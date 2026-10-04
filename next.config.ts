import type { NextConfig } from "next";
import { STATIC_SECURITY_HEADERS } from "./lib/securityHeaders";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    // Every path, including Route Handlers and files in public/. The Content-Security-Policy is
    // per request (it carries a nonce), so proxy.ts sets that one.
    return [{ source: "/:path*", headers: STATIC_SECURITY_HEADERS }];
  },
};

export default nextConfig;
