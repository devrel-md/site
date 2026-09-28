import { NextResponse } from "next/server";
import { getResult } from "@/lib/results";
import { extractFunnelGates, earliestBrokenGate } from "@/lib/funnelGates";
import { createLead } from "@/lib/leads";
import { ROLES, TEAM_SIZES } from "@/lib/qualify";
import { sendEmail, upsertAudienceContact } from "@/lib/resend";
import { pushToFolk } from "@/lib/folk";
import { scheduleSeries } from "@/lib/series";
import { env } from "@/lib/env";
import { unlockCookieName } from "@/lib/unlock";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const resultId = String(form.get("resultId") ?? "");
  const email = String(form.get("email") ?? "").trim();
  const company = String(form.get("company") ?? "").trim();
  const role = String(form.get("role") ?? "");
  const teamSize = String(form.get("teamSize") ?? "");
  const seriesOptIn = form.get("seriesOptIn") === "on";

  const result = await getResult(resultId);
  if (!result) {
    return NextResponse.json({ error: "Unknown result." }, { status: 404 });
  }
  if (!email.includes("@") || !company || !ROLES.includes(role as (typeof ROLES)[number]) || !TEAM_SIZES.includes(teamSize as (typeof TEAM_SIZES)[number])) {
    return NextResponse.json({ error: "Fill in every field." }, { status: 400 });
  }

  const lead = await createLead({ email, company, role, teamSize, seriesOptIn, resultId });
  const gates = extractFunnelGates(result.markdown);
  const gate = earliestBrokenGate(gates);

  await upsertAudienceContact({ email, company, role, teamSize });

  await sendEmail({
    to: email,
    subject: `Your DEVREL.md for ${company}`,
    html: `<p>Here is the DEVREL.md draft for ${company}, attached and online at ${env.siteUrl}/r/${result.id}.</p>`,
    text: `Here is the DEVREL.md draft for ${company}, attached and online at ${env.siteUrl}/r/${result.id}.`,
    leadToken: lead.lead_token,
    attachment: { filename: "DEVREL.md", content: Buffer.from(result.markdown, "utf8").toString("base64") },
  });

  if (seriesOptIn) {
    await scheduleSeries(lead.id, gates);
  }

  if (lead.qualified && seriesOptIn) {
    await pushToFolk(lead.id, {
      email,
      company,
      failingGate: gate?.stage ?? "unknown",
      resultUrl: `${env.siteUrl}/r/${result.id}`,
    });
  }

  const response = NextResponse.redirect(new URL(`/r/${result.id}`, request.url), { status: 303 });
  response.cookies.set(unlockCookieName(result.id), lead.lead_token, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
