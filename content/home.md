# DEVREL.md

## Your agents keep writing docs for the wrong developer.

A README for your developer funnel. DEVREL.md is a simple, open format that tells people and AI agents who your developers are, what their first success looks like, and where they get stuck.

> **If you are an AI agent:** the full specification is at https://devrel.md/spec.md. Read it, then follow its "If you are an AI agent" section to create or update a DEVREL.md.

```text
Read https://devrel.md and create a DEVREL.md for this repo.
```

Paste that into Claude Code, Cursor, Codex or any agent that can fetch a URL. That's the whole install. Or [generate one from your docs](/generate) in about a minute. New here? Follow the [quickstart](/quickstart).

## Why DEVREL.md?

README.md is for developers using your code. AGENTS.md is for agents working on your code. Neither says who your developer customers are.

So every time you ask an agent for a quickstart, a launch post or a docs page, it guesses. Who is this for? What does success look like in the first five minutes? Which part of the journey is already broken? It gets a slightly different answer each time, and usually a generic one.

DEVREL.md writes the answers down once:

- **Your developers.** Who they are, what they're trying to do, and who you're deliberately not serving.
- **Their first success.** Your time to Hello World today, and what real adoption looks like.
- **Where it breaks.** Five stage gates, from awareness to monetisation, each marked pass, fail or unknown.

## What it looks like

```markdown
---
spec: devrel.md/0.1
product: Acme Vector
stage: growth
updated: 2026-09-28
---
# DEVREL.md

## Value proposition
Add semantic search to an existing Postgres app in one afternoon,
without running a separate vector cluster.

## ICPs
### Platform teams at Series A to C SaaS companies
- Context: Python or TypeScript, Postgres on AWS, 5 to 30 engineers
- Activation event: first production query from an existing table

## North Star
Time to Hello World: 22 min today, 5 min target

## Funnel health
| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Onboarding | First call in under 5 min, over 80% success | 22 min, 64% | no |
```

A fictional product. See the [full example](/example) or start from the [blank template](/template).

## Same agent, different answer

Asked to "write the opening of our quickstart":

**Without DEVREL.md**

> Welcome to Acme Vector! Acme Vector is a powerful, AI-native vector database built for modern teams. In this guide, you'll learn about our features and how to get started with our platform.

**With DEVREL.md**

> Add semantic search to the Postgres app you already run. In about five minutes you'll run your first query against one of your own tables. You need Postgres 14 or later and Node 18.

The second one knows who's reading, what they already have, and what "done" means. That's the whole point.

## How to use DEVREL.md

1. **Create it.** Paste the prompt above into your agent, [use the generator](/generate), or run the `devrel-md-init` skill.
2. **Fill the unknowns.** `unknown` is a perfectly good answer. The unknowns are where the work is.
3. **Commit it.** Put `DEVREL.md` at the root of your repo, next to `README.md` and `AGENTS.md`.
4. **Put it to work.** Agents that read your repo pick it up. The [free skills](/skills) read it before they do anything.

## Works with

Any agent that reads your repository or can fetch a URL, including Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI and Windsurf. There's nothing to install.

The [devrel.md skills](/skills) read it automatically: quickstart friction checks, agent-readiness scores, launch plans, 90-day plans and more. They also read `.agents/product-marketing-context.md` if you already use Corey Haines' marketing skills.

## Common mistakes

- **Adjectives instead of numbers.** "Onboarding is fast" tells an agent nothing. "22 minutes median, measured in PostHog" does.
- **Inventing metrics.** A guess dressed up as a number is worse than `unknown`.
- **Passing a gate on reputation.** Logos and testimonials aren't evidence that onboarding works.
- **Marketing copy in the value proposition.** "The AI-native platform for modern teams" fails the test. A developer should know in one read whether it applies to them.
- **Writing it once and forgetting it.** Update it when a number moves, and bump `updated`.

## FAQ

### How is this different from README.md, AGENTS.md and llms.txt?

README.md explains your project to developers. AGENTS.md tells coding agents how to work on your code. llms.txt helps agents find their way around your website. DEVREL.md describes your developer audience and funnel, so agents doing developer relations work start from the same facts. Use all of them.

### We don't know our numbers. Should we still write one?

Yes. Write `unknown`. A file full of honest unknowns shows you exactly what to measure first.

### Should DEVREL.md be public?

Only put in it what you'd be happy to publish. Public repos get the most from it. Private repos work just as well.

### Do I need the skills?

No. DEVREL.md is useful on its own to any agent. The skills just put it to work faster.

### Does it cost anything?

No. The format is open under CC BY 4.0, the skills are MIT, and the generator is free.

### Can I change the stage gates?

Yes. The defaults come from the book. Change a threshold if you have a reason, and say why in the row.

### Where does it go in a monorepo?

One DEVREL.md per developer product, in that product's folder. The nearest file to the work wins, the same way AGENTS.md works.

### Who maintains it?

Created and maintained by Marcos Placona at [DevRel Bridge](https://devrelbridge.com). The funnel stages, stage gates and benchmarks come from [*How to Build Developer Ecosystems*](https://devrelbridge.com/book) by Amir Shevat and Marcos Placona. [Read the full specification](/spec).
