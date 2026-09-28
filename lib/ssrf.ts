// A safe page fetcher for the generator. HTTPS only, resolves the host and
// refuses private, loopback, link-local and metadata IP ranges, including
// after redirects (SSRF protection). 10s timeout, 2 MB cap per page.
import dns from "node:dns/promises";
import net from "node:net";

const USER_AGENT = "devrel.md-generator (+https://devrel.md)";
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;

export class SsrfBlockedError extends Error {
  constructor(reason: string) {
    super(`Blocked by SSRF guard: ${reason}`);
    this.name = "SsrfBlockedError";
  }
}

/** True when an IPv4 address falls in a private, loopback, link-local, CGNAT
 * or metadata range. */
export function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts as [number, number, number, number];

  if (a === 0) return true; // "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 0) return true; // reserved (incl. 192.0.0.0/24)
  if (a === 192 && b === 168) return true; // private
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved (224.0.0.0/4, 240.0.0.0/4) and broadcast
  return false;
}

/** True when an IPv6 address falls in a loopback, link-local or unique-local
 * range, or is an IPv4-mapped address whose embedded IPv4 is blocked. */
export function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower === "::") return true; // unspecified
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // fe80::/10 link-local
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 unique local

  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]!);

  return false;
}

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (net.isIPv6(ip)) return isBlockedIpv6(ip);
  return true; // unrecognised: fail closed
}

async function assertHostIsSafe(hostname: string): Promise<void> {
  // A literal IP in the URL: check it directly.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new SsrfBlockedError(`literal IP ${hostname} is blocked`);
    return;
  }

  if (hostname === "localhost") throw new SsrfBlockedError("localhost is blocked");

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError(`could not resolve ${hostname}`);
  }
  if (addresses.length === 0) throw new SsrfBlockedError(`no addresses for ${hostname}`);
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfBlockedError(`${hostname} resolves to blocked address ${address}`);
    }
  }
}

export interface SafeFetchResult {
  url: string;
  status: number;
  headers: Headers;
  text: string;
  truncated: boolean;
}

/** Fetch a page with SSRF protection, a hard byte cap and a manual, checked
 * redirect chain. Only ever follows https:// links. */
export async function safeFetch(inputUrl: string): Promise<SafeFetchResult> {
  let current = new URL(inputUrl);

  for (let hop = 0; ; hop += 1) {
    if (current.protocol !== "https:") {
      throw new SsrfBlockedError(`non-HTTPS scheme ${current.protocol}`);
    }
    await assertHostIsSafe(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,text/markdown,text/plain;q=0.9,*/*;q=0.5",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new SsrfBlockedError("redirect with no Location header");
      if (hop >= MAX_REDIRECTS) throw new SsrfBlockedError("too many redirects");
      current = new URL(location, current);
      continue;
    }

    const reader = response.body?.getReader();
    let bytes = 0;
    let truncated = false;
    const chunks: Uint8Array[] = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          bytes += value.byteLength;
          if (bytes > MAX_BYTES) {
            truncated = true;
            const remaining = MAX_BYTES - (bytes - value.byteLength);
            if (remaining > 0) chunks.push(value.slice(0, remaining));
            await reader.cancel().catch(() => {});
            break;
          }
          chunks.push(value);
        }
      }
    }
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");

    return { url: current.toString(), status: response.status, headers: response.headers, text, truncated };
  }
}

export { USER_AGENT as GENERATOR_USER_AGENT };
