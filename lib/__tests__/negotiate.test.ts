import { describe, it, expect } from "vitest";
import { wantsMarkdown } from "@/lib/negotiate";

function req(headers: Record<string, string>): Request {
  return new Request("https://devrel.md/", { headers });
}

describe("wantsMarkdown", () => {
  it("serves Markdown when Accept explicitly asks for it", () => {
    expect(wantsMarkdown(req({ accept: "text/markdown" }), false)).toBe(true);
  });

  it("serves Markdown to curl's default headers", () => {
    expect(wantsMarkdown(req({ "user-agent": "curl/8.4.0", accept: "*/*" }), false)).toBe(true);
  });

  it("serves Markdown to wget's default headers", () => {
    expect(wantsMarkdown(req({ "user-agent": "Wget/1.21.3", accept: "*/*" }), false)).toBe(true);
  });

  it("serves Markdown to HTTPie's default headers", () => {
    expect(wantsMarkdown(req({ "user-agent": "HTTPie/3.2.2", accept: "*/*" }), false)).toBe(true);
  });

  it("serves Markdown when Accept is missing entirely for a non-browser UA", () => {
    expect(wantsMarkdown(req({ "user-agent": "some-cli/1.0" }), false)).toBe(true);
  });

  it("serves HTML to a browser sending a typical Accept header", () => {
    expect(
      wantsMarkdown(
        req({
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }),
        false
      )
    ).toBe(false);
  });

  it("serves HTML to a browser even with a wildcard-only Accept header", () => {
    // Mozilla UA takes precedence: real browsers never send a bare Accept: */*
    // for a navigation, but we still must not misclassify one that does.
    expect(wantsMarkdown(req({ "user-agent": "Mozilla/5.0", accept: "*/*" }), false)).toBe(false);
  });

  it("always serves Markdown when the .md route forces it, regardless of headers", () => {
    expect(
      wantsMarkdown(req({ "user-agent": "Mozilla/5.0", accept: "text/html" }), true)
    ).toBe(true);
  });

  it("does not serve Markdown to a crawler sending a standard HTML Accept header", () => {
    expect(
      wantsMarkdown(req({ "user-agent": "ClaudeBot/1.0", accept: "text/html,application/xhtml+xml" }), false)
    ).toBe(false);
  });
});
