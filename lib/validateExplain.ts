// Turns validator.ts's terse, machine-oriented problem strings into a plain
// one-line fix, for the human-facing /validate page and the JSON API.

export function explainProblem(problem: string): string {
  if (problem === "no frontmatter") {
    return "Add YAML frontmatter at the very top of the file: a --- line, the fields, then another --- line.";
  }
  if (problem === "wrapped in code fence") {
    return "Remove the ``` fence around the file. Output the DEVREL.md content itself, not a fenced block containing it.";
  }
  if (problem === "required sections out of order") {
    return "Put the required sections in spec order: Product, Value proposition, ICPs, Anti-personas, North Star, Activation, Funnel health.";
  }

  let match = problem.match(/^frontmatter missing (\w+)$/);
  if (match) return `Add "${match[1]}:" to the frontmatter. It is a required field.`;

  if (problem.startsWith("bad stage ")) {
    return "Set \"stage:\" to exactly one of pre-launch, early, growth, scale, enterprise or unknown. Nothing else on that line, not even a comment.";
  }

  match = problem.match(/^missing section (.+)$/);
  if (match) return `Add a "## ${match[1]}" section.`;

  match = problem.match(/^funnel row (\w+) missing$/);
  if (match) return `Add a Funnel health table row for ${match[1]}.`;

  match = problem.match(/^funnel (\w+) pass=/);
  if (match) {
    return `Set the ${match[1]} row's Pass cell to exactly yes, no, unknown or n/a. Nothing else in that cell.`;
  }

  match = problem.match(/^length (\d+) lines$/);
  if (match) {
    const lines = Number(match[1]);
    return lines < 40
      ? "Add more detail: a valid file is at least 40 lines."
      : "Trim it down: a valid file is 400 lines or fewer. Link out to detail instead of pasting it in.";
  }

  return "See the spec (/spec) for the exact requirement.";
}

export interface ValidationProblem {
  problem: string;
  fix: string;
}
