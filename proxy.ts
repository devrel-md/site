// Sets the Content-Security-Policy on every response, with a fresh nonce per request. Next reads the
// nonce back out of the CSP *request* header and stamps it on its own scripts, so it is set on both.
// See lib/csp.ts for the policy and why scripts use a nonce plus hashes. The other security headers
// are static and live in next.config.ts.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    development: process.env.NODE_ENV === "development",
    // Only where the site is served over https, so plain-http local runs keep working.
    upgradeInsecure: (process.env.SITE_URL ?? "").startsWith("https://"),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Everything except the hashed build assets, which are not documents.
  matcher: "/((?!_next/static|_next/image).*)",
};
