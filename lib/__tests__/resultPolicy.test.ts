import { describe, it, expect } from "vitest";
import {
  hostKey,
  hasSourcedFact,
  isIndexable,
  shouldIndex,
  provenanceText,
  provenanceHtml,
  withProvenanceComment,
} from "@/lib/resultPolicy";
import type { FunnelGate } from "@/lib/results";

const gate = (pass: FunnelGate["pass"], now = "Quickstart takes 5 minutes"): FunnelGate => ({
  stage: "Onboarding",
  gate: "Time to first call under 15 minutes",
  now,
  pass,
});

describe("hostKey", () => {
  it("lower-cases and drops a leading www", () => {
    expect(hostKey("https://WWW.Example.com/docs?x=1")).toBe("example.com");
    expect(hostKey("Docs.Example.com")).toBe("docs.example.com");
  });

  it("returns an empty key for something that is not a host", () => {
    expect(hostKey("not a url")).toBe("");
    expect(hostKey("")).toBe("");
  });
});

describe("indexing decision", () => {
  it("is indexable with no problems and at least one sourced fact", () => {
    expect(isIndexable({ validatorProblems: [], groundingProblems: [], gates: [gate("unknown", "unknown"), gate("yes")] })).toBe(true);
  });

  it("is not indexable when every gate is unknown", () => {
    const gates = [gate("unknown", "unknown"), gate("unknown", "Not stated in public docs")];
    expect(hasSourcedFact(gates)).toBe(false);
    expect(isIndexable({ validatorProblems: [], groundingProblems: [], gates })).toBe(false);
  });

  it("does not count a yes or no with nothing written in the Now cell", () => {
    expect(hasSourcedFact([gate("yes", ""), gate("no", "unknown")])).toBe(false);
  });

  it("is not indexable when the validator flagged anything", () => {
    expect(isIndexable({ validatorProblems: ["length 12 lines"], groundingProblems: [], gates: [gate("yes")] })).toBe(false);
  });

  it("is not indexable when the grounding check flagged anything", () => {
    expect(isIndexable({ validatorProblems: [], groundingProblems: ['"8.5k" is not in the pages'], gates: [gate("no")] })).toBe(false);
  });

  it("indexes a row only when it is marked indexable and not excluded", () => {
    expect(shouldIndex({ indexable: true, excluded_at: null })).toBe(true);
    expect(shouldIndex({ indexable: false, excluded_at: null })).toBe(false);
    expect(shouldIndex({ indexable: true, excluded_at: "2026-10-04T10:00:00Z" })).toBe(false);
    // Rows from before the migration carry no flag.
    expect(shouldIndex({})).toBe(false);
  });
});

describe("provenance", () => {
  const result = { created_at: new Date("2026-10-04T21:30:00Z"), host: "acme.dev", pages_read: 4 };

  it("states the date, page count and host, and how to get it corrected or removed", () => {
    expect(provenanceText(result)).toBe(
      "Automated draft generated on 4 October 2026 from 4 public pages of acme.dev. " +
        "It is a starting point, not an audit. To correct or remove it, email hello@devrel.md."
    );
  });

  it("says one page for one page", () => {
    expect(provenanceText({ ...result, pages_read: 1 })).toContain("from 1 public page of acme.dev.");
  });

  it("copes with rows from before the page count was stored", () => {
    const text = provenanceText({ created_at: "2026-09-30T08:00:00Z", host: null, url: "https://www.old.example/docs", pages_read: null });
    expect(text).toContain("on 30 September 2026 from public pages of old.example.");
  });

  it("links the email address and escapes the host", () => {
    const html = provenanceHtml({ ...result, host: "<b>x</b>" });
    expect(html).toContain('<a href="mailto:hello@devrel.md">hello@devrel.md</a>');
    expect(html).not.toContain("<b>");
  });

  it("uses no dashes as punctuation", () => {
    expect(provenanceText(result)).not.toMatch(/[–—]| -- /);
  });
});

describe("withProvenanceComment", () => {
  const text = "Automated draft generated on 4 October 2026 from 4 public pages of acme.dev.";

  it("keeps the generator comment as the last line", () => {
    const out = withProvenanceComment("---\nproduct: A\n---\n\n## Product\nx\n\n<!-- Generated with devrel.md -->\n", text);
    const lines = out.trimEnd().split("\n");
    expect(lines.at(-1)).toBe("<!-- Generated with devrel.md -->");
    expect(lines.at(-2)).toBe(`<!-- ${text} -->`);
    expect(out.startsWith("---\nproduct: A\n---")).toBe(true);
  });

  it("appends the comment when the file has no generator comment", () => {
    const out = withProvenanceComment("---\nproduct: A\n---\n\nbody\n", text);
    expect(out.trimEnd().split("\n").at(-1)).toBe(`<!-- ${text} -->`);
  });
});
