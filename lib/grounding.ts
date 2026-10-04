// Catches figures a model invented rather than read. The generator may only
// state numbers that the pages it was given support; anything else is a guess
// dressed up as a fact, and a wrong DEVREL.md is worse than no DEVREL.md.
//
// What this establishes, and what it does not. It is number matching, not
// fact checking. A current value (anything not labelled as a target) passes
// only if the number, with a compatible unit, appears in the fetched text
// next to a word that describes the same thing, or on a page the same line
// cites. The pages themselves may be wrong, stale or marketing; a number that
// is really about something else but shares a nearby word can still pass. A
// gate threshold never supports a current value, because the source for a
// current value is the pages and nothing else. Targets and proposals are
// checked separately: they may restate a number from the pages or one of the
// spec's default gate thresholds, and otherwise must be a placeholder.
import type { FetchedPage } from "@/lib/discoverPages";

/** Below this much readable text there is nothing to ground a file in. */
export const MIN_SOURCE_CHARS = 500;

export function hasEnoughSource(pages: FetchedPage[]): boolean {
  return pages.reduce((total, page) => total + page.content.trim().length, 0) >= MIN_SOURCE_CHARS;
}

const ESTIMATE = /(?:~|≈|approx\.?\s*|roughly\s+|about\s+|around\s+)\d/i;

type Unit = "percent" | "minute" | "second" | "ms" | "hour" | "day" | "money" | "times";

interface Figure {
  /** The number as written, with any k or m suffix, for messages. */
  label: string;
  value: number;
  unit: Unit | null;
  index: number;
  end: number;
}

const UNIT_PATTERN =
  "%|percent\\b|minutes?\\b|mins?\\b|seconds?\\b|secs?\\b|ms\\b|hours?\\b|hrs?\\b|h\\b|days?\\b|s\\b|x\\b|" +
  "usd\\b|dollars?\\b|gbp\\b|eur\\b|euros?\\b|pounds?\\b";
// A figure, an optional k or m multiplier, and an optional unit, which may be
// glued on ("5min", "30-day") or spaced ("5 min").
const FIGURE = new RegExp(
  `(\\d+(?:,\\d{3})*(?:\\.\\d+)?)(?:\\s*([km])\\b)?(?:[\\s\\u2010-\\u2015-]*(${UNIT_PATTERN}))?(?!\\w|\\.\\d)`,
  "gi"
);

function unitOf(word: string | undefined): Unit | null {
  if (!word) return null;
  const w = word.toLowerCase();
  if (w === "%" || w === "percent") return "percent";
  if (w.startsWith("min")) return "minute";
  if (w === "ms") return "ms";
  if (w.startsWith("sec") || w === "s") return "second";
  if (w.startsWith("h")) return "hour";
  if (w.startsWith("day")) return "day";
  if (w === "x") return "times";
  return "money";
}

function figuresIn(text: string): Figure[] {
  const figures: Figure[] = [];
  for (const match of text.matchAll(FIGURE)) {
    const digits = (match[1] ?? "").replace(/,/g, "");
    const suffix = match[2]?.toLowerCase();
    const index = match.index ?? 0;
    const currency = /[$£€]\s?$/.test(text.slice(Math.max(0, index - 2), index));
    figures.push({
      label: `${match[1]}${match[2] ?? ""}`,
      value: Number(digits) * (suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1),
      unit: currency ? "money" : unitOf(match[3]),
      index,
      end: index + match[0].length,
    });
  }
  return figures;
}

function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Source figures that are the claimed figure. A claim with a unit ("20%",
 * "5 min", "$20") only matches a source figure in the same unit, so a price
 * cannot stand in for a rate or a duration. */
function matching(claim: Figure, candidates: Figure[]): Figure[] {
  return candidates.filter((f) => sameNumber(f.value, claim.value) && (claim.unit === null || claim.unit === f.unit));
}

// The numbers in the spec's "Default stage gates". A proposal may restate
// these without them being invented.
const DEFAULT_THRESHOLDS: { value: number; unit: Unit }[] = [
  { value: 5, unit: "minute" },
  { value: 80, unit: "percent" },
  { value: 20, unit: "percent" },
  { value: 65, unit: "percent" },
  { value: 24, unit: "hour" },
];

function isDefaultThreshold(claim: Figure): boolean {
  return DEFAULT_THRESHOLDS.some(
    (t) => sameNumber(t.value, claim.value) && (claim.unit === null || claim.unit === t.unit)
  );
}

// Words that say nothing about which metric a number belongs to.
const STOP_WORDS = new Set(
  (
    "the and or of to in on for with a an is are was were be been by at as per from that this it its not no than " +
    "over under about all any more most less up our your their has have had can will may via etc each both only " +
    "also such into out one two new first time total median mean average current currently today now rate " +
    "source sources see page pages doc docs public stated unknown measured number figure approximately"
  ).split(" ")
);
// Units and periods: "5 min" near "min" in unrelated text must not count.
const UNIT_WORDS = new Set(
  "min mins minute minutes sec secs second seconds hour hours hr hrs day days week weeks month months mo year years percent usd dollar dollars"
    .split(" ")
);

function stem(word: string): string {
  return word.replace(/(?:ing|ed|es|s)$/, "").slice(0, 6);
}

/** Stemmed content words, so "activated", "activation" and "activate" meet. */
function contentWords(text: string): Set<string> {
  const words = new Set<string>();
  for (const word of text.toLowerCase().match(/[a-z]{2,}/g) ?? []) {
    if (STOP_WORDS.has(word) || UNIT_WORDS.has(word)) continue;
    words.add(stem(word));
  }
  return words;
}

// What each funnel stage's current value is about, for cells that carry only
// a bare figure ("14 min, 71%"). The gate's own text is deliberately absent:
// it is where the thresholds live.
const STAGE_VOCABULARY: Record<string, Set<string>> = Object.fromEntries(
  Object.entries({
    awareness: "signup sign traffic visitor download star install follower subscriber referral",
    onboarding: "call request quickstart setup success hello started integrat onboard install",
    activation: "activat production usage active retention",
    engagement: "answer question community respon forum discord support member thread post",
    monetization: "pay paid price pricing plan tier revenue convert trial subscription cost fee",
  }).map(([stage, words]) => [stage, contentWords(words)])
);

/** The text around a figure in the source, within its paragraph. */
function windowAround(source: string, figure: Figure): string {
  const WINDOW = 90;
  const start = Math.max(source.lastIndexOf("\n\n", figure.index) + 1, figure.index - WINDOW, 0);
  const blank = source.indexOf("\n\n", figure.end);
  const stop = Math.min(blank === -1 ? source.length : blank, figure.end + WINDOW);
  return source.slice(start, stop);
}

// The ways a model labels a number as something it recommends rather than
// something it read: "5 min target", "target of 5 min", "(proposed)".
const TARGET_NOUN = "(?:targets?|goals?|aims?|thresholds?|gates?|benchmarks?)";
const LABEL_AFTER = new RegExp(`^\\W*(?:[\\w%/'-]+\\W+){0,3}?${TARGET_NOUN}\\b`, "i");
const LABEL_BEFORE = /\b(?:targets?|goals?|aims?|thresholds?|benchmarks?)\b(?:\W+\w+){0,3}\W*$/i;
const CONNECTORS_ONLY = /^[\s,/&-]*(?:(?:and|or|to)\s*[\s,/&-]*)*$/i;
const CURRENT_CUE = /\b(?:median|mean|average|current(?:ly)?|today|now|measured|actual|presently|so far|observed|reported|latest)\b/i;
// A clause that says it has no value restates a gate ("unknown, against < 5 min"),
// and a prohibition ("never promise 100% deliverability") states no fact.
const UNKNOWN_CUE = /\b(?:unknown|not stated|not measured|no data|n\/a)\b/i;
const PROHIBITION_CUE = /\b(?:never|must not|do not|don't|avoid)\b/i;
const PROPOSED_ONLY = /^\(?\s*proposed\b[^)]*\)?$/i;
const CLAUSE_BREAK = /\s*[;|]\s*|,\s+|[.!?](?=\s|$)|\s[-\u2013\u2014]\s|\s+(?:but|while|whereas)\s+/i;

interface Claim {
  figure: Figure;
  target: boolean;
  /** Words from the same clause, which say what the figure is about. */
  words: Set<string>;
}

/** Splits text into clauses, so a current value and a target on the same
 * line are judged separately. A trailing "(proposed)" belongs to the clause
 * before it. */
function clausesOf(text: string): string[] {
  const clauses: string[] = [];
  for (const piece of text.split(CLAUSE_BREAK)) {
    const clause = piece.trim();
    if (!clause) continue;
    if (PROPOSED_ONLY.test(clause) && clauses.length > 0) clauses[clauses.length - 1] += ` ${clause}`;
    else clauses.push(clause);
  }
  return clauses;
}

function claimsIn(text: string): Claim[] {
  const claims: Claim[] = [];
  for (const clause of clausesOf(text)) {
    const figures = figuresIn(clause);
    if (figures.length === 0) continue;
    const words = contentWords(clause);
    const proposed = /\bproposed\b/i.test(clause);
    const targets: boolean[] = [];
    const found: Claim[] = [];
    for (let i = figures.length - 1; i >= 0; i--) {
      const figure = figures[i]!;
      const next = figures[i + 1];
      const after = clause.slice(figure.end, next?.index ?? clause.length);
      const before = clause.slice(figures[i - 1]?.end ?? 0, figure.index);
      // "5 min and 80% targets": the label reaches back along the chain.
      const chained = next !== undefined && targets[i + 1] === true && CONNECTORS_ONLY.test(after);
      let target = LABEL_AFTER.test(after) || LABEL_BEFORE.test(before) || chained;
      // "(proposed)" covers the clause unless the figure is plainly a measurement.
      if (!target && proposed && !CURRENT_CUE.test(`${before} ${after}`)) target = true;
      // "within 24h" names the gate's answer window rather than reporting a result.
      const window = figure.value === 24 && figure.unit === "hour" && /\b(?:within|in|per|every|over)\s*$/i.test(clause.slice(0, figure.index));
      const prohibited = PROHIBITION_CUE.test(clause.slice(Math.max(0, figure.index - 60), figure.index));
      if (!target && isDefaultThreshold(figure) && UNKNOWN_CUE.test(clause)) target = true;
      targets[i] = target;
      if (window || prohibited) continue;
      found.unshift({ figure, target, words });
    }
    claims.push(...found);
  }
  return claims;
}

function pageKey(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\.md$/i, "").replace(/\/+$/, "");
    return `${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return url.toLowerCase();
  }
}

function citedUrls(raw: string): string[] {
  const urls = [...raw.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]!);
  urls.push(...(raw.match(/https?:\/\/[^\s)\]>]+/g) ?? []));
  return urls;
}

interface Evidence {
  text: string;
  figures: Figure[];
  pages: Map<string, Figure[]>;
}

function gatherEvidence(pages: FetchedPage[]): Evidence {
  const joined = pages.map((p) => p.content).join("\n").toLowerCase();
  const byPage = new Map<string, Figure[]>();
  for (const page of pages) {
    const key = pageKey(page.url);
    byPage.set(key, [...(byPage.get(key) ?? []), ...figuresIn(page.content.toLowerCase())]);
  }
  return { text: joined, figures: figuresIn(joined), pages: byPage };
}

type Verdict = "supported" | "absent" | "untied" | "invented-target";

function judge(claim: Claim, evidence: Evidence, cited: string[], vocabulary: Set<string>): Verdict {
  const found = matching(claim.figure, evidence.figures);
  if (claim.target) {
    return isDefaultThreshold(claim.figure) || found.length > 0 ? "supported" : "invented-target";
  }
  if (found.length === 0) return "absent";
  // A citation the model gives, resolving to a fetched page that states it.
  for (const url of cited) {
    const pageFigures = evidence.pages.get(pageKey(url));
    if (pageFigures && matching(claim.figure, pageFigures).length > 0) return "supported";
  }
  const context = new Set([...claim.words, ...vocabulary]);
  if (context.size === 0) return "supported";
  const tied = found.some((f) => [...contentWords(windowAround(evidence.text, f))].some((w) => context.has(w)));
  return tied ? "supported" : "untied";
}

const REASON: Record<Exclude<Verdict, "supported">, string> = {
  absent: "does not appear in the fetched pages",
  untied:
    "appears in the fetched pages, but not next to words that describe this metric, and no cited page states it " +
    "(write unknown, or cite the page that states it)",
  "invented-target":
    "is a proposed target that neither the pages nor the spec's default gates state (use a placeholder such as <N minutes>)",
};

// Sections that legitimately hold numbers we didn't read: links, and the
// questions we're asking the reader. Funnel health is checked cell by cell.
const SKIPPED_SECTIONS = new Set(["docs map", "open questions", "funnel health"]);

// Names that contain digits but aren't figures.
const NAMED_TOKENS = /\b(?:SOC ?2|ISO ?\d+|OAuth ?2(?:\.\d)?|HTTP\/?\d(?:\.\d)?|ICP ?\d+|H\d|P\d|[A-Za-z]+\d+[A-Za-z]*)\b/g;

/** Strips what is not a claim: link targets, source citations, list
 * numbering, named standards. */
function claimText(raw: string): string {
  return raw
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/\(\s*(?:sources?|see|via)\b[^)]*\)/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s*(?:\d+\.|[-*])\s+/, "")
    .replace(/^#+\s.*$/, "")
    .replace(NAMED_TOKENS, "");
}

/** Lines from the body that make claims, with the raw line kept for its
 * citations. Targets are no longer skipped: they are judged per figure. */
function claimLines(markdown: string): { raw: string; text: string }[] {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines: { raw: string; text: string }[] = [];
  let section = "";
  for (const raw of body.split("\n")) {
    const heading = raw.match(/^## (.+)$/);
    if (heading) {
      section = (heading[1] ?? "").trim().toLowerCase();
      continue;
    }
    if (SKIPPED_SECTIONS.has(section)) continue;
    lines.push({ raw, text: claimText(raw) });
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

/** Problems for every figure the draft states without support. */
export function groundingProblems(markdown: string, pages: FetchedPage[]): string[] {
  const evidence = gatherEvidence(pages);
  const problems: string[] = [];

  const estimate = markdown.match(new RegExp(`.{0,40}${ESTIMATE.source}.{0,20}`, "i"));
  if (estimate) problems.push(`Estimated figure presented as data: "${estimate[0].trim()}"`);

  for (const { raw, text } of claimLines(markdown)) {
    const cited = citedUrls(raw);
    for (const claim of claimsIn(text)) {
      const verdict = judge(claim, evidence, cited, new Set());
      if (verdict !== "supported") {
        problems.push(`"${claim.figure.label}" in "${text.trim().slice(0, 80)}" ${REASON[verdict]}`);
      }
    }
  }

  // Only the Now cell is a current value. The Gate cell holds the spec's
  // thresholds and is never evidence about the product.
  for (const row of funnelRows(markdown)) {
    const cited = citedUrls(`${row.now} ${row.gate}`);
    const vocabulary = STAGE_VOCABULARY[row.stage.toLowerCase()] ?? new Set<string>();
    for (const claim of claimsIn(claimText(row.now))) {
      const verdict = judge(claim, evidence, cited, vocabulary);
      if (verdict !== "supported") problems.push(`${row.stage}: "${claim.figure.label}" ${REASON[verdict]}`);
    }
  }
  return problems;
}
