import { escapeHtml } from "@/lib/html";
import { ROLES, TEAM_SIZES } from "@/lib/qualify";
import { earliestBrokenGate } from "@/lib/funnelGates";
import type { FunnelGate } from "@/lib/results";

const SKILL_FOR_STAGE: Record<string, { slug: string; note: string }> = {
  Awareness: { slug: "developer-funnel-audit", note: "map the whole funnel before spending more on awareness" },
  Onboarding: { slug: "quickstart-friction-check", note: "walk the quickstart like a new developer" },
  Activation: { slug: "developer-funnel-audit", note: "define the activation event before measuring it" },
  Engagement: { slug: "devrel-metrics-plan", note: "find out who actually answers questions today" },
  Monetization: { slug: "devrel-metrics-plan", note: "pair paying with a trust signal, not just a price" },
};

export function stageGatesHtml(gates: FunnelGate[]): string {
  if (gates.length === 0) return "";
  const broken = earliestBrokenGate(gates);

  const rows = gates
    .map((g) => {
      const passClass = g.pass === "yes" ? "pass-yes" : g.pass === "no" ? "pass-no" : "pass-unknown";
      return `<div class="stage-row"><span>${escapeHtml(g.stage)}</span><span class="${passClass}">${escapeHtml(g.pass)}</span></div>`;
    })
    .join("\n");

  const skill = broken ? SKILL_FOR_STAGE[broken.stage] : undefined;
  const nextSkills = skill
    ? `<p><strong>Next skill to run:</strong> <a href="/skills/${skill.slug}">${skill.slug}</a>, to ${escapeHtml(skill.note)}.</p>`
    : `<p>All five stage gates pass. <a href="/skills/devrel-metrics-plan">devrel-metrics-plan</a> keeps them that way.</p>`;

  return `<div class="callout">
<h2 id="stage-gates">Stage gates</h2>
<div class="stage-gates">${rows}</div>
${broken ? `<p><strong>Fix first:</strong> ${escapeHtml(broken.stage)}, the earliest stage that is not passing.</p>` : ""}
${nextSkills}
</div>`;
}

export function rawToggleHtml(markdown: string): string {
  return `<details class="raw-toggle">
<summary>View raw Markdown</summary>
<pre id="raw-markdown">${escapeHtml(markdown)}</pre>
</details>`;
}

export function leadFormHtml(resultId: string): string {
  const roleOptions = ROLES.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("\n");
  const teamOptions = TEAM_SIZES.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("\n");

  return `<div class="callout">
<h2 id="get-the-file">Get the file</h2>
<p>The file above is free to read. Leave a few details to unlock copy and download, and we will also email it to you.</p>
<form class="lead-form" method="post" action="/api/lead">
<input type="hidden" name="resultId" value="${escapeHtml(resultId)}">
<div>
<label for="email">Email</label>
<input id="email" name="email" type="email" required>
</div>
<div>
<label for="company">Company</label>
<input id="company" name="company" type="text" required>
</div>
<div>
<label for="role">Role</label>
<select id="role" name="role" required>
<option value="" disabled selected>Choose one</option>
${roleOptions}
</select>
</div>
<div>
<label for="teamSize">Team size</label>
<select id="teamSize" name="teamSize" required>
<option value="" disabled selected>Choose one</option>
${teamOptions}
</select>
</div>
<div class="checkbox-row">
<input id="seriesOptIn" name="seriesOptIn" type="checkbox">
<label for="seriesOptIn">Send me the 5-email series on fixing my failing stage gates</label>
</div>
<button class="primary" type="submit">Unlock copy and download</button>
</form>
</div>`;
}

export function unlockedPanelHtml(resultId: string, qualified: boolean, leadToken: string): string {
  const handoff = qualified
    ? `<p>Want someone to find and fix the break with you? <a href="/go/audit?m=generator&c=result&t=${escapeHtml(leadToken)}">Book a 20-minute review of this file</a>.</p>`
    : `<p>Want the fuller picture? <a href="/go/book?m=generator&c=result&t=${escapeHtml(leadToken)}">Read the book</a>, or run the next skill above yourself.</p>`;

  return `<div class="callout">
<h2 id="unlocked">Copy and download</h2>
<button class="primary" type="button" id="copy-markdown" data-target="raw-markdown">Copy Markdown</button>
<a class="primary" style="display:inline-block;margin-left:0.5rem;text-decoration:none" href="/r/${escapeHtml(resultId)}.md?download=1" download="DEVREL.md">Download DEVREL.md</a>
${handoff}
</div>
<script>
(function(){
  var btn = document.getElementById('copy-markdown');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var target = document.getElementById(btn.getAttribute('data-target'));
    if (!target) return;
    navigator.clipboard.writeText(target.textContent || '').then(function () {
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = 'Copy Markdown'; }, 2000);
    });
  });
})();
</script>`;
}
