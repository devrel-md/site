"use client";

import { SiteShell } from "@/app/SiteShell";
import { themeScript } from "@/lib/siteLayout";

// Only used if the root layout itself fails, so it has to bring its own <html>.
/* eslint-disable @next/next/no-html-link-for-pages -- plain anchors on purpose: the rest of the site is Route Handlers, not React pages. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-GB">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- see app/layout.tsx */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
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
      </body>
    </html>
  );
}
