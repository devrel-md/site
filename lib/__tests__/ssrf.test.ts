import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isBlockedIpv4, isBlockedIpv6 } from "@/lib/ssrf";

describe("isBlockedIpv4", () => {
  it("blocks private ranges", () => {
    expect(isBlockedIpv4("10.1.2.3")).toBe(true);
    expect(isBlockedIpv4("172.16.0.1")).toBe(true);
    expect(isBlockedIpv4("172.31.255.255")).toBe(true);
    expect(isBlockedIpv4("192.168.1.1")).toBe(true);
  });

  it("blocks loopback", () => {
    expect(isBlockedIpv4("127.0.0.1")).toBe(true);
  });

  it("blocks link-local, including the cloud metadata address", () => {
    expect(isBlockedIpv4("169.254.169.254")).toBe(true);
    expect(isBlockedIpv4("169.254.1.1")).toBe(true);
  });

  it("blocks CGNAT and reserved ranges", () => {
    expect(isBlockedIpv4("100.64.0.1")).toBe(true);
    expect(isBlockedIpv4("0.0.0.0")).toBe(true);
    expect(isBlockedIpv4("240.0.0.1")).toBe(true);
    expect(isBlockedIpv4("224.0.0.1")).toBe(true);
  });

  it("allows a normal public address", () => {
    expect(isBlockedIpv4("93.184.216.34")).toBe(false);
    expect(isBlockedIpv4("172.15.255.255")).toBe(false);
    expect(isBlockedIpv4("172.32.0.1")).toBe(false);
  });
});

describe("isBlockedIpv6", () => {
  it("blocks loopback and unspecified", () => {
    expect(isBlockedIpv6("::1")).toBe(true);
    expect(isBlockedIpv6("::")).toBe(true);
  });

  it("blocks link-local and unique-local", () => {
    expect(isBlockedIpv6("fe80::1")).toBe(true);
    expect(isBlockedIpv6("fd00::1")).toBe(true);
  });

  it("blocks IPv4-mapped addresses whose embedded address is blocked", () => {
    expect(isBlockedIpv6("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIpv6("::ffff:10.0.0.5")).toBe(true);
  });

  it("allows a normal public IPv6 address", () => {
    expect(isBlockedIpv6("2606:4700:4700::1111")).toBe(false);
  });
});

describe("safeFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refuses a non-HTTPS URL before making any request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { safeFetch, SsrfBlockedError } = await import("@/lib/ssrf");
    await expect(safeFetch("http://example.com/")).rejects.toBeInstanceOf(SsrfBlockedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a literal loopback IP before making any request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { safeFetch, SsrfBlockedError } = await import("@/lib/ssrf");
    await expect(safeFetch("https://127.0.0.1/")).rejects.toBeInstanceOf(SsrfBlockedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a hostname that resolves to a private address", async () => {
    vi.doMock("node:dns/promises", () => ({
      default: {
        lookup: vi.fn().mockResolvedValue([{ address: "10.0.0.5", family: 4 }]),
      },
    }));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { safeFetch, SsrfBlockedError } = await import("@/lib/ssrf");
    await expect(safeFetch("https://internal.example.test/")).rejects.toBeInstanceOf(SsrfBlockedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("follows a redirect to a public host but blocks one to a private address", async () => {
    vi.doMock("node:dns/promises", () => ({
      default: {
        lookup: vi.fn().mockImplementation(async (hostname: string) => {
          if (hostname === "internal.example.test") return [{ address: "10.0.0.9", family: 4 }];
          return [{ address: "93.184.216.34", family: 4 }];
        }),
      },
    }));

    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "https://internal.example.test/secret" } })
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { safeFetch, SsrfBlockedError } = await import("@/lib/ssrf");
    await expect(safeFetch("https://public.example.test/")).rejects.toBeInstanceOf(SsrfBlockedError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("gives up after too many redirects", async () => {
    vi.doMock("node:dns/promises", () => ({
      default: { lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]) },
    }));

    const fetchSpy = vi.fn().mockImplementation((input: string | URL) => {
      const url = String(input);
      return Promise.resolve(
        new Response(null, { status: 302, headers: { location: `${url}/next` } })
      );
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { safeFetch, SsrfBlockedError } = await import("@/lib/ssrf");
    await expect(safeFetch("https://public.example.test/")).rejects.toBeInstanceOf(SsrfBlockedError);
    // 1 initial + 3 allowed redirects = 4 calls before giving up on the 4th redirect.
    expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
