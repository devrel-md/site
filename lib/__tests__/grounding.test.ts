import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { groundingProblems, hasEnoughSource } from "@/lib/grounding";
import { validate } from "@/lib/validator";

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
      "- Time to Hello World: unknown today, 5 min target (proposed)",
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

// A Funnel health table with the spec's default gates and the given Now cells.
function funnel(now: Partial<Record<"Awareness" | "Onboarding" | "Activation" | "Engagement" | "Monetization", string>>) {
  const gates = {
    Awareness: "Signups arrive from quality sources, not just traffic spikes",
    Onboarding: "Median time to first call under 5 minutes, and first-call success above 80%",
    Activation: "Activation rate above 20%, and production usage is measurable",
    Engagement: "The community answers more than 65% of questions, and engagement sustains itself",
    Monetization: "Paying deepens trust rather than replacing it",
  };
  const rows = Object.entries(gates).map(
    ([stage, gate]) => `| ${stage} | ${gate} | ${now[stage as keyof typeof now] ?? "Not stated in public docs"} | unknown |`
  );
  return ["## Funnel health", "", "| Stage | Gate | Now | Pass |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

const docs = (content: string, url = "https://acme.dev/docs/start") => ({ url, label: "docs", content });
const FILLER = "Acme sends email for developers. ".repeat(20);

describe("current values need evidence tied to the metric", () => {
  it("does not let a gate threshold support an invented current first-call time", () => {
    const markdown = funnel({ Onboarding: "Median time to first call is 5 min" });
    const problems = groundingProblems(markdown, [docs(`${FILLER} Quickstart for Node.`)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Onboarding: "5"');
  });

  it("does not let an unrelated number in the pages stand in for a current time", () => {
    const markdown = funnel({ Onboarding: "Median time to first call is 5 min" });
    const problems = groundingProblems(markdown, [docs(`${FILLER} The Pro plan includes 5 minutes of audio hosting.`)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("not next to words that describe this metric");
  });

  it("does not let an unrelated pricing number support an activation rate", () => {
    const markdown = funnel({ Activation: "20% activation rate" });
    const problems = groundingProblems(markdown, [docs(`${FILLER} The Pro plan costs $20 per month.`)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Activation: "20"');
  });

  it("applies the same rule to an activation rate stated outside the table", () => {
    const markdown = ["## Activation", "- **Current activation rate:** 20%"].join("\n");
    const problems = groundingProblems(markdown, [docs(`${FILLER} The Pro plan costs $20 per month.`)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"20" in');
  });

  it("does not match a count with a plan price in a different unit", () => {
    const markdown = ["## Product", "- Quickstarts exist for 20+ languages."].join("\n");
    const problems = groundingProblems(markdown, [docs(`${FILLER} The Pro plan costs $20 per month.`)]);
    expect(problems).toHaveLength(1);
  });

  it("checks a current measurement on a line that also carries a target", () => {
    const markdown = ["## North Star", "- Time to Hello World: 12 min today, 5 min target (proposed)"].join("\n");
    const problems = groundingProblems(markdown, [docs(FILLER)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"12"');
  });

  it("checks the current value when the target follows 'and'", () => {
    const markdown = ["## North Star", "- Median 14 min today and 5 min target (proposed)"].join("\n");
    const problems = groundingProblems(markdown, [docs(FILLER)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"14"');
  });

  it("accepts a measurement the pages state next to the metric", () => {
    const markdown = funnel({ Onboarding: "14 min median, 71% first-call success" });
    const pages = [docs(`${FILLER}\n\nOur median time to first call is 14 minutes, and first-call success is 71%.`)];
    expect(groundingProblems(markdown, pages)).toEqual([]);
  });

  it("accepts a measurement when the line cites a fetched page that states it", () => {
    const markdown = funnel({ Onboarding: "14 min (Source: [start guide](https://acme.dev/docs/start.md))" });
    const pages = [docs(`${FILLER}\n\nThe cache refreshes every 14 minutes.`)];
    expect(groundingProblems(markdown, pages)).toEqual([]);
  });

  it("ignores a citation that points at a page that does not state it", () => {
    const markdown = funnel({ Onboarding: "14 min (Source: [pricing](https://acme.dev/pricing))" });
    const pages = [
      docs(`${FILLER}\n\nThe cache refreshes every 14 minutes.`),
      docs(`${FILLER} Pricing is simple.`, "https://acme.dev/pricing"),
    ];
    expect(groundingProblems(markdown, pages)).toHaveLength(1);
  });

  it("needs the unit to agree: a percentage is not a duration", () => {
    const markdown = funnel({ Onboarding: "Median time to first call is 80 min" });
    const problems = groundingProblems(markdown, [docs(`${FILLER}\n\nFirst-call success is 80%.`)]);
    expect(problems).toHaveLength(1);
  });

  it("catches units written without a space", () => {
    const markdown = funnel({ Onboarding: "Median 5min to first call" });
    expect(groundingProblems(markdown, [docs(FILLER)])).toHaveLength(1);
  });

  it("accepts unknown values and unmeasured stages", () => {
    const markdown = funnel({
      Onboarding: "Docs provide SDK quickstarts; current time and success rate are unknown.",
      Activation: "unknown",
    });
    expect(groundingProblems(markdown, [docs(FILLER)])).toEqual([]);
  });

  it("accepts a Now cell that restates the default gate thresholds as targets", () => {
    const markdown = funnel({
      Onboarding: "No data against the 5 min and 80% targets",
      Engagement: "unknown today, against a 65% target and answers within 24h",
    });
    expect(groundingProblems(markdown, [docs(FILLER)])).toEqual([]);
  });
});

describe("proposals follow the spec's no-invented-number rule", () => {
  it("accepts a target at a default gate threshold, or left as a placeholder", () => {
    const markdown = [
      "## North Star",
      "- Time to Hello World: unknown today, under 5 minutes target (proposed)",
      "- Target time from signup: <N minutes> (proposed)",
    ].join("\n");
    expect(groundingProblems(markdown, [docs(FILLER)])).toEqual([]);
  });

  it("flags a target number that neither the pages nor the default gates state", () => {
    const markdown = ["## North Star", "- Time to Hello World: unknown today, 15 min target (proposed)"].join("\n");
    const problems = groundingProblems(markdown, [docs(FILLER)]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("proposed target");
    expect(problems[0]).toContain("<N minutes>");
  });

  it("flags a number inside proposed wording", () => {
    const markdown = ["## Value proposition", "Send email in under 2 minutes. (proposed)"].join("\n");
    expect(groundingProblems(markdown, [docs(FILLER)])).toHaveLength(1);
  });

  it("accepts a target the pages themselves state", () => {
    const markdown = ["## North Star", "- Target time to first call: 10 minutes (proposed)"].join("\n");
    const pages = [docs(`${FILLER} Our aim is a working call within 10 minutes of signup.`)];
    expect(groundingProblems(markdown, pages)).toEqual([]);
  });
});

describe("bake-off fixtures keep their recorded outcome", () => {
  const dir = path.join(process.cwd(), "scripts", "bakeoff");
  // Stand-in for the pricing page the fixtures were drafted from.
  const pricing = docs(
    `${FILLER}\n\nFree plan: 100 emails per day, 3 domains. Pro plan $20 per month. ` +
      "Pricing includes a free-plan sending limit of 100 per day.",
    "https://resend.com/pricing"
  );

  it("passes and fails structural validation exactly as results.json recorded", async () => {
    const results: { file?: string; problems?: string[] }[] = JSON.parse(await readFile(path.join(dir, "results.json"), "utf8"));
    const recorded = results.filter((r) => r.file);
    expect(recorded).toHaveLength(6);
    for (const { file, problems } of recorded) {
      const text = await readFile(path.join(dir, "fixtures", file!), "utf8");
      expect(validate(text), file).toEqual(problems);
    }
  });

  it("still accepts the clean fixture and still rejects those with invented figures", async () => {
    const outcome = async (file: string) =>
      groundingProblems(await readFile(path.join(dir, "fixtures", file), "utf8"), [pricing]).length === 0;
    expect(await outcome("openai-gpt-6-luna.md")).toBe(true);
    // Archetype percentages, team sizes and a made-up 15 minute figure.
    expect(await outcome("nvidia-nemotron-3-ultra-550b-a55b-free.md")).toBe(false);
    expect(await outcome("google-gemini-2-5-flash-lite.md")).toBe(false);
    expect(await outcome("deepseek-deepseek-v4-flash.md")).toBe(false);
    expect(await outcome("nvidia-nemotron-3-super-120b-a12b.md")).toBe(false);
  });
});
