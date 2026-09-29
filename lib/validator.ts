// TypeScript port of scripts/bakeoff/run.py's validate(). Keep this in sync
// with that script; it is the tested prompt's quality gate, ported exactly
// (including its Python repr-style messages) so the bake-off fixtures assert
// the same problems here as they did there.

const REQUIRED = [
  "Product",
  "Value proposition",
  "ICPs",
  "Anti-personas",
  "North Star",
  "Activation",
  "Funnel health",
];
const STAGES = ["Awareness", "Onboarding", "Activation", "Engagement", "Monetization"];
const ALLOWED_STAGES = ["pre-launch", "early", "growth", "scale", "enterprise", "unknown"];
const ALLOWED_PASS = ["yes", "no", "unknown", "n/a"];

function reprLike(value: string | undefined): string {
  return value === undefined ? "None" : `'${value}'`;
}

function parseFrontmatter(block: string): Record<string, string> {
  const fm: Record<string, string> = {};
  const re = /^(\w+):\s*(.+?)\s*(?:#.*)?$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block))) {
    fm[match[1]!] = match[2]!;
  }
  return fm;
}

export function validate(rawText: string): string[] {
  const problems: string[] = [];
  let t = rawText.trim();

  if (t.startsWith("```")) {
    problems.push("wrapped in code fence");
    t = t.replace(/^```[a-z]*\n|\n```$/g, "");
  }

  const frontmatterMatch = t.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    return ["no frontmatter"];
  }
  const fm = parseFrontmatter(frontmatterMatch[1]!);

  for (const key of ["spec", "product", "stage", "updated"]) {
    if (!(key in fm)) problems.push(`frontmatter missing ${key}`);
  }
  if (!ALLOWED_STAGES.includes(fm.stage ?? "")) {
    problems.push(`bad stage ${reprLike(fm.stage)}`);
  }

  const headingRe = /^## (.+?)\s*$/gm;
  const headingMatches = [...t.matchAll(headingRe)];
  const heads = headingMatches.map((m) => m[1]!);

  const positions: number[] = [];
  let funnelHeadingIndex: number | null = null;
  for (const required of REQUIRED) {
    const idx = heads.findIndex((h) => h.toLowerCase().startsWith(required.toLowerCase()));
    if (idx === -1) {
      problems.push(`missing section ${required}`);
    } else {
      positions.push(idx);
      if (required === "Funnel health") funnelHeadingIndex = idx;
    }
  }
  const sorted = [...positions].sort((a, b) => a - b);
  if (!positions.every((v, i) => v === sorted[i])) {
    problems.push("required sections out of order");
  }

  if (funnelHeadingIndex !== null) {
    const start = headingMatches[funnelHeadingIndex]!.index!;
    const end =
      funnelHeadingIndex + 1 < headingMatches.length
        ? headingMatches[funnelHeadingIndex + 1]!.index!
        : t.length;
    const fhBlock = t.slice(start, end);

    for (const stage of STAGES) {
      const rowRe = new RegExp(`^\\|\\s*${stage}\\s*\\|.*\\|\\s*(\\S+)\\s*\\|\\s*$`, "m");
      const row = fhBlock.match(rowRe);
      if (!row) {
        problems.push(`funnel row ${stage} missing`);
      } else if (!ALLOWED_PASS.includes(row[1]!.toLowerCase())) {
        problems.push(`funnel ${stage} pass=${reprLike(row[1])}`);
      }
    }
  }

  const lines = t.split("\n").length;
  if (lines < 40 || lines > 400) {
    problems.push(`length ${lines} lines`);
  }

  return problems;
}
