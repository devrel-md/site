import { checkAndIncrementRateLimit } from "@/lib/rateLimit";
import { clientIp, hashIp } from "@/lib/hash";
import { runValidation } from "@/lib/runValidation";

const MAX_BYTES = 100_000;

/** Paste a DEVREL.md, get the same quality check the generator uses. Accepts
 * `text/markdown` (or any non-JSON content type: the raw body is read as
 * text) or JSON `{ "markdown": "..." }`. No login, no storage: nothing here
 * is written to the database except the rate-limit counter. */
export async function POST(request: Request): Promise<Response> {
  const ipHash = hashIp(clientIp(request.headers));
  const { allowed } = await checkAndIncrementRateLimit(ipHash, "validate");
  if (!allowed) {
    return Response.json(
      { error: "You have hit today's validation limit. Try again tomorrow." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let markdown: string;

  if (contentType.includes("application/json")) {
    let body: { markdown?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    markdown = typeof body.markdown === "string" ? body.markdown : "";
  } else {
    markdown = await request.text();
  }

  if (markdown.length > MAX_BYTES) {
    return Response.json({ error: `That's over the ${MAX_BYTES.toLocaleString()} character limit.` }, { status: 400 });
  }
  if (!markdown.trim()) {
    return Response.json({ error: "Paste a DEVREL.md file to validate." }, { status: 400 });
  }

  const result = runValidation(markdown);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
