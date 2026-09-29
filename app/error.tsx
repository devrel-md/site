"use client";

import { SiteShell } from "@/app/SiteShell";

/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors on purpose: the rest of the site is Route Handlers, not React pages. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SiteShell path="">
      <h1>Something went wrong</h1>
      <p>
        That was our fault, not yours. Try again, or head back to the <a href="/">home page</a>.
      </p>
      <p>
        <button type="button" className="primary" onClick={() => reset()}>
          Try again
        </button>
      </p>
    </SiteShell>
  );
}
