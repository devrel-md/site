// Markdown -> HTML for the "well-typeset Markdown document" pages. Runs
// server-side only. Headings get stable slug ids and fenced code blocks keep
// their declared language as a class, both required by our own
// agent-readiness-check rubric.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import matter from "gray-matter";
import type { Element, ElementContent, Root } from "hast";

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
  html: string;
}

// Model-generated Markdown is rendered by this same pipeline (/r/[id]), so it is
// treated as untrusted. Raw HTML is already dropped (allowDangerousHtml: false),
// but remark-rehype copies link and image URLs through as written. This pass keeps
// only http, https and mailto links (plus relative ones) and replaces every image
// that is not a same-origin path with its alt text, so no script URL can be
// clicked and no page can plant a tracking image. The CSP in proxy.ts is the
// second layer behind this one.
const SAFE_LINK_SCHEMES = new Set(["http", "https", "mailto"]);

function hasUnsafeScheme(url: string): boolean {
  // Browsers ignore control characters and whitespace inside a scheme, so strip them first.
  const compact = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  return match !== null && !SAFE_LINK_SCHEMES.has(match[1]!.toLowerCase());
}

function isSameOriginPath(url: string): boolean {
  const compact = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  return compact.startsWith("/") && !compact.startsWith("//") && !compact.startsWith("/\\");
}

function sanitiseChildren(children: ElementContent[]): ElementContent[] {
  const out: ElementContent[] = [];
  for (const child of children) {
    if (child.type !== "element") {
      out.push(child);
      continue;
    }
    if (child.tagName === "img") {
      const src = typeof child.properties.src === "string" ? child.properties.src : "";
      if (isSameOriginPath(src)) {
        out.push(child);
      } else {
        const alt = typeof child.properties.alt === "string" ? child.properties.alt : "";
        if (alt) out.push({ type: "text", value: alt });
      }
      continue;
    }
    if (child.tagName === "a" && typeof child.properties.href === "string" && hasUnsafeScheme(child.properties.href)) {
      delete child.properties.href;
    }
    child.children = sanitiseChildren(child.children);
    out.push(child);
  }
  return out;
}

function rehypeSanitiseUrls() {
  return (tree: Root) => {
    tree.children = sanitiseChildren(tree.children as ElementContent[]) as Root["children"];
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitiseUrls)
  .use(rehypeSlug)
  .use(rehypeStringify);

export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

export async function parseMarkdown(raw: string): Promise<ParsedMarkdown> {
  const { data, content } = matter(raw);
  const html = await markdownToHtml(content);
  return { frontmatter: data, body: content, html };
}
