import { query } from "@/lib/db";
import type { GoParams } from "@/lib/goRedirect";

/** Logs a /go click. Never throws: a logging failure must not break the redirect. */
export async function logClick(params: GoParams, ipHash: string): Promise<void> {
  try {
    await query(
      `insert into clicks (slug, medium, campaign, lead_token, ip_hash) values ($1, $2, $3, $4, $5)`,
      [params.slug, params.medium, params.campaign, params.leadToken, ipHash]
    );
  } catch (err) {
    console.error("logClick failed", err);
  }
}
