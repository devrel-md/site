import type { Metadata } from "next";
import { themeScript } from "@/lib/siteLayout";

export const metadata: Metadata = {
  title: "DEVREL.md",
  description: "The open spec and skill library for developer relations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- shared, unhashed stylesheet also served
            directly to the hand-built HTML routes; it must keep the same /styles.css URL everywhere. */}
        <link rel="stylesheet" href="/styles.css" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
