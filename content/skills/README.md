<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/devrel-md-mark-light.svg">
    <img src="assets/devrel-md-mark-dark.svg" alt="DEVREL.md" width="64" height="64">
  </picture>
</p>

# devrel-skills

Developer relations skills for AI agents, built from the book *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona. They audit quickstarts, check whether agents can use your docs, and write down your developer funnel, so your agent starts from how DevRel actually works rather than guessing.

Every skill reads your [DEVREL.md](https://devrel.md) first, so you only explain your product once.

## Install

No install, any agent that can fetch a URL:

```
Read https://devrel.md and create a DEVREL.md for this repo.
```

Claude Code, Codex, Cursor and others, via [skills.sh](https://skills.sh):

```bash
npx skills add devrel-md/skills
```

Claude Code plugin:

```
/plugin marketplace add devrel-md/skills
/plugin install devrel-skills@devrel-skills
```

Or copy any folder from `skills/` into your agent's skills directory.

## Start here

Run `devrel-md-init` first. It reads your repo and docs, asks only about what it can't find, writes `DEVREL.md`, and tells you which stage of your developer journey to fix first.

## Skills

| Skill | What it does | Book chapters |
| --- | --- | --- |
| [devrel-md-init](skills/devrel-md-init/SKILL.md) | Writes your DEVREL.md and shows which stage gates fail | 1, 2, 8, App A.5, App F |
| [quickstart-friction-check](skills/quickstart-friction-check/SKILL.md) | Walks your quickstart like a new developer and rates every step | 1, 2, 4, App F |
| [agent-readiness-check](skills/agent-readiness-check/SKILL.md) | Scores how well AI agents can discover, read and use your docs | 4, 11, App E |
| [developer-funnel-audit](skills/developer-funnel-audit/SKILL.md) | Maps your programs onto the five funnel stages and tells you which stage to fix first | 1, 2, App F |
| [icp-builder](skills/icp-builder/SKILL.md) | Defines and scores your developer segments with the ICP canvas and fit score | 1, App A.5, App A.6 |
| [devrel-metrics-plan](skills/devrel-metrics-plan/SKILL.md) | Swaps vanity metrics for leading and lagging pairs, specs a dashboard and the events behind it | 1, 8, App F, App I |
| [devrel-launch-plan](skills/devrel-launch-plan/SKILL.md) | Builds a channel-by-channel launch plan, after checking onboarding is ready for the traffic | 2, 3, 8 |
| [devrel-90-day-plan](skills/devrel-90-day-plan/SKILL.md) | Plans your next 90 days week by week, with exit criteria, to grow or to prove DevRel's value | 9, App A, App G |

More skills ship weekly. Watch the repo or see the [changelog](CHANGELOG.md).

## Works alongside marketingskills

If you use Corey Haines' [marketingskills](https://github.com/coreyhaines31/marketingskills), these skills also read your `.agents/product-marketing-context.md`. Your agent already knows your product.

## What these skills don't do

They don't send data anywhere, don't need an account or an email, and never log in to anything. Every skill works fully on its own.

## Credits and help

Frameworks from [*How to Build Developer Ecosystems*](https://devrel.md/go/book?m=github&c=skills-readme) by Amir Shevat and Marcos Placona. Maintained by Marcos Placona at [DevRel Bridge](https://devrelbridge.com). If you want a team to find and fix where your developer journey breaks, that's what we do.

Contributions welcome: every new skill must be based on a named chapter of the book, or clearly marked as a community pattern with its own source. Small corrections can go straight to a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
