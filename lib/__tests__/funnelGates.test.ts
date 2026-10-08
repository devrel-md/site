import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractFunnelGates } from "@/lib/funnelGates";

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

});
