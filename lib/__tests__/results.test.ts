import { describe, it, expect } from "vitest";
import { normaliseUrl } from "@/lib/results";

describe("normaliseUrl", () => {
  it("lower-cases the host and drops a trailing slash", () => {
    expect(normaliseUrl("https://Example.COM/Docs/")).toBe("https://example.com/Docs");
  });

  it("strips utm_ query params but keeps others, sorted", () => {
    expect(normaliseUrl("https://example.com/?utm_source=x&b=2&a=1")).toBe(
      "https://example.com/?a=1&b=2"
    );
  });

  it("treats the same URL with different utm params as the same cache key", () => {
    const a = normaliseUrl("https://example.com/docs?utm_source=twitter");
    const b = normaliseUrl("https://example.com/docs?utm_source=newsletter");
    expect(a).toBe(b);
  });

  it("drops the fragment", () => {
    expect(normaliseUrl("https://example.com/docs#introduction")).toBe("https://example.com/docs");
  });
});
