import { describe, it, expect } from "vitest";
import { nextStep } from "@/lib/funnelGates";
import { stageGatesHtml } from "@/lib/resultPage";
import type { FunnelGate } from "@/lib/results";

const STAGES = ["Awareness", "Onboarding", "Activation", "Engagement", "Monetization"];
const gates = (passes: FunnelGate["pass"][], now = "Not stated in public docs"): FunnelGate[] =>
  STAGES.map((stage, i) => ({ stage, gate: `${stage} gate`, now, pass: passes[i]! }));

describe("next step", () => {
  it("fixes the earliest known failure, even when an earlier stage needs data", () => {
    const step = nextStep(gates(["unknown", "unknown", "no", "unknown", "n/a"]));
    expect(step).toMatchObject({ kind: "fix", gate: { stage: "Activation" } });
  });

  it("measures Onboarding first when nothing is known to fail", () => {
    const step = nextStep(gates(["unknown", "unknown", "unknown", "unknown", "unknown"]));
    expect(step).toMatchObject({ kind: "measure", gate: { stage: "Onboarding" } });
  });

  it("measures the earliest unknown stage when Onboarding is already known", () => {
    const step = nextStep(gates(["yes", "yes", "unknown", "unknown", "n/a"]));
    expect(step).toMatchObject({ kind: "measure", gate: { stage: "Activation" } });
  });

  it("maintains when everything passes", () => {
    expect(nextStep(gates(["yes", "yes", "yes", "yes", "n/a"]))).toEqual({ kind: "maintain" });
  });
});

describe("stage gates summary", () => {
  it("explains an all-unknown result instead of implying nothing was found", () => {
    const html = stageGatesHtml(gates(["unknown", "unknown", "unknown", "unknown", "unknown"]));
    expect(html).toContain("needs a number only your team has");
    expect(html).toContain("Needs your data");
    expect(html).toContain("Measure first: Onboarding");
    expect(html).toContain("To judge it, measure");
    expect(html).not.toContain("Fix first");
    expect(html).not.toContain(">unknown<");
  });

  it("shows what was found on the public pages", () => {
    const html = stageGatesHtml(gates(["unknown", "unknown", "unknown", "unknown", "unknown"], "A Slack channel on the Scale plan"));
    expect(html).toContain("What we found:</strong> A Slack channel on the Scale plan");
  });
});

describe("stage gates summary wording", () => {
  it("says a generated result is number matching, not fact checking", () => {
    const html = stageGatesHtml(gates(["unknown", "unknown", "unknown", "unknown", "unknown"]));
    expect(html).toContain("number matching, not fact checking");
  });

  it("does not claim a pasted file was compared with pages", () => {
    const html = stageGatesHtml(gates(["unknown", "unknown", "unknown", "unknown", "unknown"]), "pasted");
    expect(html).not.toContain("We read your public pages");
    expect(html).toContain("Nothing here was compared with your pages");
  });
});
