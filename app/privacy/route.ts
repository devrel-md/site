import { contentRoute } from "@/lib/contentRoute";
import { readPrivacy } from "@/lib/content";

export const GET = contentRoute({
  path: "/privacy",
  mdPath: "/privacy.md",
  title: "Privacy: DEVREL.md",
  description: "What devrel.md stores, why, how to delete it, and how to unsubscribe.",
  load: readPrivacy,
});
