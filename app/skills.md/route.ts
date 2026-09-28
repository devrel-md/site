import { markdownResponse } from "@/lib/negotiate";
import { skillsCatalogMarkdown } from "@/lib/skillsPage";

export async function GET(): Promise<Response> {
  return markdownResponse(await skillsCatalogMarkdown(), "/skills.md");
}
