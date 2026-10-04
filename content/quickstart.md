# Quickstart

Create a DEVREL.md for your product in about five minutes, then check it.

## Before you start

You need:

- A repository for your developer product, or its public docs URL
- An AI agent that can read files or fetch a URL, such as Claude Code, Cursor, Codex or GitHub Copilot

No account, no install, no API key.

## 1. Create the file

Open your agent in the repository and paste:

```text
Read https://devrel.md and create a DEVREL.md for this repo.
```

The agent reads the [specification](/spec), gathers facts from your README, docs, package manifests and pricing page, and asks you a short batch of questions about anything it couldn't find. Answering `unknown` is fine.

No repository handy? [Generate one from your docs URL](/generate) instead.

## 2. Check what you got

You should now have a `DEVREL.md` at the root of your repo that starts like this:

```markdown
---
spec: devrel.md/0.1
product: Your Product
stage: growth
updated: 2026-09-29
---

# DEVREL.md

## Product
```

It contains these sections, in this order: Product, Value proposition, ICPs, Anti-personas, North Star, Activation, Funnel health. Your agent should finish by telling you which stage gates are failing or unknown.

## 3. Validate it

Paste the file into the [validator](/validate), or call the API:

```bash
curl -s https://devrel.md/api/validate \
  -H "Content-Type: text/markdown" \
  --data-binary @DEVREL.md
```

A valid file (this is the real response for the [full example](/example)) returns:

```json
{
  "valid": true,
  "problems": [],
  "gates": [
    { "stage": "Awareness", "gate": "Signups come from quality sources, not just traffic", "now": "60% of signups from docs and search, 25% from one launch spike", "pass": "yes" },
    { "stage": "Onboarding", "gate": "Median time to first call < 5 min and first-call success > 80%", "now": "22 min, 64%", "pass": "no" },
    { "stage": "Activation", "gate": "Activation rate > 20% and production usage measurable", "now": "14%, measurable", "pass": "no" },
    { "stage": "Engagement", "gate": "Community answers > 65% of questions within 24h", "now": "unknown", "pass": "unknown" },
    { "stage": "Monetization", "gate": "Paying deepens trust rather than replacing it", "now": "Too early to judge", "pass": "n/a" }
  ]
}
```

`gates` is the parsed Funnel health table: one object per stage, with its gate, the current state and whether it passes. A file with problems returns `"valid": false` and one entry per problem, each with how to fix it.

## 4. Commit it and put it to work

Commit `DEVREL.md` next to `README.md` and `AGENTS.md`. From then on, any agent that reads your repo starts from the same facts, and the [free skills](/skills) read it before they do anything. A good first one is `quickstart-friction-check`, which walks your own quickstart the way a new developer would.

## Testing safely

There is no separate sandbox, test mode or staging environment: the generator you try is the same one everyone uses. You can still experiment without cost or risk.

- **Validate first.** The [validator](/validate) and `POST /api/validate` call no paid model and store nothing, so they are the safe way to check a file as often as you like. Each visitor gets 30 checks a day.
- **Repeat runs are free.** The generator caches each URL for 24 hours, so generating the same URL again returns the cached result instead of running the model again.
- **Daily limits.** Each visitor gets five generations a day, counted per hashed IP address. A cached result does not use up a generation.
- **Self-hosted copy.** Cloudflare's documented always-pass Turnstile test keys work as a test key for your own copy of this app. See [Testing safely in the API docs](/api) for the details.

## Next

- [Read the full specification](/spec)
- [Browse the skills](/skills)
- [See a complete example](/example)
