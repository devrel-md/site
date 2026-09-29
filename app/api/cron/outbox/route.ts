import { env } from "@/lib/env";
import { processOutboxOnce } from "@/lib/outbox";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await processOutboxOnce();
  return Response.json(result);
}
