import { describe, it, expect } from "vitest";
import { groundingProblems, hasEnoughSource } from "@/lib/grounding";

const page = (content: string) => ({ url: "https://example.com", label: "input page", content });

function draft(now: string, extra = ""): string {
  return [
    "## North Star",
    extra,
    "## Funnel health",
    "",
    "| Stage | Gate | Now | Pass |",
    "| --- | --- | --- | --- |",
    `| Awareness | Signups come from quality sources | ${now} | unknown |`,
    "| Onboarding | Median time to first call < 5 min and first-call success > 80% | Not stated in public docs | unknown |",
  ].join("\n");
}

describe("grounding", () => {
  it("flags a figure that is not in the fetched pages (the replay.io star count)", () => {
    const problems = groundingProblems(draft("GitHub stars 8.5k"), [page("Replay records your app.")]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("8.5k");
  });

  it("accepts a figure the pages state, however it is written", () => {
    const pages = [page("Over 8,500 developers use Replay. Setup takes 30 seconds.")];
    expect(groundingProblems(draft("8.5k developers; setup in 30 seconds"), pages)).toEqual([]);
  });

  it("accepts thresholds quoted from the gate itself", () => {
    const markdown = draft("Not stated").replace(
      "| Not stated in public docs | unknown |",
      "| No data against the 5 min and 80% targets | unknown |"
    );
    expect(groundingProblems(markdown, [page("docs")])).toEqual([]);
  });

  it("flags estimates anywhere in the file", () => {
    const problems = groundingProblems(draft("Not stated", "Discord ~2k members"), [page("Join our Discord")]);
    expect(problems.some((p) => p.includes("Estimated"))).toBe(true);
  });

  it("does not match a figure inside a longer number", () => {
    expect(groundingProblems(draft("722 stars"), [page("17225 downloads")])).toHaveLength(1);
  });

  it("needs a minimum amount of source text", () => {
    expect(hasEnoughSource([])).toBe(false);
    expect(hasEnoughSource([page("short")])).toBe(false);
    expect(hasEnoughSource([page("x".repeat(600))])).toBe(true);
  });
});

describe("grounding across the whole file", () => {
  const pages = [page("Replay QA explores your app. ".repeat(30))];

  it("flags invented figures outside Funnel health (the replay.io archetype split and team sizes)", () => {
    const markdown = [
      "## ICPs",
      "- Company stage and team size: Series A startups (20 to 200 engineers)",
      "## Developer archetypes",
      "- Hacker: 25%",
    ].join("\n");
    const problems = groundingProblems(markdown, pages);
    expect(problems.some((p) => p.includes('"20"'))).toBe(true);
    expect(problems.some((p) => p.includes('"25"'))).toBe(true);
  });

  it("ignores proposals, links, list numbering, named standards and the sections we don't check", () => {
    const markdown = [
      "---",
      "spec: devrel.md/0.1",
      "updated: 2026-09-30",
      "---",
      "## North Star",
      "- Time to Hello World: unknown today, 15 min target (proposed)",
      "## ICPs",
      "### ICP 2: QA engineers",
      "1. Needs SOC 2 and OAuth 2.0 with Node18",
      "- See [the guide](https://docs.example.com/v2/start)",
      "## Docs map",
      "- API v3: https://example.com/v3",
      "## Open questions",
      "1. What share of 1,000 signups activate within 7 days?",
    ].join("\n");
    expect(groundingProblems(markdown, pages)).toEqual([]);
  });
});
