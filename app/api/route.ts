import { contentRoute } from "@/lib/contentRoute";
import { readApiReference } from "@/lib/content";

export const GET = contentRoute({
  path: "/api",
  mdPath: "/api.md",
  title: "API reference: DEVREL.md",
  description: "The generator's one API, documented: no key, no account, no sales call.",
  load: readApiReference,
});
