import { query, queryOne } from "@/lib/db";
import { randomToken } from "@/lib/hash";
import { isQualified } from "@/lib/qualify";

export interface LeadRow {
  id: string;
  email: string;
  company: string;
  role: string;
  team_size: string;
  qualified: boolean;
  series_opt_in: boolean;
  result_id: string | null;
  lead_token: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface CreateLeadParams {
  email: string;
  company: string;
  role: string;
  teamSize: string;
  seriesOptIn: boolean;
  resultId: string;
}

export async function createLead(params: CreateLeadParams): Promise<LeadRow> {
  const id = randomToken(8);
  const leadToken = randomToken(16);
  const qualified = isQualified(params.role, params.teamSize);

  const rows = await query<LeadRow>(
    `insert into leads (id, email, company, role, team_size, qualified, series_opt_in, result_id, lead_token)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [id, params.email, params.company, params.role, params.teamSize, qualified, params.seriesOptIn, params.resultId, leadToken]
  );
  return rows[0]!;
}

export async function getLeadByToken(token: string): Promise<LeadRow | undefined> {
  return queryOne<LeadRow>(`select * from leads where lead_token = $1`, [token]);
}
