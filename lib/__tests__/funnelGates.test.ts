import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractFunnelGates, earliestBrokenGate } from "@/lib/funnelGates";

describe("extractFunnelGates", () => {
  it("extracts all five stage rows from a real generated file", async () => {
    const text = await readFile(
      path.join(process.cwd(), "scripts", "bakeoff", "fixtures", "openai-gpt-6-luna.md"),
      "utf8"
    );
    const gates = extractFunnelGates(text);
    expect(gates).toHaveLength(5);
    expect(gates.map((g) => g.stage)).toEqual([
      "Awareness",
      "Onboarding",
      "Activation",
      "Engagement",
      "Monetization",
    ]);
    expect(gates.every((g) => g.pass === "unknown")).toBe(true);
  });

  it("finds the earliest failing or unknown gate, in stage order", async () => {
    const text = await readFile(
      path.join(process.cwd(), "scripts", "bakeoff", "fixtures", "openai-gpt-6-luna.md"),
      "utf8"
    );
    const gates = extractFunnelGates(text);
    const broken = earliestBrokenGate(gates);
    expect(broken?.stage).toBe("Awareness");
  });

  it("returns null when every gate passes or is n/a", () => {
    const gates = [
      { stage: "Awareness", gate: "g", now: "n", pass: "yes" as const },
      { stage: "Onboarding", gate: "g", now: "n", pass: "yes" as const },
      { stage: "Activation", gate: "g", now: "n", pass: "yes" as const },
      { stage: "Engagement", gate: "g", now: "n", pass: "yes" as const },
      { stage: "Monetization", gate: "g", now: "n", pass: "n/a" as const },
    ];
    expect(earliestBrokenGate(gates)).toBeNull();
  });
});
