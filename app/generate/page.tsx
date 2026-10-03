import type { Metadata } from "next";
import { env } from "@/lib/env";
import { OG_IMAGE_PATH } from "@/lib/siteLayout";
import { SiteShell } from "@/app/SiteShell";
import { GenerateForm } from "@/app/generate/GenerateForm";

export const metadata: Metadata = {
  title: "Generate: DEVREL.md",
  description: "Paste a product's docs or home URL and get a draft DEVREL.md in about half a minute.",
  // A page-level openGraph replaces the layout's wholesale, so the image is repeated here.
  openGraph: {
    title: "Generate: DEVREL.md",
    description: "Paste a product's docs or home URL and get a draft DEVREL.md in about half a minute.",
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Generate: DEVREL.md",
    description: "Paste a product's docs or home URL and get a draft DEVREL.md in about half a minute.",
    images: [OG_IMAGE_PATH],
  },
};

export default function GeneratePage() {
  return (
    <SiteShell path="/generate">
      <h1>Generate a DEVREL.md</h1>
      <p>
        Paste a product&apos;s docs or home page URL. We fetch a handful of public pages, follow the
        spec, and stream a draft back in about half a minute. You can read, copy and download it
        without an account or email. We store the generated result; community updates are optional.
      </p>
      <GenerateForm turnstileSiteKey={env.turnstileSiteKey} />
    </SiteShell>
  );
}
