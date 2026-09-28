import { contentRoute } from "@/lib/contentRoute";
import { readTemplate } from "@/lib/content";
import { frontmatterPanelHtml } from "@/lib/frontmatterPanel";

export const GET = contentRoute({
  path: "/template",
  mdPath: "/template.md",
  title: "DEVREL.md template",
  description: "A blank DEVREL.md, ready to copy into a repository and fill in.",
  load: readTemplate,
  preContent: frontmatterPanelHtml,
});
