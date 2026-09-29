import { markdownResponse } from "@/lib/negotiate";
import { readHome } from "@/lib/content";

export async function GET(): Promise<Response> {
  return markdownResponse(await readHome(), "/index.md");
}
