// Central, typed access to configuration. Every variable has a safe local
// default so the app runs with Resend, Folk and Turnstile unset, per the brief.

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendAudienceId: process.env.RESEND_AUDIENCE_ID ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "DEVREL.md <hello@devrel.md>",
  // Where replies go. Sending uses the mail. subdomain, which does not receive mail,
  // so replies must point at the forwarded address.
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? "hello@devrel.md",
  folkApiKey: process.env.FOLK_API_KEY ?? "",
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  // Infisical names this TURNSTILE_SITE_SECRET; TURNSTILE_SECRET_KEY is kept
  // as a fallback for anyone following the brief's original naming.
  turnstileSecretKey:
    process.env.TURNSTILE_SITE_SECRET ??
    process.env.TURNSTILE_SECRET_KEY ??
    "1x0000000000000000000000000000000AA",
  ipHashSalt: process.env.IP_HASH_SALT ?? "local-dev-salt",
  cronSecret: process.env.CRON_SECRET ?? "local-dev-cron-secret",
  dailySpendCapUsd: num(process.env.DAILY_SPEND_CAP_USD, 2.0),
  seriesEnabled: bool(process.env.SERIES_ENABLED, false),
  gitCommitSha: process.env.GIT_COMMIT_SHA ?? "dev",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export function isConfigured(key: "resend" | "folk"): boolean {
  if (key === "resend") return env.resendApiKey.length > 0;
  return env.folkApiKey.length > 0;
}
