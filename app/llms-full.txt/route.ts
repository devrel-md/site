import { buildLlmsFullTxt } from "@/lib/llms";

export async function GET(): Promise<Response> {
  const body = await buildLlmsFullTxt();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
