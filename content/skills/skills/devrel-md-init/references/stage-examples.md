# Setting `stage`: two worked cases

The spec defines `stage` by monthly developer signups: `early` under 100, `growth` 100 to 500, `scale` 500 to 2,000, `enterprise` over 2,000. `pre-launch` means no public developer path yet. Use this file to check your own output. Both products below are fictional.

## Case 1: impressive marketing, no signup counts, so `unknown`

**What the public pages show**

- A homepage claiming "trusted by thousands of teams" with a row of recognisable customer logos
- A launch post announcing a large funding round, and an active social account
- A polished docs site, a quickstart, an SDK for four languages and a busy-looking community forum
- No signup figure anywhere: no published count, no changelog stat, no statement in the docs, and the user has not been asked yet

**What the file should say**

```yaml
---
spec: devrel.md/0.1
product: Lumen Queue
url: https://lumenqueue.example
stage: unknown
updated: 2026-10-04
---
```

Under Metrics and Open questions:

```markdown
- Monthly developer signups: unknown. Needed to set `stage`.
- Open question: how many new developers signed up last month, and from which source (analytics, billing, auth provider)?
```

Under Competitors or Awareness, a sourced fact and a labelled inference stay apart:

```markdown
- Homepage claims "trusted by thousands of teams" (lumenqueue.example, read 2026-10-04). Not a developer signup count.
- Likely competes with managed queue services (inferred).
```

**Why `unknown`**

Logos, funding, a busy forum and a confident tagline describe the company's marketing, not how many developers sign up each month. A large, well-funded company can have a small developer programme, and a small one can have a large one. The customer count is also not the signup count, and "teams" is not "developers". Guessing `growth` here would turn an impression into a metric. Ask for the number instead, and tell the user in the output that stage is unknown and why.

## Case 2: sourced counts, so the right stage

**What you have**

- The user answers the signup question: "About 340 new developer signups last month, from our auth dashboard."
- The user also says activation is not tracked yet.

**What the file should say**

```yaml
---
spec: devrel.md/0.1
product: Harbour CLI
url: https://harbourcli.example
stage: growth
updated: 2026-10-04
---
```

Under Metrics:

```markdown
- Developer signups per month: 340 (auth dashboard, Sep 2026, supplied by the team)
- Signup to first successful call: unknown. Not instrumented.
```

**Why `growth`**

340 falls in the 100 to 500 band, the figure has a source and a month, and it is recorded where a reader can check it. `stage: growth` is bare, because the evidence lives in Metrics and not beside the value. Note what stays `unknown`: the missing activation figure does not change the stage, and it still appears under Open questions as a metric to start measuring.

## Quick checks before you write `stage`

| Check | If the answer is no |
| --- | --- |
| Do I have a signup figure for a stated month? | Write `unknown` and ask |
| Is the figure from the user or a published page, with its source recorded? | Write `unknown` and ask |
| Does the figure count developer signups, not customers, MAUs, GitHub stars or downloads? | Write `unknown` and ask |
| Is the frontmatter value bare, with no comment or label beside it? | Move the evidence to Metrics |
