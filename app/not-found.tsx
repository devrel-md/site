import type { Metadata } from "next";
import { SiteShell } from "@/app/SiteShell";

export const metadata: Metadata = { title: "Not found: DEVREL.md" };

/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors on purpose: the rest of the site is Route Handlers, not React pages. */
export default function NotFound() {
  return (
    <SiteShell path="">
      <h1>Page not found</h1>
      <p>
        There is nothing at this address. Try the <a href="/quickstart">quickstart</a>, the{" "}
        <a href="/spec">spec</a> or the <a href="/skills">skills</a>.
      </p>
    </SiteShell>
  );
}
