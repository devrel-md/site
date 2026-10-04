import { beforeEach, describe, expect, it, vi } from "vitest";

const isHostExcludedMock = vi.fn();
const applyRobotsRefusalMock = vi.fn();
const findCachedResultMock = vi.fn();
const generateMock = vi.fn();
vi.mock("@/lib/exclusions", () => ({
  isHostExcluded: (...args: unknown[]) => isHostExcludedMock(...args),
  applyRobotsRefusal: (...args: unknown[]) => applyRobotsRefusalMock(...args),
}));
vi.mock("@/lib/results", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/results")>()),
  findCachedResult: (...args: unknown[]) => findCachedResultMock(...args),
  createResult: vi.fn(),
}));
vi.mock("@/lib/generate", () => ({ generateDevrelMd: (...args: unknown[]) => generateMock(...args) }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: async () => true }));
vi.mock("@/lib/rateLimit", () => ({
  isRateLimited: async () => false,
  checkAndIncrementRateLimit: async () => {},
}));
vi.mock("@/lib/db", () => ({ query: vi.fn(), queryOne: vi.fn() }));

import { POST } from "@/app/api/generate/route";

function post(url: string): Request {
  return new Request("https://devrel.md/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, turnstileToken: "ok" }),
  });
}

describe("generate route and excluded hosts", () => {
  beforeEach(() => {
    isHostExcludedMock.mockReset().mockResolvedValue(false);
    applyRobotsRefusalMock.mockReset().mockResolvedValue(true);
    findCachedResultMock.mockReset().mockResolvedValue(undefined);
    generateMock.mockReset();
  });

  it("refuses an excluded host before the cache or the generator is touched", async () => {
    isHostExcludedMock.mockResolvedValue(true);
    const response = await POST(post("https://www.Acme.dev/docs"));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("asked us not to generate");
    expect(isHostExcludedMock).toHaveBeenCalledWith("acme.dev");
    expect(findCachedResultMock).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("marks existing results excluded when a run is refused because of robots.txt", async () => {
    generateMock.mockResolvedValue({ status: "no_sources", reason: "blocked_by_robots", httpStatus: null });
    const response = await POST(post("https://acme.dev/docs"));
    await response.text();
    expect(applyRobotsRefusalMock).toHaveBeenCalledWith("https://acme.dev/docs");
  });

  it("does not touch results for other refusals", async () => {
    generateMock.mockResolvedValue({ status: "no_sources", reason: "not_found", httpStatus: 404 });
    const response = await POST(post("https://acme.dev/missing"));
    await response.text();
    expect(applyRobotsRefusalMock).not.toHaveBeenCalled();
  });

  it("still tells the person why when marking fails", async () => {
    applyRobotsRefusalMock.mockRejectedValue(new Error("db down"));
    generateMock.mockResolvedValue({ status: "no_sources", reason: "blocked_by_robots", httpStatus: null });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(post("https://acme.dev/docs"));
    expect(await response.text()).toContain("robots.txt");
    spy.mockRestore();
  });
});
