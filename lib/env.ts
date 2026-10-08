// Central, typed access to configuration. Every variable has a safe local
// default so the app runs with Resend, Folk and Turnstile unset, per the brief.

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
  trustedProxyHops: num(process.env.TRUSTED_PROXY_HOPS, 1),
  dailySpendCapUsd: num(process.env.DAILY_SPEND_CAP_USD, 2.0),
  gitCommitSha: process.env.GIT_COMMIT_SHA ?? "dev",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export function isConfigured(key: "resend" | "folk"): boolean {
  if (key === "resend") return env.resendApiKey.length > 0;
  return env.folkApiKey.length > 0;
}

// The shared stylesheet, versioned by build. /styles.css is not hashed, so
// without this a browser can pair new HTML with an old cached stylesheet after
// a deploy (new markup, no rules for it).
export const STYLESHEET_HREF = `/styles.css?v=${encodeURIComponent(env.gitCommitSha)}`;
