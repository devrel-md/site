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

  it("wraps the entrance in a hero, marks the lede, and links the full example under the example block", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    const { html } = await renderHomeHtml(raw);

    const hero = html.slice(html.indexOf('<div class="hero">'), html.indexOf('<h2 id="why-devrelmd"'));
    expect(hero).toContain("<h1");
    expect(hero).toContain('<p class="lede">Think of DEVREL.md as a README for your developer funnel');
    expect(hero).toContain("<pre>");
    // The hero closes before the reading column starts.
    expect(hero.trim().endsWith("</div>")).toBe(true);
    expect(html.match(/<div class="hero">/g)).toHaveLength(1);

    const afterExample = html.slice(html.indexOf('<h2 id="what-it-looks-like"'));
    expect(afterExample).toMatch(/<\/pre>\s*<p class="code-link"><a href="\/example">View the full example<\/a><\/p>/);
  });

  it("keeps the contribution guide link inside the 'Who maintains it?' answer", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    const { html } = await renderHomeHtml(raw);

    const start = html.indexOf("<summary>Who maintains it?</summary>");
    expect(start).toBeGreaterThan(-1);
    const end = html.indexOf("</details>", start);
    const answer = html.slice(start, end);
    expect(answer).toContain(
      'the <a href="https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md">contribution guide</a> explains'
    );
    expect(answer).toContain("Marcos Placona maintains it today.");
  });

  it("labels the example as an excerpt and keeps the comparison to measured facts", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    const { html } = await renderHomeHtml(raw);

    const example = html.slice(html.indexOf('<h2 id="what-it-looks-like"'), html.indexOf("<pre>", html.indexOf('<h2 id="what-it-looks-like"')));
    expect(example).toContain("An excerpt from the DEVREL.md of Acme Vector");
    expect(example).toContain('<a href="/example">complete example</a>');

    const grid = html.slice(html.indexOf('<div class="compare-grid">'), html.indexOf('<h2 id="how-to-use-devrelmd"'));
    expect(grid).toContain("about 22 minutes");
    expect(grid).not.toMatch(/five minutes|5 minutes/);
    expect(grid).not.toMatch(/Postgres 1\d|Node 1\d/);
  });

  it("gives an explicit instruction to read DEVREL.md and only claims automatic discovery for the skills", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    expect(raw).not.toContain("pick it up");
    const { html } = await renderHomeHtml(raw);

    const section = html.slice(html.indexOf('<h2 id="tell-your-agents-to-read-it"'), html.indexOf('<h2 id="works-with"'));
    expect(section).toContain("AGENTS.md");
    expect(section).toContain("CLAUDE.md");
    expect(section).toMatch(/<code class="language-markdown">## Developer relations/);
    expect(section).toContain("read [DEVREL.md](DEVREL.md)");

    const works = html.slice(html.indexOf('<h2 id="works-with"'), html.indexOf('<h2 id="common-mistakes"'));
    expect(works).toContain('<a href="#tell-your-agents-to-read-it">instruction above</a>');
    expect(works).toContain("look for it automatically");
  });

  it("has a contribution route, credits both book authors and links related work without endorsement", async () => {
    const raw = await readFile(path.join(process.cwd(), "content", "home.md"), "utf8");
    const { html } = await renderHomeHtml(raw);

    const section = html.slice(html.indexOf('<h2 id="contribute"'), html.indexOf('<h2 id="faq"'));
    expect(section).toContain('href="https://github.com/devrel-md/spec"');
    expect(section).toContain('href="https://github.com/devrel-md/skills"');
    expect(section).toContain('href="https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md"');
    expect(section).toContain("maintained by Marcos Placona");
    expect(section).toContain("Amir Shevat and Marcos Placona");
    expect(section).toContain('<a href="https://agents.md">AGENTS.md</a>');
    expect(section).toContain('href="https://github.com/coreyhaines31/marketingskills"');
    expect(section).toContain("doesn't mean their authors endorse DEVREL.md");
  });

  it("does not throw and skips the transform when a section is missing", async () => {
    const { html } = await renderHomeHtml("# Title\n\nJust a normal paragraph.\n");
    expect(html).toContain("<p>Just a normal paragraph.</p>");
  });
});
