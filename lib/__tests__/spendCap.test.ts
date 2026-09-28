import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));

import { isOverDailySpendCap, todaysPaidSpendUsd } from "@/lib/spendCap";

describe("spend cap", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("reads today's spend as zero when there are no rows", async () => {
    queryMock.mockResolvedValue([{ total: null }]);
    expect(await todaysPaidSpendUsd()).toBe(0);
  });

  it("is not over the cap when spend is below DAILY_SPEND_CAP_USD (default 2.00)", async () => {
    queryMock.mockResolvedValue([{ total: "1.50" }]);
    expect(await isOverDailySpendCap()).toBe(false);
  });

  it("is over the cap once spend reaches DAILY_SPEND_CAP_USD", async () => {
    queryMock.mockResolvedValue([{ total: "2.00" }]);
    expect(await isOverDailySpendCap()).toBe(true);
  });

  it("is over the cap once spend exceeds DAILY_SPEND_CAP_USD", async () => {
    queryMock.mockResolvedValue([{ total: "5.13" }]);
    expect(await isOverDailySpendCap()).toBe(true);
  });
});
