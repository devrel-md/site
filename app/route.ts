import { wantsMarkdown, markdownResponse, htmlResponse } from "@/lib/negotiate";
import { renderPage } from "@/lib/page";
import { renderHomeHtml } from "@/lib/homeMarkdown";
import { readHome } from "@/lib/content";

export async function GET(request: Request): Promise<Response> {
  const markdown = await readHome();

  if (wantsMarkdown(request, false)) {
    return markdownResponse(markdown, "/index.md");
  }

  const { html } = await renderHomeHtml(markdown);
  const page = renderPage({
    title: "DEVREL.md",
    description:
      "A README for your developer funnel. DEVREL.md tells people and AI agents who your developers are, what their first success looks like, and where they get stuck.",
    path: "/",
    bodyHtml: html,
    bodyClassName: "home",
  });
  return htmlResponse(page, "/index.md");
}
