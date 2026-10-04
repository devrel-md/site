import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const PUBLIC_ORIGIN = "https://devrel.md";

// env.siteUrl is read when lib/env is first imported, so each test sets
// SITE_URL, resets the module cache and imports the route fresh.
describe("public URLs follow the runtime SITE_URL", () => {
  const original = process.env.SITE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.SITE_URL = PUBLIC_ORIGIN;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = original;
  });

  it("robots.txt points at the public sitemap", async () => {
    const { default: robots } = await import("@/app/robots");
    const out = JSON.stringify(robots());
    expect(out).not.toContain("localhost");
    expect(robots().sitemap).toBe(`${PUBLIC_ORIGIN}/sitemap.xml`);
  });

  it("sitemap.xml only lists public URLs", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(10);
    for (const entry of entries) {
      expect(entry.url.startsWith(`${PUBLIC_ORIGIN}/`)).toBe(true);
      expect(entry.url).not.toContain("localhost");
    }
  });

  it("llms.txt, llms-full.txt and openapi.json contain no localhost", async () => {
    const llms = await (await import("@/app/llms.txt/route")).GET();
    const full = await (await import("@/app/llms-full.txt/route")).GET();
    const openapi = await (await import("@/app/openapi.json/route")).GET();
    expect(await llms.text()).not.toContain("localhost");
    expect(await full.text()).not.toContain("localhost");
    expect(await openapi.text()).not.toContain("localhost");
  });
});

// Without this, Next prerenders robots.txt and sitemap.xml at build time, when
// SITE_URL is unset, and bakes http://localhost:3000 into the image (issue #16).
describe("routes that embed SITE_URL are not prerendered", () => {
  it.each(["@/app/robots", "@/app/sitemap"])("%s is force-dynamic", async (path) => {
    const mod = (await import(path)) as { dynamic?: string };
    expect(mod.dynamic).toBe("force-dynamic");
  });
});
