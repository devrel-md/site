import { verifyTurnstile } from "@/lib/turnstile";
import { checkAndIncrementRateLimit, isRateLimited } from "@/lib/rateLimit";
import { clientIp, hashIp } from "@/lib/hash";
import { normaliseUrl, findCachedResult, createResult, logCacheHit } from "@/lib/results";
import { extractFunnelGates } from "@/lib/funnelGates";
import { generateDevrelMd, type NoSourcesReason } from "@/lib/generate";
import { SKILLS_INSTALL_NOTE } from "@/lib/skillsPage";
import { hostKey } from "@/lib/resultPolicy";
import { isHostExcluded, applyRobotsRefusal } from "@/lib/exclusions";

export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Say why we couldn't read the site, so people know what to change. Each
// message ends by leading into the agent prompt shown under it.
function noSourcesMessage(reason: NoSourcesReason, httpStatus: number | null): string {
  const tail =
    "Try your docs home or quickstart URL instead, or ask your own agent, which can read your repository:";
  switch (reason) {
    case "not_found":
      return `That page doesn't exist: the site returned ${httpStatus ?? 404} (not found). Check the URL for typos. ${tail}`;
    case "blocked_by_robots":
      return `That site's robots.txt asks automated readers like ours not to read that page, so we didn't. ${tail}`;
    case "refused":
      return `That page refused our request (HTTP ${httpStatus}). It may need a login or block automated readers. ${tail}`;
    case "unreadable":
      return (
        "We couldn't read enough of that site to write an accurate file, so we didn't guess. The pages may " +
        `need JavaScript to show their content, or have very little text. ${tail}`
      );
  }
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

  // Check without counting: only runs that reach a model count (below).
  if (await isRateLimited(ipHash, "generate")) {
    return Response.json(
      { error: "You have hit today's generation limit. Try again tomorrow." },
      { status: 429 }
    );
  }

  // A removal request blocks the host outright: no cache, no new run.
  if (await isHostExcluded(hostKey(rawUrl))) {
    return Response.json(
      {
        error:
          "The owner of that site has asked us not to generate a file for it. " +
          "You can still create one with your own agent: read https://devrel.md and create a DEVREL.md for the repo.",
      },
      { status: 403 }
    );
  }

  const normalised = normaliseUrl(rawUrl);
  const cached = await findCachedResult(normalised);
  if (cached) {
    await logCacheHit(cached.id);
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
          beforeFirstModelCall: async () => {
            await checkAndIncrementRateLimit(ipHash, "generate");
          },
          persistResult: async (markdown, model, costUsd, provenance) => {
            const result = await createResult({
              url: rawUrl,
              normalisedUrl: normalised,
              markdown,
              gates: extractFunnelGates(markdown),
              model,
              costUsd,
              ...provenance,
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
          if (outcome.reason === "blocked_by_robots") {
            // The site has told our reader to stay out: honour it for results we already hold.
            await applyRobotsRefusal(rawUrl).catch((err) => console.error("robots exclusion failed", err));
          }
          send(
            sseEvent("error", {
              reason: "no_sources",
              message: noSourcesMessage(outcome.reason, outcome.httpStatus),
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
