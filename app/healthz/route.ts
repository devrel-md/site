import { env } from "@/lib/env";
import { checkConfig, isProductionRuntime } from "@/lib/configCheck";

// Liveness only: no database or third-party calls, and status stays "ok" so a
// config problem never blocks a deploy. `config` says whether production
// variables are real; outside production it is "unchecked".
export async function GET(): Promise<Response> {
  const checked = isProductionRuntime();
  const problems = checked ? checkConfig().problems.map((p) => p.name) : [];
  return Response.json(
    {
      status: "ok",
      build_sha: env.gitCommitSha,
      config: !checked ? "unchecked" : problems.length ? "invalid" : "ok",
      config_problems: problems,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
