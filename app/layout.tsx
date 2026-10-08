import type { Metadata } from "next";
import { env, STYLESHEET_HREF } from "@/lib/env";
import { OG_IMAGE_PATH, themeScript } from "@/lib/siteLayout";

// Rendered per request so metadataBase (and so the absolute og:image URL) uses the
// runtime SITE_URL rather than whatever was set when the image was built.
export const dynamic = "force-dynamic";

const title = "DEVREL.md";
const description = "The open spec and skill library for developer relations.";

// The same icons and social tags renderPage puts in the hand-built routes.
export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title,
  description,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    siteName: title,
    type: "website",
    title,
    description,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE_PATH] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- shared, unhashed stylesheet also served
            directly to the hand-built HTML routes; it must use the same STYLESHEET_HREF everywhere. */}
        <link rel="stylesheet" href={STYLESHEET_HREF} />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
