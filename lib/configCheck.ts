// Production configuration check. lib/env.ts falls back to development
// defaults so the app runs locally with nothing set; in production those same
// fallbacks would hide a missing secret. This module names what is wrong,
// never what any value is.

type Source = Record<string, string | undefined>;

export type ConfigProblem = { name: string; reason: string };

export type ConfigReport = {
  /** Required variables that are missing or still on a development default. */
  problems: ConfigProblem[];
  /** Optional integrations that are off, or set up inconsistently. */
  warnings: ConfigProblem[];
};

// Must match the fallbacks in lib/env.ts (lib/__tests__/configCheck.test.ts checks this).
export const DEV_DEFAULTS = {
  IP_HASH_SALT: "local-dev-salt",
  CRON_SECRET: "local-dev-cron-secret",
  SITE_URL: "http://localhost:3000",
};

// Cloudflare's documented Turnstile test keys: a digit, "x", zeros and two letters,
// e.g. site key 1x00000000000000000000AA and secret 1x0000000000000000000000000000000AA.
const TURNSTILE_TEST_KEY = /^\dx0{15,}[A-F]{2}$/;

function value(source: Source, name: string): string {
  return (source[name] ?? "").trim();
}

/** True when running the production server, false during `next build`, dev and tests. */
export function isProductionRuntime(source: Source = process.env): boolean {
  return source.NODE_ENV === "production" && source.NEXT_PHASE !== "phase-production-build";
}

function siteUrlProblem(raw: string): string | null {
  if (!raw) return "missing";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "not a valid URL";
  }
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return "development default";
  if (url.protocol !== "https:") return "not https";
  return null;
}

function turnstileSecret(source: Source): string {
  return value(source, "TURNSTILE_SITE_SECRET") || value(source, "TURNSTILE_SECRET_KEY");
}

export function cronSecretProblem(source: Source = process.env): string | null {
  const secret = value(source, "CRON_SECRET");
  if (!secret) return "missing";
  if (secret === DEV_DEFAULTS.CRON_SECRET) return "development default";
  return null;
}

export function turnstileSecretProblem(source: Source = process.env): string | null {
  const secret = turnstileSecret(source);
  if (!secret) return "missing";
  if (TURNSTILE_TEST_KEY.test(secret)) return "Cloudflare test key";
  return null;
}

/** Checks every variable regardless of environment; callers decide when it matters. */
export function checkConfig(source: Source = process.env): ConfigReport {
  const problems: ConfigProblem[] = [];
  const warnings: ConfigProblem[] = [];
  const need = (name: string, reason: string | null) => {
    if (reason) problems.push({ name, reason });
  };

  need("DATABASE_URL", value(source, "DATABASE_URL") ? null : "missing");
  need("OPENROUTER_API_KEY", value(source, "OPENROUTER_API_KEY") ? null : "missing");

  const siteKey = value(source, "TURNSTILE_SITE_KEY");
  need(
    "TURNSTILE_SITE_KEY",
    !siteKey ? "missing" : TURNSTILE_TEST_KEY.test(siteKey) ? "Cloudflare test key" : null
  );
  need("TURNSTILE_SITE_SECRET", turnstileSecretProblem(source));

  const salt = value(source, "IP_HASH_SALT");
  need(
    "IP_HASH_SALT",
    !salt ? "missing" : salt === DEV_DEFAULTS.IP_HASH_SALT ? "development default" : null
  );
  need("CRON_SECRET", cronSecretProblem(source));
  need("SITE_URL", siteUrlProblem(value(source, "SITE_URL")));

  const resend = value(source, "RESEND_API_KEY");
  if (!resend) {
    warnings.push({ name: "RESEND_API_KEY", reason: "unset, emails are logged instead of sent" });
    if (value(source, "RESEND_AUDIENCE_ID")) {
      warnings.push({ name: "RESEND_AUDIENCE_ID", reason: "set without RESEND_API_KEY, no audience sync" });
    }
  } else if (!value(source, "EMAIL_FROM")) {
    warnings.push({ name: "EMAIL_FROM", reason: "unset, falls back to hello@devrel.md, not the mail. sending domain" });
  }
  if (!value(source, "FOLK_API_KEY")) {
    warnings.push({ name: "FOLK_API_KEY", reason: "unset, community contacts are not pushed to Folk" });
  }
  if (!value(source, "GIT_COMMIT_SHA")) {
    warnings.push({ name: "GIT_COMMIT_SHA", reason: "unset, /healthz reports dev" });
  }

  return { problems, warnings };
}

/** Logs the report loudly at start-up. Names and reasons only, never values. */
export function logConfigReport(report: ConfigReport): void {
  for (const w of report.warnings) {
    console.warn(`[config] ${w.name}: ${w.reason}`);
  }
  if (report.problems.length === 0) {
    console.log("[config] production configuration ok");
    return;
  }
  console.error(
    [
      "[config] PRODUCTION CONFIGURATION INVALID. /healthz reports config: invalid.",
      ...report.problems.map((p) => `[config]   ${p.name}: ${p.reason}`),
    ].join("\n")
  );
}
