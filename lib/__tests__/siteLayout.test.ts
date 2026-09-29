import { describe, it, expect } from "vitest";
import { siteHeaderHtml, siteFooterHtml, NAV } from "@/lib/siteLayout";

describe("siteFooterHtml", () => {
  const footer = siteFooterHtml();

  it("links DevRel Bridge directly, with UTMs, no /go redirect and no nofollow", () => {
    expect(footer).toContain(
      '<a href="https://devrelbridge.com/?utm_source=devrel.md&utm_medium=footer">DevRel Bridge</a>'
    );
    expect(footer).not.toContain("/go/");
    expect(footer).not.toMatch(/rel="[^"]*nofollow/);
  });

  it("links the book title directly, with UTMs", () => {
    expect(footer).toContain(
      '<a href="https://devrelbridge.com/book?utm_source=devrel.md&utm_medium=footer"><em>How to Build Developer Ecosystems</em></a>'
    );
  });
});

describe("siteHeaderHtml", () => {
  it("has the wordmark and the five nav links in order", () => {
    const html = siteHeaderHtml("");
    expect(html).toContain("</svg>DEVREL.md</a>");
    const labels = [...html.matchAll(/class="nav-link"[^>]*>([^<]+)</g)].map((m) => m[1]);
    expect(labels).toEqual(["Quickstart", "Spec", "Skills", "Generate", "Validate"]);
    expect(NAV).toHaveLength(5);
    expect(html).not.toContain("aria-current");
  });

  it('marks the current page with aria-current="page" and its section with "true"', () => {
    expect(siteHeaderHtml("/spec")).toMatch(/href="\/spec" aria-current="page"/);
    expect(siteHeaderHtml("/spec").match(/aria-current/g)).toHaveLength(1);
    expect(siteHeaderHtml("/skills/agent-readiness-check")).toMatch(/href="\/skills" aria-current="true"/);
  });
});

describe("brand mark and head meta", () => {
  it("puts an aria-hidden, currentColor mark before the wordmark text", async () => {
    const { siteHeaderHtml } = await import("@/lib/siteLayout");
    const html = siteHeaderHtml("");
    expect(html).toMatch(/<a class="wordmark" href="\/"><svg class="mark"[^>]*aria-hidden="true"/);
    expect(html).toContain("</svg>DEVREL.md</a>");
    expect(html).toContain('stroke="currentColor"');
    expect(html).not.toMatch(/<svg[^>]*role=/);
  });
});
