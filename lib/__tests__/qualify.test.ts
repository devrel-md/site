import { describe, it, expect } from "vitest";
import { isQualified } from "@/lib/qualify";

describe("isQualified", () => {
  it("qualifies a founder at a mid-size team", () => {
    expect(isQualified("Founder / CEO", "11 to 50")).toBe(true);
  });

  it("qualifies a head of marketing at a large team", () => {
    expect(isQualified("Head of marketing or growth", "1,000+")).toBe(true);
  });

  it("does not qualify a buyer role on a tiny team", () => {
    expect(isQualified("CTO / engineering lead", "1 to 10")).toBe(false);
  });

  it("does not qualify a non-buyer role even on a large team", () => {
    expect(isQualified("Engineer", "201 to 1,000")).toBe(false);
    expect(isQualified("Developer advocate", "51 to 200")).toBe(false);
    expect(isQualified("Other", "1,000+")).toBe(false);
  });

  it("does not qualify an unrecognised role or team size", () => {
    expect(isQualified("Founder / CEO", "not a real size")).toBe(false);
    expect(isQualified("Not a real role", "11 to 50")).toBe(false);
  });
});
