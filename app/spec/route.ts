import { contentRoute } from "@/lib/contentRoute";
import { readSpec } from "@/lib/content";
import { frontmatterPanelHtml } from "@/lib/frontmatterPanel";

export const GET = contentRoute({
  path: "/spec",
  mdPath: "/spec.md",
  title: "DEVREL.md: the spec",
  description:
    "DEVREL.md tells people and AI agents who a developer product is for, what first success looks like, and where the developer journey is healthy or broken.",
  load: readSpec,
  preContent: (frontmatter) =>
    `${frontmatterPanelHtml(frontmatter)}\n<p>Prefer to skip straight to code? See the <a href="/api#quickstart">API quickstart</a> for the generator, or paste a URL straight into <a href="/generate">/generate</a>.</p>`,
});
