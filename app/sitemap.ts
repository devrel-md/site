import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listSkillSlugs } from "@/lib/content";

// Rendered per request so every URL follows the runtime SITE_URL. Left static,
// Next prerenders this at build time, when SITE_URL is not set.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const skillSlugs = await listSkillSlugs();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${env.siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${env.siteUrl}/quickstart`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${env.siteUrl}/spec`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${env.siteUrl}/example`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.siteUrl}/template`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.siteUrl}/skills`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${env.siteUrl}/generate`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${env.siteUrl}/validate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.siteUrl}/api`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${env.siteUrl}/changelog`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${env.siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const skillEntries: MetadataRoute.Sitemap = skillSlugs.map((slug) => ({
    url: `${env.siteUrl}/skills/${slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...skillEntries];
}
