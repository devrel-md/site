// Sent on every response, from next.config.ts headers(). Kept free of imports because next.config.ts
// cannot resolve the @/ alias. The Content-Security-Policy is separate (lib/csp.ts) because it needs a nonce.
export const STATIC_SECURITY_HEADERS: { key: string; value: string }[] = [
  // One year. No includeSubDomains or preload yet: both are hard to undo, and are an owner decision.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Legacy equivalent of frame-ancestors 'none' for browsers that ignore CSP.
  { key: "X-Frame-Options", value: "DENY" },
];
