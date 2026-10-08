import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

vi.mock("@/lib/db", () => ({ query: vi.fn(async () => ({ rows: [] })) }));

const exampleMarkdown = () =>
  readFile(path.join(process.cwd(), "content", "spec", "examples", "acme-vector.DEVREL.md"), "utf8");

vi.mock("@/lib/results", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/results")>();
  return {
    ...actual,
    getResult: vi.fn(async (id: string) =>
      id === "found"
        ? {
            id: "found",
            url: "https://example.com",
            normalised_url: "https://example.com",
            markdown: await exampleMarkdown(),
            gates: [],
            model: "test",
            cost_usd: "0",
            created_at: "2026-09-29T00:00:00Z",
          }
        : undefined
    ),
  };
});

const browser = { "user-agent": "Mozilla/5.0", accept: "text/html" };
const get = (url: string) => new Request(url, { headers: browser });

function expectSharedChrome(html: string, current?: string) {
  expect(html).toMatch(/<a class="wordmark" href="\/"><svg class="mark"[^>]*aria-hidden="true"[\s\S]*<\/svg>DEVREL\.md<\/a>/);
  for (const label of ["Quickstart", "Spec", "Skills", "Generate", "Validate"]) {
    expect(html).toMatch(new RegExp(`class="nav-link"[^>]*>${label}</a>`));
  }
  expect(html).toContain('<footer class="site-footer">');
  expect(html).toContain('href="https://devrelbridge.com/?utm_source=devrel.md&utm_medium=footer"');
  expect(html).toContain('href="https://devrelbridge.com/book?utm_source=devrel.md&utm_medium=footer"');
  expect(html).toContain('href="https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md">Contribute</a>');
  if (current) {
    expect(html).toMatch(new RegExp(`href="${current}"[^>]*aria-current="page"`));
  }
}

describe("every route renders the shared header and footer", () => {
  const routes: { name: string; load: () => Promise<{ GET: (r: Request, c?: never) => Promise<Response> }>; url: string; current?: string; ctx?: unknown }[] = [
    { name: "/", load: () => import("@/app/route"), url: "https://devrel.md/" },
    { name: "/quickstart", load: () => import("@/app/quickstart/route"), url: "https://devrel.md/quickstart", current: "/quickstart" },
    { name: "/spec", load: () => import("@/app/spec/route"), url: "https://devrel.md/spec", current: "/spec" },
    { name: "/example", load: () => import("@/app/example/route"), url: "https://devrel.md/example" },
    { name: "/template", load: () => import("@/app/template/route"), url: "https://devrel.md/template" },
    { name: "/skills", load: () => import("@/app/skills/route"), url: "https://devrel.md/skills", current: "/skills" },
    { name: "/validate", load: () => import("@/app/validate/route"), url: "https://devrel.md/validate", current: "/validate" },
    { name: "/privacy", load: () => import("@/app/privacy/route"), url: "https://devrel.md/privacy" },
    { name: "/changelog", load: () => import("@/app/changelog/route"), url: "https://devrel.md/changelog" },
    { name: "/api", load: () => import("@/app/api/route"), url: "https://devrel.md/api" },
  ];

  for (const r of routes) {
    it(r.name, async () => {
      const { GET } = await r.load();
      const res = await GET(get(r.url));
      expect(res.headers.get("content-type")).toContain("text/html");
      expectSharedChrome(await res.text(), r.current);
    });
  }

  it("/skills/[name]", async () => {
    const { listSkillSlugs } = await import("@/lib/content");
    const [slug] = await listSkillSlugs();
    const { GET } = await import("@/app/skills/[name]/route");
    const res = await GET(get(`https://devrel.md/skills/${slug}`), { params: Promise.resolve({ name: slug! }) } as never);
    expect(res.status).toBe(200);
    const html = await res.text();
    expectSharedChrome(html);
    expect(html).toMatch(/href="\/skills"[^>]*aria-current="true"/);
  });

  it("/skills/[name] 404", async () => {
    const { GET } = await import("@/app/skills/[name]/route");
    const res = await GET(get("https://devrel.md/skills/nope"), { params: Promise.resolve({ name: "nope" }) } as never);
    expect(res.status).toBe(404);
    expectSharedChrome(await res.text());
  });

  it("/r/[id] (found and not found)", async () => {
    const { GET } = await import("@/app/r/[id]/route");
    const found = await GET(get("https://devrel.md/r/found"), { params: Promise.resolve({ id: "found" }) } as never);
    expect(found.status).toBe(200);
    expectSharedChrome(await found.text());
    const missing = await GET(get("https://devrel.md/r/nope"), { params: Promise.resolve({ id: "nope" }) } as never);
    expect(missing.status).toBe(404);
    expectSharedChrome(await missing.text());
  });

  it("/generate", async () => {
    const { default: GeneratePage } = await import("@/app/generate/page");
    const html = renderToStaticMarkup(createElement(GeneratePage));
    expectSharedChrome(html, "/generate");
  });

  it("the 404 page", async () => {
    const { default: NotFound } = await import("@/app/not-found");
    expectSharedChrome(renderToStaticMarkup(createElement(NotFound)));
  });

  it("the error page", async () => {
    const { default: ErrorPage } = await import("@/app/error");
    expectSharedChrome(
      renderToStaticMarkup(createElement(ErrorPage, { error: new Error("x"), reset: () => {} }))
    );
  });
});

describe("icons and social tags", () => {
  const ICONS = [
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="apple-touch-icon" href="/apple-icon.png">',
  ];

  it("/ has icons, og and twitter tags with an absolute image URL", async () => {
    const { GET } = await import("@/app/route");
    const html = await (await GET(get("https://devrel.md/"))).text();
    for (const icon of ICONS) expect(html).toContain(icon);
    expect(html).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/opengraph-image\.png">/);
    expect(html).toMatch(/<meta name="twitter:image" content="https?:\/\/[^"]+\/opengraph-image\.png">/);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta property="og:title" content="DEVREL.md">');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toMatch(/<svg class="mark"[^>]*aria-hidden="true"/);
  });

  it("links the stylesheet versioned by build, so a deploy never pairs new HTML with a cached old stylesheet", async () => {
    const { GET } = await import("@/app/route");
    const { STYLESHEET_HREF } = await import("@/lib/env");
    const html = await (await GET(get("https://devrel.md/"))).text();
    expect(STYLESHEET_HREF).toMatch(/^\/styles\.css\?v=.+/);
    expect(html).toContain(`<link rel="stylesheet" href="${STYLESHEET_HREF}">`);
    expect(html).not.toContain('href="/styles.css"');
  });

  it("/generate (React path) has icons and og:image too", async () => {
    const { metadata } = await import("@/app/layout");
    expect(metadata.icons).toMatchObject({ apple: "/apple-icon.png" });
    expect(JSON.stringify(metadata.icons)).toContain("/favicon.svg");
    expect(JSON.stringify(metadata.icons)).toContain("/favicon.ico");
    expect(JSON.stringify(metadata.openGraph)).toContain("/opengraph-image.png");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("Markdown responses carry no HTML head", async () => {
    const { GET } = await import("@/app/route");
    const res = await GET(new Request("https://devrel.md/", { headers: { "user-agent": "curl/8.4.0", accept: "text/markdown" } }));
    const body = await res.text();
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).not.toContain("<head");
    expect(body).not.toContain("og:image");
    expect(body).not.toContain("<svg");
  });
});
