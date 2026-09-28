// Fetches the given page plus up to five discovered pages for the generator:
// llms.txt, docs home, quickstart or getting-started, pricing, API reference.
// Caps roughly match scripts/bakeoff: ~20k llms.txt, ~15k quickstart, ~12k
// docs home, ~8k pricing, ~4k others, about 20k tokens total.
import { safeFetch, SsrfBlockedError } from "@/lib/ssrf";
import { htmlToText, extractLinks } from "@/lib/htmlToText";
import { isDisallowed } from "@/lib/robotsCheck";

export interface FetchedPage {
  url: string;
  label: string;
  content: string;
}

function isMarkdownLike(url: string, contentType: string | null): boolean {
  if (url.endsWith(".md") || url.endsWith(".txt")) return true;
  if (!contentType) return false;
  return contentType.includes("text/markdown") || contentType.includes("text/plain");
}

async function fetchCapped(url: string, cap: number): Promise<string | null> {
  const origin = new URL(url).origin;
  const pathname = new URL(url).pathname;
  if (await isDisallowed(origin, pathname)) return null;
  try {
    const res = await safeFetch(url);
    if (res.status !== 200) return null;
    const markdown = isMarkdownLike(res.url, res.headers.get("content-type"));
    const text = markdown ? res.text : htmlToText(res.text);
    return text.slice(0, cap);
  } catch (err) {
    if (err instanceof SsrfBlockedError) return null;
    return null;
  }
}

/** Try the Markdown twin of an HTML page (Link header, or the same path with
 * .md appended) before falling back to the HTML page itself. */
async function fetchPreferMarkdown(url: string, cap: number): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.endsWith(".md")) {
      const candidate = new URL(parsed.pathname.endsWith("/") ? `${parsed.pathname}index.md` : `${parsed.pathname}.md`, parsed);
      const md = await fetchCapped(candidate.toString(), cap);
      if (md) return md;
    }
  } catch {
    // fall through to the original URL
  }
  return fetchCapped(url, cap);
}

function findLink(
  links: { href: string; text: string }[],
  keywords: string[],
  excludePatterns: RegExp[] = []
): string | null {
  for (const keyword of keywords) {
    const hit = links.find((link) => {
      const haystack = `${link.text} ${link.href}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
      return !excludePatterns.some((p) => p.test(link.href));
    });
    if (hit) return hit.href;
  }
  return null;
}

const NON_TECH = [/\/blog\//, /\/news\//, /\/articles\//, /\/posts\//, /\/case-studies\//];

export async function discoverPages(inputUrl: string): Promise<FetchedPage[]> {
  const origin = new URL(inputUrl).origin;
  const pages: FetchedPage[] = [];

  const inputText = await fetchCapped(inputUrl, 12000);
  let inputHtml = "";
  try {
    const raw = await safeFetch(inputUrl);
    inputHtml = raw.text;
  } catch {
    inputHtml = "";
  }
  if (inputText) pages.push({ url: inputUrl, label: "input page", content: inputText });

  const llmsTxt = await fetchCapped(`${origin}/llms.txt`, 20000);
  if (llmsTxt) pages.push({ url: `${origin}/llms.txt`, label: "llms.txt", content: llmsTxt });

  // Build a candidate link set from llms.txt's Markdown links and the input
  // page's HTML links, the same spirit as the agent-readiness sample set.
  const linksFromLlms = llmsTxt
    ? Array.from(llmsTxt.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)).map((m) => ({
        text: m[1] ?? "",
        href: m[2] ?? "",
      }))
    : [];
  const linksFromHtml = inputHtml ? extractLinks(inputHtml, inputUrl) : [];
  const links = [...linksFromLlms, ...linksFromHtml];

  const docsHome =
    findLink(links, ["/docs", "/developer", "/api", "/reference", "docs."], NON_TECH) ??
    (links.find((l) => /docs\.|developer\./i.test(new URL(l.href).hostname))?.href ?? null);

  const quickstart = findLink(
    links,
    ["quickstart", "quick-start", "getting-started", "get-started", "guide"],
    NON_TECH
  );
  const pricing = findLink(links, ["pricing", "/plans"], NON_TECH);
  const apiReference = findLink(links, ["api-reference", "api reference", "/reference"], NON_TECH);

  const discovered: { url: string | null; label: string; cap: number; preferMd: boolean }[] = [
    { url: docsHome, label: "docs home", cap: 12000, preferMd: true },
    { url: quickstart, label: "quickstart", cap: 15000, preferMd: true },
    { url: pricing, label: "pricing", cap: 8000, preferMd: false },
    { url: apiReference, label: "API reference", cap: 4000, preferMd: true },
  ];

  for (const item of discovered) {
    if (!item.url) continue;
    if (pages.some((p) => p.url === item.url)) continue;
    const content = item.preferMd
      ? await fetchPreferMarkdown(item.url, item.cap)
      : await fetchCapped(item.url, item.cap);
    if (content) pages.push({ url: item.url, label: item.label, content });
  }

  return pages;
}
