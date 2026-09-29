import { verifyTurnstile } from "@/lib/turnstile";
import { checkAndIncrementRateLimit } from "@/lib/rateLimit";
import { clientIp, hashIp } from "@/lib/hash";
import { normaliseUrl, findCachedResult, createResult } from "@/lib/results";
import { extractFunnelGates } from "@/lib/funnelGates";
import { generateDevrelMd } from "@/lib/generate";
import { SKILLS_INSTALL_NOTE } from "@/lib/skillsPage";

export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request): Promise<Response> {
  let body: { url?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawUrl = (body.url ?? "").trim();
  const turnstileToken = body.turnstileToken ?? "";

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return Response.json({ error: "Enter a valid URL, including https://." }, { status: 400 });
  }
  if (parsedUrl.protocol !== "https:") {
    return Response.json({ error: "Only https:// URLs are supported." }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request.headers));

  const turnstileOk = await verifyTurnstile(turnstileToken);
  if (!turnstileOk) {
    return Response.json({ error: "That verification check did not pass. Try again." }, { status: 400 });
  }

  const { allowed } = await checkAndIncrementRateLimit(ipHash, "generate");
  if (!allowed) {
    return Response.json(
      { error: "You have hit today's generation limit. Try again tomorrow." },
      { status: 429 }
    );
  }

  const normalised = normaliseUrl(rawUrl);
  const cached = await findCachedResult(normalised);
  if (cached) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(sseEvent("delta", cached.markdown)));
        controller.enqueue(encoder.encode(sseEvent("done", { id: cached.id, status: "success", cached: true })));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const outcome = await generateDevrelMd({
          inputUrl: rawUrl,
          onDelta: (chunk) => controller.enqueue(encoder.encode(sseEvent("delta", chunk))),
          persistResult: async (markdown, model, costUsd) => {
            const result = await createResult({
              url: rawUrl,
              normalisedUrl: normalised,
              markdown,
              gates: extractFunnelGates(markdown),
              model,
              costUsd,
            });
            return result.id;
          },
        });

        if (outcome.status === "capped") {
          controller.enqueue(
            encoder.encode(
              sseEvent("error", {
                reason: "capped",
                message:
                  "We are back tomorrow: today's generation budget is spent. In the meantime, any agent can do this without the generator:",
                alternative: SKILLS_INSTALL_NOTE,
              })
            )
          );
          controller.close();
          return;
        }

        if (outcome.status !== "success") {
          controller.enqueue(
            encoder.encode(
              sseEvent("error", {
                reason: "exhausted",
                message: "That draft did not come out right. Try again in a moment, or a different URL.",
              })
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(sseEvent("done", { id: outcome.resultId, status: "success" })));
        controller.close();
      } catch (err) {
        console.error("generate stream failed", err);
        controller.enqueue(
          encoder.encode(sseEvent("error", { reason: "internal", message: "Something went wrong. Try again." }))
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
