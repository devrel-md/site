import { query, queryOne } from "@/lib/db";
import { randomToken } from "@/lib/hash";

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
 * last 24 hours. */
export async function findCachedResult(normalisedUrl: string): Promise<ResultRow | undefined> {
  return queryOne<ResultRow>(
    `select * from results
     where normalised_url = $1 and created_at > now() - interval '24 hours'
     order by created_at desc
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
}): Promise<ResultRow> {
  const id = randomToken(8);
  const rows = await query<ResultRow>(
    `insert into results (id, url, normalised_url, markdown, gates, model, cost_usd)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [id, params.url, params.normalisedUrl, params.markdown, JSON.stringify(params.gates), params.model, params.costUsd]
  );
  return rows[0]!;
}
