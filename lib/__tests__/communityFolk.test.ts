import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { folkApiKey: "test-key" },
  isConfigured: (key: string) => key === "folk",
}));
vi.mock("@/lib/db", () => ({ query: vi.fn() }));

import { markCommunityUnsubscribedInFolk, syncCommunityToFolk } from "@/lib/folk";

describe("community Folk sync", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "person-1" }) }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("creates a tagged community contact with no sales qualification", async () => {
    expect(await syncCommunityToFolk("reader@example.com", null)).toBe("person-1");
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ email: "reader@example.com", tags: ["source: devrel.md", "community: subscribed"] });
    expect(body).not.toHaveProperty("company");
    expect(body).not.toHaveProperty("deal");
  });

  it("marks the known contact unsubscribed", async () => {
    await markCommunityUnsubscribedInFolk("person-1");
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://api.folk.app/v1/people/person-1");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body)).tags).toContain("community: unsubscribed");
  });
});
