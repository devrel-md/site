// Content-Security-Policy for every response, built per request by proxy.ts.
//
// Script policy: the site has two kinds of inline script.
//   1. Our own fixed strings (theme, theme toggle, code copy buttons, result copy button), injected by
//      renderPage, the React layout and SiteShell. Their text never varies, so each is allowed by its
//      SHA-256 hash. That covers the hand-built Route Handler pages, which have no per-request render
//      step where a nonce could be threaded through.
//   2. Next.js's own inline bootstrap and flight-data scripts on the React pages (/generate, 404,
//      error). Their text changes per page and build, so a hash is impractical. Next reads the nonce
//      from the CSP request header and stamps it on them, and on the Turnstile <Script>.
// No 'unsafe-inline' and no 'unsafe-eval' for scripts. A hash or nonce is required for anything inline.
//
// Adding a new inline script means adding its text to INLINE_SCRIPTS below. csp.test.ts fails if a
// rendered page carries an inline script that is not covered.
import { createHash } from "node:crypto";
import { themeScript, toggleScript } from "@/lib/siteLayout";
import { copyScript } from "@/lib/page";
import { resultCopyScript } from "@/lib/resultPage";

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

export const INLINE_SCRIPTS: string[] = [themeScript(), toggleScript(), copyScript(), resultCopyScript()];

export function scriptHash(script: string): string {
  return `'sha256-${createHash("sha256").update(script, "utf8").digest("base64")}'`;
}

export function buildCsp(opts: { nonce: string; development?: boolean; upgradeInsecure?: boolean }): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${opts.nonce}'`,
    ...INLINE_SCRIPTS.map(scriptHash),
    TURNSTILE_ORIGIN,
    // React uses eval in development for stack reconstruction. Never in production.
    ...(opts.development ? ["'unsafe-eval'"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Stylesheets: our own /styles.css only. Inline style="" attributes exist (React style props, the
    // result page download button), so they are allowed per attribute, but no inline <style> blocks.
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    // Own images only. Generated Markdown is also stripped of remote images in lib/markdown.ts.
    "img-src 'self'",
    "font-src 'self'",
    // Same-origin fetch to /api/generate (streaming) and /api/*.
    "connect-src 'self'",
    `frame-src ${TURNSTILE_ORIGIN}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(opts.upgradeInsecure ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}
