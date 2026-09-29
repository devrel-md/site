import { describe, it, expect } from "vitest";
import { explainProblem } from "@/lib/validateExplain";

describe("explainProblem", () => {
  it("explains a missing frontmatter field", () => {
    expect(explainProblem("frontmatter missing stage")).toMatch(/"stage:"/);
  });

  it("explains a bad stage value", () => {
    expect(explainProblem("bad stage 'growth (inferred)'")).toMatch(/pre-launch, early, growth, scale, enterprise or unknown/);
  });

  it("explains a missing required section", () => {
    expect(explainProblem("missing section Product")).toBe('Add a "## Product" section.');
  });

  it("explains a missing funnel row", () => {
    expect(explainProblem("funnel row Awareness missing")).toBe(
      "Add a Funnel health table row for Awareness."
    );
  });

  it("explains a bad funnel pass value", () => {
    expect(explainProblem("funnel Onboarding pass='maybe'")).toMatch(/yes, no, unknown or n\/a/);
  });

  it("explains a length problem below the minimum", () => {
    expect(explainProblem("length 12 lines")).toMatch(/at least 40 lines/);
  });

  it("explains a length problem above the maximum", () => {
    expect(explainProblem("length 500 lines")).toMatch(/400 lines or fewer/);
  });

  it("explains no frontmatter, wrapped code fence and out-of-order sections", () => {
    expect(explainProblem("no frontmatter")).toMatch(/YAML frontmatter/);
    expect(explainProblem("wrapped in code fence")).toMatch(/```/);
    expect(explainProblem("required sections out of order")).toMatch(/spec order/);
  });

  it("falls back to a generic pointer for an unrecognised problem", () => {
    expect(explainProblem("something new")).toBe("See the spec (/spec) for the exact requirement.");
  });
});
