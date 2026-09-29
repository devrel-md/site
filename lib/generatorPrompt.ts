import { readSpec, readSkillMarkdown } from "@/lib/content";
import type { FetchedPage } from "@/lib/discoverPages";

// Mirrors scripts/bakeoff/run.py's system and user prompt construction
// exactly, so the model sees the same tested prompt in production as it did
// in the bake-off. Keep the two in sync.
export async function buildSystemPrompt(): Promise<string> {
  const [spec, skill] = await Promise.all([readSpec(), readSkillMarkdown("devrel-md-init")]);

  return (
    "You write DEVREL.md files. Follow the specification and the skill instructions below exactly.\n" +
    "This is an unattended run: nobody can answer questions. Do not ask any. Put the questions you would " +
    "have asked under an 'Open questions' section.\n" +
    "Output ONLY the complete DEVREL.md file content, starting with the '---' frontmatter line. " +
    "No preamble, no code fences, no commentary after the file.\n\n" +
    `<spec>\n${spec}\n</spec>\n\n<skill>\n${skill ?? ""}\n</skill>`
  );
}

export function buildUserPrompt(inputUrl: string, pages: FetchedPage[], today: string): string {
  let user = `Product developer home: ${inputUrl}\nToday's date: ${today}\n\nPublic pages fetched for you:\n\n`;
  for (const page of pages) {
    user += `<page url="${page.url}">\n${page.content}\n</page>\n\n`;
  }
  user += "Write the DEVREL.md for this product now.";
  return user;
}
