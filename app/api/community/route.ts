import {
  CONFIRMATION_TTL_DAYS,
  purgeExpiredPending,
  releaseConfirmation,
  requestCommunitySignup,
  sendCommunityConfirmation,
} from "@/lib/community";
import { isConfigured } from "@/lib/env";
import { clientIp, hashIp } from "@/lib/hash";
import { escapeHtml } from "@/lib/html";
import { renderPage } from "@/lib/page";
import { checkAndIncrementRateLimit } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

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
  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return page("<p>Enter a valid email and choose the community updates checkbox to subscribe.</p>", 400);
  }

  // Turnstile needs JavaScript to run. Without a token, say so plainly rather
  // than failing silently.
  if (!turnstileToken) {
    return page(
      "<p>The human check did not complete, so nothing was sent. It needs JavaScript and a recent browser. Go back, make sure the check has finished, and try again, or email hello@devrel.md and we will help.</p>",
      400,
    );
  }
  const ip = clientIp(request.headers);
  if (!(await verifyTurnstile(turnstileToken, ip === "unknown" ? undefined : ip))) {
    return page("<p>That human check did not pass. Go back and try again.</p>", 400);
  }

  // Counted only after Turnstile passes, so a bot cannot use up a shared
  // IP's budget without solving the challenge.
  const limit = await checkAndIncrementRateLimit(hashIp(ip), "community");
  if (!limit.allowed) {
    return page("<p>You have hit today's community signup limit for this connection. Try again tomorrow.</p>", 429);
  }

  try {
    await purgeExpiredPending();
  } catch (error) {
    console.error("Community pending cleanup failed", error);
  }

  // Same reply whether or not the address is new, already subscribed or was
  // asked very recently, so the form does not reveal who is on the list.
  const pending = await requestCommunitySignup(email);
  if (pending) {
    const sent = await sendCommunityConfirmation(pending);
    // With Resend unset (local development) sending only logs, so carry on.
    if (!sent.sent && isConfigured("resend")) {
      await releaseConfirmation(pending.email);
      return page("<p>We could not send the confirmation email just now. Nothing was saved as a subscription. Try again in a few minutes.</p>", 502);
    }
  }

  return page(
    `<p>Check your inbox. If ${escapeHtml(email)} can be added, we have sent one email with a link to confirm.</p>` +
      `<p>You are not subscribed until you click that link. It works for ${CONFIRMATION_TTL_DAYS} days, and the email includes an unsubscribe link.</p>`,
  );
}
