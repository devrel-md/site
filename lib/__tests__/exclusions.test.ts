import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  queryOne: async (...args: unknown[]) => (await queryMock(...args))[0],
}));
const isDisallowedMock = vi.fn();
vi.mock("@/lib/robotsCheck", () => ({ isDisallowed: (...args: unknown[]) => isDisallowedMock(...args) }));

import { applyRobotsRefusal, isHostExcluded, markHostExcluded } from "@/lib/exclusions";
import { findCachedResult } from "@/lib/results";

const sql = (call: unknown[]) => String(call[0]).replace(/\s+/g, " ");

describe("robots.txt opt-out", () => {
  beforeEach(() => {
    queryMock.mockReset().mockResolvedValue([{ id: "r1" }]);
    isDisallowedMock.mockReset();
  });

  it("marks existing results for the host as excluded when the whole site is closed to us", async () => {
    isDisallowedMock.mockResolvedValue(true);
    expect(await applyRobotsRefusal("https://www.Acme.dev/docs/start")).toBe(true);
    expect(isDisallowedMock).toHaveBeenCalledWith("https://www.acme.dev", "/");
    expect(sql(queryMock.mock.calls[0]!)).toContain("update results set excluded_at = now() where host = $1");
    expect(queryMock.mock.calls[0]![1]).toEqual(["acme.dev"]);
  });

  it("leaves results alone when only one path is disallowed", async () => {
    isDisallowedMock.mockResolvedValue(false);
    expect(await applyRobotsRefusal("https://acme.dev/admin")).toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("reports whether a host is blocked", async () => {
    queryMock.mockResolvedValueOnce([{ excluded: 1 }]);
    expect(await isHostExcluded("acme.dev")).toBe(true);
    queryMock.mockResolvedValueOnce([]);
    expect(await isHostExcluded("other.dev")).toBe(false);
  });

  it("returns how many results were marked", async () => {
    queryMock.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    expect(await markHostExcluded("acme.dev")).toBe(2);
  });
});

describe("the 24 hour cache", () => {
  it("never serves an excluded result or a result for an excluded host", async () => {
    queryMock.mockReset().mockResolvedValue([]);
    await findCachedResult("https://acme.dev/docs");
    const text = sql(queryMock.mock.calls[0]!);
    expect(text).toContain("r.excluded_at is null");
    expect(text).toContain("not exists (select 1 from excluded_hosts h where h.host = r.host)");
    expect(text).toContain("interval '24 hours'");
  });
});
