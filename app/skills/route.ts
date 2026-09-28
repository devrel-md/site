import { wantsMarkdown, markdownResponse, htmlResponse } from "@/lib/negotiate";
import { renderPage } from "@/lib/page";
import { skillsCatalogHtml, skillsCatalogMarkdown } from "@/lib/skillsPage";

export async function GET(request: Request): Promise<Response> {
  if (wantsMarkdown(request, false)) {
    return markdownResponse(await skillsCatalogMarkdown(), "/skills.md");
  }

  const bodyHtml = await skillsCatalogHtml();
  const page = renderPage({
    title: "Skills: DEVREL.md",
    description:
      "Free DevRel skills for AI agents, built from How to Build Developer Ecosystems. Every skill reads your DEVREL.md first.",
    path: "/skills",
    bodyHtml,
  });
  return htmlResponse(page, "/skills.md");
}
