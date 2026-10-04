import { describe, it, expect, vi, afterEach } from "vitest";
import { checkConfig, DEV_DEFAULTS, isProductionRuntime, logConfigReport } from "@/lib/configCheck";

// A production-shaped environment with every required variable set to a real-looking value.
const good: Record<string, string> = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://u:p@db:5432/devrelmd",
  OPENROUTER_API_KEY: "sk-or-test",
  TURNSTILE_SITE_KEY: "0x4AAAAAAAexample",
  TURNSTILE_SITE_SECRET: "0x4AAAAAAAsecret",
  IP_HASH_SALT: "a-long-random-salt",
  CRON_SECRET: "a-long-random-cron-secret",
  SITE_URL: "https://devrel.md",
  RESEND_API_KEY: "re_test",
  RESEND_AUDIENCE_ID: "aud_test",
  EMAIL_FROM: "DEVREL.md <hello@mail.devrel.md>",
  FOLK_API_KEY: "folk_test",
  GIT_COMMIT_SHA: "abc123",
};

function without(...names: string[]): Record<string, string> {
  const copy = { ...good };
  for (const n of names) delete copy[n];
  return copy;
}

function problemNames(source: Record<string, string>): string[] {
  return checkConfig(source).problems.map((p) => p.name);
}

describe("isProductionRuntime", () => {
  it("is true only for the production server, not during next build", () => {
    expect(isProductionRuntime({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionRuntime({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })).toBe(false);
    expect(isProductionRuntime({ NODE_ENV: "development" })).toBe(false);
    expect(isProductionRuntime({ NODE_ENV: "test" })).toBe(false);
  });
});

describe("checkConfig", () => {
  it("reports nothing for a complete production environment", () => {
    expect(checkConfig(good)).toEqual({ problems: [], warnings: [] });
  });

  it("flags every required variable when nothing is set", () => {
    expect(problemNames({ NODE_ENV: "production" }).sort()).toEqual(
      [
        "CRON_SECRET",
        "DATABASE_URL",
        "IP_HASH_SALT",
        "OPENROUTER_API_KEY",
        "SITE_URL",
        "TURNSTILE_SITE_KEY",
        "TURNSTILE_SITE_SECRET",
      ].sort()
    );
  });

  it("treats an empty string as missing, since ?? in lib/env.ts would accept it", () => {
    const report = checkConfig({ ...good, CRON_SECRET: "", IP_HASH_SALT: "  " });
    expect(report.problems).toEqual([
      { name: "IP_HASH_SALT", reason: "missing" },
      { name: "CRON_SECRET", reason: "missing" },
    ]);
  });

  it("flags the development defaults from .env.example", () => {
    const report = checkConfig({
      ...good,
      IP_HASH_SALT: "local-dev-salt",
      CRON_SECRET: "local-dev-cron-secret",
      SITE_URL: "http://localhost:3000",
    });
    expect(report.problems).toEqual([
      { name: "IP_HASH_SALT", reason: "development default" },
      { name: "CRON_SECRET", reason: "development default" },
      { name: "SITE_URL", reason: "development default" },
    ]);
  });

  it("flags Cloudflare's Turnstile test keys, including the always-fail and spent-token pairs", () => {
    for (const [siteKey, secret] of [
      ["1x00000000000000000000AA", "1x0000000000000000000000000000000AA"],
      ["2x00000000000000000000AB", "2x0000000000000000000000000000000AA"],
      ["3x00000000000000000000FF", "3x0000000000000000000000000000000AA"],
    ]) {
      const report = checkConfig({ ...good, TURNSTILE_SITE_KEY: siteKey, TURNSTILE_SITE_SECRET: secret });
      expect(report.problems.map((p) => p.name)).toEqual(["TURNSTILE_SITE_KEY", "TURNSTILE_SITE_SECRET"]);
    }
  });

  it("accepts the TURNSTILE_SECRET_KEY fallback name, as lib/env.ts does", () => {
    const source = { ...without("TURNSTILE_SITE_SECRET"), TURNSTILE_SECRET_KEY: "0x4AAAAAAAsecret" };
    expect(problemNames(source)).toEqual([]);
  });

  it("requires SITE_URL to be an https URL", () => {
    expect(checkConfig({ ...good, SITE_URL: "http://devrel.md" }).problems).toEqual([
      { name: "SITE_URL", reason: "not https" },
    ]);
    expect(checkConfig({ ...good, SITE_URL: "devrel.md" }).problems).toEqual([
      { name: "SITE_URL", reason: "not a valid URL" },
    ]);
    expect(problemNames({ ...good, SITE_URL: "https://devrel.md/" })).toEqual([]);
  });

  it("treats Resend and Folk as optional: warnings, never problems", () => {
    const report = checkConfig(without("RESEND_API_KEY", "FOLK_API_KEY"));
    expect(report.problems).toEqual([]);
    expect(report.warnings.map((w) => w.name)).toEqual(["RESEND_API_KEY", "RESEND_AUDIENCE_ID", "FOLK_API_KEY"]);
  });

  it("warns when Resend sends without an explicit EMAIL_FROM", () => {
    expect(checkConfig(without("EMAIL_FROM")).warnings.map((w) => w.name)).toEqual(["EMAIL_FROM"]);
  });

  it("matches the fallbacks lib/env.ts actually uses", async () => {
    vi.resetModules();
    // Stub first so unstubAllEnvs restores the originals, then unset.
    for (const name of Object.keys(DEV_DEFAULTS)) {
      vi.stubEnv(name, "");
      delete process.env[name];
    }
    const { env } = await import("@/lib/env");
    expect(env.ipHashSalt).toBe(DEV_DEFAULTS.IP_HASH_SALT);
    expect(env.cronSecret).toBe(DEV_DEFAULTS.CRON_SECRET);
    expect(env.siteUrl).toBe(DEV_DEFAULTS.SITE_URL);
    vi.unstubAllEnvs();
  });
});

describe("logConfigReport", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs names and reasons, never values", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    logConfigReport(checkConfig({ ...good, CRON_SECRET: "local-dev-cron-secret" }));
    const logged = error.mock.calls.flat().join("\n");
    expect(logged).toContain("PRODUCTION CONFIGURATION INVALID");
    expect(logged).toContain("CRON_SECRET: development default");
    expect(logged).not.toContain("local-dev-cron-secret");
    expect(logged).not.toContain(good.IP_HASH_SALT);
  });

  it("says ok when nothing is wrong", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    logConfigReport(checkConfig(good));
    expect(log).toHaveBeenCalledWith("[config] production configuration ok");
    expect(error).not.toHaveBeenCalled();
  });
});
