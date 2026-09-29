import { unsubscribeByToken } from "@/lib/unsubscribe";
import { escapeHtml } from "@/lib/html";
import { renderPage } from "@/lib/page";

function page(message: string): Response {
  const html = renderPage({
    title: "Unsubscribed: DEVREL.md",
    description: "Email preferences for DEVREL.md.",
    path: "/api/unsubscribe",
    bodyHtml: `<h1>${escapeHtml(message)}</h1><p><a href="/">Back to devrel.md</a></p>`,
    copyButtons: false,
  });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";

  if (!token && request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await request.text();
      token = new URLSearchParams(body).get("token") ?? "";
    }
  }

  const result = await unsubscribeByToken(token);
  if (!result.found) return page("That unsubscribe link is not valid.");
  return page("You are unsubscribed. You will not get another email from devrel.md.");
}

// One-click unsubscribe works without logging in, both from a clicked link
// (GET) and from a mail client's List-Unsubscribe-Post (RFC 8058, POST).
export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
