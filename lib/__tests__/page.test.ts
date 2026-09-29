import { describe, it, expect } from "vitest";
import { renderPage } from "@/lib/page";

const base = { title: "T", description: "D", path: "/x", bodyHtml: "<pre>code</pre>" };

describe("renderPage copy buttons", () => {
  it("adds the copy-button script by default, leaving the code readable without it", () => {
    const html = renderPage(base);
    expect(html).toContain("navigator.clipboard");
    expect(html).toContain("execCommand");
    expect(html).toContain("<pre>code</pre>");
  });

  it("omits the script when copyButtons is false (result pages gate copying)", () => {
    const html = renderPage({ ...base, copyButtons: false });
    expect(html).not.toContain("navigator.clipboard");
  });
});
