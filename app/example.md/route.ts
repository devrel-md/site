import { contentRoute } from "@/lib/contentRoute";
import { readExample } from "@/lib/content";

export const GET = contentRoute({
  path: "/example",
  mdPath: "/example.md",
  title: "DEVREL.md example: Acme Vector",
  description: "A filled-in DEVREL.md for a fictional product, showing every section in use.",
  load: readExample,
  forceMarkdown: true,
});
