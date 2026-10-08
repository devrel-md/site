import { describe, it, expect } from "vitest";
import { formatLaunchMetrics, loadLaunchMetrics } from "@/lib/launchMetrics";

type Rows = Record<string, unknown>[];

// Answers each report query by the table it reads, and records what was asked.
function fakeDb(tables: { results?: Rows; cache_hits?: Rows; attempts?: Rows; signups?: Rows; unsubscribes?: Rows; clicks?: Rows }) {
  const calls: { text: string; params: unknown[] }[] = [];
  const run = async (text: string, params: unknown[] = []) => {
    const sql = text.replace(/\s+/g, " ").trim();
    calls.push({ text: sql, params });
    if (sql.includes("from results")) return { rows: tables.results ?? [] };
    if (sql.includes("from cache_hits")) return { rows: tables.cache_hits ?? [] };
    if (sql.includes("from attempts")) return { rows: tables.attempts ?? [] };
    if (sql.includes("confirmed_at is not null")) return { rows: tables.signups ?? [] };
    if (sql.includes("unsubscribed_at is not null")) return { rows: tables.unsubscribes ?? [] };
    if (sql.includes("from clicks")) return { rows: tables.clicks ?? [] };
    throw new Error(`unexpected query: ${sql}`);
  };
  return { calls, run };
}

describe("loadLaunchMetrics", () => {
  it("merges every source into one row per day, in order, with totals", async () => {
    // pg returns counts and numeric sums as strings.
    const { run } = fakeDb({
      results: [{ day: "2026-10-02", n: "3" }, { day: "2026-10-01", n: "1" }],
      cache_hits: [{ day: "2026-10-02", n: "2" }],
      attempts: [{ day: "2026-10-01", n: "2", usd: "0.012500" }, { day: "2026-10-02", n: "4", usd: "0.030000" }],
      signups: [{ day: "2026-10-03", n: "5" }],
      unsubscribes: [{ day: "2026-10-03", n: "1" }],
      clicks: [
        { day: "2026-10-02", slug: "audit", medium: "generator", campaign: null, n: "2", bots: "1" },
        { day: "2026-10-03", slug: "audit", medium: "generator", campaign: null, n: "1", bots: "0" },
        { day: "2026-10-03", slug: "book", medium: "email", campaign: "launch", n: "4", bots: "0" },
      ],
    });

    const metrics = await loadLaunchMetrics(run);

    expect(metrics.days.map((d) => d.day)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(metrics.days[1]).toMatchObject({
      freshGenerations: 3,
      cachedGenerations: 2,
      modelCalls: 4,
      modelCostUsd: 0.03,
      clicks: 2,
      botClicks: 1,
    });
    expect(metrics.days[2]).toMatchObject({ signups: 5, unsubscribes: 1, clicks: 5, freshGenerations: 0 });
    expect(metrics.totals).toMatchObject({
      day: "total",
      freshGenerations: 4,
      cachedGenerations: 2,
      modelCalls: 6,
      signups: 5,
      unsubscribes: 1,
      clicks: 7,
      botClicks: 1,
    });
    expect(metrics.totals.modelCostUsd).toBeCloseTo(0.0425);
    expect(metrics.clickTotals).toEqual([
      { slug: "book", medium: "email", campaign: "launch", clicks: 4, botClicks: 0 },
      { slug: "audit", medium: "generator", campaign: null, clicks: 3, botClicks: 1 },
    ]);
  });

  it("passes the start day to every query, and null for all time", async () => {
    const since = fakeDb({});
    await loadLaunchMetrics(since.run, "2026-10-01");
    expect(since.calls).toHaveLength(6);
    expect(since.calls.every((c) => c.params[0] === "2026-10-01")).toBe(true);

    const all = fakeDb({});
    const metrics = await loadLaunchMetrics(all.run);
    expect(all.calls.every((c) => c.params[0] === null)).toBe(true);
    expect(metrics.days).toEqual([]);
    expect(metrics.totals.freshGenerations).toBe(0);
  });

  it("groups days in UTC and keeps likely bots out of the click count", async () => {
    const { calls, run } = fakeDb({});
    await loadLaunchMetrics(run);
    expect(calls.every((c) => c.text.includes("at time zone 'utc'"))).toBe(true);
    const clicks = calls.find((c) => c.text.includes("from clicks"))!;
    expect(clicks.text).toContain("count(*) filter (where not likely_bot) as n");
    expect(clicks.text).toContain("group by 1, 2, 3, 4");
  });
});

describe("formatLaunchMetrics", () => {
  it("prints a total row and the click breakdown", async () => {
    const { run } = fakeDb({
      results: [{ day: "2026-10-01", n: "2" }],
      attempts: [{ day: "2026-10-01", n: "2", usd: "0.5" }],
      clicks: [{ day: "2026-10-01", slug: "audit", medium: "site", campaign: null, n: "1", bots: "0" }],
    });
    const text = formatLaunchMetrics(await loadLaunchMetrics(run, "2026-10-01"));
    expect(text).toContain("since 2026-10-01");
    expect(text).toMatch(/^total\s+2\s+2\s+0\s+2\s+\$0\.5000/m);
    expect(text).toMatch(/^audit\s+site\s+\(none\)\s+1\s+0$/m);
  });

  it("says so when there are no clicks", async () => {
    const text = formatLaunchMetrics(await loadLaunchMetrics(fakeDb({}).run));
    expect(text).toContain("all time");
    expect(text).toContain("No clicks.");
  });
});
