import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const safeFetchMock = vi.fn();
vi.mock("@/lib/ssrf", () => ({
  safeFetch: (...args: unknown[]) => safeFetchMock(...args),
  SsrfBlockedError: class extends Error {},
}));
const isDisallowedMock = vi.fn();
vi.mock("@/lib/robotsCheck", () => ({ isDisallowed: (...args: unknown[]) => isDisallowedMock(...args) }));

import { findOwnDevrel } from "@/lib/discoverPages";

const VALID = readFileSync(path.join(process.cwd(), "scripts", "bakeoff", "fixtures", "openai-gpt-6-luna.md"), "utf8");
const ok = (url: string, text: string) => ({ url, status: 200, headers: new Headers(), text, truncated: false });

describe("findOwnDevrel", () => {
  beforeEach(() => {
    safeFetchMock.mockReset();
    isDisallowedMock.mockReset().mockResolvedValue(false);
  });

  it("returns the root file when it is a valid DEVREL.md", async () => {
    safeFetchMock.mockResolvedValueOnce(ok("https://acme.dev/DEVREL.md", VALID));
    expect(await findOwnDevrel("https://acme.dev")).toBe("https://acme.dev/DEVREL.md");
    expect(safeFetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to /.well-known when the root has none", async () => {
    safeFetchMock
      .mockResolvedValueOnce({ ...ok("https://acme.dev/DEVREL.md", ""), status: 404 })
      .mockResolvedValueOnce(ok("https://acme.dev/.well-known/DEVREL.md", VALID));
    expect(await findOwnDevrel("https://acme.dev")).toBe("https://acme.dev/.well-known/DEVREL.md");
  });

  it("ignores a file that does not pass the validator, such as an HTML page served for every path", async () => {
    safeFetchMock.mockResolvedValue(ok("https://acme.dev/DEVREL.md", "<!doctype html><title>Home</title>"));
    expect(await findOwnDevrel("https://acme.dev")).toBeNull();
    expect(safeFetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores a file that redirects to another host", async () => {
    safeFetchMock.mockResolvedValue(ok("https://elsewhere.example/DEVREL.md", VALID));
    expect(await findOwnDevrel("https://acme.dev")).toBeNull();
  });

  it("does not fetch a path that robots.txt disallows for our agent", async () => {
    isDisallowedMock.mockResolvedValue(true);
    expect(await findOwnDevrel("https://acme.dev")).toBeNull();
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it("treats a failed fetch as no file", async () => {
    safeFetchMock.mockRejectedValue(new Error("blocked"));
    expect(await findOwnDevrel("https://acme.dev")).toBeNull();
  });
});
