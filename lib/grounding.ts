// Catches figures a model invented rather than read. The generator may only
// state numbers that appear in the pages it was given; anything else is a
// guess dressed up as a fact, and a wrong DEVREL.md is worse than no DEVREL.md.
import type { FetchedPage } from "@/lib/discoverPages";

/** Below this much readable text there is nothing to ground a file in. */
export const MIN_SOURCE_CHARS = 500;

export function hasEnoughSource(pages: FetchedPage[]): boolean {
  return pages.reduce((total, page) => total + page.content.trim().length, 0) >= MIN_SOURCE_CHARS;
}

const FIGURE = /(\d[\d,]*(?:\.\d+)?)\s*([km])?(?![\w.])/gi;
const ESTIMATE = /(?:~|≈|approx\.?\s*|roughly\s+|about\s+|around\s+)\d/i;

function normaliseSource(pages: FetchedPage[]): string {
  return pages.map((p) => p.content).join("\n").toLowerCase().replace(/(\d),(?=\d{3})/g, "$1");
}

/** The ways a figure might be written in the source: "8.5k" could be "8.5k",
 * "8,500" or "8500". */
function spellings(digits: string, suffix: string | undefined): string[] {
  const plain = digits.replace(/,/g, "");
  const forms = [plain];
  if (suffix) {
    forms.push(`${plain}${suffix.toLowerCase()}`);
    const multiplier = suffix.toLowerCase() === "k" ? 1_000 : 1_000_000;
    forms.push(String(Math.round(Number(plain) * multiplier)));
  }
  return forms;
}

function appearsIn(haystack: string, form: string): boolean {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\d.])${escaped}(?![\\d])`).test(haystack);
}

// Sections that legitimately hold numbers we didn't read: links, and the
// questions we're asking the reader. Funnel health is checked cell by cell.
const SKIPPED_SECTIONS = new Set(["docs map", "open questions", "funnel health"]);

// Names that contain digits but aren't figures.
const NAMED_TOKENS = /\b(?:SOC ?2|ISO ?\d+|OAuth ?2(?:\.\d)?|HTTP\/?\d(?:\.\d)?|ICP ?\d+|H\d|P\d|[A-Za-z]+\d+[A-Za-z]*)\b/g;

/** Lines from the body that make claims, with URLs and list numbering removed.
 * Lines marked as proposals or targets are recommendations, not facts. */
function claimLines(markdown: string): string[] {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines: string[] = [];
  let section = "";
  for (const raw of body.split("\n")) {
    const heading = raw.match(/^## (.+)$/);
    if (heading) {
      section = (heading[1] ?? "").trim().toLowerCase();
      continue;
    }
    if (SKIPPED_SECTIONS.has(section)) continue;
    if (/\(proposed\)|\btarget/i.test(raw)) continue;
    lines.push(
      raw
        .replace(/\]\([^)]*\)/g, "]")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/^\s*(?:\d+\.|[-*])\s+/, "")
        .replace(/^#+\s.*$/, "")
        .replace(NAMED_TOKENS, "")
    );
  }
  return lines;
}

function funnelRows(markdown: string): { stage: string; gate: string; now: string }[] {
  const section = markdown.split(/^## Funnel health\s*$/m)[1]?.split(/^## /m)[0] ?? "";
  return section
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && !/^-+$/.test(cells[0] ?? "") && cells[0] !== "Stage")
    .map(([stage = "", gate = "", now = ""]) => ({ stage, gate, now }));
}

/** Problems for every figure the draft states without a source. */
export function groundingProblems(markdown: string, pages: FetchedPage[]): string[] {
  const source = normaliseSource(pages);
  const problems: string[] = [];

  const estimate = markdown.match(new RegExp(`.{0,40}${ESTIMATE.source}.{0,20}`, "i"));
  if (estimate) problems.push(`Estimated figure presented as data: "${estimate[0].trim()}"`);

  for (const line of claimLines(markdown)) {
    for (const match of line.matchAll(FIGURE)) {
      const [, digits = "", suffix] = match;
      if (!spellings(digits, suffix).some((form) => appearsIn(source, form))) {
        problems.push(`"${match[0].trim()}" in "${line.trim().slice(0, 80)}" does not appear in the fetched pages`);
      }
    }
  }

  for (const row of funnelRows(markdown)) {
    const gate = row.gate.toLowerCase();
    for (const match of row.now.matchAll(FIGURE)) {
      const [, digits = "", suffix] = match;
      const forms = spellings(digits, suffix);
      const grounded = forms.some((form) => appearsIn(source, form) || appearsIn(gate, form));
      if (!grounded) problems.push(`${row.stage}: "${match[0].trim()}" does not appear in the fetched pages`);
    }
  }
  return problems;
}
