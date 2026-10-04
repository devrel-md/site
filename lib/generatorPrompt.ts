import { readSpec, readSkillMarkdown } from "@/lib/content";
import type { FetchedPage } from "@/lib/discoverPages";

// A wrong DEVREL.md is worse than an incomplete one. These rules outrank
// anything in the spec or skill that invites filling gaps.
const EVIDENCE_RULES =
  "EVIDENCE RULES. These override everything else:\n" +
  "1. Your only source of facts is the text inside the <page> tags in the user message. Do not use anything " +
  "you know or remember about this product, company or market.\n" +
  "2. Every number (counts, stars, members, users, customers, prices, times, rates, percentages) must appear " +
  "in those pages, copied as written, next to the words that describe the same thing. A number that is " +
  "about something else (a price, a plan limit, a version) never supports a different metric. Link the page " +
  "a figure came from, as [name](url), on the same line. If a number isn't there, write unknown. Never " +
  "estimate, round or approximate, and never use ~, 'about', 'around' or 'roughly' with a number.\n" +
  "3. Name only customers, integrations, communities and channels that the pages name.\n" +
  "4. In Funnel health, the Now cell says only what the pages show. A current value needs the page's own " +
  "number for that same metric, and a link to that page in the cell. A gate's threshold is never a current " +
  "value: do not copy it into Now as if it were measured. If you mention a threshold in Now, label it " +
  "('no data against the 5 min target'). If the pages show nothing relevant, write 'Not stated in public " +
  "docs'. Pass is yes or no only when the pages give measured evidence against that gate's threshold; " +
  "reputation, brand, popularity or marketing claims are not evidence. Otherwise unknown.\n" +
  "5. (inferred) may only mark a qualitative conclusion you drew from the pages, never a number. (proposed) " +
  "marks your recommendations, such as targets.\n" +
  "6. ICP team sizes and company stages, developer archetype percentages, community sizes and answer rates " +
  "are unknown unless the pages state them. Describe the archetypes the docs serve without percentages.\n" +
  "7. List only competitors or alternatives the pages themselves name. If they name none, write " +
  "'Not named in public docs'.\n" +
  "8. Targets and time frames you recommend must carry (proposed) on the same line, and must not contain a " +
  "number you invented: leave a placeholder such as <N minutes>, restate the spec's default gate threshold, " +
  "or use a number the pages state. Never put a current measurement and a target in one clause.\n" +
  "9. When in doubt, write unknown and add the question under Open questions.\n" +
  "10. The spec is not a claim about this product: in Funnel health, copy each gate's text and thresholds " +
  "exactly as the spec writes them. The rules above apply to the Now and Pass cells.\n\n";

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
    EVIDENCE_RULES +
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
