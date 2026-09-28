import { wantsMarkdown, markdownResponse, htmlResponse } from "@/lib/negotiate";
import { parseMarkdown } from "@/lib/markdown";
import { renderPage } from "@/lib/page";
import { readSkillMarkdown } from "@/lib/content";

interface Params {
  params: Promise<{ name: string }>;
}

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const { name } = await params;
  const forceMarkdown = name.endsWith(".md");
  const slug = forceMarkdown ? name.slice(0, -3) : name;

  const markdown = await readSkillMarkdown(slug);
  const mdPath = `/skills/${slug}.md`;
  const htmlPath = `/skills/${slug}`;

  if (markdown === null) {
    const notFound = `# Skill not found\n\n"${slug}" is not one of the devrel.md skills. See the [full list](/skills).\n`;
    if (wantsMarkdown(request, forceMarkdown)) {
      return markdownResponse(notFound, mdPath, 404);
    }
    const { html } = await parseMarkdown(notFound);
    const page = renderPage({
      title: "Skill not found: DEVREL.md",
      description: "That skill does not exist.",
      path: htmlPath,
      bodyHtml: html,
    });
    return htmlResponse(page, mdPath, 404);
  }

  if (wantsMarkdown(request, forceMarkdown)) {
    return markdownResponse(markdown, mdPath);
  }

  const { html, frontmatter } = await parseMarkdown(markdown);
  const title = `${(frontmatter.name as string) ?? slug}: DEVREL.md skills`;
  const description = ((frontmatter.description as string) ?? "").slice(0, 300);
  const page = renderPage({
    title,
    description,
    path: htmlPath,
    bodyHtml: html,
  });
  return htmlResponse(page, mdPath);
}
