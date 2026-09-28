import { escapeHtml } from "@/lib/html";
import { listSkills, type SkillSummary } from "@/lib/content";

export const SKILLS_INSTALL_NOTE = `Read https://devrel.md and create a DEVREL.md for this repo.`;
export const SKILLS_SH_COMMAND = `npx skills add mplacona/devrel-skills`;
export const SKILLS_PLUGIN_COMMANDS = `/plugin marketplace add mplacona/devrel-skills\n/plugin install devrel-skills@devrel-skills`;

export function installBlockHtml(): string {
  return `<h2 id="install">Install</h2>
<p>No install, any agent that can fetch a URL:</p>
<pre class="install-block"><code class="language-text">${escapeHtml(SKILLS_INSTALL_NOTE)}</code></pre>
<p>Claude Code, Codex, Cursor and others, via <a href="https://skills.sh">skills.sh</a>:</p>
<pre class="install-block"><code class="language-bash">${escapeHtml(SKILLS_SH_COMMAND)}</code></pre>
<p>Claude Code plugin:</p>
<pre class="install-block"><code class="language-text">${escapeHtml(SKILLS_PLUGIN_COMMANDS)}</code></pre>`;
}

function skillMeta(skill: SkillSummary): string {
  const chapters = skill.frontmatter.metadata?.source ?? "unknown";
  return `Book chapters: ${escapeHtml(chapters)}`;
}

export async function skillsCatalogHtml(): Promise<string> {
  const skills = await listSkills();
  const items = skills
    .map((skill) => {
      const name = escapeHtml(skill.frontmatter.name ?? skill.slug);
      const description = escapeHtml(skill.frontmatter.description ?? "");
      return `<li>
<h3 id="skill-${escapeHtml(skill.slug)}"><a href="/skills/${encodeURIComponent(skill.slug)}">${name}</a></h3>
<p>${description}</p>
<p class="meta">${skillMeta(skill)}</p>
</li>`;
    })
    .join("\n");

  return `<h1>Skills</h1>
<p>Free skills built from <em>How to Build Developer Ecosystems</em> by Amir Shevat and Marcos Placona. Every skill reads your <a href="/">DEVREL.md</a> first, so you only explain your product once. Start with <a href="/skills/devrel-md-init">devrel-md-init</a>.</p>
<ul class="skill-list">
${items}
</ul>
${installBlockHtml()}`;
}

export async function skillsCatalogMarkdown(): Promise<string> {
  const skills = await listSkills();
  const rows = skills
    .map((skill) => {
      const name = skill.frontmatter.name ?? skill.slug;
      const description = (skill.frontmatter.description ?? "").replace(/\|/g, "\\|");
      const chapters = skill.frontmatter.metadata?.source ?? "unknown";
      return `| [${name}](/skills/${skill.slug}) | ${description} | ${chapters} |`;
    })
    .join("\n");

  return `# Skills

Free skills built from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona. Every skill reads your DEVREL.md first, so you only explain your product once. Start with [devrel-md-init](/skills/devrel-md-init).

| Skill | What it does | Book chapters |
| --- | --- | --- |
${rows}

## Install

No install, any agent that can fetch a URL:

\`\`\`
${SKILLS_INSTALL_NOTE}
\`\`\`

Claude Code, Codex, Cursor and others, via [skills.sh](https://skills.sh):

\`\`\`bash
${SKILLS_SH_COMMAND}
\`\`\`

Claude Code plugin:

\`\`\`
${SKILLS_PLUGIN_COMMANDS}
\`\`\`
`;
}
