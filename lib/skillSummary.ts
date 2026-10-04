// Display helpers for the skills catalog. `description` is written for agent
// routing (trigger phrases), so human-facing lists prefer `metadata.summary`.
import type { SkillFrontmatter } from "@/lib/content";

/** First sentence of a long routing description, used when no summary exists yet. */
export function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const match = flat.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0] : flat;
}

/** The short human summary, falling back to the first sentence of `description`. */
export function skillSummaryText(frontmatter: SkillFrontmatter): string {
  const summary = frontmatter.metadata?.summary?.trim();
  if (summary) return summary;
  return firstSentence(frontmatter.description ?? "");
}

/**
 * Chapter references only, for a column under a heading that already credits the
 * book. `source` reads "<Book> by <Authors>, Ch 1, 2, App F"; authors never
 * contain a comma, so everything after the first comma following " by " is the
 * chapter list. A source in any other shape is returned unchanged.
 */
export function skillChapters(frontmatter: SkillFrontmatter): string {
  const source = frontmatter.metadata?.source?.trim();
  if (!source) return "unknown";
  const match = source.match(/^.*? by [^,]+,\s*(.+)$/);
  return match?.[1] ?? source;
}

export function skillInstallCommand(slug: string): string {
  return `npx skills add devrel-md/skills --skill ${slug}`;
}
