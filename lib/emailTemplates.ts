import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const EMAILS_DIR = path.join(process.cwd(), "emails");

export interface EmailTemplate {
  subject: string;
  stage?: string;
  body: string;
}

export async function loadEmailTemplate(name: string): Promise<EmailTemplate> {
  const raw = await readFile(path.join(EMAILS_DIR, `${name}.md`), "utf8");
  const { data, content } = matter(raw);
  return { subject: data.subject as string, stage: data.stage as string | undefined, body: content.trim() };
}

export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

const STAGE_TEMPLATE: Record<string, string> = {
  Awareness: "series-awareness",
  Onboarding: "series-onboarding",
  Activation: "series-activation",
  Engagement: "series-engagement",
  Monetization: "series-monetization",
};

export function templateForStage(stage: string): string | undefined {
  return STAGE_TEMPLATE[stage];
}
