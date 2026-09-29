---
spec: devrel.md/0.1
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

### Platform teams at Series A to C SaaS companies

- **Technical context:** Python or TypeScript services, Postgres on AWS RDS or Aurora, Terraform
- **Company stage and team size:** Series A to C, 5 to 30 engineers
- **Use case:** in-app semantic search and retrieval for an AI feature, on data they already hold
- **Decision:** a staff engineer evaluates and champions it; the VP Engineering approves spend
- **Activation event:** first production query served from an existing table, within 7 days of signup
- **Fit score:** 3.8 (Pain 4, Urgency 4, Activation ease 3, Strategic value 4)

### AI product engineers at early-stage startups

- **Technical context:** TypeScript, Next.js, Vercel, Supabase or Neon
- **Company stage and team size:** seed, 2 to 8 engineers
- **Use case:** retrieval for a chat or agent feature
- **Decision:** the engineer adopts alone, card payment
- **Activation event:** first query from a deployed app, within 48 hours
- **Fit score:** 2.9 (Pain 3, Urgency 4, Activation ease 4, Strategic value 2)

## Anti-personas

- Solo builders and hobby projects: high signups, no budget, no path to expansion
- Enterprises that require on-premise deployment with custom SLAs
- Teams not on Postgres

## North Star

- Time to Hello World: 22 min median today, 5 min target
- Measured: signup to first successful similarity query, product analytics, last 30 days
- First success means: a query returns ranked results from a sample table the developer loaded

## Activation

- Event: first production query against an existing table (not the sample data)
- Target: within 7 days of signup
- Current rate: 14% of signups within 7 days

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | 60% of signups from docs and search, 25% from one launch spike | yes |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | 22 min, 64% | no |
| Activation | Activation rate > 20% and production usage measurable | 14%, measurable | no |
| Engagement | Community answers > 65% of questions within 24h | unknown | unknown |
| Monetization | Paying deepens trust rather than replacing it | Too early to judge | n/a |

## Metrics

| Stage | Leading | Now | Lagging | Now |
| --- | --- | --- | --- | --- |
| Awareness | Docs to quickstart click-through | 0.8% | Signups per month | 340 |
| Onboarding | Quickstart completion | 38% | Median time to first query | 22 min |
| Activation | Activated in 24h | 6% | 7-day activation | 14% |

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

## Competitors

- Dedicated vector databases: chosen when search is the whole product and the team is happy to run another datastore
- Plain Postgres full-text search: chosen when exact keyword match is enough
- Building it in-house on pgvector: chosen by teams with spare platform capacity

## Open questions

- Where do developers drop off inside the quickstart? Loading sample data is suspected.
- Does anyone answer community questions systematically?

<!-- Generated with devrel.md -->
