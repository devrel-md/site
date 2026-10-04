import { describe, expect, it, vi } from "vitest";

const SOURCE = "How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 1, 2, 4, App F";
const LONG_DESCRIPTION =
  'Use when someone asks to check a quickstart. Trigger phrases include "check our quickstart", "onboarding friction". Walks a public path.';

// Fixtures stand in for content/skills: one skill with a summary, one without
// (the state before the content sync), so the catalog is safe either side of it.
vi.mock("@/lib/content", () => ({
  listSkills: async () => [
    {
      slug: "with-summary",
      frontmatter: {
        name: "with-summary",
        description: LONG_DESCRIPTION,
        metadata: { summary: "Walks your quickstart | rates every step", source: SOURCE },
      },
    },
    {
      slug: "no-summary",
      frontmatter: { name: "no-summary", description: LONG_DESCRIPTION, metadata: { source: SOURCE } },
    },
  ],
  readHome: async () => "",
  readQuickstart: async () => "",
  readSpec: async () => "",
  readTemplate: async () => "",
  readExample: async () => "",
  readSkillMarkdown: async () => "",
}));

import { skillsCatalogHtml, skillsCatalogMarkdown } from "@/lib/skillsPage";
import { buildLlmsTxt } from "@/lib/llms";

describe("skills catalog markdown", () => {
  it("shows the summary, chapter references and install command", async () => {
    const md = await skillsCatalogMarkdown();
    expect(md).toContain(
      "| [with-summary](/skills/with-summary) | Walks your quickstart \\| rates every step | Ch 1, 2, 4, App F | `npx skills add devrel-md/skills --skill with-summary` |"
    );
  });

  it("falls back to the first sentence of the description", async () => {
    const md = await skillsCatalogMarkdown();
    expect(md).toContain("| [no-summary](/skills/no-summary) | Use when someone asks to check a quickstart. | Ch 1, 2, 4, App F |");
    expect(md).not.toContain("Trigger phrases");
  });

  it("credits the book once above the table, not on every row", async () => {
    const md = await skillsCatalogMarkdown();
    const [intro, table] = md.split("| Skill |");
    expect(intro).toContain("Amir Shevat and Marcos Placona");
    expect(table).not.toContain("Amir Shevat");
    expect(table).not.toContain("How to Build Developer Ecosystems");
  });
});

describe("skills catalog html", () => {
  it("shows the summary, chapters and install command per skill", async () => {
    const html = await skillsCatalogHtml();
    expect(html).toContain("<p>Walks your quickstart | rates every step</p>");
    expect(html).toContain('<p class="meta">Book chapters: Ch 1, 2, 4, App F</p>');
    expect(html).toContain("npx skills add devrel-md/skills --skill no-summary");
    expect(html).not.toContain("Trigger phrases");
    expect(html).not.toContain("Book chapters: How to Build");
  });

  it("credits both authors once", async () => {
    const html = await skillsCatalogHtml();
    expect(html.match(/Amir Shevat/g)).toHaveLength(1);
  });
});

describe("llms.txt", () => {
  it("lists skills with the summary and falls back to the first sentence", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toMatch(/- \[with-summary\]\([^)]*\/skills\/with-summary\): Walks your quickstart \| rates every step\n/);
    expect(txt).toMatch(/- \[no-summary\]\([^)]*\/skills\/no-summary\): Use when someone asks to check a quickstart\.\n/);
    expect(txt).not.toContain("Trigger phrases");
  });
});
