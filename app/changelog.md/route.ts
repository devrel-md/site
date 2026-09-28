import { contentRoute } from "@/lib/contentRoute";
import { readChangelog } from "@/lib/content";

export const GET = contentRoute({
  path: "/changelog",
  mdPath: "/changelog.md",
  title: "Changelog: DEVREL.md",
  description: "Dated changes to devrel.md, the spec and the skill library.",
  load: readChangelog,
  forceMarkdown: true,
});
