import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runValidation } from "@/lib/runValidation";

describe("runValidation", () => {
  it("reports a valid file with no problems and no empty explanations", async () => {
    const text = await readFile(
      path.join(process.cwd(), "scripts", "bakeoff", "fixtures", "openai-gpt-6-luna.md"),
      "utf8"
    );
    const result = runValidation(text);
    expect(result.valid).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.gates).toHaveLength(5);
  });

  it("explains every problem for an invalid file", async () => {
    const text = await readFile(
      path.join(process.cwd(), "scripts", "bakeoff", "fixtures", "google-gemini-2-5-flash-lite.md"),
      "utf8"
    );
    const result = runValidation(text);
    expect(result.valid).toBe(false);
    expect(result.problems.length).toBeGreaterThan(0);
    for (const p of result.problems) {
      expect(p.fix.length).toBeGreaterThan(0);
    }
  });

  it("still returns gates for a file with a valid funnel table but other problems", () => {
    const text = [
      "---",
      "spec: devrel.md/0.1",
      "product: X",
      "stage: unknown",
      "updated: 2026-09-28",
      "---",
      "",
      "## Product",
      "text",
      "## Funnel health",
      "",
      "| Stage | Gate | Now | Pass |",
      "| --- | --- | --- | --- |",
      "| Awareness | g | n | yes |",
      "| Onboarding | g | n | no |",
      "| Activation | g | n | unknown |",
      "| Engagement | g | n | unknown |",
      "| Monetization | g | n | n/a |",
    ].join("\n");
    const result = runValidation(text);
    expect(result.valid).toBe(false); // missing several required sections
    expect(result.gates).toHaveLength(5);
    expect(result.gates.find((g) => g.stage === "Onboarding")?.pass).toBe("no");
  });

  it("returns no gates for text with no funnel table at all", () => {
    const result = runValidation("not a devrel.md file at all");
    expect(result.gates).toEqual([]);
  });
});
