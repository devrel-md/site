import type { Metadata } from "next";
import { env } from "@/lib/env";
import { GenerateForm } from "@/app/generate/GenerateForm";

export const metadata: Metadata = {
  title: "Generate: DEVREL.md",
  description: "Paste a product's docs or home URL and get a draft DEVREL.md in about half a minute.",
};

const NAV = [
  { href: "/", label: "Spec" },
  { href: "/skills", label: "Skills" },
  { href: "/generate", label: "Generate" },
];

export default function GeneratePage() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- shared, unhashed stylesheet also served
          directly to the hand-built HTML routes; it must keep the same /styles.css URL everywhere. */}
      <link rel="stylesheet" href="/styles.css" />
      {/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors on purpose: every
          other page on the site is a Route Handler, not a React page, so there is no
          client-side router to hand off to. */}
      <header className="site-header">
        <nav>
          <a className="wordmark" href="/">
            DEVREL.md
          </a>
          {NAV.map((item) => (
            <a key={item.href} className="nav-link" href={item.href} aria-current={item.href === "/generate" ? "page" : undefined}>
              {item.label}
            </a>
          ))}
          <span className="spacer" />
        </nav>
      </header>
      <main>
        <h1>Generate a DEVREL.md</h1>
        <p>
          Paste a product&apos;s docs or home page URL. We fetch a handful of public pages, follow the
          spec, and stream a draft back in about half a minute. Nothing is stored except the result and,
          if you choose to see the copy and download buttons, your email.
        </p>
        <GenerateForm turnstileSiteKey={env.turnstileSiteKey} />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            Created and maintained by Marcos Placona, DevRel Bridge. Framework from{" "}
            <em>How to Build Developer Ecosystems</em> by Amir Shevat and Marcos Placona.
          </span>
        </div>
      </footer>
    </>
  );
}
