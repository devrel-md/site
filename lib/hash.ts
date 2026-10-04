import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { env } from "@/lib/env";

/** sha256(ip + IP_HASH_SALT), so a raw IP is never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + env.ipHashSalt).digest("hex");
}

/** Shared key for requests with no trustworthy address. rateLimit.ts gives it a strict budget. */
export const UNKNOWN_IP = "unknown";

let warnedUnknown = false;

/** A valid IP in canonical form, or null. IPv6 is reduced to its /64 prefix. */
function normalise(raw: string): string | null {
  let value = raw.trim().toLowerCase();
  if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1);
  value = value.replace(/%.*$/, "");
  const kind = isIP(value);
  if (kind === 4) return value;
  if (kind !== 6) return null;
  const groups = ipv6Groups(value);
  if (!groups) return null;
  // Dual-stack listeners report IPv4 peers as ::ffff:a.b.c.d. Use the IPv4 form
  // so one machine never gets two buckets.
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    return [groups[6]! >> 8, groups[6]! & 0xff, groups[7]! >> 8, groups[7]! & 0xff].join(".");
  }
  // One household or device can rotate through a whole /64, so key on the prefix.
  return `${groups.slice(0, 4).map((g) => g.toString(16)).join(":")}::/64`;
}

/** The eight 16-bit groups of a valid IPv6 address (isIP has already checked it). */
function ipv6Groups(value: string): number[] | null {
  const dotted = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(value);
  if (dotted) {
    const [a, b, c, d] = dotted[2]!.split(".").map(Number) as [number, number, number, number];
    value = `${dotted[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail, extra] = value.split("::");
  if (extra !== undefined) return null;
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const fill = tail === undefined ? 0 : 8 - left.length - right.length;
  if (fill < 0 || left.length + right.length + fill !== 8) return null;
  return [...left, ...Array<string>(fill).fill("0"), ...right].map((g) => parseInt(g, 16));
}

/**
 * The client address as seen by the first proxy we trust, or "unknown".
 *
 * X-Forwarded-For is a list: the client may send any entries it likes, and each
 * trusted proxy appends the address of the peer that connected to it. So the
 * only reliable entries are the last `trustedHops`, and the client is the
 * `trustedHops`th from the right. With one proxy that is the last entry. The
 * leftmost entry is attacker-controlled and is never used.
 *
 * Returns "unknown" when the header is missing, has fewer entries than there are
 * trusted hops, or the chosen entry is not an IP address. Callers should expect
 * "unknown" to share one strict rate-limit bucket (see rateLimit.ts).
 * X-Real-IP is deliberately ignored: it is a single value with no chain, so a
 * client-supplied one cannot be told apart from the edge's.
 */
export function clientIp(headers: Headers, trustedHops: number = env.trustedProxyHops): string {
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim());
  const hops = Number.isInteger(trustedHops) && trustedHops >= 0 ? trustedHops : 1;
  const raw = hops > 0 && entries.length >= hops ? entries[entries.length - hops] : undefined;
  const ip = raw === undefined ? null : normalise(raw);
  if (ip) return ip;
  if (!warnedUnknown) {
    warnedUnknown = true;
    console.warn(
      `clientIp: no trustworthy client address (trusted hops ${hops}, X-Forwarded-For entries ${entries.length}). ` +
        "Using the shared strict bucket. Check TRUSTED_PROXY_HOPS and the edge proxy."
    );
  }
  return UNKNOWN_IP;
}

export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
