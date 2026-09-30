import type { FunnelGate } from "@/lib/results";

const STAGES = ["Awareness", "Onboarding", "Activation", "Engagement", "Monetization"];

/** Extracts the five Funnel health rows from a generated DEVREL.md, for the
 * stage gates summary on the result page. Assumes the file already passed
 * validate(), so the table is well-formed. */
export function extractFunnelGates(markdown: string): FunnelGate[] {
  const headingMatch = markdown.match(/^## Funnel health\s*$/m);
  if (!headingMatch || headingMatch.index === undefined) return [];

  const rest = markdown.slice(headingMatch.index);
  const nextHeading = rest.slice(1).search(/^## /m);
  const block = nextHeading === -1 ? rest : rest.slice(0, nextHeading + 1);

  const gates: FunnelGate[] = [];
  for (const stage of STAGES) {
    const rowRe = new RegExp(`^\\|\\s*${stage}\\s*\\|(.*)\\|\\s*(\\S+)\\s*\\|\\s*$`, "m");
    const row = block.match(rowRe);
    if (!row) continue;
    const middle = row[1]!.split("|").map((s) => s.trim());
    const gate = middle[0] ?? "";
    const now = middle[1] ?? "";
    const rawPass = row[2]!.toLowerCase();
    const pass: FunnelGate["pass"] =
      rawPass === "yes" || rawPass === "no" || rawPass === "n/a" ? rawPass : "unknown";
    gates.push({ stage, gate, now, pass });
  }
  return gates;
}

/** The earliest stage (in funnel order) that is failing or unknown, per the
 * spec's rule: don't scale a stage until the one before it passes. */
export function earliestBrokenGate(gates: FunnelGate[]): FunnelGate | null {
  return gates.find((g) => g.pass === "no" || g.pass === "unknown") ?? null;
}

export type NextStep =
  | { kind: "fix"; gate: FunnelGate }
  | { kind: "measure"; gate: FunnelGate }
  | { kind: "maintain" };

/** What to do next. A gate known to fail is fixed first (earliest in the
 * funnel). With no known failure but gates that need data, measure first,
 * starting with Onboarding: time to first call is the book's North Star and
 * the one a team can measure itself this week. */
export function nextStep(gates: FunnelGate[]): NextStep {
  const failing = gates.find((g) => g.pass === "no");
  if (failing) return { kind: "fix", gate: failing };
  const unknown = gates.filter((g) => g.pass === "unknown");
  if (unknown.length > 0) {
    return { kind: "measure", gate: unknown.find((g) => g.stage === "Onboarding") ?? unknown[0]! };
  }
  return { kind: "maintain" };
}
