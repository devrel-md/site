// Reads the spec and skills content straight from the git submodules at
// content/spec and content/skills. The site never copies their content by
// hand: this is the one place that touches those files.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const SPEC_DIR = path.join(ROOT, "content", "spec");
const SKILLS_DIR = path.join(ROOT, "content", "skills", "skills");
const SITE_DIR = path.join(ROOT, "content", "site");

async function read(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function readHome(): Promise<string> {
  return read(path.join(CONTENT_DIR, "home.md"));
}

export async function readQuickstart(): Promise<string> {
  return read(path.join(CONTENT_DIR, "quickstart.md"));
}

export async function readSpec(): Promise<string> {
  return read(path.join(SPEC_DIR, "SPEC.md"));
}

export async function readTemplate(): Promise<string> {
  return read(path.join(SPEC_DIR, "TEMPLATE.md"));
}

export async function readExample(): Promise<string> {
  return read(path.join(SPEC_DIR, "examples", "acme-vector.DEVREL.md"));
}

export async function readPrivacy(): Promise<string> {
  return read(path.join(SITE_DIR, "privacy.md"));
}

export async function readChangelog(): Promise<string> {
  return read(path.join(SITE_DIR, "changelog.md"));
}

export async function readApiReference(): Promise<string> {
  return read(path.join(SITE_DIR, "api.md"));
}

export async function readValidateDescription(): Promise<string> {
  return read(path.join(SITE_DIR, "validate.md"));
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  metadata?: {
    version?: string;
    summary?: string;
    source?: string;
    homepage?: string;
    rubric?: string;
    spec?: string;
  };
}

export interface SkillSummary {
  slug: string;
  frontmatter: SkillFrontmatter;
}

/** Every skill folder name under content/skills/skills, sorted alphabetically. */
export async function listSkillSlugs(): Promise<string[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export async function readSkillMarkdown(slug: string): Promise<string | null> {
  try {
    return await read(path.join(SKILLS_DIR, slug, "SKILL.md"));
  } catch {
    return null;
  }
}

export async function readSkillSummary(slug: string): Promise<SkillSummary | null> {
  const raw = await readSkillMarkdown(slug);
  if (raw === null) return null;
  const { data } = matter(raw);
  return { slug, frontmatter: data as SkillFrontmatter };
}

export async function listSkills(): Promise<SkillSummary[]> {
  const slugs = await listSkillSlugs();
  const summaries = await Promise.all(slugs.map(readSkillSummary));
  return summaries.filter((s): s is SkillSummary => s !== null);
}
