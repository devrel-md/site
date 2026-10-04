import { confirmCommunitySubscriber, saveCommunityFolkId } from "@/lib/community";
import { syncCommunityToFolk } from "@/lib/folk";
import { escapeHtml } from "@/lib/html";
import { renderPage } from "@/lib/page";
import { upsertAudienceContact } from "@/lib/resend";

export const dynamic = "force-dynamic";

function page(bodyHtml: string, status = 200): Response {
  const html = renderPage({
    title: "Confirm community updates: DEVREL.md",
    description: "Confirm your DEVREL.md community updates.",
    path: "/api/community/confirm",
    bodyHtml: `<h1>Community updates</h1>${bodyHtml}<p><a href="/">Back to DEVREL.md</a></p>`,
    copyButtons: false,
  });
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// Opening the link only shows a button. Email security scanners and link
// previews fetch links with GET, and confirming on GET would let them
// subscribe someone who never clicked. The POST below does the confirming.
export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return page("<p>That confirmation link is not valid. You can sign up again from any result page.</p>", 400);
  return page(
    `<p>One more click to finish joining DEVREL.md community updates.</p>
<form method="post" action="/api/community/confirm">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<button class="primary" type="submit">Confirm my subscription</button>
</form>`,
  );
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";
  if (!token) {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("token") ?? "");
  }

  const outcome = await confirmCommunitySubscriber(token);
  switch (outcome.status) {
    case "confirmed": {
      // Only the first use of a link gets here, so this is the only place a
      // signup is synced to the Resend audience and Folk.
      const { subscriber } = outcome;
      await upsertAudienceContact({ email: subscriber.email });
      const folkId = await syncCommunityToFolk(subscriber.email, subscriber.folk_person_id);
      if (folkId) await saveCommunityFolkId(subscriber.email, folkId);
      return page(`<p>You're subscribed to occasional DEVREL.md community updates at ${escapeHtml(subscriber.email)}. Every email includes an unsubscribe link.</p>`);
    }
    case "already_confirmed":
      return page("<p>This address is already confirmed. Nothing more to do.</p>");
    case "unsubscribed":
      return page("<p>This address was confirmed earlier and has since unsubscribed. Sign up again from any result page to rejoin.</p>");
    case "invalid":
      return page("<p>That confirmation link has expired or is no longer valid. You can sign up again from any result page.</p>", 400);
  }
}
