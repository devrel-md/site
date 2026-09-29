import { env } from "@/lib/env";

export async function GET(): Promise<Response> {
  return Response.json(
    { status: "ok", build_sha: env.gitCommitSha },
    { headers: { "Cache-Control": "no-store" } }
  );
}
