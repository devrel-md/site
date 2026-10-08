// The SQL and formatting behind scripts/launch-metrics.ts, kept free of the app's database
// module so the script stays light and the tests can pass a fake query runner. Days are UTC.
// See docs/metrics.md.

/** Query runner, so the admin script and the tests can supply their own. */
export type RowQueryer = (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

export interface DayMetrics {
  day: string;
  freshGenerations: number;
  cachedGenerations: number;
  /** Every model call that day, failed and retried ones included, since those cost money too. */
  modelCalls: number;
  modelCostUsd: number;
  signups: number;
  unsubscribes: number;
  clicks: number;
  botClicks: number;
}

export interface ClickRow {
  day: string;
  slug: string;
  medium: string;
  campaign: string | null;
  clicks: number;
  botClicks: number;
}

export interface LaunchMetrics {
  since: string | null;
  days: DayMetrics[];
  /** The whole period, with day set to "total". */
  totals: DayMetrics;
  /** Per day, slug, medium and campaign. */
  clicks: ClickRow[];
  /** The same, summed over the whole period. */
  clickTotals: Omit<ClickRow, "day">[];
}

// Each query returns one row per UTC day (and, for clicks, per slug, medium and campaign).
// $1 is the first day to include, or null for everything.
const DAY = (column: string) => `to_char(${column} at time zone 'utc', 'YYYY-MM-DD')`;
const SINCE = (column: string) => `($1::date is null or ${column} >= $1::date::timestamp at time zone 'utc')`;

const QUERIES = {
  fresh: `select ${DAY("created_at")} as day, count(*) as n
          from results where ${SINCE("created_at")} group by 1`,
  cached: `select ${DAY("created_at")} as day, count(*) as n
           from cache_hits where ${SINCE("created_at")} group by 1`,
  cost: `select ${DAY("created_at")} as day, count(*) as n, coalesce(sum(cost_usd), 0) as usd
         from attempts where ${SINCE("created_at")} group by 1`,
  signups: `select ${DAY("confirmed_at")} as day, count(*) as n
            from community_subscribers where confirmed_at is not null and ${SINCE("confirmed_at")} group by 1`,
  unsubscribes: `select ${DAY("unsubscribed_at")} as day, count(*) as n
                 from community_subscribers where unsubscribed_at is not null and ${SINCE("unsubscribed_at")} group by 1`,
  clicks: `select ${DAY("created_at")} as day, slug, medium, campaign,
                  count(*) filter (where not likely_bot) as n,
                  count(*) filter (where likely_bot) as bots
           from clicks where ${SINCE("created_at")} group by 1, 2, 3, 4`,
};

function emptyDay(day: string): DayMetrics {
  return {
    day,
    freshGenerations: 0,
    cachedGenerations: 0,
    modelCalls: 0,
    modelCostUsd: 0,
    signups: 0,
    unsubscribes: 0,
    clicks: 0,
    botClicks: 0,
  };
}

// pg returns count(*) and numeric columns as strings.
const num = (value: unknown) => Number(value ?? 0);

/** Runs the report queries and merges them into one row per day, plus totals. */
export async function loadLaunchMetrics(run: RowQueryer, since: string | null = null): Promise<LaunchMetrics> {
  const params = [since];
  const [fresh, cached, cost, signups, unsubscribes, clicks] = await Promise.all([
    run(QUERIES.fresh, params),
    run(QUERIES.cached, params),
    run(QUERIES.cost, params),
    run(QUERIES.signups, params),
    run(QUERIES.unsubscribes, params),
    run(QUERIES.clicks, params),
  ]);

  const days = new Map<string, DayMetrics>();
  const dayOf = (row: { day?: unknown }) => {
    const key = String(row.day);
    let entry = days.get(key);
    if (!entry) days.set(key, (entry = emptyDay(key)));
    return entry;
  };

  for (const row of fresh.rows) dayOf(row).freshGenerations += num(row.n);
  for (const row of cached.rows) dayOf(row).cachedGenerations += num(row.n);
  for (const row of cost.rows) {
    dayOf(row).modelCalls += num(row.n);
    dayOf(row).modelCostUsd += num(row.usd);
  }
  for (const row of signups.rows) dayOf(row).signups += num(row.n);
  for (const row of unsubscribes.rows) dayOf(row).unsubscribes += num(row.n);

  const clickRows: ClickRow[] = clicks.rows.map((row) => ({
    day: String(row.day),
    slug: String(row.slug),
    medium: String(row.medium),
    campaign: row.campaign == null ? null : String(row.campaign),
    clicks: num(row.n),
    botClicks: num(row.bots),
  }));
  const clickTotals = new Map<string, Omit<ClickRow, "day">>();
  for (const row of clickRows) {
    dayOf(row).clicks += row.clicks;
    dayOf(row).botClicks += row.botClicks;
    const key = JSON.stringify([row.slug, row.medium, row.campaign]);
    const total = clickTotals.get(key) ?? { slug: row.slug, medium: row.medium, campaign: row.campaign, clicks: 0, botClicks: 0 };
    total.clicks += row.clicks;
    total.botClicks += row.botClicks;
    clickTotals.set(key, total);
  }

  const sortedDays = [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
  const totals = emptyDay("total");
  for (const day of sortedDays) {
    totals.freshGenerations += day.freshGenerations;
    totals.cachedGenerations += day.cachedGenerations;
    totals.modelCalls += day.modelCalls;
    totals.modelCostUsd += day.modelCostUsd;
    totals.signups += day.signups;
    totals.unsubscribes += day.unsubscribes;
    totals.clicks += day.clicks;
    totals.botClicks += day.botClicks;
  }

  const byClicks = (a: Omit<ClickRow, "day">, b: Omit<ClickRow, "day">) =>
    b.clicks - a.clicks || a.slug.localeCompare(b.slug) || a.medium.localeCompare(b.medium);
  return {
    since,
    days: sortedDays,
    totals,
    clicks: clickRows.sort((a, b) => a.day.localeCompare(b.day) || byClicks(a, b)),
    clickTotals: [...clickTotals.values()].sort(byClicks),
  };
}

/** Text columns come first and are left aligned; the rest are numbers, right aligned. */
function table(headers: string[], rows: string[][], textColumns = 1): string {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) =>
    cells.map((c, i) => (i < textColumns ? c.padEnd(widths[i]!) : c.padStart(widths[i]!))).join("  ").trimEnd();
  return [line(headers), line(widths.map((w) => "-".repeat(w))), ...rows.map(line)].join("\n");
}

const usd = (value: number) => `$${value.toFixed(4)}`;

/** Plain text tables for the terminal: per day with a total row, then /go clicks. */
export function formatLaunchMetrics(metrics: LaunchMetrics): string {
  const dayRow = (d: DayMetrics) => [
    d.day,
    String(d.freshGenerations + d.cachedGenerations),
    String(d.freshGenerations),
    String(d.cachedGenerations),
    String(d.modelCalls),
    usd(d.modelCostUsd),
    String(d.signups),
    String(d.unsubscribes),
    String(d.clicks),
    String(d.botClicks),
  ];
  const campaign = (c: string | null) => c ?? "(none)";

  const sections = [
    `Launch metrics, UTC days, ${metrics.since ? `since ${metrics.since}` : "all time"}`,
    table(
      ["day", "generations", "fresh", "cached", "model calls", "model cost", "signups", "unsubscribes", "/go clicks", "bot clicks"],
      [...metrics.days.map(dayRow), dayRow(metrics.totals)]
    ),
    "/go clicks by slug, medium and campaign, total (bot clicks are excluded from clicks)",
    metrics.clickTotals.length
      ? table(
          ["slug", "medium", "campaign", "clicks", "bot clicks"],
          metrics.clickTotals.map((r) => [r.slug, r.medium, campaign(r.campaign), String(r.clicks), String(r.botClicks)]),
          3
        )
      : "No clicks.",
    "/go clicks by day",
    metrics.clicks.length
      ? table(
          ["day", "slug", "medium", "campaign", "clicks", "bot clicks"],
          metrics.clicks.map((r) => [r.day, r.slug, r.medium, campaign(r.campaign), String(r.clicks), String(r.botClicks)]),
          4
        )
      : "No clicks.",
  ];
  return sections.join("\n\n");
}
