import { query, queryOne } from "@/lib/db";
import { randomToken } from "@/lib/hash";
import { hostKey } from "@/lib/resultPolicy";

export interface FunnelGate {
  stage: string;
  gate: string;
  now: string;
  pass: "yes" | "no" | "unknown" | "n/a";
}

export interface ResultRow {
  id: string;
  url: string;
  normalised_url: string;
  markdown: string;
  gates: FunnelGate[];
  model: string;
  cost_usd: string;
  created_at: string;
  host: string | null;
  pages_read: number | null;
  indexable: boolean;
  excluded_at: string | null;
  own_devrel_url: string | null;
}

export function normaliseUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  const keep = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key.toLowerCase().startsWith("utm_")) continue;
    keep.append(key, value);
  }
  keep.sort();
  const query = keep.toString();
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${query ? `?${query}` : ""}`;
}

/** A cache hit is an existing result for the same normalised URL within the
 * last 24 hours. Results the site owner has asked us to remove, and results
 * for an excluded host, are never served from the cache: removal must not be
 * undone by it. */
export async function findCachedResult(normalisedUrl: string): Promise<ResultRow | undefined> {
  return queryOne<ResultRow>(
    `select * from results r
     where r.normalised_url = $1 and r.created_at > now() - interval '24 hours'
       and r.excluded_at is null
       and not exists (select 1 from excluded_hosts h where h.host = r.host)
     order by r.created_at desc
     limit 1`,
    [normalisedUrl]
  );
}

export async function getResult(id: string): Promise<ResultRow | undefined> {
  return queryOne<ResultRow>(`select * from results where id = $1`, [id]);
}

export async function createResult(params: {
  url: string;
  normalisedUrl: string;
  markdown: string;
  gates: FunnelGate[];
  model: string;
  costUsd: number;
  pagesRead: number | null;
  indexable: boolean;
  ownDevrelUrl: string | null;
}): Promise<ResultRow> {
  const id = randomToken(8);
  const rows = await query<ResultRow>(
    `insert into results
       (id, url, normalised_url, markdown, gates, model, cost_usd, host, pages_read, indexable, own_devrel_url)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning *`,
    [
      id,
      params.url,
      params.normalisedUrl,
      params.markdown,
      JSON.stringify(params.gates),
      params.model,
      params.costUsd,
      hostKey(params.url),
      params.pagesRead,
      params.indexable,
      params.ownDevrelUrl,
    ]
  );
  return rows[0]!;
}

/** Records that a cached result was served, for the launch metrics report. Never throws:
 * a logging failure must not stop the cached result reaching the visitor. */
export async function logCacheHit(resultId: string): Promise<void> {
  try {
    await query(`insert into cache_hits (result_id) values ($1)`, [resultId]);
  } catch (err) {
    console.error("logCacheHit failed", err);
  }
}
