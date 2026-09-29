import { env } from "@/lib/env";
import { readHome, readSpec, readTemplate, readExample, listSkills, readSkillMarkdown } from "@/lib/content";

export async function buildLlmsTxt(): Promise<string> {
  const skills = await listSkills();
  const skillLinks = skills
    .map((s) => `- [${s.frontmatter.name}](${env.siteUrl}/skills/${s.slug}): ${s.frontmatter.description}`)
    .join("\n");

  return `# DEVREL.md

> DEVREL.md is a Markdown file at the root of a repository. It tells people and AI agents who a developer product is for, what a developer's first success looks like, and where the developer journey is healthy or broken. This site hosts the open spec and a free skill library built from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona.

## Spec

- [Home](${env.siteUrl}/): what DEVREL.md is and how to use it
- [The spec](${env.siteUrl}/spec): the full DEVREL.md specification, required sections, frontmatter and default stage gates
- [Template](${env.siteUrl}/template): a blank DEVREL.md ready to fill in
- [Example](${env.siteUrl}/example): a filled-in DEVREL.md for a fictional product

## Skills

- [Skill catalog](${env.siteUrl}/skills): every skill, what it does and how to install it
${skillLinks}

## Generator and validator

- [Generate a DEVREL.md](${env.siteUrl}/generate): paste a product's docs or home URL and get a draft in about half a minute
- [Validate a DEVREL.md](${env.siteUrl}/validate): paste a file and get the same quality check the generator uses
- [API reference](${env.siteUrl}/api): the generator's HTTP API, no key required
- [OpenAPI document](${env.siteUrl}/openapi.json)

## Other

- [Changelog](${env.siteUrl}/changelog)
- [Privacy](${env.siteUrl}/privacy)
- [Full content export](${env.siteUrl}/llms-full.txt)
`;
}

export async function buildLlmsFullTxt(): Promise<string> {
  const [home, spec, template, example, skills] = await Promise.all([
    readHome(),
    readSpec(),
    readTemplate(),
    readExample(),
    listSkills(),
  ]);

  const skillSections = await Promise.all(
    skills.map(async (s) => {
      const md = await readSkillMarkdown(s.slug);
      return `\n\n---\n\n<!-- ${env.siteUrl}/skills/${s.slug} -->\n\n${md ?? ""}`;
    })
  );

  return [
    `<!-- ${env.siteUrl}/ -->`,
    home,
    `\n\n---\n\n<!-- ${env.siteUrl}/spec -->\n\n${spec}`,
    `\n\n---\n\n<!-- ${env.siteUrl}/template -->\n\n${template}`,
    `\n\n---\n\n<!-- ${env.siteUrl}/example -->\n\n${example}`,
    ...skillSections,
  ].join("\n");
}
