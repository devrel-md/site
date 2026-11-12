# Setting `stage`: two worked cases

The spec defines `stage` by activated developers a month: developers who reached the activation event that month. `early` under 20, `growth` 20 to 100, `scale` 100 to 400, `enterprise` over 400. `pre-launch` means no public developer path yet. Use this file to check your own output. Both products below are fictional.

## Case 1: impressive marketing and a signup count, still `unknown`

**What the public pages show**

- A homepage claiming "trusted by thousands of teams" with a row of recognisable customer logos
- A launch post announcing a large funding round, and an active social account
- A polished docs site, a quickstart, an SDK for four languages and a busy-looking community forum
- A changelog post saying "over 3,000 new developers signed up in September"
- No figure for how many developers reached the activation event, and the user has not been asked yet

**What the file should say**

```yaml
---
spec: devrel.md/0.2
product: Lumen Queue
url: https://lumenqueue.example
stage: unknown
updated: 2026-10-12
---
```

Under Metrics and Open questions:

```markdown
- Developer signups: 3,000+ in Sep 2026 (lumenqueue.example changelog, read 2026-10-12). Signups, not activated developers, so it does not set `stage`.
- Activated developers per month: unknown. Needed to set `stage`.
- Open question: how many developers reached the activation event last month, and from which source (product analytics, billing, auth provider)?
```

In the first ICP's Alternatives, a sourced fact and a labelled inference stay apart:

```markdown
- Homepage claims "trusted by thousands of teams" (lumenqueue.example, read 2026-10-12). Not an activated developer count.
- Likely alternative: a managed queue service from their cloud provider (inferred).
```

**Why `unknown`**

Logos, funding, a busy forum and a confident tagline describe the company's marketing, not how many developers activate each month. Even the signup figure doesn't settle it: 3,000 signups with a 2% activation rate is 60 activated developers, which is `growth`, and with a 20% rate it is 600, which is `enterprise`. Guessing either turns an impression into a metric. Record the signup figure, ask for the activation figure, and tell the user in the output that stage is unknown and why.

## Case 2: a sourced activation count, so the right stage

**What you have**

- The user answers the activation question: "About 70 developers ran their first production deploy last month. That's our activation event, from product analytics."
- The user also says retention is not tracked yet.

**What the file should say**

```yaml
---
spec: devrel.md/0.2
product: Harbour CLI
url: https://harbourcli.example
stage: growth
updated: 2026-10-12
---
```

Under Metrics:

```markdown
- Activated developers per month: 70 (product analytics, Sep 2026, supplied by the team)
- Retention of activated developers: unknown. Not instrumented.
```

**Why `growth`**

70 falls in the 20 to 100 band, the figure counts the activation event, it has a source and a month, and it is recorded where a reader can check it. `stage: growth` is bare, because the evidence lives in Metrics and not beside the value. Note what stays `unknown`: missing retention does not change the stage, but the Activation gate's `Pass` stays `unknown` and retention appears under Open questions as a metric to start measuring.

## Quick checks before you write `stage`

| Check | If the answer is no |
| --- | --- |
| Do I have a figure for a stated month? | Write `unknown` and ask |
| Is the figure from the user or a published page, with its source recorded? | Write `unknown` and ask |
| Does the figure count developers who reached the activation event, not signups, customers, MAUs, GitHub stars or downloads? | Write `unknown`, record what you do have under Metrics, and ask |
