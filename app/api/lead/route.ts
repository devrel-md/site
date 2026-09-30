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
import { escapeHtml } from "@/lib/html";
import { renderPage } from "@/lib/page";

function errorPage(message: string, status: number, backHref: string): Response {
  const html = renderPage({
    title: "Could not unlock: DEVREL.md",
    description: "Something went wrong unlocking this result.",
    path: "/api/lead",
    bodyHtml: `<h1>${escapeHtml(message)}</h1><p><a href="${escapeHtml(backHref)}">Back</a></p>`,
    copyButtons: false,
  });
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

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
    return errorPage("That result does not exist.", 404, "/");
  }
  if (!email.includes("@") || !company || !ROLES.includes(role as (typeof ROLES)[number]) || !TEAM_SIZES.includes(teamSize as (typeof TEAM_SIZES)[number])) {
    return errorPage("Fill in every field, then try again.", 400, `/r/${resultId}`);
  }

  const lead = await createLead({ email, company, role, teamSize, seriesOptIn, resultId });
  const gates = extractFunnelGates(result.markdown);
  const gate = earliestBrokenGate(gates);

  await upsertAudienceContact({ email, company, role, teamSize });

  await sendEmail({
    to: email,
    subject: `Your DEVREL.md for ${company}`,
    html: `<p>Here is the DEVREL.md draft for ${escapeHtml(company)}, attached and online at ${env.siteUrl}/r/${result.id}.</p>`,
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

  // Relative Location: behind the proxy, request.url is the container's own
  // address (http://0.0.0.0:3000), which the browser can't reach.
  const response = new NextResponse(null, { status: 303, headers: { Location: `/r/${result.id}` } });
  response.cookies.set(unlockCookieName(result.id), lead.lead_token, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
