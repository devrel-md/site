import { describe, it, expect } from "vitest";
import { resolveGo, buildTrackedUrl } from "@/lib/goRedirect";

describe("resolveGo", () => {
  it("resolves a known slug to its destination", () => {
    const { destination } = resolveGo("audit", new URLSearchParams());
    expect(destination).toBe("https://devrelbridge.com/audit");
  });

  it("returns null for an unknown slug", () => {
    const { destination } = resolveGo("nonsense", new URLSearchParams());
    expect(destination).toBeNull();
  });

  it("defaults medium to site and drops an unrecognised medium", () => {
    const { params } = resolveGo("book", new URLSearchParams("m=carrier-pigeon"));
    expect(params.medium).toBe("site");
  });

  it("accepts every allowed medium", () => {
    for (const m of ["skill", "generator", "site", "email"]) {
      const { params } = resolveGo("book", new URLSearchParams(`m=${m}`));
      expect(params.medium).toBe(m);
    }
  });

  it("carries campaign and lead token through", () => {
    const { params } = resolveGo("launch", new URLSearchParams("c=devrel-md-init&t=abc123"));
    expect(params.campaign).toBe("devrel-md-init");
    expect(params.leadToken).toBe("abc123");
  });
});

describe("buildTrackedUrl", () => {
  it("appends utm_source, utm_medium and the campaign", () => {
    const url = buildTrackedUrl("https://devrelbridge.com/audit", {
      slug: "audit",
      medium: "skill",
      campaign: "devrel-md-init",
      leadToken: null,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("utm_source")).toBe("devrel.md");
    expect(parsed.searchParams.get("utm_medium")).toBe("skill");
    expect(parsed.searchParams.get("utm_campaign")).toBe("devrel-md-init");
    expect(parsed.searchParams.has("lt")).toBe(false);
  });

  it("preserves an incoming lead token as lt", () => {
    const url = buildTrackedUrl("https://devrelbridge.com/book", {
      slug: "book",
      medium: "generator",
      campaign: null,
      leadToken: "lead-token-1",
    });
    expect(new URL(url).searchParams.get("lt")).toBe("lead-token-1");
  });

  it("omits utm_campaign when there is none", () => {
    const url = buildTrackedUrl("https://devrelbridge.com/audit", {
      slug: "audit",
      medium: "site",
      campaign: null,
      leadToken: null,
    });
    expect(new URL(url).searchParams.has("utm_campaign")).toBe(false);
  });
});
