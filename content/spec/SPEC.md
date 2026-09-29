---
spec: devrel.md
version: 0.1.0
status: draft
license: CC BY 4.0
maintainer: Marcos Placona, DevRel Bridge
---

# DEVREL.md

DEVREL.md is a Markdown file at the root of a repository. It tells people and AI agents who a developer product is for, what a developer's first success looks like, and where the developer journey is healthy or broken.

README.md tells a developer how to use a project. AGENTS.md tells a coding agent how to work on it. DEVREL.md tells anyone doing developer relations work (a writer, an advocate, or an agent drafting a quickstart, a launch post or a docs page) what they need to know before they start.

## If you are an AI agent

You were probably asked to "read devrel.md and create a DEVREL.md for this repo". Do this:

1. Read this whole document once.
2. Gather facts from the repository and the product's public pages, in this order: README, docs folder or docs site, package manifests (package.json, pyproject.toml, go.mod and so on), `llms.txt`, the pricing page, existing `.agents/product-marketing-context.md` or `AGENTS.md`.
3. Draft every required section from what you found. Write `unknown` for anything you could not find. Never invent numbers, customers or metrics. Qualitative judgements you reasonably infer (a likely competitor, a probable anti-persona) are allowed if you mark them `(inferred)`. Numbers are never inferred.
4. Ask the user only for what you could not find, in one short batch of questions. The most valuable answers are usually the activation event, the current time to Hello World and the metric baselines. If nobody can answer (an unattended run), skip the questions and list them under Open questions instead.
5. Write the file to `DEVREL.md` at the repository root. If you are not working in a repository, write it to the current directory, or return the file's content, and say which. Start it with the frontmatter in [Frontmatter](#frontmatter).
6. Finish by telling the user which stage gates in [Funnel health](#funnel-health) are failing or unknown. That is the most useful thing the file reveals.

If a DEVREL.md already exists, update it in place. Keep the user's wording, change only what is out of date and bump `updated`.

## File location

Tools that read DEVREL.md look in this order and use the first match:

1. `DEVREL.md` at the repository root
2. `docs/DEVREL.md`
3. `.github/DEVREL.md`

A monorepo with several developer products can put one DEVREL.md in each product's folder. The nearest file to the work being done wins, the same way AGENTS.md works.

If none exists, a tool may fall back to `.agents/product-marketing-context.md` for product and audience basics. That file is not a substitute for the funnel and metric sections.

## Principles

- **Facts over adjectives.** "Median time to first call: 14 minutes (PostHog, Sep 2026)" is useful. "Onboarding is fast" is not.
- **Unknown is a valid answer.** A file full of honest `unknown` values is better than one full of guesses. The unknowns are where the work is.
- **Label what you inferred.** Facts carry their source. A reasonable qualitative inference carries `(inferred)`, and proposed wording carries `(proposed)`. Proposed wording never contains invented numbers: leave a placeholder such as `<N minutes>` for the team to fill.
- **Keep machine-read values bare.** Frontmatter values and the `Pass` column of Funnel health hold only the allowed values. Put an inference label in a YAML comment (`stage: growth # inferred`) or in the Now column, never next to the value.
- **Short enough to read in five minutes.** Aim for under 300 lines. Link out to detail rather than pasting it in.
- **No secrets.** No API keys, internal URLs that expose infrastructure, customer names you have no permission to share, or revenue figures you would not publish.
- **One file, one truth.** Other documents can link to DEVREL.md instead of repeating it.

## Frontmatter

Every DEVREL.md starts with YAML frontmatter:

```yaml
---
spec: devrel.md/0.1        # required, the spec version this file follows
product: Acme Vector       # required, the product name
url: https://acme.dev      # recommended, the product's developer home
stage: growth              # required: pre-launch | early | growth | scale | enterprise | unknown
updated: 2026-09-28        # required, ISO date of the last meaningful edit
owner: devrel@acme.dev     # optional, who keeps this file current
---
```

`stage` describes the company's developer program, not its funding:

| Stage | Roughly |
| --- | --- |
| pre-launch | No public developer path yet |
| early | Under 100 developer signups a month |
| growth | 100 to 500 a month |
| scale | 500 to 2,000 a month |
| enterprise | Over 2,000 a month |
| unknown | Not known yet. Public pages rarely reveal signup volume |

## Required sections

A valid DEVREL.md has these sections, as `##` headings, in this order.

### Product

Two or three sentences: what the product does, for which kind of developer, and the category it competes in. Write it for a developer, not an investor.

### Value proposition

One sentence that pairs the developer's job with a measurable outcome. The test: a developer can tell in one read whether it applies to them.

> Add semantic search to an existing Postgres app in one afternoon, without running a separate vector cluster.

Not: "The AI-native data platform for modern teams."

### ICPs

One `###` block per developer segment, most important first. Each block covers:

- **Technical context:** languages, frameworks, infrastructure
- **Company stage and team size**
- **Use case:** the specific job they are hiring the product for
- **Decision:** who can adopt it alone, and who has to approve it (buyer and champion, where they differ)
- **Activation event:** the action that shows real adoption, with a target time from signup
- **Fit score:** optional, see [ICP fit score](#icp-fit-score)

The litmus test for a segment: you can picture a specific person who matches it. If you can't, it is too broad.

### Anti-personas

Who the product is deliberately not serving right now. This protects focus: it's the list that lets a team say no to content, features and partnerships that would dilute it.

### North Star

The time it takes a new developer to reach their first success, today and as a target. Say how it is measured.

```markdown
- Time to Hello World: 14 min median today, 5 min target
- Measured: signup to first successful API call, PostHog, last 30 days
- First success means: a query returns results from the developer's own table
```

"Hello World" means the first moment a developer thinks "this works and I can see how it solves my problem". It isn't necessarily printing text.

### Activation

What counts as real adoption, as opposed to integration. Integration is wiring the SDK in. Activation is solving a real problem with real data in the developer's own context. State the event, the target time and the current rate if known.

### Funnel health

A table with one row per stage. Each row says whether the stage gate currently passes. This is the most important section in the file.

```markdown
| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | Mostly HN spikes | no |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | 14 min, 71% | no |
| Activation | Activation rate > 20% and production usage measurable | unknown | unknown |
| Engagement | Community answers > 65% of questions within 24h | 40% | no |
| Monetization | Paying deepens trust rather than replacing it | too early | n/a |
```

`Pass` is exactly one of `yes`, `no`, `unknown` or `n/a`, with nothing else in the cell. `yes` needs evidence against the gate's threshold (a measured number, or for Awareness, known signup sources). Reputation, logos or testimonials are not evidence: mark `unknown` and say what you saw in the Now column. The default gates are listed in [Default stage gates](#default-stage-gates). Change a gate's threshold if you have a reason, and say why in the row.

The rule behind the table: don't scale a stage until the one before it passes. Awareness spent on a broken onboarding path is wasted budget.

## Optional sections

Include the ones that apply, after the required sections, in any order.

### Metrics

Leading and lagging indicators per stage, with current values and dates. Every leading metric should have a lagging metric it is meant to move. See [Default metrics](#default-metrics).

### Docs map

Links an agent or a writer needs: quickstart, API reference, use-case guides, SDK repos and supported languages, changelog, status page, `llms.txt`, OpenAPI spec, MCP server.

### Developer archetypes

The intended content balance across four archetypes: **Hacker** (fast prototypes, needs quickstarts and one-click deploys), **Integrator** (fitting into an existing stack, needs reference and migration guides), **Architect** (reliability, scale and security, needs SLAs and security docs) and **Evangelist** (visibility and peer credibility, needs speaking and co-marketing opportunities). A percentage split is enough.

### Community

Live channels (forum, Discord, Slack, GitHub Discussions, office hours), who answers questions today, the answer rate within 24 hours, and whether a champion or ambassador program exists.

### Business model

How developers or their companies pay: free, freemium, usage-based, subscription, enterprise contract or open source with a commercial offering. For open source, say where the product sits: pure open source, open platform, open core or open protocol. Include pricing links, and the point where a developer first meets a paywall.

### Voice and guardrails

Tone, words to use and avoid, claims that must never be made, compliance constraints (SOC 2, HIPAA, GDPR and so on), and anything that must never be generated by AI without human review (security guidance, legal text, incident communication).

### Competitors

Named alternatives, including "build it yourself", with one line each on when a developer would pick them instead.

### Open questions

Things the team knows it doesn't know yet. Tools reading this file should treat these as the most useful places to help.

## Reference

### Default stage gates

The five stages and their default gates. A stage is healthy when its gate passes.

| Stage | Developer's state of mind | Default gate |
| --- | --- | --- |
| Awareness | "I know this exists and roughly what it's for." | Signups arrive from quality sources, not just traffic spikes |
| Onboarding | "I got it working in minutes." | Median time to first call under 5 minutes, and first-call success above 80% |
| Activation | "It solves my real problem with my real data." | Activation rate above 20%, and production usage is measurable |
| Engagement | "I'm part of a community that helps me grow." | The community answers more than 65% of questions, and engagement sustains itself |
| Monetization | "Paying gets me more value, and I feel good about it." | Paying deepens trust rather than replacing it |

A product that never charges developers (a platform ecosystem, a pure open source project) marks Monetization `n/a`.

### Default metrics

Starting points. Replace them with what the team actually tracks.

| Stage | Leading | Lagging | Good / Great / Excellent |
| --- | --- | --- | --- |
| Awareness | Docs or tutorial to quickstart click-through | Branded search, delayed signups | 0.7% / 1.0% / 1.5%+ click-through |
| Onboarding | Quickstart completion, drop-off step | Median time to first call, first-call success | 40% / 60% / 80%+ completion |
| Activation | Share reaching the activation event in 24h | 7-day activation retention, production keys | 15% / 25% / 35%+ in 24h |
| Engagement | Answer rate within 24h, peer response time | Feature breadth per account, community content per month | 50% / 65% / 80%+ answered |
| Monetization | Pricing page visits by activated developers | Trial to paid, expansion, net retention | 8% / 12% / 18%+ trial to paid |

Metrics to replace, because they look good without predicting anything: follower counts (use click-through and activation), total docs views (use completion), event attendance (use first calls after the event), GitHub stars (use active usage and contributors), community member count (use answer rate).

### ICP fit score

Score each segment from 1 to 5 on four factors:

- **Pain:** how much the problem hurts
- **Urgency:** how soon they need it solved
- **Activation ease:** how easily they can succeed with the product as it is today
- **Strategic value:** how much winning this segment matters to the business

`Fit = (Pain × Urgency × Activation ease × Strategic value) / 100`. The maximum is 6.25. Focus on segments at 3.0 or above. If no segment reaches 2.5, or the top segment has an activation ease of 1, fix the product path before investing in developer marketing.

## For tool and skill authors

- Read DEVREL.md before asking the user anything. Ask only for what is missing or specific to the task.
- Treat `unknown` values and failing gates as the priority. Don't produce awareness work for a product whose onboarding gate fails without saying so.
- Never write marketing calls to action into a user's DEVREL.md. The file belongs to the team that commits it.
- A tool that generates the file may add one attribution comment as the last line: `<!-- Generated with devrel.md -->`. Users may remove it.
- Parse the frontmatter with any YAML parser. A JSON Schema is at `schema/frontmatter.schema.json`.

## Versioning

This is version 0.1.0, a draft. Minor versions add optional sections or fields, and existing files stay valid. Major versions may rename or remove required sections, and they come with a migration note. Changes go through an issue first, then a pull request, in the `devrel-md/spec` repository.

## Credits

Created and maintained by Marcos Placona ([DevRel Bridge](https://devrelbridge.com)). The funnel stages, stage gates, ICP canvas and benchmarks come from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona.

This specification is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
