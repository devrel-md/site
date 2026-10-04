import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));

import { checkAndIncrementRateLimit, isRateLimited } from "@/lib/rateLimit";
import {
  RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY,
  RATE_LIMIT_PER_IP_PER_DAY,
  RATE_LIMIT_VALIDATE_PER_IP_PER_DAY,
} from "@/lib/generatorConfig";

describe("checkAndIncrementRateLimit", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("allows a generate request under the generator's limit", async () => {
    queryMock.mockResolvedValue([{ count: RATE_LIMIT_PER_IP_PER_DAY }]);
    const result = await checkAndIncrementRateLimit("hash1", "generate");
    expect(result).toEqual({ allowed: true, count: RATE_LIMIT_PER_IP_PER_DAY });
  });

  it("blocks a generate request once over the generator's limit", async () => {
    queryMock.mockResolvedValue([{ count: RATE_LIMIT_PER_IP_PER_DAY + 1 }]);
    const result = await checkAndIncrementRateLimit("hash1", "generate");
    expect(result.allowed).toBe(false);
  });

  it("uses the validator's own, more generous limit", async () => {
    queryMock.mockResolvedValue([{ count: RATE_LIMIT_PER_IP_PER_DAY + 1 }]);
    // Same count as a blocked generate request, but under the validate limit.
    const result = await checkAndIncrementRateLimit("hash1", "validate");
    expect(result.allowed).toBe(true);
    expect(RATE_LIMIT_VALIDATE_PER_IP_PER_DAY).toBeGreaterThan(RATE_LIMIT_PER_IP_PER_DAY);
  });

  it("queries with the kind so generate and validate get separate counters", async () => {
    queryMock.mockResolvedValue([{ count: 1 }]);
    await checkAndIncrementRateLimit("hash1", "validate");
    const [, params] = queryMock.mock.calls[0]!;
    expect(params).toEqual(["hash1", "validate"]);
  });

  it("gives community signup its own budget under its own kind", async () => {
    queryMock.mockResolvedValue([{ count: RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY }]);
    expect((await checkAndIncrementRateLimit("hash1", "community")).allowed).toBe(true);
    const [, params] = queryMock.mock.calls[0]!;
    expect(params).toEqual(["hash1", "community"]);

    queryMock.mockResolvedValue([{ count: RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY + 1 }]);
    expect((await checkAndIncrementRateLimit("hash1", "community")).allowed).toBe(false);
  });

  it("defaults to the generate kind when none is given", async () => {
    queryMock.mockResolvedValue([{ count: 1 }]);
    await checkAndIncrementRateLimit("hash1");
    const [, params] = queryMock.mock.calls[0]!;
    expect(params).toEqual(["hash1", "generate"]);
  });
});

describe("isRateLimited", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("is not limited before the first run of the day", async () => {
    queryMock.mockResolvedValue([]);
    expect(await isRateLimited("hash1", "generate")).toBe(false);
  });

  it("is limited once today's runs reach the limit, and never writes", async () => {
    queryMock.mockResolvedValue([{ count: RATE_LIMIT_PER_IP_PER_DAY }]);
    expect(await isRateLimited("hash1", "generate")).toBe(true);
    const [sql] = queryMock.mock.calls[0]!;
    expect(String(sql).trim().toLowerCase().startsWith("select")).toBe(true);
  });
});
