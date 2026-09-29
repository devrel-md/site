import { contentRoute } from "@/lib/contentRoute";
import { readSpec } from "@/lib/content";

export const GET = contentRoute({
  path: "/spec",
  mdPath: "/spec.md",
  title: "DEVREL.md: the spec",
  description:
    "DEVREL.md tells people and AI agents who a developer product is for, what first success looks like, and where the developer journey is healthy or broken.",
  load: readSpec,
  forceMarkdown: true,
});
