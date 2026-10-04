import { contentRoute } from "@/lib/contentRoute";
import { readValidateDescription } from "@/lib/content";

export const GET = contentRoute({
  path: "/validate",
  mdPath: "/validate.md",
  title: "Validate: DEVREL.md",
  description: "Paste a DEVREL.md and get the structural check the generator uses: format, not facts.",
  load: readValidateDescription,
  forceMarkdown: true,
});
