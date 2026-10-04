import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { folkApiKey: "test-key" },
  isConfigured: (key: string) => key === "folk",
}));
vi.mock("@/lib/db", () => ({ query: vi.fn() }));

import { markCommunityUnsubscribedInFolk, syncCommunityToFolk } from "@/lib/folk";

const GROUP_ID = `grp_${"a".repeat(36)}`;
const OTHER_GROUP_ID = `grp_${"b".repeat(36)}`;
const PERSON_ID = `per_${"c".repeat(36)}`;
const BASE = "https://api.folk.app/v1";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(status < 400 ? { data } : data), { status });
}

const groupsList = json({
  items: [
    { id: OTHER_GROUP_ID, name: "Leads" },
    { id: GROUP_ID, name: "DEVREL.md community" },
  ],
  pagination: {},
});

type Handler = (url: string, init: RequestInit) => Response | undefined;

/** Routes mocked Folk calls by method and path. Unrouted calls fail the test. */
function routeFetch(...handlers: Handler[]) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    for (const handler of handlers) {
      const response = handler(String(url), init);
      if (response) return response.clone();
    }
    throw new Error(`Unexpected Folk call: ${init.method ?? "GET"} ${url}`);
  }));
}

const groups: Handler = (url) => (url.startsWith(`${BASE}/groups`) ? groupsList : undefined);
const calls = () => vi.mocked(fetch).mock.calls.map(([url, init]) => ({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined }));

describe("community Folk sync", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a new person with an emails array and the community group, then records the opt-in note", async () => {
    routeFetch(
      groups,
      (url, init) => (url.includes("/people?") && init.method === "GET" ? json({ items: [] }) : undefined),
      (url, init) => (url === `${BASE}/people` && init.method === "POST" ? json({ id: PERSON_ID, groups: [] }) : undefined),
      (url, init) => (url === `${BASE}/notes` && init.method === "POST" ? json({ id: "nte_1" }) : undefined),
    );
    expect(await syncCommunityToFolk("reader@example.com", null)).toBe(PERSON_ID);

    const search = calls().find((call) => call.url.includes("/people?"));
    expect(search?.url).toContain("filter[emails][eq]=reader%40example.com");
    const create = calls().find((call) => call.method === "POST" && call.url === `${BASE}/people`);
    expect(create?.body).toEqual({ emails: ["reader@example.com"], groups: [{ id: GROUP_ID }] });
    // Folk rejects unknown keys, so none of the old fields may be sent.
    expect(create?.body).not.toHaveProperty("email");
    expect(create?.body).not.toHaveProperty("tags");
    expect(create?.body).not.toHaveProperty("notes");
    expect(create?.body).not.toHaveProperty("company");
    const note = calls().find((call) => call.url === `${BASE}/notes`);
    expect(note?.body).toMatchObject({ entity: { id: PERSON_ID }, visibility: "public" });
    expect(note?.body.content).toContain("Explicit opt-in");
    expect(note?.body.content).toContain("No sales consent");
  });

  it("updates the person found by email instead of creating a second one, keeping their other groups", async () => {
    routeFetch(
      groups,
      (url, init) => (url.includes("/people?") && init.method === "GET" ? json({ items: [{ id: PERSON_ID, groups: [{ id: OTHER_GROUP_ID, name: "Leads" }] }] }) : undefined),
      (url, init) => (url === `${BASE}/people/${PERSON_ID}` && init.method === "PATCH" ? json({ id: PERSON_ID }) : undefined),
      (url, init) => (url === `${BASE}/notes` && init.method === "POST" ? json({ id: "nte_1" }) : undefined),
    );
    expect(await syncCommunityToFolk("reader@example.com", null)).toBe(PERSON_ID);

    expect(calls().some((call) => call.method === "POST" && call.url === `${BASE}/people`)).toBe(false);
    const patch = calls().find((call) => call.method === "PATCH");
    expect(patch?.body).toEqual({ groups: [{ id: OTHER_GROUP_ID }, { id: GROUP_ID }] });
  });

  it("uses the stored person id and sends no update when they are already in the group", async () => {
    routeFetch(
      groups,
      (url, init) => (url === `${BASE}/people/${PERSON_ID}` && init.method === "GET" ? json({ id: PERSON_ID, groups: [{ id: GROUP_ID, name: "DEVREL.md community" }] }) : undefined),
      (url, init) => (url === `${BASE}/notes` && init.method === "POST" ? json({ id: "nte_1" }) : undefined),
    );
    expect(await syncCommunityToFolk("reader@example.com", PERSON_ID)).toBe(PERSON_ID);
    expect(calls().map((call) => call.method)).not.toContain("PATCH");
    expect(calls().some((call) => call.url.includes("/people?"))).toBe(false);
  });

  it("creates the person without a group, and logs the group names, when the community group does not exist", async () => {
    routeFetch(
      (url) => (url.startsWith(`${BASE}/groups`) ? json({ items: [{ id: OTHER_GROUP_ID, name: "Leads" }], pagination: {} }) : undefined),
      (url, init) => (url.includes("/people?") && init.method === "GET" ? json({ items: [] }) : undefined),
      (url, init) => (url === `${BASE}/people` && init.method === "POST" ? json({ id: PERSON_ID }) : undefined),
      (url, init) => (url === `${BASE}/notes` && init.method === "POST" ? json({ id: "nte_1" }) : undefined),
    );
    expect(await syncCommunityToFolk("reader@example.com", null)).toBe(PERSON_ID);
    const create = calls().find((call) => call.method === "POST" && call.url === `${BASE}/people`);
    expect(create?.body).toEqual({ emails: ["reader@example.com"] });
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain("Leads");
  });

  it("logs Folk's 422 message, never the key or the address, and returns null without throwing", async () => {
    const body = {
      error: {
        code: "UNPROCESSABLE_ENTITY",
        message: "Invalid input",
        details: { issues: [{ code: "invalid_string", message: "Invalid email reader@example.com" }] },
      },
    };
    routeFetch(
      groups,
      (url, init) => (url.includes("/people?") && init.method === "GET" ? json({ items: [] }) : undefined),
      (url, init) => (url === `${BASE}/people` && init.method === "POST" ? json(body, 422) : undefined),
    );
    expect(await syncCommunityToFolk("reader@example.com", null)).toBeNull();

    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("422");
    expect(logged).toContain("Invalid input");
    expect(logged).not.toContain("test-key");
    expect(logged).not.toContain("reader@example.com");
    expect(calls().some((call) => call.url === `${BASE}/notes`)).toBe(false);
  });

  it("returns null without throwing when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")));
    expect(await syncCommunityToFolk("reader@example.com", null)).toBeNull();
  });

  it("removes the person from the community group only and records the withdrawal", async () => {
    routeFetch(
      (url, init) => (url === `${BASE}/people/${PERSON_ID}` && init.method === "GET"
        ? json({ id: PERSON_ID, groups: [{ id: OTHER_GROUP_ID, name: "Leads" }, { id: GROUP_ID, name: "DEVREL.md community" }] })
        : undefined),
      (url, init) => (url === `${BASE}/people/${PERSON_ID}` && init.method === "PATCH" ? json({ id: PERSON_ID }) : undefined),
      (url, init) => (url === `${BASE}/notes` && init.method === "POST" ? json({ id: "nte_1" }) : undefined),
    );
    await markCommunityUnsubscribedInFolk(PERSON_ID);

    expect(calls().find((call) => call.method === "PATCH")?.body).toEqual({ groups: [{ id: OTHER_GROUP_ID }] });
    expect(calls().find((call) => call.url === `${BASE}/notes`)?.body.content).toContain("withdrawn");
  });
});
