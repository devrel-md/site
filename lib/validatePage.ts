import { escapeHtml } from "@/lib/html";
import type { ValidationResult } from "@/lib/runValidation";
import { stageGatesHtml } from "@/lib/resultPage";

export function validateFormHtml(previousMarkdown = ""): string {
  return `<form class="validate-form" method="post" action="/validate">
<div>
<label for="markdown">Paste your DEVREL.md</label>
<textarea id="markdown" name="markdown" rows="16" required placeholder="---&#10;spec: devrel.md/0.1&#10;product: ...&#10;---" spellcheck="false">${escapeHtml(previousMarkdown)}</textarea>
</div>
<button class="primary" type="submit">Validate</button>
</form>`;
}

export function validateResultsHtml(result: ValidationResult): string {
  const summary = result.valid
    ? `<p class="pass-yes"><strong>Pass.</strong> The structure is valid: frontmatter, required sections, a well-formed Funnel health table and a sensible length. This checks the format only. It has no source pages to compare against, so it cannot tell you whether the content is true.</p>`
    : `<p class="pass-no"><strong>${result.problems.length} ${result.problems.length === 1 ? "problem" : "problems"} found.</strong></p>`;

  const problemList = result.valid
    ? ""
    : `<ul class="problem-list">
${result.problems
  .map(
    (p) => `<li><span class="pass-no">${escapeHtml(p.problem)}</span><p>${escapeHtml(p.fix)}</p></li>`
  )
  .join("\n")}
</ul>`;

  const gates = result.gates.length > 0 ? stageGatesHtml(result.gates, "pasted") : "";

  return `<div class="callout" id="results">
<h2 id="results-heading">Results</h2>
${summary}
${problemList}
</div>
${gates}`;
}
