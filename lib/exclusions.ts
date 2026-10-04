// Removal and opt-out for generated result pages. See docs/result-pages.md.
import { query, queryOne } from "@/lib/db";
import { isDisallowed } from "@/lib/robotsCheck";
import { hostKey } from "@/lib/resultPolicy";

/** True when generation for this host is blocked. */
export async function isHostExcluded(host: string): Promise<boolean> {
  const row = await queryOne(`select 1 as excluded from excluded_hosts where host = $1`, [host]);
  return row !== undefined;
}

/** Marks every result for a host as excluded (noindex, with a note on the page). */
export async function markHostExcluded(host: string): Promise<number> {
  const rows = await query<{ id: string }>(
    `update results set excluded_at = now() where host = $1 and excluded_at is null returning id`,
    [host]
  );
  return rows.length;
}

/** Called when a generation was refused because robots.txt disallows our agent. When the
 * whole site is closed to us (the root path is disallowed), the owner has opted out: mark
 * their existing results as excluded. A rule for one path only, such as /admin, is not an
 * opt-out of the whole host, so it changes nothing. Returns true when results were marked. */
export async function applyRobotsRefusal(inputUrl: string): Promise<boolean> {
  const host = hostKey(inputUrl);
  if (!host) return false;
  const origin = new URL(inputUrl).origin;
  if (!(await isDisallowed(origin, "/"))) return false;
  await markHostExcluded(host);
  return true;
}
