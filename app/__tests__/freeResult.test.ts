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
    expect(html).not.toContain("Unlock copy and download");
  });

  it("downloads the complete Markdown without a cookie or JavaScript", async () => {
    const response = await GET(request("/r/example.md?download=1"), { params: Promise.resolve({ id: "example.md" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain('filename="DEVREL.md"');
    expect(await response.text()).toBe(markdown);
  });
});
