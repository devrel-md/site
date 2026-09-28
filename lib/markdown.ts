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

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
  html: string;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
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
