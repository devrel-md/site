// Content negotiation shared by every content page: `/`, `/example`,
// `/template`, `/skills`, `/skills/[name]`, `/privacy`, `/changelog`, `/r/[id]`.
//
// Rules, from the brief:
// - `Accept: text/markdown`, or a request for `<path>.md`, returns raw Markdown.
// - curl, wget, HTTPie and similar non-browser user agents with `Accept: */*`
//   also get Markdown, so `curl devrel.md` prints the spec.
// - Browsers get the same content rendered to HTML server-side.
// - Every response sends `Vary: Accept, User-Agent` and a `Link` header
//   pointing at the Markdown alternate.

const BROWSER_UA = /Mozilla\//i;

export function wantsMarkdown(request: Request, forced: boolean): boolean {
  if (forced) return true;

  const accept = (request.headers.get("accept") ?? "").trim();
  if (accept.includes("text/markdown")) return true;

  const userAgent = request.headers.get("user-agent") ?? "";
  const isBrowser = BROWSER_UA.test(userAgent);
  const acceptIsWildcard = accept === "" || accept === "*/*" || accept.startsWith("*/*,");

  return !isBrowser && acceptIsWildcard;
}

export function markdownHeaders(mdPath: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept, User-Agent");
  headers.set("Link", `<${mdPath}>; rel="alternate"; type="text/markdown"`);
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return headers;
}

export function htmlHeaders(mdPath: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Vary", "Accept, User-Agent");
  headers.set("Link", `<${mdPath}>; rel="alternate"; type="text/markdown"`);
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return headers;
}

export function markdownResponse(markdown: string, mdPath: string, status = 200): Response {
  return new Response(markdown, { status, headers: markdownHeaders(mdPath) });
}

export function htmlResponse(html: string, mdPath: string, status = 200): Response {
  return new Response(html, { status, headers: htmlHeaders(mdPath) });
}
