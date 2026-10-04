import { beforeEach, describe, expect, it, vi } from "vitest";

const getResultMock = vi.fn();
vi.mock("@/lib/results", () => ({ getResult: (...args: unknown[]) => getResultMock(...args) }));

import { GET } from "@/app/r/[id]/route";

const markdown = "---\nproduct: Example\n---\n# DEVREL.md\n\nA draft.\n\n<!-- Generated with devrel.md -->\n";
const base = {
  id: "abc",
  markdown,
  gates: [],
  url: "https://acme.dev/docs",
  host: "acme.dev",
  pages_read: 4,
  created_at: new Date("2026-10-04T21:30:00Z"),
  indexable: true,
  excluded_at: null,
  own_devrel_url: null,
};

function request(path: string): Request {
  return new Request(`https://devrel.md${path}`, { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("result page indexing", () => {
  beforeEach(() => getResultMock.mockReset());

  it("is indexable when the row passed the quality bar: no robots meta, no X-Robots-Tag", async () => {
    getResultMock.mockResolvedValue(base);
    const response = await GET(request("/r/abc"), ctx("abc"));
    const html = await response.text();
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(html).not.toContain('name="robots"');
    expect(html).toContain('<link rel="canonical" href="');
    expect(html).toContain("/r/abc");
  });

  it("sends noindex in the page and the header when the row is not indexable", async () => {
    getResultMock.mockResolvedValue({ ...base, indexable: false });
    const response = await GET(request("/r/abc"), ctx("abc"));
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(await response.text()).toContain('<meta name="robots" content="noindex">');
  });

  it("treats a row from before the migration, with no flag at all, as noindex", async () => {
    const { indexable: _omit, ...legacy } = base;
    void _omit;
    getResultMock.mockResolvedValue(legacy);
    const response = await GET(request("/r/abc"), ctx("abc"));
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("sends noindex on the Markdown route and the download too", async () => {
    getResultMock.mockResolvedValue({ ...base, indexable: false });
    const md = await GET(request("/r/abc.md"), ctx("abc.md"));
    expect(md.headers.get("x-robots-tag")).toBe("noindex");
    const download = await GET(request("/r/abc.md?download=1"), ctx("abc.md"));
    expect(download.headers.get("x-robots-tag")).toBe("noindex");
  });
});

describe("provenance on result pages", () => {
  beforeEach(() => getResultMock.mockReset().mockResolvedValue(base));

  it("shows the provenance line above the file", async () => {
    const html = await (await GET(request("/r/abc"), ctx("abc"))).text();
    const line =
      "Automated draft generated on 4 October 2026 from 4 public pages of acme.dev. " +
      'It is a starting point, not an audit. To correct or remove it, email <a href="mailto:hello@devrel.md">hello@devrel.md</a>.';
    expect(html).toContain(line);
    expect(html.indexOf(line)).toBeLessThan(html.indexOf('id="raw-markdown"'));
    expect(html.indexOf(line)).toBeLessThan(html.indexOf("<h1"));
  });

  it("adds the provenance as a comment before the generator comment on the Markdown route", async () => {
    const body = await (await GET(request("/r/abc.md"), ctx("abc.md"))).text();
    const lines = body.trimEnd().split("\n");
    expect(lines.at(-1)).toBe("<!-- Generated with devrel.md -->");
    expect(lines.at(-2)).toContain("<!-- Automated draft generated on 4 October 2026 from 4 public pages of acme.dev.");
    expect(body.startsWith("---\nproduct: Example\n---")).toBe(true);
  });

  it("leaves the download byte for byte as stored", async () => {
    const response = await GET(request("/r/abc.md?download=1"), ctx("abc.md"));
    expect(await response.text()).toBe(markdown);
  });
});

describe("excluded results", () => {
  it("is noindex and says why, in one line", async () => {
    getResultMock.mockResolvedValue({ ...base, excluded_at: new Date("2026-10-04T22:00:00Z") });
    const response = await GET(request("/r/abc"), ctx("abc"));
    const html = await response.text();
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(html).toContain("The site owner has asked for this not to be indexed.");
  });

  it("does not show the note on a normal result", async () => {
    getResultMock.mockResolvedValue(base);
    const html = await (await GET(request("/r/abc"), ctx("abc"))).text();
    expect(html).not.toContain("asked for this not to be indexed");
  });

  it("stays noindex even when the row was marked indexable", async () => {
    getResultMock.mockResolvedValue({ ...base, indexable: true, excluded_at: "2026-10-04T22:00:00Z" });
    const response = await GET(request("/r/abc.md"), ctx("abc.md"));
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });
});

describe("canonical to the company's own file", () => {
  const own = "https://acme.dev/DEVREL.md";

  it("points the canonical link at it and links it visibly", async () => {
    getResultMock.mockResolvedValue({ ...base, own_devrel_url: own });
    const html = await (await GET(request("/r/abc"), ctx("abc"))).text();
    expect(html).toContain(`<link rel="canonical" href="${own}">`);
    expect(html).not.toContain('<link rel="canonical" href="https://devrel.md/r/abc">');
    expect(html).toContain("This company publishes its own DEVREL.md");
    expect(html).toContain(`<a href="${own}">${own}</a>`);
  });

  it("sends a canonical Link header on the Markdown route", async () => {
    getResultMock.mockResolvedValue({ ...base, own_devrel_url: own });
    const response = await GET(request("/r/abc.md"), ctx("abc.md"));
    expect(response.headers.get("link")).toContain(`<${own}>; rel="canonical"`);
  });

  it("keeps the canonical on the page itself when the company has no file", async () => {
    getResultMock.mockResolvedValue(base);
    const html = await (await GET(request("/r/abc"), ctx("abc"))).text();
    expect(html).toMatch(/<link rel="canonical" href="[^"]*\/r\/abc">/);
    expect(html).not.toContain("publishes its own DEVREL.md");
  });
});
