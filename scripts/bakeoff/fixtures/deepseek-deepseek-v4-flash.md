---
spec: devrel.md/0.1
product: Resend
url: https://resend.com
stage: growth (inferred)
updated: 2026-09-28
owner: unknown
---

## Product

Resend is the email API for developers. It provides a REST API, official SDKs (Node.js, Python, Ruby, Go, Rust, Elixir, Java, .NET, PHP), an SMTP relay, a CLI, and an MCP server to send transactional and marketing emails with high deliverability. It competes in the developer email infrastructure category alongside SendGrid, Mailgun, Postmark, and Amazon SES.

## Value proposition

Send transactional and marketing emails from any stack in minutes, with SDKs for every major language, without managing SMTP servers or worrying about deliverability. (proposed)

## ICPs

### Full-stack and backend developers building SaaS products

- **Technical context:** Node.js, Next.js, Python, Ruby, Go, Rust, Java, .NET, PHP; modern frameworks (Express, Django, Rails, Laravel, FastAPI, etc.); serverless (Vercel Functions, Supabase Edge Functions, Cloudflare Workers, AWS Lambda)
- **Company stage and team size:** Early-stage startups to mid-market companies, 1–50 engineers
- **Use case:** Sending transactional emails triggered by user actions — password resets, order confirmations, welcome emails, invoice receipts
- **Decision:** The individual developer can adopt with a free API key; a team lead or CTO approves the paid plan
- **Activation event:** First successful API call returning an email ID, with the email delivered to the inbox
- **Fit score:** unknown

### Developer experience and platform teams

- **Technical context:** Any stack; responsible for email infrastructure, deliverability, and monitoring across the organization
- **Company stage and team size:** Mid-market to enterprise, 20+ engineers
- **Use case:** Replacing legacy email providers (SendGrid, Mailgun, Amazon SES) with a simpler API, better webhooks, and best-in-class debugging
- **Decision:** The platform team recommends; a VP of Engineering or CTO approves the contract
- **Activation event:** First production email sent through Resend after migrating a domain
- **Fit score:** unknown

### Indie developers and solo founders

- **Technical context:** Any language; building a side project or early-stage product
- **Company stage and team size:** Solo, pre-revenue or very early
- **Use case:** Adding email notifications to an app with zero infrastructure overhead
- **Decision:** The developer decides alone; the free plan (100 emails/day) covers the need
- **Activation event:** First email sent via the quickstart in under 5 minutes
- **Fit score:** unknown

## Anti-personas

- **Enterprise marketing teams** that need drag-and-drop editors, complex segmentation, and A/B testing without writing code — Resend is API-first and developer-centric.
- **High-volume bulk senders** (millions of emails per day) who need dedicated IPs and custom SLAs out of the box — Resend offers dedicated IPs as an add-on on Scale, but the core product is optimized for transactional and moderate-volume marketing sends.
- **Non-technical users** who want a traditional email marketing platform with a visual campaign builder — Resend's Broadcasts editor exists but the product is designed for developers.

## North Star

- Time to Hello World: unknown today, target unknown
- Measured: signup to first successful API call (email sent and delivered)
- First success means: the developer receives the test email in their inbox

## Activation

- Activation event: The developer sends an email to a real recipient (not just a test address) from their own verified domain, using their own code
- Target time: unknown
- Current rate: unknown

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | Strong brand recognition among developers; testimonials from well-known companies (MrBeast, Gumroad, Raycast, Replit, Tailwind, Turso, Inngest) | yes (inferred) |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | Quickstart guides exist for 20+ languages/frameworks; median time unknown; first-call success unknown | unknown |
| Activation | Activation rate > 20% and production usage measurable | unknown | unknown |
| Engagement | Community answers > 65% of questions within 24h | unknown | unknown |
| Monetization | Paying deepens trust rather than replacing it | Free plan (100/day), Pro ($?), Scale ($?), Enterprise (custom); pay-as-you-go overages; pricing page is transparent | unknown |

## Metrics

| Stage | Leading | Lagging | Current |
| --- | --- | --- | --- |
| Awareness | Docs or tutorial to quickstart click-through | Branded search, delayed signups | unknown |
| Onboarding | Quickstart completion, drop-off step | Median time to first call, first-call success | unknown |
| Activation | Share reaching the activation event in 24h | 7-day activation retention, production keys | unknown |
| Engagement | Answer rate within 24h, peer response time | Feature breadth per account, community content per month | unknown |
| Monetization | Pricing page visits by activated developers | Trial to paid, expansion, net retention | unknown |

## Docs map

- **Quickstart:** https://resend.com/docs/introduction.md
- **API reference:** https://resend.com/docs/api-reference/introduction.md
- **SDK docs:** https://resend.com/docs/sdks (inferred)
- **Supported languages:** Node.js, Python, Ruby, Go, Rust, Elixir, Java, .NET, PHP
- **Framework guides:** Next.js, Remix, Nuxt, SvelteKit, Express, Django, Rails, Laravel, FastAPI, Flask, and more
- **CLI:** https://resend.com/docs/cli-quickstart.md
- **MCP server:** referenced in docs
- **llms.txt:** https://resend.com/docs/llms.txt
- **llms-full.txt:** https://resend.com/docs/llms-full.txt (referenced in Node.js guide)
- **OpenAPI spec:** unknown
- **Status page:** unknown
- **Changelog:** unknown

## Community

- Live channels: unknown (support channels include ticket support and Slack support on paid plans per pricing page)
- Who answers questions today: unknown
- Answer rate within 24h: unknown
- Champion or ambassador program: unknown

## Business model

- **Free tier:** 100 transactional emails/day, 3 custom domains, 1 webhook endpoint, 5 AI credits/month
- **Pro tier:** Unlimited daily limit, 10 custom domains, 5 webhook endpoints, 100 AI credits/month
- **Scale tier:** Unlimited daily limit, 1,000 custom domains, 10 webhook endpoints, 500 AI credits/month; add-ons available (additional domains $20/mo, dedicated IPs $30/mo, SSO $150/mo)
- **Enterprise:** Flexible limits, dedicated IP warming, signed webhook endpoints, urgent response SLA, deliverability expertise
- **Pay-as-you-go overages:** billed in buckets of 1,000 emails at plan's overage rate
- **Pricing page:** https://resend.com/pricing
- **First paywall:** When exceeding 100 emails/day on the free plan, or needing more than 3 custom domains or 1 webhook endpoint

## Voice and guardrails

- **Tone:** Developer-first, straightforward, no marketing fluff. Docs use clear imperative language ("Install", "Set your API key", "Send email using HTML").
- **Words to use:** simple, reliable, deliverable, API-first, SDK, quickstart
- **Words to avoid:** revolutionary, game-changing, AI-powered (unless referring to the AI assistant feature)
- **Claims that must never be made:** "100% deliverability" — no email provider can guarantee this
- **Compliance:** GDPR compliant; SOC 2 Type II certified (mentioned on pricing page); DMARC, DKIM, SPF authentication supported
- **AI review guardrails:** Security guidance (API key handling, domain verification steps) must never be generated without human review

## Competitors

- **SendGrid (Twilio):** When a team already uses Twilio or needs a more established enterprise brand; Resend is simpler and more developer-friendly per testimonials
- **Mailgun:** When a team needs advanced email parsing and routing; Resend has a cleaner API and better DX
- **Postmark:** When transactional-only sending with high reliability is the only need; Resend also offers marketing broadcasts
- **Amazon SES:** When the team is already deep in AWS and wants minimal cost; Resend provides better developer experience, webhooks, and debugging
- **Build it yourself (SMTP server):** When a team has dedicated infrastructure engineers and wants full control; Resend removes the operational burden

## Open questions

1. What is the median time from signup to first successful API call? (North Star metric)
2. What is the current activation rate (percentage of signups that send a real email from their own domain within 7 days)?
3. What is the quickstart completion rate and where do developers drop off?
4. Where do developers ask questions (Discord, GitHub Discussions, forum)? What is the answer rate within 24 hours?
5. What are the current signup volumes per month? (to confirm the stage)
6. Who is the primary owner of developer relations at Resend?
7. What is the trial-to-paid conversion rate?
8. What is the net revenue retention for paid plans?

<!-- Generated with devrel.md -->