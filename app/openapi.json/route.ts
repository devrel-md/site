import { buildOpenApiDoc } from "@/lib/openapiDoc";

export async function GET(): Promise<Response> {
  return Response.json(buildOpenApiDoc(), { headers: { "Cache-Control": "public, max-age=300" } });
}
