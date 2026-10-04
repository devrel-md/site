import { describe, expect, it } from "vitest";
import { buildCsp, scriptHash, INLINE_SCRIPTS } from "@/lib/csp";
import { STATIC_SECURITY_HEADERS } from "@/lib/securityHeaders";
import { renderPage } from "@/lib/page";
import { fileActionsHtml, communityFormHtml } from "@/lib/resultPage";
import { themeScript, toggleScript } from "@/lib/siteLayout";

const csp = buildCsp({ nonce: "TESTNONCE" });

function directive(policy: string, name: string): string[] {
  const found = policy.split("; ").find((d) => d.startsWith(`${name} `));
  return found ? found.slice(name.length + 1).split(" ") : [];
}

// Every <script> without a src, as the browser would see its text.
function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
}

// Every <script src> origin: "self" for same-origin paths, otherwise the scheme and host.
function scriptSources(html: string): string[] {
  return [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => (m[1]!.startsWith("/") ? "'self'" : new URL(m[1]!).origin));
}

describe("Content-Security-Policy", () => {
  it("allows only own origin by default and the Turnstile script and frame", () => {
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "script-src")).toContain("https://challenges.cloudflare.com");
    expect(directive(csp, "frame-src")).toEqual(["https://challenges.cloudflare.com"]);
    expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    expect(directive(csp, "img-src")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("never allows unsafe-inline for scripts or inline style blocks, nor unsafe-eval in production", () => {
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).toEqual(["'self'"]);
    expect(directive(csp, "style-src-attr")).toEqual(["'unsafe-inline'"]);
  });

  it("carries the per-request nonce, and only allows unsafe-eval in development", () => {
    expect(directive(csp, "script-src")).toContain("'nonce-TESTNONCE'");
    expect(directive(buildCsp({ nonce: "n", development: true }), "script-src")).toContain("'unsafe-eval'");
  });

  it("adds upgrade-insecure-requests only when asked", () => {
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ nonce: "n", upgradeInsecure: true })).toContain("upgrade-insecure-requests");
  });

  it("hashes exactly the inline scripts the site serves", () => {
    const scriptSrc = directive(csp, "script-src");
    const rendered = [
      renderPage({ title: "T", description: "D", path: "/x", bodyHtml: "<pre>code</pre>" }),
      renderPage({ title: "T", description: "D", path: "/x", bodyHtml: "", copyButtons: false, postContent: fileActionsHtml("abc") }),
    ];
    const found = rendered.flatMap(inlineScripts);
    expect(found.length).toBeGreaterThanOrEqual(5);
    for (const text of found) expect(scriptSrc, `inline script not covered:\n${text.slice(0, 80)}`).toContain(scriptHash(text));
    // The React layout and SiteShell inject these strings verbatim via dangerouslySetInnerHTML.
    expect(scriptSrc).toContain(scriptHash(themeScript()));
    expect(scriptSrc).toContain(scriptHash(toggleScript()));
    expect(INLINE_SCRIPTS).toHaveLength(4);
  });

  it("covers the result page with its Turnstile community form", () => {
    const scriptSrc = directive(csp, "script-src");
    const html = renderPage({
      title: "T",
      description: "D",
      path: "/r/abc",
      bodyHtml: "",
      copyButtons: false,
      postContent: fileActionsHtml("abc") + communityFormHtml(),
    });
    const sources = scriptSources(html);
    expect(sources).toContain("https://challenges.cloudflare.com");
    for (const origin of sources) expect(scriptSrc, `external script not allowed: ${origin}`).toContain(origin);
    for (const text of inlineScripts(html)) expect(scriptSrc).toContain(scriptHash(text));
    // The form posts to our own origin, which form-action allows.
    expect(html).toContain('action="/api/community"');
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("covers the community confirm and signup response pages", async () => {
    const scriptSrc = directive(csp, "script-src");
    const confirm = await import("@/app/api/community/confirm/route");
    const signup = await import("@/app/api/community/route");
    const pages = [
      await confirm.GET(new Request("https://devrel.md/api/community/confirm?token=abc")),
      await confirm.GET(new Request("https://devrel.md/api/community/confirm")),
      await signup.POST(new Request("https://devrel.md/api/community", { method: "POST", body: new URLSearchParams({ email: "nope" }) })),
    ];
    for (const res of pages) {
      const html = await res.text();
      expect(html).toContain("<main>");
      for (const origin of scriptSources(html)) expect(scriptSrc).toContain(origin);
      for (const text of inlineScripts(html)) expect(scriptSrc).toContain(scriptHash(text));
      // Neither page redirects off-site, which form-action would block.
      expect(res.headers.get("location")).toBeNull();
    }
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });
});

describe("static security headers", () => {
  const byKey = Object.fromEntries(STATIC_SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it("sets HSTS, nosniff, a referrer policy and a framing restriction", () => {
    expect(byKey["Strict-Transport-Security"]).toMatch(/^max-age=\d{8,}/);
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
  });
});

describe("proxy", () => {
  it("sets the CSP on the response and on the forwarded request, with a fresh nonce each time", async () => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");
    const a = proxy(new NextRequest("https://devrel.md/generate"));
    const b = proxy(new NextRequest("https://devrel.md/spec"));
    const cspA = a.headers.get("content-security-policy")!;
    const cspB = b.headers.get("content-security-policy")!;
    expect(cspA).toContain("default-src 'self'");
    const nonce = (p: string) => /'nonce-([^']+)'/.exec(p)![1];
    expect(nonce(cspA)).not.toBe(nonce(cspB));
    // Forwarded request headers are advertised via x-middleware-override-headers.
    expect(a.headers.get("x-middleware-override-headers")).toContain("content-security-policy");
    expect(a.headers.get("x-middleware-request-x-nonce")).toBe(nonce(cspA));
  });
});
