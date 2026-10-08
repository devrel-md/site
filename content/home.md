# DEVREL.md

## Your agents keep writing docs for the wrong developer.

Think of DEVREL.md as a README for your developer funnel: one simple, open file that tells people and AI agents who your developers are, what their first success looks like, and where they get stuck.

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

An excerpt from the DEVREL.md of Acme Vector, a fictional product. The [complete example](/example) has every required section.

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

Prefer a blank page? Start from the [template](/template).

## Same agent, different answer

Asked to "write the opening of our quickstart":

**Without DEVREL.md**

> Welcome to Acme Vector! Acme Vector is a powerful, AI-native vector database built for modern teams. In this guide, you'll learn about our features and how to get started with our platform.

**With DEVREL.md**

> Add semantic search to the Postgres app you already run, without a separate vector cluster. You'll load a sample table and get ranked results from your first similarity query. Today that takes about 22 minutes. You need an existing Postgres database and a Python or TypeScript project.

The second one knows who's reading, what they already have, and what "done" means. Everything in it comes from the [example file](/example): it quotes the measured 22 minutes rather than the 5-minute target, and it doesn't invent version requirements the file doesn't state.

## How to use DEVREL.md

1. **Create it.** Paste the prompt above into your agent, [use the generator](/generate), or run the `devrel-md-init` skill.
2. **Fill the unknowns.** `unknown` is a perfectly good answer. The unknowns are where the work is.
3. **Commit it.** Put `DEVREL.md` at the root of your repo, next to `README.md` and `AGENTS.md`.
4. **Tell your agents to read it.** Naming a file DEVREL.md doesn't make an agent open it. Add the instruction below to the file your agent already reads. The [free skills](/skills) look for it on their own.

## Tell your agents to read it

Most agents read an instruction file at the start of every session, such as `AGENTS.md` or `CLAUDE.md`. Add this to it:

```markdown
## Developer relations

Before any developer relations work (docs, quickstarts, tutorials,
launch posts, developer marketing), read [DEVREL.md](DEVREL.md).
It says who our developers are, what their first success looks like
and which stage gates are failing. Treat its numbers as the source
of truth. Where it says `unknown`, don't invent a figure.
```

In Claude Code, `CLAUDE.md` can also import the file with a line containing `@DEVREL.md`. If your agent has no instruction file, start the request with "Read DEVREL.md first."

## Works with

DEVREL.md is plain Markdown, so it works with any agent that can read a file in your repository or fetch a URL, including Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI and Windsurf. There's nothing to install.

Working with an agent isn't the same as being found by it. General-purpose agents read DEVREL.md when you ask them to or when their instruction file points to it, so add the [instruction above](#tell-your-agents-to-read-it).

The [devrel.md skills](/skills) look for it automatically: every skill checks for `DEVREL.md`, then `docs/DEVREL.md`, then `.github/DEVREL.md` before asking you anything. They cover quickstart friction checks, agent-readiness scores, launch plans, 90-day plans and more. If you already use Corey Haines' [marketing skills](https://github.com/coreyhaines31/marketingskills), the devrel.md skills also reuse your `.agents/product-marketing-context.md` for product and audience basics.

## Common mistakes

- **Adjectives instead of numbers.** "Onboarding is fast" tells an agent nothing. "22 minutes median, measured in PostHog" does.
- **Inventing metrics.** A guess dressed up as a number is worse than `unknown`.
- **Passing a gate on reputation.** Logos and testimonials aren't evidence that onboarding works.
- **Marketing copy in the value proposition.** "The AI-native platform for modern teams" fails the test. A developer should know in one read whether it applies to them.
- **Writing it once and forgetting it.** Update it when a number moves, and bump `updated`.

## The framework behind it

DEVREL.md didn't come from nowhere. Its five funnel stages, the stage gates, the ICP fit score and the benchmarks come from [*How to Build Developer Ecosystems*](/go/book?c=home) by Amir Shevat and Marcos Placona, a practical framework for developer-led growth drawn from building developer programmes at companies like Slack, Twitter, Google, Microsoft and Twilio.

The book explains the thinking: why time to Hello World is the North Star, why activation isn't the same as integration, and why you shouldn't scale a stage until the one before it works. DEVREL.md turns that thinking into a file your agents can use. [About the book](/go/book?c=home).

## Contribute

DEVREL.md is a draft, and real files make it better. Small fixes, such as a typo, a broken link or a wrong example, can go straight to a pull request. For anything bigger, open an issue first:

- **The format, template and example:** [devrel-md/spec](https://github.com/devrel-md/spec)
- **The skills:** [devrel-md/skills](https://github.com/devrel-md/skills)

The [contribution guide](https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md) explains how to report a problem or propose a change or a skill, how decisions are made, and how contributors are credited.

DEVREL.md was created and is maintained by Marcos Placona at [DevRel Bridge](https://devrelbridge.com). Its frameworks come from the book by Amir Shevat and Marcos Placona. It takes its inspiration from [AGENTS.md](https://agents.md), and the skills are designed to work alongside Corey Haines' [marketing skills](https://github.com/coreyhaines31/marketingskills). Both are independent projects: linking to them doesn't mean their authors endorse DEVREL.md.

## FAQ

### How is this different from README.md, AGENTS.md and llms.txt?

README.md explains your project to developers. AGENTS.md tells coding agents how to work on your code. llms.txt helps agents find their way around your website. DEVREL.md describes your developer audience and funnel, so agents doing developer relations work start from the same facts. Use all of them.

### We don't know our numbers. Should we still write one?

Yes. Write `unknown`. A file full of honest unknowns shows you exactly what to measure first.

### Should DEVREL.md be public?

Only put in it what you'd be happy to publish. Public repos get the most from it. Private repos work just as well.

### Do I need the skills?

No. DEVREL.md is useful on its own to any agent you point at it. The skills just put it to work faster, and they find it without being told.

### Does it cost anything?

No. The format is open under CC BY 4.0, the skills are MIT, and the generator is free.

### Can I change the stage gates?

Yes. The defaults come from the book. Change a threshold if you have a reason, and say why in the row.

### Where does it go in a monorepo?

One DEVREL.md per developer product, in that product's folder. The nearest file to the work wins, the same way AGENTS.md works.

### Who maintains it?

Created and maintained by Marcos Placona at [DevRel Bridge](https://devrelbridge.com). The funnel stages, stage gates and benchmarks come from [*How to Build Developer Ecosystems*](/go/book?c=home-faq) by Amir Shevat and Marcos Placona. [Read the full specification](/spec). Marcos Placona maintains it today. Small corrections can go straight to a pull request, and the [contribution guide](https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md) explains how to report problems, propose changes or skills, and how decisions are made.
