# Playbook building blocks

Reusable blocks for assembling a 90-day plan. Paraphrased from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona (Ch 9, App A, App G). Pull in only the blocks a given plan needs; don't paste this whole file into the output.

## Week 1 quick wins

Low-effort, high-value tasks a small team can finish in the first five working days, while longer sprints spin up. Use these to fill week 1 regardless of variant, trimmed to what the product actually needs.

| Task | Rough effort | KPI impact | Owner role |
| --- | --- | --- | --- |
| Ship (or fix) a quickstart with copy-paste-ready code | Half a day | Onboarding, activation | Developer advocate |
| Add basic analytics to the docs (page views, quickstart drop-off) | A couple of hours | Enables every later metric | DevRel engineer |
| Open a shared channel with engineering and product for developer friction reports | An hour | Feedback loop speed | Community or program manager |
| Draft or publish an API deprecation and support policy | A few hours | Developer trust | API product manager |
| Announce a small recognition moment for an active community member | A couple of hours | Engagement | Community manager |

Prioritise the first three if the team has no activation data yet; the last two build trust and engagement over time. A short internal demo at the end of the week helps momentum.

## Sprint building blocks

Each block is a self-contained unit of work with its own exit criteria. Use the one (or two) that match the funnel stage currently failing. Adjust owners and day counts to the team's real size; a two-person team will stretch a 14-day block, a larger team may compress it.

### Foundation sprint (14 days)

Gets the baseline infrastructure in place before anything else can be measured or improved.

| Days | Task | Owner role | KPI impact | Deliverable |
| --- | --- | --- | --- | --- |
| 1-3 | Audit existing docs, find the top gaps | Technical writer + developer advocate | Time to first call | Gap analysis with a prioritised backlog |
| 4-6 | Build a "hello world to first call" quickstart under 5 minutes | Developer advocate | Activation rate | Published quickstart with runnable code |
| 7-9 | Remove approval gates; make key or credential generation instant | Product + DevRel engineer | Signup-to-first-call conversion | Automated provisioning |
| 10-12 | Audit the top error codes and add actionable guidance | Engineering + technical writer | Support ticket volume | Improved error messages shipped |
| 13-14 | Instrument signup, first-call and activation events | Analytics engineer | Enables every later measurement | A funnel dashboard |

Exit criteria: quickstart completion over 70%, median time to first call under 5 minutes, baseline metrics visible on a dashboard, no approval gate between signup and first call.

### Onboarding optimisation sprint (14 days)

Run once the foundation is in place, to remove friction from the first-impression path.

| Days | Task | Owner role | KPI impact | Deliverable |
| --- | --- | --- | --- | --- |
| 1-2 | Watch a handful of developers attempt onboarding unaided | DX researcher + developer advocate | Surfaces real friction | A prioritised friction log |
| 3-5 | Build a hosted sandbox that needs no local setup | DevRel engineer | Time to first success | A live sandbox with pre-configured auth |
| 6-8 | Publish a small library of one-click-deploy sample apps | Developer advocate + DevRel engineer | Breadth of activation | A sample repo with deploy buttons |
| 9-11 | Add copy buttons, language tabs and syntax highlighting to code blocks | Technical writer + frontend engineer | Docs engagement | Improved code blocks across docs |
| 12-14 | Record a short getting-started walkthrough | Developer advocate | Support load | A published video linked from docs |

Exit criteria: first-call success over 80%, median time to first call under 3 minutes, the top friction points from the usability test resolved, meaningful sandbox uptake among new signups.

### Activation acceleration sprint (21 days)

Run once onboarding is healthy, to move developers from a toy example to something in production.

| Days | Task | Owner role | KPI impact | Deliverable |
| --- | --- | --- | --- | --- |
| 1-3 | Document a production-ready pattern for the top use case | Solutions architect + developer advocate | Production adoption | An architecture blueprint with a deployment checklist |
| 4-7 | Add retry and backoff helpers to the SDKs | DevRel engineer | Error rate | Updated SDK releases |
| 8-10 | Publish starter observability dashboards | SRE + DevRel engineer | Time to production-ready | A public dashboard template repo |
| 11-14 | Write integration guides for the most popular frameworks | Technical writer | Feature breadth | Published integration docs |
| 15-18 | Publish a go-live checklist covering security, scale and monitoring | Security + SRE + technical writer | Production confidence | An interactive checklist in the docs |
| 19-21 | Review activation metrics and name the next bottleneck | Analytics engineer + product manager | Informs the next sprint | An activation dashboard with next steps |

Exit criteria: 7-day activation rate over 20%, production key creation trending up, reference architectures published for the top use cases, error rate for activated users under 2%.

## Company-size adaptations

- **Startup (roughly under 50 people):** lean on the foundation sprint and week 1 quick wins; skip formal champion or ambassador programmes for now; put activation ahead of awareness; keep the metrics list to three to five items.
- **Growth-stage (roughly 50-500 people):** run the full sequence of sprint blocks the funnel needs across the 90 days; invest in the measurement dashboard early; start a small champion pilot (10-15 people) once onboarding is healthy.
- **Enterprise (roughly 500+ people):** expect the 90-day plan to be the first phase of a longer rollout; add extra weeks for cross-functional sign-off and executive sponsorship; note in the plan's risks that a fourth 30-day block is likely needed, rather than inventing one here.

## Ready-for-a-DevRel-hire check

Use only when the user is deciding whether to make a first DevRel hire. Keep it to one short block in the output, not a full section.

**Likely ready when:** there's product-market fit with at least one developer segment; baseline docs exist, even if rough; support channels show repeat, patternable questions; some basic funnel instrumentation already exists; and the team is genuinely willing to act on developer feedback.

**Likely not ready when:** the SDK or API isn't stable yet; the product ships breaking changes weekly; the expectation is that DevRel will "sell" a product developers don't like; or leadership needs this quarter's ROI and can't fund a function that pays back over quarters, not weeks.
