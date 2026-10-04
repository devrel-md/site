import { describe, it, expect, vi, beforeEach } from "vitest";
import { clientIp, hashIp, UNKNOWN_IP } from "@/lib/hash";

function headers(forwarded?: string, extra: Record<string, string> = {}): Headers {
  const h = new Headers(extra);
  if (forwarded !== undefined) h.set("x-forwarded-for", forwarded);
  return h;
}

describe("clientIp with one trusted proxy (production)", () => {
  it("uses the address the edge appended when the client sent no header", () => {
    expect(clientIp(headers("198.51.100.4"), 1)).toBe("198.51.100.4");
  });

  it("ignores a forged leftmost entry and uses the one the edge appended", () => {
    expect(clientIp(headers("203.0.113.7, 198.51.100.4"), 1)).toBe("198.51.100.4");
  });

  it("ignores a long forged chain", () => {
    expect(clientIp(headers("1.1.1.1, 2.2.2.2, 3.3.3.3, 198.51.100.4"), 1)).toBe("198.51.100.4");
  });

  it("gives the same identity however the client forges the header", () => {
    const a = clientIp(headers("203.0.113.7, 198.51.100.4"), 1);
    const b = clientIp(headers("203.0.113.8, 198.51.100.4"), 1);
    const c = clientIp(headers("198.51.100.4"), 1);
    expect(new Set([a, b, c]).size).toBe(1);
  });

  it("tolerates spaces and mixed case around entries", () => {
    expect(clientIp(headers("  203.0.113.7 ,   198.51.100.4  "), 1)).toBe("198.51.100.4");
  });

  it("ignores X-Real-IP, even when it is the only header", () => {
    expect(clientIp(headers(undefined, { "x-real-ip": "203.0.113.10" }), 1)).toBe(UNKNOWN_IP);
    expect(clientIp(headers("198.51.100.4", { "x-real-ip": "203.0.113.10" }), 1)).toBe("198.51.100.4");
  });
});

describe("clientIp with two trusted proxies", () => {
  it("uses the second entry from the right", () => {
    // client, then the address the CDN saw, then the address the edge saw (the CDN)
    expect(clientIp(headers("198.51.100.4, 192.0.2.50"), 2)).toBe("198.51.100.4");
  });

  it("ignores forged entries to the left of the trusted pair", () => {
    expect(clientIp(headers("203.0.113.7, 198.51.100.4, 192.0.2.50"), 2)).toBe("198.51.100.4");
  });

  it("is unknown when the chain is shorter than the trusted hops", () => {
    expect(clientIp(headers("198.51.100.4"), 2)).toBe(UNKNOWN_IP);
  });
});

describe("clientIp with no trustworthy address", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("is unknown when the header is missing", () => {
    expect(clientIp(headers(undefined), 1)).toBe(UNKNOWN_IP);
  });

  it("is unknown when the header is empty or only separators", () => {
    expect(clientIp(headers(""), 1)).toBe(UNKNOWN_IP);
    expect(clientIp(headers(" , "), 1)).toBe(UNKNOWN_IP);
    expect(clientIp(headers("203.0.113.7,"), 1)).toBe(UNKNOWN_IP);
  });

  it("is unknown when no proxy is trusted", () => {
    expect(clientIp(headers("203.0.113.7"), 0)).toBe(UNKNOWN_IP);
  });

  it("falls back to one trusted hop for a nonsense hop count", () => {
    expect(clientIp(headers("203.0.113.7, 198.51.100.4"), -1)).toBe("198.51.100.4");
    expect(clientIp(headers("203.0.113.7, 198.51.100.4"), 1.5)).toBe("198.51.100.4");
    expect(clientIp(headers("203.0.113.7, 198.51.100.4"), Number.NaN)).toBe("198.51.100.4");
  });

  it.each([
    "not-an-ip",
    "999.1.1.1",
    "1.2.3",
    "1.2.3.4.5",
    "198.51.100.4:8080",
    "<script>alert(1)</script>",
    "198.51.100.4; drop table rate_limits",
    "::g",
    "1:2:3:4:5:6:7:8:9",
    "unknown",
    "x".repeat(5000),
  ])("is unknown for a malformed trusted entry: %s", (value) => {
    expect(clientIp(headers(`203.0.113.7, ${value}`), 1)).toBe(UNKNOWN_IP);
  });

  it("does not let a forged valid entry stand in for a malformed trusted one", () => {
    expect(clientIp(headers("203.0.113.7, garbage"), 1)).toBe(UNKNOWN_IP);
  });

  it("never exposes the header contents in the warning", () => {
    const warn = vi.spyOn(console, "warn");
    clientIp(headers("secret-looking-value"), 1);
    for (const call of warn.mock.calls) expect(String(call[0])).not.toContain("secret-looking-value");
  });
});

describe("clientIp with IPv6", () => {
  it("keys on the /64 prefix, so rotating the host part gives one identity", () => {
    const a = clientIp(headers("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), 1);
    const b = clientIp(headers("2001:db8:1:2::1"), 1);
    expect(a).toBe("2001:db8:1:2::/64");
    expect(b).toBe(a);
  });

  it("separates different /64 prefixes", () => {
    expect(clientIp(headers("2001:db8:1:2::1"), 1)).not.toBe(clientIp(headers("2001:db8:1:3::1"), 1));
  });

  it("is case-insensitive, strips leading zeros and accepts brackets and zone ids", () => {
    const canonical = "2001:db8:1:2::/64";
    expect(clientIp(headers("2001:DB8:0001:0002:0:0:0:1"), 1)).toBe(canonical);
    expect(clientIp(headers("[2001:db8:1:2::1]"), 1)).toBe(canonical);
    expect(clientIp(headers("2001:db8:1:2::1%eth0"), 1)).toBe(canonical);
  });

  it("maps IPv4-mapped IPv6 addresses to the IPv4 form", () => {
    expect(clientIp(headers("::ffff:198.51.100.4"), 1)).toBe("198.51.100.4");
    expect(clientIp(headers("::ffff:c633:6404"), 1)).toBe("198.51.100.4");
  });

  it("handles loopback and short forms without collapsing them into IPv4 buckets", () => {
    expect(clientIp(headers("::1"), 1)).toBe("0:0:0:0::/64");
    expect(clientIp(headers("2001:db8::"), 1)).toBe("2001:db8:0:0::/64");
  });

  it("ignores a forged IPv6 entry to the left of the trusted one", () => {
    expect(clientIp(headers("2001:db8:ffff::1, 198.51.100.4"), 1)).toBe("198.51.100.4");
    expect(clientIp(headers("203.0.113.7, 2001:db8:1:2::1"), 1)).toBe("2001:db8:1:2::/64");
  });
});

describe("clientIp default", () => {
  it("trusts one proxy when TRUSTED_PROXY_HOPS is not set", () => {
    expect(clientIp(headers("203.0.113.7, 198.51.100.4"))).toBe("198.51.100.4");
  });
});

describe("hashIp of the unknown address", () => {
  it("is stable, so every unknown request lands in the same bucket", () => {
    expect(hashIp(UNKNOWN_IP)).toBe(hashIp("unknown"));
  });
});
