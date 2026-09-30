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

// X-Accel-Buffering stops the nginx proxy in front of the app from holding the
// stream back until it finishes.
const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

// A comment line every few seconds keeps the proxy from closing a connection
// that is quiet while pages are fetched or a model is thinking.
const HEARTBEAT_MS = 10_000;

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
    return new Response(stream, { headers: SSE_HEADERS });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      // The browser can go away mid-run; keep generating so the result is
      // still saved, but stop writing to a stream nobody is reading.
      const send = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      };
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      try {
        const outcome = await generateDevrelMd({
          inputUrl: rawUrl,
          onDelta: (chunk) => send(sseEvent("delta", chunk)),
          onStatus: (status) => send(sseEvent("status", status)),
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
          send(
            sseEvent("error", {
              reason: "capped",
              message:
                "We are back tomorrow: today's generation budget is spent. In the meantime, any agent can do this without the generator:",
              alternative: SKILLS_INSTALL_NOTE,
            })
          );
          return;
        }

        if (outcome.status === "no_sources") {
          send(
            sseEvent("error", {
              reason: "no_sources",
              message:
                "We couldn't read enough of that site to write an accurate file, so we didn't guess. The pages may block automated readers, need JavaScript to show their content, or sit behind a login. Try your docs home or quickstart URL instead, or ask your own agent, which can read your repository:",
              alternative: "Read https://devrel.md and create a DEVREL.md for this repo.",
            })
          );
          return;
        }

        if (outcome.status !== "success") {
          send(
            sseEvent("error", {
              reason: "exhausted",
              message:
                "We couldn't produce a draft we could stand behind from those pages, so we didn't show one. Try your docs home or quickstart URL, or try again in a moment.",
            })
          );
          return;
        }

        send(sseEvent("done", { id: outcome.resultId, status: "success" }));
      } catch (err) {
        console.error("generate stream failed", err);
        send(sseEvent("error", { reason: "internal", message: "Something went wrong. Try again." }));
      } finally {
        clearInterval(heartbeat);
        close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
