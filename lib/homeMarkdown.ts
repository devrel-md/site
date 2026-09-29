// The home page reads like agents.md: an FAQ that scans as a list of
// questions (native <details>), and the "Without / With" comparison as two
// cards. Markdown alone can't express either, so this rehype plugin
// restructures those two sections after the normal Markdown pipeline runs,
// and leaves everything else untouched. If the source headings ever change
// wording, each transform just no-ops rather than breaking the build.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { toString as hastToString } from "hast-util-to-string";
import matter from "gray-matter";
import type { Element, ElementContent, Properties, Root, RootContent } from "hast";

function isElement(node: RootContent, tagName?: string): node is Element {
  return node.type === "element" && (!tagName || (node as Element).tagName === tagName);
}

function textOf(node: RootContent): string {
  return isElement(node) || node.type === "text" ? hastToString(node).trim() : "";
}

/** Splits `children` into [before, section, after], where `section` is the
 * heading matched by `predicate` plus every sibling up to (not including)
 * the next heading of the same tag name. */
function extractSection(
  children: RootContent[],
  tagName: string,
  predicate: (headingText: string) => boolean
): { before: RootContent[]; heading: Element; body: RootContent[]; after: RootContent[] } | null {
  const start = children.findIndex((n) => isElement(n, tagName) && predicate(textOf(n)));
  if (start === -1) return null;

  let end = children.length;
  for (let i = start + 1; i < children.length; i += 1) {
    const child = children[i];
    if (child && isElement(child, tagName)) {
      end = i;
      break;
    }
  }

  return {
    before: children.slice(0, start),
    heading: children[start] as Element,
    body: children.slice(start + 1, end),
    after: children.slice(end),
  };
}

function el(tagName: string, properties: Properties, children: ElementContent[]): Element {
  return { type: "element", tagName, properties, children };
}

/** "## FAQ" followed by "### Question" + answer blocks becomes a list of
 * <details><summary>Question</summary>answer</details>. */
function transformFaq(tree: Root): void {
  const section = extractSection(tree.children, "h2", (t) => t.toLowerCase() === "faq");
  if (!section) return;

  function buildDetails(block: { question: Element; answer: ElementContent[] }): Element {
    const summary = el("summary", {}, block.question.children);
    return el("details", { className: ["faq-item"] }, [summary, ...block.answer]);
  }

  const items: Element[] = [];
  let current: { question: Element; answer: ElementContent[] } | null = null;

  for (const node of section.body) {
    if (isElement(node, "h3")) {
      if (current) items.push(buildDetails(current));
      current = { question: node, answer: [] };
    } else if (current) {
      current.answer.push(node as ElementContent);
    }
  }
  if (current) items.push(buildDetails(current));
  if (items.length === 0) return;

  const list = el("div", { className: ["faq-list"] }, items);
  tree.children = [...section.before, section.heading, list, ...section.after];
}

/** "## Same agent, different answer": the two "**Without/With DEVREL.md**"
 * paragraphs plus their blockquotes become a two-card comparison grid,
 * leaving the surrounding intro/outro paragraphs where they were. */
function transformComparison(tree: Root): void {
  const section = extractSection(
    tree.children,
    "h2",
    (t) => t.toLowerCase() === "same agent, different answer"
  );
  if (!section) return;

  // remark-rehype leaves whitespace-only text nodes between block elements,
  // so the blockquote after a label paragraph isn't necessarily its very
  // next sibling by index: find the next actual element instead.
  function nextElementIndex(from: number): number | null {
    for (let i = from; i < section!.body.length; i += 1) {
      const node = section!.body[i];
      if (node && isElement(node)) return i;
    }
    return null;
  }

  const labelIndexes: number[] = [];
  section.body.forEach((node, i) => {
    if (isElement(node, "p")) {
      const t = textOf(node).toLowerCase();
      if (t === "without devrel.md" || t === "with devrel.md") labelIndexes.push(i);
    }
  });
  const [firstIndex, secondIndex] = labelIndexes;
  if (firstIndex === undefined || secondIndex === undefined) return;

  const cards: Element[] = [];
  let lastIndex = secondIndex;
  for (const idx of [firstIndex, secondIndex]) {
    const label = section.body[idx] as Element;
    const quoteIndex = nextElementIndex(idx + 1);
    const quote = quoteIndex === null ? null : section.body[quoteIndex];
    if (!quote || !isElement(quote, "blockquote")) return; // structure not as expected: bail out
    lastIndex = Math.max(lastIndex, quoteIndex!);
    const labelText: ElementContent = { type: "text", value: textOf(label) };
    cards.push(
      el("div", { className: ["compare-card"] }, [
        el("p", { className: ["compare-label"] }, [labelText]),
        quote as ElementContent,
      ])
    );
  }

  const grid = el("div", { className: ["compare-grid"] }, cards);
  const before = section.body.slice(0, firstIndex);
  const after = section.body.slice(lastIndex + 1);

  tree.children = [...section.before, section.heading, ...before, grid, ...after, ...section.after];
}

/** Wraps everything before the second h2 (H1, headline, lede, agent note and
 * prompt block) in <div class="hero"> so CSS can give the entrance a wider
 * measure than the reading column, and marks the paragraph straight after the
 * headline as the lede. No-ops if the document doesn't open h1, h2. */
function transformHero(tree: Root): void {
  const elementIndexes = tree.children
    .map((n, i) => (isElement(n) ? i : -1))
    .filter((i) => i !== -1);
  const [h1, headline, lede] = elementIndexes.map((i) => tree.children[i] as Element);
  if (!h1 || h1.tagName !== "h1" || !headline || headline.tagName !== "h2") return;

  const nextH2 = tree.children.findIndex(
    (n, i) => i > (elementIndexes[1] as number) && isElement(n, "h2")
  );
  if (nextH2 === -1) return;

  if (lede && lede.tagName === "p") lede.properties = { ...lede.properties, className: ["lede"] };

  const heroChildren = tree.children.slice(0, nextH2) as ElementContent[];
  tree.children = [el("div", { className: ["hero"] }, heroChildren), ...tree.children.slice(nextH2)];
}

/** A small "View the full example" link directly under the example code
 * block in "## What it looks like". */
function addExampleLink(tree: Root): void {
  const section = extractSection(tree.children, "h2", (t) => t.toLowerCase() === "what it looks like");
  if (!section) return;
  const preIndex = section.body.findIndex((n) => isElement(n, "pre"));
  if (preIndex === -1) return;

  const link = el("p", { className: ["code-link"] }, [
    el("a", { href: "/example" }, [{ type: "text", value: "View the full example" }]),
  ]);
  const body = [...section.body.slice(0, preIndex + 1), link, ...section.body.slice(preIndex + 1)];
  tree.children = [...section.before, section.heading, ...body, ...section.after];
}

function homeLayout() {
  return (tree: Root) => {
    addExampleLink(tree);
    transformFaq(tree);
    transformComparison(tree);
    transformHero(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(homeLayout)
  .use(rehypeStringify);

export async function renderHomeHtml(raw: string): Promise<{ html: string; frontmatter: Record<string, unknown> }> {
  const { data, content } = matter(raw);
  const file = await processor.process(content);
  return { html: String(file), frontmatter: data };
}
