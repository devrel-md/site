import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderHomeHtml } from "@/lib/homeMarkdown";

describe("renderHomeHtml", () => {
  it("renders the real home.md content with FAQ details and a comparison grid", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    const { html } = await renderHomeHtml(raw);

    // FAQ becomes a list of <details><summary> pairs, not raw h3s.
    expect(html).toContain('<div class="faq-list">');
    expect(html).toContain('<details class="faq-item">');
    expect(html).toMatch(/<summary>How is this different from README\.md/);
    expect(html).not.toMatch(/<h3[^>]*>How is this different/);

    // The Without/With comparison becomes a two-card grid.
    expect(html).toContain('<div class="compare-grid">');
    const cardCount = (html.match(/<div class="compare-card">/g) ?? []).length;
    expect(cardCount).toBe(2);
    expect(html).toContain('<p class="compare-label">Without DEVREL.md</p>');
    expect(html).toContain('<p class="compare-label">With DEVREL.md</p>');

    // Headings still get stable ids, code blocks still declare a language.
    expect(html).toMatch(/<h2 id="why-devrelmd"/);
    expect(html).toMatch(/<code class="language-markdown"/);
  });

  it("does not throw and skips the transform when a section is missing", async () => {
    const { html } = await renderHomeHtml("# Title\n\nJust a normal paragraph.\n");
    expect(html).toContain("<p>Just a normal paragraph.</p>");
  });
});
