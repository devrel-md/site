import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validate } from "@/lib/validator";

const FIXTURES_DIR = path.join(process.cwd(), "scripts", "bakeoff", "fixtures");

// Ground truth: scripts/bakeoff/results.json, produced by the Python
// validator this file is a TypeScript port of.
const CASES: { file: string; problems: string[] }[] = [
  { file: "openai-gpt-6-luna.md", problems: [] },
  { file: "nvidia-nemotron-3-ultra-550b-a55b-free.md", problems: [] },
  {
    file: "deepseek-deepseek-v4-flash.md",
    problems: ["bad stage 'growth (inferred)'", "funnel row Awareness missing"],
  },
  {
    file: "google-gemini-2-5-flash-lite.md",
    problems: ["wrapped in code fence", "missing section Product"],
  },
  {
    file: "nvidia-nemotron-3-super-120b-a12b.md",
    problems: ["bad stage 'growth (inferred)'"],
  },
  { file: "qwen-qwen3-8-flash.md", problems: ["no frontmatter"] },
];

describe("validate (bake-off fixtures)", () => {
  for (const { file, problems } of CASES) {
    it(`matches the Python validator's verdict for ${file}`, async () => {
      const text = await readFile(path.join(FIXTURES_DIR, file), "utf8");
      expect(validate(text)).toEqual(problems);
    });
  }
});

describe("validate (unit behaviour)", () => {
  it("flags a file with no frontmatter", () => {
    expect(validate("# Just a heading\n")).toEqual(["no frontmatter"]);
  });

  it("flags missing required frontmatter keys", () => {
    const text = `---\nspec: devrel.md/0.1\n---\n\n## Product\n\nx\n`;
    const problems = validate(text);
    expect(problems).toContain("frontmatter missing product");
    expect(problems).toContain("frontmatter missing stage");
    expect(problems).toContain("frontmatter missing updated");
  });

  it("accepts a minimal, well-formed file", () => {
    const lines = [
      "---",
      "spec: devrel.md/0.1",
      "product: Acme",
      "stage: unknown",
      "updated: 2026-09-28",
      "---",
      "",
      "## Product",
      "text",
      "## Value proposition",
      "text",
      "## ICPs",
      "text",
      "## Anti-personas",
      "text",
      "## North Star",
      "text",
      "## Activation",
      "text",
      "## Funnel health",
      "",
      "| Stage | Gate | Now | Pass |",
      "| --- | --- | --- | --- |",
      "| Awareness | g | n | yes |",
      "| Onboarding | g | n | yes |",
      "| Activation | g | n | yes |",
      "| Engagement | g | n | yes |",
      "| Monetization | g | n | n/a |",
    ];
    // Pad to satisfy the 40-line minimum, same as a real generated file would be.
    while (lines.length < 40) lines.push("filler line");
    expect(validate(lines.join("\n"))).toEqual([]);
  });
});
