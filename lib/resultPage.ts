import { escapeHtml } from "@/lib/html";
import { nextStep } from "@/lib/funnelGates";
import type { FunnelGate } from "@/lib/results";

const SKILL_FOR_STAGE: Record<string, { slug: string; note: string }> = {
  Awareness: { slug: "developer-funnel-audit", note: "map the whole funnel before spending more on awareness" },
  Onboarding: { slug: "quickstart-friction-check", note: "walk the quickstart like a new developer" },
  Activation: { slug: "developer-funnel-audit", note: "define the activation event before measuring it" },
  Engagement: { slug: "devrel-metrics-plan", note: "find out who actually answers questions today" },
  Monetization: { slug: "devrel-metrics-plan", note: "pair paying with a trust signal, not just a price" },
};

// What a team measures to judge each gate. Only the team has these numbers,
// which is why a gate read from public pages is usually "needs your data".
const MEASURE_FOR_STAGE: Record<string, string> = {
  Awareness: "where your signups come from, and which sources go on to activate",
  Onboarding: "the median time from signup to a first successful call, and the share of new developers who get there",
  Activation: "the share of signups who reach your activation event, and whether production usage is visible",
  Engagement: "the share of community questions answered within 24 hours, and who answers them",
  Monetization: "whether paying customers stay as engaged and trusting as they were before paying",
};

const STATUS: Record<FunnelGate["pass"], { label: string; className: string }> = {
  yes: { label: "Passing", className: "pass-yes" },
  no: { label: "Failing", className: "pass-no" },
  unknown: { label: "Needs your data", className: "pass-unknown" },
  "n/a": { label: "Not applicable yet", className: "pass-na" },
};

function saysNothing(now: string): boolean {
  return !now.trim() || /^unknown\.?$/i.test(now.trim()) || /^not stated in public docs\.?$/i.test(now.trim());
}

function headline(gates: FunnelGate[]): string {
  const judged = gates.filter((g) => g.pass === "yes" || g.pass === "no").length;
  const needData = gates.filter((g) => g.pass === "unknown").length;
  if (needData === 0) {
    return `All ${gates.length} stage gates could be judged from what we read.`;
  }
  if (judged === 0) {
    return (
      `We read your public pages and wrote down what they say. None of the ${gates.length} stage gates can be judged ` +
      "from outside, and that's normal: each one needs a number only your team has, such as time to first call " +
      "or activation rate. The file is a starting point, not a verdict."
    );
  }
  return (
    `${judged} of ${gates.length} stage gates could be judged from your public pages. ` +
    `The other ${needData} need a number only your team has.`
  );
}

export function stageGatesHtml(gates: FunnelGate[]): string {
  if (gates.length === 0) return "";

  const cards = gates
    .map((g) => {
      const status = STATUS[g.pass];
      const found = saysNothing(g.now)
        ? "<p class=\"gate-found gate-empty\">Your public pages don't say.</p>"
        : `<p class="gate-found"><strong>What we found:</strong> ${escapeHtml(g.now)}</p>`;
      const measure =
        g.pass === "unknown" && MEASURE_FOR_STAGE[g.stage]
          ? `<p class="gate-measure"><strong>To judge it, measure</strong> ${escapeHtml(MEASURE_FOR_STAGE[g.stage]!)}.</p>`
          : "";
      return `<div class="gate-card">
<div class="gate-head"><h3>${escapeHtml(g.stage)}</h3><span class="gate-status ${status.className}">${status.label}</span></div>
<p class="gate-rule">Gate: ${escapeHtml(g.gate)}</p>
${found}
${measure}
</div>`;
    })
    .join("\n");

  const step = nextStep(gates);
  let next: string;
  if (step.kind === "fix") {
    const skill = SKILL_FOR_STAGE[step.gate.stage];
    next =
      `<p><strong>Fix first: ${escapeHtml(step.gate.stage)}.</strong> It's the earliest stage we know is failing, ` +
      "and later stages can't do better than it.</p>" +
      (skill
        ? `<p><strong>Next skill to run:</strong> <a href="/skills/${skill.slug}">${skill.slug}</a>, to ${escapeHtml(skill.note)}.</p>`
        : "");
  } else if (step.kind === "measure") {
    const onboarding = step.gate.stage === "Onboarding";
    next =
      `<p><strong>Measure first: ${escapeHtml(step.gate.stage)}.</strong> ` +
      (onboarding
        ? "Time to first call is the North Star in <em>How to Build Developer Ecosystems</em>, and it's the one gate you can measure yourself this week: time a new developer through your quickstart.</p>" +
          '<p><strong>Next skills to run:</strong> <a href="/skills/quickstart-friction-check">quickstart-friction-check</a> to walk your quickstart like a new developer, then <a href="/skills/devrel-metrics-plan">devrel-metrics-plan</a> to start tracking all five gates.</p>'
        : `Measure ${escapeHtml(MEASURE_FOR_STAGE[step.gate.stage] ?? "it")}.</p>` +
          '<p><strong>Next skill to run:</strong> <a href="/skills/devrel-metrics-plan">devrel-metrics-plan</a>, to start tracking all five gates.</p>');
  } else {
    next = `<p>All five stage gates pass. <a href="/skills/devrel-metrics-plan">devrel-metrics-plan</a> keeps them that way.</p>`;
  }

  return `<div class="callout">
<h2 id="stage-gates">Stage gates</h2>
<p class="gates-headline">${escapeHtml(headline(gates))}</p>
<div class="gate-cards">${cards}</div>
${next}
</div>`;
}

export function rawToggleHtml(markdown: string): string {
  return `<details class="raw-toggle">
<summary>View raw Markdown</summary>
<pre id="raw-markdown">${escapeHtml(markdown)}</pre>
</details>`;
}

export function communityFormHtml(): string {
  return `<div class="callout">
<h2 id="community-updates">Community updates</h2>
<p>Want occasional news about DEVREL.md, new skills and ways to contribute? Joining is optional and separate from your file.</p>
<form class="lead-form" method="post" action="/api/community">
<div>
<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email" required>
</div>
<div class="checkbox-row">
<input id="communityConsent" name="communityConsent" type="checkbox" required>
<label for="communityConsent">Yes, email me occasional DEVREL.md community updates. I can unsubscribe any time.</label>
</div>
<button class="primary" type="submit">Join community updates</button>
</form>
</div>`;
}

export function fileActionsHtml(resultId: string): string {
  return `<div class="callout">
<h2 id="get-the-file">Copy and download</h2>
<p>Your file is free to read, copy and download. No email is needed.</p>
<button class="primary" type="button" id="copy-markdown" data-target="raw-markdown">Copy Markdown</button>
<a class="primary" style="display:inline-block;margin-left:0.5rem;text-decoration:none" href="/r/${escapeHtml(resultId)}.md?download=1" download="DEVREL.md">Download DEVREL.md</a>
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
    }, function () { btn.textContent = 'Select the raw Markdown above to copy it'; });
  });
})();
</script>`;
}
