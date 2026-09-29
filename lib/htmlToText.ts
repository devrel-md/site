/** A pragmatic HTML-to-text conversion for feeding page content to the model.
 * Not a renderer: strips script/style/nav noise and collapses whitespace. */
export function htmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1]?.length))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extracts every href from an HTML document, resolved against a base URL. */
export function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const re = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const rawHref = match[1]!;
    const text = match[2]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    try {
      const resolved = new URL(rawHref, baseUrl);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") {
        links.push({ href: resolved.toString(), text });
      }
    } catch {
      // ignore unresolvable hrefs (mailto:, javascript:, etc.)
    }
  }
  return links;
}
