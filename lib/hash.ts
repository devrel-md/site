import { createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/** sha256(ip + IP_HASH_SALT), so a raw IP is never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + env.ipHashSalt).digest("hex");
}

/** Best-effort client IP from standard proxy headers, falling back to "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
