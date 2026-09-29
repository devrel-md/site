import type { Metadata } from "next";
import { env } from "@/lib/env";
import { SiteShell } from "@/app/SiteShell";
import { GenerateForm } from "@/app/generate/GenerateForm";

export const metadata: Metadata = {
  title: "Generate: DEVREL.md",
  description: "Paste a product's docs or home URL and get a draft DEVREL.md in about half a minute.",
};

export default function GeneratePage() {
  return (
    <SiteShell path="/generate">
      <h1>Generate a DEVREL.md</h1>
      <p>
        Paste a product&apos;s docs or home page URL. We fetch a handful of public pages, follow the
        spec, and stream a draft back in about half a minute. Nothing is stored except the result and,
        if you choose to see the copy and download buttons, your email.
      </p>
      <GenerateForm turnstileSiteKey={env.turnstileSiteKey} />
    </SiteShell>
  );
}
