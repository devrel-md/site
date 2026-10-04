// The SQL behind scripts/exclude-host.ts, kept free of the app's database module so the
// script stays light and the tests can pass a recording query runner. See docs/result-pages.md.

/** Query runner, so the admin script and the tests can supply their own. */
export type Queryer = (text: string, params?: unknown[]) => Promise<{ rowCount: number | null }>;

/** What an admin does for a removal request: block the host, then either mark its results as
 * excluded or delete them. Both blocks regeneration and stop the URL cache serving them. */
export async function excludeHost(
  run: Queryer,
  host: string,
  options: { remove: boolean; reason?: string }
): Promise<{ affected: number }> {
  await run(
    `insert into excluded_hosts (host, reason) values ($1, $2)
     on conflict (host) do update set reason = excluded.reason`,
    [host, options.reason ?? null]
  );
  const outcome = options.remove
    ? await run(`delete from results where host = $1`, [host])
    : await run(`update results set excluded_at = coalesce(excluded_at, now()) where host = $1`, [host]);
  return { affected: outcome.rowCount ?? 0 };
}
