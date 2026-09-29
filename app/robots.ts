import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

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
