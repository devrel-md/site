import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Rendered per request so the sitemap URL follows the runtime SITE_URL. Left
// static, Next prerenders this at build time, when SITE_URL is not set.
export const dynamic = "force-dynamic";

const AI_AGENTS = ["GPTBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
