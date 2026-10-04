import { saveCommunityFolkId, subscribeToCommunity } from "@/lib/community";
import { escapeHtml } from "@/lib/html";
import { renderPage } from "@/lib/page";
import { upsertAudienceContact } from "@/lib/resend";
import { syncCommunityToFolk } from "@/lib/folk";

function page(message: string, status = 200): Response {
  const html = renderPage({
    title: "Community updates: DEVREL.md",
    description: "DEVREL.md community email preferences.",
    path: "/api/community",
    bodyHtml: `<h1>Community updates</h1>${message}<p><a href="/">Back to DEVREL.md</a></p>`,
    copyButtons: false,
  });
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const consent = form.get("communityConsent") === "on";
  if (!consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return page("<p>Enter a valid email and choose the community updates checkbox to subscribe.</p>", 400);
  }

  const subscriber = await subscribeToCommunity(email);
  await upsertAudienceContact({ email: subscriber.email });
  const folkId = await syncCommunityToFolk(subscriber.email, subscriber.folk_person_id);
  if (folkId) await saveCommunityFolkId(subscriber.email, folkId);
  const unsubscribe = `/api/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`;
  return page(`<p>You're subscribed to occasional DEVREL.md community updates at ${escapeHtml(subscriber.email)}.</p><p><a href="${escapeHtml(unsubscribe)}">Unsubscribe any time</a>. Save this link for later.</p>`);
}
