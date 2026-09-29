import { validate } from "@/lib/validator";
import { explainProblem, type ValidationProblem } from "@/lib/validateExplain";
import { extractFunnelGates } from "@/lib/funnelGates";
import type { FunnelGate } from "@/lib/results";

export interface ValidationResult {
  valid: boolean;
  problems: ValidationProblem[];
  gates: FunnelGate[];
}

/** The same quality gate the generator uses (lib/validator.ts), with each
 * problem explained. Also returns the stage-gates summary when the file is
 * parseable enough to have one, even if it isn't fully valid. */
export function runValidation(markdown: string): ValidationResult {
  const rawProblems = validate(markdown);
  const problems = rawProblems.map((problem) => ({ problem, fix: explainProblem(problem) }));
  const gates = extractFunnelGates(markdown);
  return { valid: problems.length === 0, problems, gates };
}
