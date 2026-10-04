import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashIp } from "@/lib/hash";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));

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

describe("POST /api/validate", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([{ count: 1 }]);
  });

  it("accepts a text/markdown body and reports valid: true for a good file", async () => {
    const { POST } = await import("@/app/api/validate/route");
    const res = await POST(
      new Request("https://devrel.md/api/validate", {
        method: "POST",
        headers: { "content-type": "text/markdown" },
        body: VALID_MARKDOWN,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.problems).toEqual([]);
    expect(data.gates).toHaveLength(5);
  });

  it("accepts a JSON body and explains each problem for a bad file", async () => {
    const { POST } = await import("@/app/api/validate/route");
    const res = await POST(
      new Request("https://devrel.md/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown: "not a real devrel.md" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.problems[0]).toHaveProperty("fix");
  });

  it("rejects an empty body", async () => {
    const { POST } = await import("@/app/api/validate/route");
    const res = await POST(
      new Request("https://devrel.md/api/validate", {
        method: "POST",
        headers: { "content-type": "text/markdown" },
        body: "   ",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 once the validate rate limit is exceeded", async () => {
    queryMock.mockResolvedValue([{ count: 1000 }]);
    const { POST } = await import("@/app/api/validate/route");
    const res = await POST(
      new Request("https://devrel.md/api/validate", {
        method: "POST",
        headers: { "content-type": "text/markdown" },
        body: VALID_MARKDOWN,
      })
    );
    expect(res.status).toBe(429);
  });

  it("rate limits under the validate kind, not generate", async () => {
    const { POST } = await import("@/app/api/validate/route");
    await POST(
      new Request("https://devrel.md/api/validate", {
        method: "POST",
        headers: { "content-type": "text/markdown" },
        body: VALID_MARKDOWN,
      })
    );
    const [, params] = queryMock.mock.calls[0]!;
    expect(params).toContain("validate");
  });

  it("rate limits on the address the edge appended, whatever the client forges", async () => {
    const { POST } = await import("@/app/api/validate/route");
    const send = (forwarded: string) =>
      POST(
        new Request("https://devrel.md/api/validate", {
          method: "POST",
          headers: { "content-type": "text/markdown", "x-forwarded-for": forwarded },
          body: VALID_MARKDOWN,
        })
      );
    await send("198.51.100.4");
    await send("203.0.113.7, 198.51.100.4");
    await send("203.0.113.8, 198.51.100.4");
    const keys = queryMock.mock.calls.map(([, params]) => (params as string[])[0]);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe(hashIp("198.51.100.4"));
  });
});
