import { describe, expect, it } from "vitest";
import { firstSentence, skillChapters, skillInstallCommand, skillSummaryText } from "@/lib/skillSummary";

const SOURCE = "How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 1, 2, 4, App F";

describe("skillSummaryText", () => {
  it("prefers metadata.summary", () => {
    expect(
      skillSummaryText({
        name: "x",
        description: "Use when asked. Trigger phrases include a, b.",
        metadata: { summary: "  Does the thing  " },
      })
    ).toBe("Does the thing");
  });

  it("falls back to the first sentence of the description", () => {
    expect(
      skillSummaryText({
        name: "x",
        description: "Use when checking a quickstart. Trigger phrases include \"a\", \"b\".",
        metadata: { source: SOURCE },
      })
    ).toBe("Use when checking a quickstart.");
  });

  it("treats a blank summary as missing", () => {
    expect(skillSummaryText({ name: "x", description: "First. Second.", metadata: { summary: "  " } })).toBe("First.");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(skillSummaryText({ name: "x", description: "" })).toBe("");
  });
});

describe("firstSentence", () => {
  it("returns the whole text when it has no sentence end", () => {
    expect(firstSentence("No full stop here")).toBe("No full stop here");
  });

  it("does not split on a full stop inside a word or version", () => {
    expect(firstSentence("Checks llms.txt and v0.1 files. Then more.")).toBe("Checks llms.txt and v0.1 files.");
  });

  it("collapses line breaks", () => {
    expect(firstSentence("Line one\nstill one. Next.")).toBe("Line one still one.");
  });
});

describe("skillChapters", () => {
  it("drops the book title and authors", () => {
    expect(skillChapters({ name: "x", description: "", metadata: { source: SOURCE } })).toBe("Ch 1, 2, 4, App F");
  });

  it("keeps appendix-only references", () => {
    expect(
      skillChapters({
        name: "x",
        description: "",
        metadata: { source: "How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, App A.5, App A.6" },
      })
    ).toBe("App A.5, App A.6");
  });

  it("returns an unrecognised source unchanged and unknown when absent", () => {
    expect(skillChapters({ name: "x", description: "", metadata: { source: "Ch 4" } })).toBe("Ch 4");
    expect(skillChapters({ name: "x", description: "" })).toBe("unknown");
  });
});

describe("skillInstallCommand", () => {
  it("installs a single skill from the repository", () => {
    expect(skillInstallCommand("icp-builder")).toBe("npx skills add devrel-md/skills --skill icp-builder");
  });
});
