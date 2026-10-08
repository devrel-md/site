import { describe, it, expect } from "vitest";
import { isLikelyBot } from "@/lib/clickBot";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("isLikelyBot", () => {
  it("treats a real browser navigation as human", () => {
    expect(isLikelyBot(headers({ "user-agent": CHROME, "sec-fetch-mode": "navigate" }))).toBe(false);
  });

  it("flags a browser user agent without Sec-Fetch-Mode", () => {
    expect(isLikelyBot(headers({ "user-agent": CHROME }))).toBe(true);
  });

  it("flags self-declared crawlers even with browser headers", () => {
    const semrush = "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)";
    expect(isLikelyBot(headers({ "user-agent": semrush, "sec-fetch-mode": "navigate" }))).toBe(true);
    expect(isLikelyBot(headers({ "user-agent": "Slackbot-LinkExpanding 1.0", "sec-fetch-mode": "navigate" }))).toBe(true);
  });

  it("flags HTTP libraries and an empty user agent", () => {
    for (const ua of ["curl/8.7.1", "python-requests/2.32.3", "Go-http-client/1.1", "node-fetch/1.0", ""]) {
      expect(isLikelyBot(headers({ "user-agent": ua }))).toBe(true);
    }
    expect(isLikelyBot(headers({}))).toBe(true);
  });
});
