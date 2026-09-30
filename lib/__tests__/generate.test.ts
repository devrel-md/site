import { describe, it, expect, vi, beforeEach } from "vitest";
import { MODEL_CHAIN } from "@/lib/generatorConfig";

const streamCompletionMock = vi.fn();
const isFreeModelCircuitOpenMock = vi.fn();
const isOverDailySpendCapMock = vi.fn();
const logAttemptMock = vi.fn();

vi.mock("@/lib/openrouter", () => ({ streamCompletion: (...args: unknown[]) => streamCompletionMock(...args) }));
vi.mock("@/lib/circuitBreaker", () => ({
  isFreeModelCircuitOpen: () => isFreeModelCircuitOpenMock(),
}));
vi.mock("@/lib/spendCap", () => ({
  isOverDailySpendCap: () => isOverDailySpendCapMock(),
}));
vi.mock("@/lib/attempts", () => ({ logAttempt: (...args: unknown[]) => logAttemptMock(...args) }));
vi.mock("@/lib/generatorPrompt", () => ({
  buildSystemPrompt: async () => "system prompt",
  buildUserPrompt: () => "user prompt",
}));
const discoverPagesMock = vi.fn();
vi.mock("@/lib/discoverPages", () => ({ discoverPages: (...args: unknown[]) => discoverPagesMock(...args) }));
const ENOUGH_SOURCE = [{ url: "https://acme.dev/docs", label: "input page", content: "Acme docs. ".repeat(80) }];

const VALID_MARKDOWN = [
  "---",
  "spec: devrel.md/0.1",
  "product: Acme",
  "stage: unknown",
  "updated: 2026-09-28",
  "---",
  "",
  "## Product",
  "text",
  "## Value proposition",
  "text",
  "## ICPs",
  "text",
  "## Anti-personas",
  "text",
  "## North Star",
  "text",
  "## Activation",
  "text",
  "## Funnel health",
  "",
  "| Stage | Gate | Now | Pass |",
  "| --- | --- | --- | --- |",
  "| Awareness | g | n | yes |",
  "| Onboarding | g | n | yes |",
  "| Activation | g | n | yes |",
  "| Engagement | g | n | yes |",
  "| Monetization | g | n | n/a |",
  ...Array(15).fill("filler line"),
].join("\n");

function success(model: string, text: string) {
  return {
    kind: "success" as const,
    result: {
      text,
      servedModel: model,
      finishReason: "stop",
      tokensIn: 100,
      tokensOut: 100,
      costUsd: model === MODEL_CHAIN.free ? 0 : 0.01,
      firstTokenMs: 500,
      totalMs: 2000,
    },
  };
}

describe("generateDevrelMd (fallback order and circuit breaker)", () => {
  beforeEach(() => {
    streamCompletionMock.mockReset();
    isFreeModelCircuitOpenMock.mockReset().mockResolvedValue(false);
    isOverDailySpendCapMock.mockReset().mockResolvedValue(false);
    logAttemptMock.mockReset();
    discoverPagesMock.mockReset().mockResolvedValue(ENOUGH_SOURCE);
  });

  it("succeeds on the free model when it produces a valid file", async () => {
    streamCompletionMock.mockResolvedValueOnce(success(MODEL_CHAIN.free, VALID_MARKDOWN));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("success");
    if (outcome.status === "success") expect(outcome.model).toBe(MODEL_CHAIN.free);
    expect(streamCompletionMock).toHaveBeenCalledTimes(1);
    expect(logAttemptMock).toHaveBeenCalledTimes(1);
    expect(logAttemptMock.mock.calls[0]![0]).toMatchObject({ outcome: "success" });
  });

  it("falls through free -> paid primary on a free timeout", async () => {
    streamCompletionMock
      .mockResolvedValueOnce({ kind: "timeout", firstTokenMs: null, elapsedMs: 15000 })
      .mockResolvedValueOnce(success(MODEL_CHAIN.paidPrimary, VALID_MARKDOWN));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("success");
    if (outcome.status === "success") expect(outcome.model).toBe(MODEL_CHAIN.paidPrimary);
    expect(streamCompletionMock).toHaveBeenCalledTimes(2);
    expect(logAttemptMock.mock.calls[0]![0]).toMatchObject({ outcome: "timeout", model: MODEL_CHAIN.free });
  });

  it("regenerates once on the next paid model after a quality-gate failure", async () => {
    streamCompletionMock
      .mockResolvedValueOnce(success(MODEL_CHAIN.free, "not a valid file"))
      .mockResolvedValueOnce(success(MODEL_CHAIN.paidPrimary, "still not valid"))
      .mockResolvedValueOnce(success(MODEL_CHAIN.paidBackup, VALID_MARKDOWN));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("success");
    if (outcome.status === "success") expect(outcome.model).toBe(MODEL_CHAIN.paidBackup);
    expect(streamCompletionMock).toHaveBeenCalledTimes(3);
    expect(logAttemptMock.mock.calls[0]![0]).toMatchObject({ outcome: "quality_fail" });
    expect(logAttemptMock.mock.calls[1]![0]).toMatchObject({ outcome: "quality_fail" });
  });

  it("skips the free model entirely when the circuit breaker is open", async () => {
    isFreeModelCircuitOpenMock.mockResolvedValue(true);
    streamCompletionMock.mockResolvedValueOnce(success(MODEL_CHAIN.paidPrimary, VALID_MARKDOWN));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("success");
    expect(streamCompletionMock).toHaveBeenCalledTimes(1);
    const [{ models }] = streamCompletionMock.mock.calls[0]!;
    expect(models).not.toContain(MODEL_CHAIN.free);
  });

  it("reports capped, without calling OpenRouter, when both the circuit is open and the spend cap is hit", async () => {
    isFreeModelCircuitOpenMock.mockResolvedValue(true);
    isOverDailySpendCapMock.mockResolvedValue(true);
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("capped");
    expect(streamCompletionMock).not.toHaveBeenCalled();
  });

  it("reports exhausted when every model in the chain fails", async () => {
    streamCompletionMock
      .mockResolvedValueOnce({ kind: "error", message: "boom", elapsedMs: 100 })
      .mockResolvedValueOnce({ kind: "error", message: "boom", elapsedMs: 100 })
      .mockResolvedValueOnce({ kind: "timeout", firstTokenMs: null, elapsedMs: 30000 });
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("exhausted");
    expect(streamCompletionMock).toHaveBeenCalledTimes(3);
  });

  it("refuses to generate, without calling OpenRouter, when no pages could be read", async () => {
    discoverPagesMock.mockResolvedValue([]);
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("no_sources");
    expect(streamCompletionMock).not.toHaveBeenCalled();
  });

  it("rejects a draft with an invented figure and falls back to the next model", async () => {
    const invented = VALID_MARKDOWN.replace("| Awareness | g | n | yes |", "| Awareness | g | 8.5k GitHub stars | yes |");
    streamCompletionMock
      .mockResolvedValueOnce(success(MODEL_CHAIN.free, invented))
      .mockResolvedValueOnce(success(MODEL_CHAIN.paidPrimary, VALID_MARKDOWN));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com" });

    expect(outcome.status).toBe("success");
    if (outcome.status === "success") expect(outcome.model).toBe(MODEL_CHAIN.paidPrimary);
    expect(logAttemptMock.mock.calls[0]?.[0]).toMatchObject({ outcome: "quality_fail" });
  });

  it("counts a run only when it reaches a model", async () => {
    const counted = vi.fn(async () => {});
    const { generateDevrelMd } = await import("@/lib/generate");

    discoverPagesMock.mockResolvedValue([]);
    await generateDevrelMd({ inputUrl: "https://example.com", beforeFirstModelCall: counted });
    expect(counted).not.toHaveBeenCalled();

    discoverPagesMock.mockResolvedValue(ENOUGH_SOURCE);
    streamCompletionMock.mockResolvedValueOnce(success(MODEL_CHAIN.free, VALID_MARKDOWN));
    await generateDevrelMd({ inputUrl: "https://example.com", beforeFirstModelCall: counted });
    expect(counted).toHaveBeenCalledTimes(1);
  });

  it("says the page doesn't exist when the input URL returns 404", async () => {
    discoverPagesMock.mockResolvedValue(Object.assign([], { input: { httpStatus: 404, blockedByRobots: false } }));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com/missing" });

    expect(outcome).toMatchObject({ status: "no_sources", reason: "not_found", httpStatus: 404 });
  });

  it("says robots.txt blocked it when that's why nothing was read", async () => {
    discoverPagesMock.mockResolvedValue(Object.assign([], { input: { httpStatus: null, blockedByRobots: true } }));
    const { generateDevrelMd } = await import("@/lib/generate");

    const outcome = await generateDevrelMd({ inputUrl: "https://example.com/private" });

    expect(outcome).toMatchObject({ status: "no_sources", reason: "blocked_by_robots" });
  });
});
