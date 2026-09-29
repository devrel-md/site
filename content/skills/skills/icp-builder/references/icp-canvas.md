# The ICP canvas, field by field

The full canvas from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona (App A.5). Walk one segment through every field before moving to the next. Skip a field only if the user has no information and no hypothesis for it, and mark it `unknown` rather than leaving it blank.

## Segment name

A short, memorable label, not a job title. "Fintech backend engineers" or "solo indie hackers shipping weekend projects" work; "developers" or "our users" doesn't. If the name could describe two very different people, it's too broad, split it.

## Four-axis definition

- **Technical context:** the languages, frameworks and infrastructure this segment actually uses day to day. Specific enough to shape a quickstart's code samples.
- **Company stage:** startup, growth stage or enterprise. This affects procurement, budget and how much process stands between "I want this" and "I can use this".
- **Team size:** solo, small team (2 to 5) or large organisation (6+). Team size changes who else needs convincing.
- **Use case:** the specific job this segment is hiring the product to do, not a category. "Send compliance-triggered SMS alerts with an audit trail" is a use case; "messaging" is a category.

## Decision

Who can adopt the product alone, and who has to approve it when that differs. A solo developer with a credit card decides fast. A team lead proposing a tool to a platform team, or a developer whose company requires procurement sign-off, decides slowly and needs different material along the way, budget justification rather than a code sample.

## Anti-persona

Who this segment explicitly is not. Naming the anti-persona is what lets a team say no to a feature request, a content idea or a partnership that would blur the segment's edges. Anti-personas are about focus now, not a permanent exclusion, a segment can be added deliberately later.

## Jobs, pains and outcomes

- **Jobs to be done:** what this segment is trying to accomplish, in their words, not the product's.
- **Current pains:** what frustrates them about how they solve this today, including workarounds and the tools they've already tried.
- **Desired outcomes:** what success looks like from their side, not "adopts our SDK" but the real-world change they want.
- **Evidence:** what supports each of the above, an interview theme, a support ticket pattern, a usage number. Anything without evidence is a hypothesis, not a fact, and should be labelled as one.

## Triggers and timing

What event sends this segment looking for a solution (a compliance deadline, an outage, a new project kickoff), how long they typically spend evaluating once triggered, and whether the trigger is seasonal or tied to a budget cycle.

## Evaluation criteria and deal-breakers

What this segment checks before choosing a platform, which documentation they read first, and the absolute non-starters that disqualify a product outright regardless of everything else it does well (no SDK in their language, no on-premise option, a compliance certification they must have).

## Activation event and target time

The one action that shows this segment has really adopted the product, not just signed up. Say it as a concrete, observable event ("first production API call", "first webhook received and handled") with a target time from signup. Different segments activate on different timelines: a solo hacker in minutes, an enterprise architect after a security review that takes weeks.

## Hello World path

The critical path to this segment's first moment of real value, as a short numbered sequence: how they discover the product, their first interaction with it, and each step between that and seeing it work. This is the same path a quickstart-friction-check walk would test, written from this segment's starting point.

## Top 3 assets to ship next

The highest-impact pieces of content or tooling that would move this segment through its Hello World path faster, ranked by impact against effort. Specific enough to hand to a writer or engineer as a brief, not "better docs".

## Integration environment

The tools and platforms this segment already has in place, and which integrations would make adoption feel native rather than bolted on. Example shape: "Typically running Next.js on Vercel with Stripe already wired in."

## Metrics: leading and lagging

- **Leading indicators:** early signals that predict this segment will succeed, measurable soon after signup.
- **Lagging indicators:** the proof that they actually activated and stayed.

Give each a target where the user has one, or `unknown` where they don't yet.

## Optional: partners and who else serves this segment well

Adjacent tools, agencies or consultancies this segment already trusts, and where a partnership might shorten their path to adoption. Skip this field unless the user has something concrete to add.

## Optional: owner and review date

Who keeps this segment definition current, and when it's next due for review. The book recommends every 90 days; use that as the default if the user doesn't set one.
