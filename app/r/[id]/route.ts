import { wantsMarkdown, markdownHeaders, markdownResponse, htmlResponse } from "@/lib/negotiate";
import { parseMarkdown } from "@/lib/markdown";
import { renderPage } from "@/lib/page";
import { getResult } from "@/lib/results";
import { frontmatterPanelHtml } from "@/lib/frontmatterPanel";
import { stageGatesHtml, rawToggleHtml, communityFormHtml, fileActionsHtml } from "@/lib/resultPage";

interface Params {
  params: Promise<{ id: string }>;
}

function notFoundResponse(mdPath: string): Response {
  const body = "# Result not found\n\nThis DEVREL.md result does not exist or has expired.\n";
  return markdownResponse(body, mdPath, 404);
}

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const { id: rawId } = await params;
  const forceMarkdown = rawId.endsWith(".md");
  const id = forceMarkdown ? rawId.slice(0, -3) : rawId;
  const mdPath = `/r/${id}.md`;
  const htmlPath = `/r/${id}`;

  const result = await getResult(id);
  if (!result) {
    if (wantsMarkdown(request, forceMarkdown)) return notFoundResponse(mdPath);
    const { html } = await parseMarkdown("# Result not found\n\nThis DEVREL.md result does not exist or has expired.\n");
    const page = renderPage({
      title: "Result not found: DEVREL.md",
      description: "This result does not exist or has expired.",
      path: htmlPath,
      bodyHtml: html,
    });
    return htmlResponse(page, mdPath, 404);
  }

  const url = new URL(request.url);
  const isDownload = url.searchParams.get("download") === "1";

  if (wantsMarkdown(request, forceMarkdown) || isDownload) {
    const headers = markdownHeaders(mdPath);
    if (isDownload) headers.set("Content-Disposition", 'attachment; filename="DEVREL.md"');
    return new Response(result.markdown, { status: 200, headers });
  }

  const { html: bodyHtml, frontmatter } = await parseMarkdown(result.markdown);

  const preContent = [
    frontmatterPanelHtml(frontmatter),
    stageGatesHtml(result.gates),
    rawToggleHtml(result.markdown),
  ].join("\n");

  const postContent = fileActionsHtml(id) + communityFormHtml();

  const page = renderPage({
    title: `${(frontmatter.product as string) ?? "Result"}: DEVREL.md`,
    description: `A generated DEVREL.md for ${(frontmatter.product as string) ?? "this product"}.`,
    path: htmlPath,
    bodyHtml,
    preContent,
    postContent,
    copyButtons: false,
  });

  return htmlResponse(page, mdPath);
}
