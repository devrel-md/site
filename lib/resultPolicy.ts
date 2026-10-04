// The indexing and provenance policy for generated result pages, as pure
// functions so the route, the generator and the admin script share one
// definition. See docs/result-pages.md.
import { escapeHtml } from "@/lib/html";
import type { FunnelGate } from "@/lib/results";

export const REMOVAL_EMAIL = "hello@devrel.md";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The key a host is stored and matched under: lower case, no leading "www.".
 * Accepts a full URL or a bare host name. Returns "" when it is neither. */
export function hostKey(urlOrHost: string): string {
  const raw = urlOrHost.trim();
  let hostname: string;
  try {
    hostname = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    return "";
  }
  return hostname.toLowerCase().replace(/^www\./, "");
}

function saysNothing(now: string): boolean {
  const value = now.trim();
  return !value || /^unknown\.?$/i.test(value) || /^not stated in public docs\.?$/i.test(value);
}

/** A sourced fact is a gate the pages let us judge (yes or no) with something
 * written in its Now cell. A file where every gate is "unknown" says nothing
 * a reader could not already see, and is not worth indexing. */
export function hasSourcedFact(gates: FunnelGate[]): boolean {
  return gates.some((g) => (g.pass === "yes" || g.pass === "no") && !saysNothing(g.now));
}

/** Indexable only when the validator and the grounding check flagged nothing and
 * the file states at least one sourced fact. */
export function isIndexable(params: {
  validatorProblems: string[];
  groundingProblems: string[];
  gates: FunnelGate[];
}): boolean {
  return (
    params.validatorProblems.length === 0 &&
    params.groundingProblems.length === 0 &&
    hasSourcedFact(params.gates)
  );
}

/** A result page is indexed only when it passed the quality bar, nobody has asked for it
 * to be left out, and its row says so. */
export function shouldIndex(result: { indexable?: boolean; excluded_at?: unknown }): boolean {
  return result.indexable === true && !result.excluded_at;
}

function formatDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The provenance sentence, in plain text. */
export function provenanceText(result: {
  created_at?: unknown;
  host?: string | null;
  url?: string;
  pages_read?: number | null;
}): string {
  const date = formatDate(result.created_at);
  const host = result.host || hostKey(result.url ?? "") || "the site";
  const pages =
    typeof result.pages_read === "number" && result.pages_read > 0
      ? `${result.pages_read} public ${result.pages_read === 1 ? "page" : "pages"}`
      : "public pages";
  return (
    `Automated draft generated${date ? ` on ${date}` : ""} from ${pages} of ${host}. ` +
    `It is a starting point, not an audit. To correct or remove it, email ${REMOVAL_EMAIL}.`
  );
}

/** The provenance block shown above the file on a result page. */
export function provenanceHtml(result: Parameters<typeof provenanceText>[0]): string {
  const text = escapeHtml(provenanceText(result));
  const linked = text.replace(REMOVAL_EMAIL, `<a href="mailto:${REMOVAL_EMAIL}">${REMOVAL_EMAIL}</a>`);
  return `<p class="provenance">${linked}</p>`;
}

export const EXCLUDED_NOTE = "The site owner has asked for this not to be indexed.";

/** One line above the file when the result is excluded. */
export function excludedHtml(): string {
  return `<p class="provenance excluded-note">${EXCLUDED_NOTE}</p>`;
}

/** The "this company has its own file" line, linking to it. */
export function ownFileHtml(url: string): string {
  return `<p class="provenance own-file">This company publishes its own DEVREL.md: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
}

const GENERATOR_COMMENT = "<!-- Generated with devrel.md -->";

/** The Markdown view of a result: the stored file with the provenance as an HTML comment
 * placed before the trailing generator comment, so that comment stays the last line. The
 * download is never passed through here. */
export function withProvenanceComment(markdown: string, text: string): string {
  const comment = `<!-- ${text} -->`;
  const trimmed = markdown.replace(/\s+$/, "");
  const lastBreak = trimmed.lastIndexOf("\n");
  const lastLine = trimmed.slice(lastBreak + 1);
  if (lastLine.trim() === GENERATOR_COMMENT) {
    return `${trimmed.slice(0, lastBreak + 1)}${comment}\n${lastLine}\n`;
  }
  return `${trimmed}\n\n${comment}\n`;
}
