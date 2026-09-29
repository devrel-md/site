import { contentRoute } from "@/lib/contentRoute";
import { readQuickstart } from "@/lib/content";

export const GET = contentRoute({
  path: "/quickstart",
  mdPath: "/quickstart.md",
  title: "Quickstart: DEVREL.md",
  description: "Create a DEVREL.md for your product in about five minutes, then check it.",
  load: readQuickstart,
  forceMarkdown: true,
});
