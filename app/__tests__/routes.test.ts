import { describe, it, expect } from "vitest";

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

describe("/ (home)", () => {
  it("serves raw Markdown to curl", async () => {
    const { GET } = await import("@/app/route");
    const res = await GET(req("https://devrel.md/", { "user-agent": "curl/8.4.0", accept: "*/*" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const body = await res.text();
    expect(body).toContain("# DEVREL.md");
    expect(body).toContain("the full specification is at https://devrel.md/spec.md");
  });

  it("serves rendered HTML to a browser, with the FAQ as details and no stray h3", async () => {
    const { GET } = await import("@/app/route");
    const res = await GET(
      req("https://devrel.md/", { "user-agent": "Mozilla/5.0", accept: "text/html" })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain('class="home"');
    expect(body).toContain('<div class="faq-list">');
    expect(body).toContain('<div class="compare-grid">');
    expect(body).toContain('<div class="hero">');
    expect(body).toContain("copy-btn");
    // Nav points Spec at /spec now that home owns "/".
    expect(body).toMatch(/href="\/spec"[^>]*>Spec<\/a>/);
    expect(body).toMatch(/href="\/validate"[^>]*>Validate<\/a>/);
    expect(body).toMatch(/href="\/quickstart"[^>]*>Quickstart<\/a>/);
    // The intro paragraph points new readers at the quickstart.
    expect(body).toMatch(/New here\? Follow the <a href="\/quickstart">quickstart<\/a>/);
  });

  it("serves the same Markdown at /index.md", async () => {
    const { GET } = await import("@/app/index.md/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
  });
});

describe("/quickstart", () => {
  it("serves raw Markdown to curl, with a stable heading and the real /api/validate shape", async () => {
    const { GET } = await import("@/app/quickstart/route");
    const res = await GET(req("https://devrel.md/quickstart", { "user-agent": "curl/8.4.0", accept: "*/*" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const body = await res.text();
    expect(body).toContain("# Quickstart");
    expect(body).toContain('"gates": [');
    expect(body).toContain('"stage": "Awareness"');
  });

  it("serves rendered HTML with stable heading ids and language-tagged code blocks", async () => {
    const { GET } = await import("@/app/quickstart/route");
    const res = await GET(
      req("https://devrel.md/quickstart", { "user-agent": "Mozilla/5.0", accept: "text/html" })
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<h2 id="[a-z0-9-]+">Before you start<\/h2>/);
    expect(body).toMatch(/<h2 id="[a-z0-9-]+">1\. Create the file<\/h2>/);
    expect(body).toMatch(/<code class="language-text">/);
    expect(body).toMatch(/<code class="language-bash">/);
    expect(body).toMatch(/<code class="language-json">/);
  });

  it("serves the same content at /quickstart.md", async () => {
    const { GET } = await import("@/app/quickstart.md/route");
    const res = await GET(req("https://devrel.md/quickstart.md", { "user-agent": "Mozilla/5.0", accept: "text/html" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
  });
});

describe("/spec", () => {
  it("serves the full spec as Markdown to curl", async () => {
    const { GET } = await import("@/app/spec/route");
    const res = await GET(req("https://devrel.md/spec", { "user-agent": "curl/8.4.0", accept: "*/*" }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("spec: devrel.md");
    expect(body).toContain("## Frontmatter");
  });

  it("serves rendered HTML to a browser with a Link header to /spec.md", async () => {
    const { GET } = await import("@/app/spec/route");
    const res = await GET(req("https://devrel.md/spec", { "user-agent": "Mozilla/5.0", accept: "text/html" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("link")).toContain("/spec.md");
  });
});

describe("/validate", () => {
  it("describes itself as Markdown to curl", async () => {
    const { GET } = await import("@/app/validate/route");
    const res = await GET(req("https://devrel.md/validate", { "user-agent": "curl/8.4.0", accept: "*/*" }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("POST /api/validate");
  });

  it("renders a form for browsers", async () => {
    const { GET } = await import("@/app/validate/route");
    const res = await GET(
      req("https://devrel.md/validate", { "user-agent": "Mozilla/5.0", accept: "text/html" })
    );
    const body = await res.text();
    expect(body).toContain('<form class="validate-form"');
    expect(body).toContain('name="markdown"');
  });
});
