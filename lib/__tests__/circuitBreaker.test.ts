import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));

import { isFreeModelCircuitOpen } from "@/lib/circuitBreaker";

function rows(outcomes: string[], ageMinutesFromNow: number[]): { outcome: string; created_at: string }[] {
  const now = Date.now();
  return outcomes.map((outcome, i) => ({
    outcome,
    created_at: new Date(now - (ageMinutesFromNow[i] ?? 0) * 60_000).toISOString(),
  }));
}

describe("isFreeModelCircuitOpen", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("is closed when there is no attempt history", async () => {
    queryMock.mockResolvedValue([]);
    expect(await isFreeModelCircuitOpen()).toBe(false);
  });

  it("is closed when fewer than 7 of the last 10 attempts failed", async () => {
    queryMock.mockResolvedValue(
      rows(["success", "success", "success", "success", "error", "timeout", "success"], [0, 1, 2, 3, 4, 5, 6])
    );
    expect(await isFreeModelCircuitOpen()).toBe(false);
  });

  it("opens when 7 of the last 10 attempts failed within the last 60 minutes", async () => {
    queryMock.mockResolvedValue(
      rows(
        ["error", "timeout", "quality_fail", "error", "error", "timeout", "quality_fail", "success", "success", "success"],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      )
    );
    expect(await isFreeModelCircuitOpen()).toBe(true);
  });

  it("closes again once the most recent failing attempt ages past 60 minutes", async () => {
    queryMock.mockResolvedValue(
      rows(
        ["error", "timeout", "quality_fail", "error", "error", "timeout", "quality_fail", "success", "success", "success"],
        [61, 62, 63, 64, 65, 66, 67, 68, 69, 70]
      )
    );
    expect(await isFreeModelCircuitOpen()).toBe(false);
  });
});
