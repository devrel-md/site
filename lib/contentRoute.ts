import { markdownResponse, htmlResponse, wantsMarkdown } from "@/lib/negotiate";
import { parseMarkdown } from "@/lib/markdown";
import { renderPage } from "@/lib/page";

export interface ContentRouteOptions {
  /** Canonical HTML path, e.g. "/" or "/template". */
  path: string;
  /** Raw Markdown path, e.g. "/index.md" or "/template.md". */
  mdPath: string;
  title: string;
  description: string;
  load: () => Promise<string>;
  /** True for the `.md` route itself: always serve raw Markdown. */
  forceMarkdown?: boolean;
  /** Optional HTML injected before the body, built from the frontmatter. */
  preContent?: (frontmatter: Record<string, unknown>) => string;
}

/** A GET handler for a page that is a Markdown file first, rendered to HTML for browsers. */
export function contentRoute(options: ContentRouteOptions) {
  return async function GET(request: Request): Promise<Response> {
    const markdown = await options.load();

    if (wantsMarkdown(request, Boolean(options.forceMarkdown))) {
      return markdownResponse(markdown, options.mdPath);
    }

    const { html: bodyHtml, frontmatter } = await parseMarkdown(markdown);
    const page = renderPage({
      title: options.title,
      description: options.description,
      path: options.path,
      bodyHtml,
      preContent: options.preContent?.(frontmatter),
    });
    return htmlResponse(page, options.mdPath);
  };
}
