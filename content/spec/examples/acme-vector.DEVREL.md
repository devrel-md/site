---
spec: devrel.md/0.2
product: Acme Vector
url: https://example.com/acme-vector
stage: growth
updated: 2026-09-28
owner: devrel@example.com
---

# DEVREL.md

> Fictional example. Acme Vector is not a real product. The numbers show the format, not real benchmarks.

## Product

Acme Vector adds vector search to an existing Postgres database as an extension plus a hosted service. It's for backend and platform engineers who want semantic search without running a separate vector store. Category: vector databases and search infrastructure.

## Value proposition

Add semantic search to an existing Postgres app in one afternoon, without running a separate vector cluster.

## ICPs

### Teams adding semantic search to an existing SaaS app

- **Technical context:** Python or TypeScript services, Postgres on AWS RDS or Aurora, Terraform. Acme Vector plugs in as an extension on the Postgres they already run, plus a hosted indexing service
- **Company stage and team size:** Series A to C, 5 to 30 engineers
- **Use case:** in-app semantic search and retrieval for an AI feature, on data they already hold
- **Hiring moment:** the product team commits to an AI search feature on the roadmap, and the first prototype needs embeddings next to existing rows
- **Goals:** 1. ship search without new infrastructure, 2. keep customer data in one database for compliance, 3. predictable cost as data grows
- **Pains:** 1. sync jobs between Postgres and a separate vector store, 2. on-call for another cluster, 3. weeks lost comparing vector databases
- **Alternatives:** a dedicated vector database, left when the sync jobs and second cluster cost more than they return; pgvector run in-house, left when index tuning eats platform time; doing nothing and keeping keyword search, left when users expect results by meaning
- **Switching forces:** push: sync jobs break and results go stale. Pull: one database, with the backups and permissions they already have. Anxiety: query latency at scale, and extension support on RDS. Habit: the team already knows its current search setup
- **Decision:** a staff engineer evaluates and champions it; the VP Engineering approves spend
- **Activation event:** first production query served from an existing table, within 7 days of signup
- **Fit score:** 3.8 (Pain 4, Urgency 4, Activation ease 3, Strategic value 4)

### Startups building a chat or agent feature on their own data

- **Technical context:** TypeScript, Next.js, Vercel, Supabase or Neon. Acme Vector plugs in through the TypeScript SDK against their hosted Postgres
- **Company stage and team size:** seed, 2 to 8 engineers
- **Use case:** retrieval for a chat or agent feature
- **Hiring moment:** answers from their agent are wrong because it cannot see the customer's data
- **Goals:** 1. get retrieval working this week, 2. stay on the free tier until there is revenue
- **Pains:** 1. too many retrieval tutorials that don't match their stack, 2. tuning chunk sizes by trial and error
- **Alternatives:** pgvector on Supabase or Neon directly, left when they need ranking and filtering they would otherwise build; a managed vector database's free tier, left when they want one fewer service
- **Switching forces:** push: retrieval quality is hurting demos. Pull: works with the Postgres they already have. Anxiety: another vendor to pay later. Habit: copying the retrieval code from a tutorial that already half works
- **Decision:** the engineer adopts alone, card payment
- **Activation event:** first query from a deployed app, within 48 hours
- **Fit score:** 2.9 (Pain 3, Urgency 4, Activation ease 4, Strategic value 2)

## Anti-personas

- Solo builders and hobby projects: high signups, no budget, no path to expansion
- Enterprises that require on-premise deployment with custom SLAs
- Teams not on Postgres

## North Star

- North Star metric: weekly active projects with a production query, 120 today, 250 target (product analytics, Sep 2026)
- Time to Hello World: 22 min median today, 5 min target
- Measured: signup to first successful similarity query, product analytics, last 30 days
- First success means: a query returns ranked results from a sample table the developer loaded

## Activation

- Event: first production query against an existing table (not the sample data)
- Target: within 7 days of signup
- Current rate: 14% of signups within 7 days, about 48 activated developers a month
- Retention: unknown. The window will be 30 days, since production search is used daily

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | > 50% of signups fit an ICP segment | 58% of September signups fit a segment, from enriched signups tagged by profile and first-week usage | yes |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | 22 min, 64% | no |
| Activation | Activation rate > 20% and > 60% of activated developers active after 30 days | 14%, retention not yet measured | no |
| Engagement | Community answers > 65% of questions within 24h | unknown | unknown |
| Monetization | Paying deepens trust rather than replacing it | Too early to judge | n/a |

## Metrics

| Stage | Leading | Now | Lagging | Now |
| --- | --- | --- | --- | --- |
| Awareness | Docs to quickstart click-through | 0.8% | Signups per month | 340 |
| Onboarding | Quickstart completion | 38% | Median time to first query | 22 min |
| Activation | Activated in 24h | 6% | Activated developers a month | 48 |

## Docs map

- Quickstart: https://example.com/acme-vector/docs/quickstart
- API reference: https://example.com/acme-vector/docs/api
- SDKs: Python, TypeScript
- llms.txt: https://example.com/llms.txt
- MCP server: none

## Voice and guardrails

- Plain and technical. No "revolutionary", no "AI-native".
- Never claim benchmark results without linking the method.
- Security and compliance guidance is written or reviewed by a human.

## Open questions

- Where do developers drop off inside the quickstart? Loading sample data is suspected.
- Does anyone answer community questions systematically?
- How many activated developers are still querying after 30 days? Needed for the Activation gate.

<!-- Generated with devrel.md -->
