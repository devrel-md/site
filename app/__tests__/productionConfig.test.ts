import { describe, it, expect, vi, afterEach } from "vitest";

const realProduction: Record<string, string> = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://u:p@db:5432/devrelmd",
  OPENROUTER_API_KEY: "sk-or-test",
  TURNSTILE_SITE_KEY: "0x4AAAAAAAexample",
  TURNSTILE_SITE_SECRET: "0x4AAAAAAAsecret",
  IP_HASH_SALT: "a-long-random-salt",
  SITE_URL: "https://devrel.md",
  GIT_COMMIT_SHA: "abc123",
};

// lib/env.ts reads process.env once at import, so each case reloads the modules.
async function withEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("/healthz", () => {
  it("keeps status ok and the exact build SHA, and reports config ok in a real production setup", async () => {
    await withEnv(realProduction);
    const { GET } = await import("@/app/healthz/route");
    const body = await (await GET()).json();
    expect(body).toEqual({ status: "ok", build_sha: "abc123", config: "ok", config_problems: [] });
  });

  it("stays status ok but reports config invalid, with names only, on development defaults", async () => {
    await withEnv({ ...realProduction, IP_HASH_SALT: "local-dev-salt", SITE_URL: "http://localhost:3000" });
    const { GET } = await import("@/app/healthz/route");
    const res = await GET();
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({
      status: "ok",
      build_sha: "abc123",
      config: "invalid",
      config_problems: ["IP_HASH_SALT", "SITE_URL"],
    });
    expect(text).not.toContain("local-dev");
  });

  it("does not check outside production", async () => {
    await withEnv({ NODE_ENV: "test", GIT_COMMIT_SHA: "abc123" });
    const { GET } = await import("@/app/healthz/route");
    const body = await (await GET()).json();
    expect(body.config).toBe("unchecked");
    expect(body.config_problems).toEqual([]);
  });
});

describe("verifyTurnstile", () => {
  it("fails closed in production on Cloudflare's always-pass secret, without calling Cloudflare", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await withEnv({ ...realProduction, TURNSTILE_SITE_SECRET: "1x0000000000000000000000000000000AA" });
    const { verifyTurnstile } = await import("@/lib/turnstile");
    expect(await verifyTurnstile("any-token")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("verifies with Cloudflare in production when the secret is real", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true }));
    await withEnv(realProduction);
    const { verifyTurnstile } = await import("@/lib/turnstile");
    expect(await verifyTurnstile("token")).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
