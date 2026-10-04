import { env } from "@/lib/env";
import { cronSecretProblem, isProductionRuntime } from "@/lib/configCheck";
import { processOutboxOnce } from "@/lib/outbox";

export async function POST(request: Request): Promise<Response> {
  // In production, never accept the development default (or an empty secret).
  if (isProductionRuntime() && cronSecretProblem()) {
    console.error("[config] refusing /api/cron/outbox: CRON_SECRET is", cronSecretProblem());
    return new Response("Cron is not configured", { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await processOutboxOnce();
  return Response.json(result);
}
