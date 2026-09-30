import { describe, it, expect } from "vitest";
import { parseRobots, isPathDisallowed } from "@/lib/robotsCheck";

describe("robots.txt rules", () => {
  it("lets a longer Allow override a shorter Disallow (docs.replay.io shape)", () => {
    const groups = parseRobots(
      ["User-agent: *", "Allow: /", "Allow: /basics/replay-qa/", "Disallow: /basics/", "Disallow: /api/"].join("\n")
    );
    expect(isPathDisallowed(groups, "/basics/replay-qa/overview")).toBe(false);
    expect(isPathDisallowed(groups, "/basics/other")).toBe(true);
    expect(isPathDisallowed(groups, "/api/x")).toBe(true);
    expect(isPathDisallowed(groups, "/pricing")).toBe(false);
  });

  it("prefers Allow when an Allow and a Disallow are equally long", () => {
    const groups = parseRobots(["User-agent: *", "Disallow: /docs", "Allow: /docs"].join("\n"));
    expect(isPathDisallowed(groups, "/docs/start")).toBe(false);
  });

  it("uses a group naming our product token instead of *", () => {
    const groups = parseRobots(
      ["User-agent: *", "Disallow: /", "", "User-agent: devrel.md-generator", "Allow: /"].join("\n")
    );
    expect(isPathDisallowed(groups, "/docs")).toBe(false);
  });

  it("shares rules across consecutive User-agent lines", () => {
    const groups = parseRobots(["User-agent: GPTBot", "User-agent: *", "Disallow: /private"].join("\n"));
    expect(isPathDisallowed(groups, "/private/page")).toBe(true);
  });

  it("supports * and $ in patterns", () => {
    const groups = parseRobots(["User-agent: *", "Disallow: /*.pdf$", "Disallow: /tmp*/x"].join("\n"));
    expect(isPathDisallowed(groups, "/files/guide.pdf")).toBe(true);
    expect(isPathDisallowed(groups, "/files/guide.pdf.html")).toBe(false);
    expect(isPathDisallowed(groups, "/tmp123/x")).toBe(true);
  });

  it("treats an empty Disallow and a missing file as allowed", () => {
    expect(isPathDisallowed(parseRobots("User-agent: *\nDisallow:"), "/anything")).toBe(false);
    expect(isPathDisallowed([], "/anything")).toBe(false);
  });
});
