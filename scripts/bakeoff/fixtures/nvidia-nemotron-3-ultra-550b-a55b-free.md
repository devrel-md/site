---
spec: devrel.md/0.1
product: Resend
url: https://resend.com
stage: growth
updated: 2026-09-28
owner: devrel@resend.com
---

## Product

Resend is the email API for developers. It provides a REST API and official SDKs for 20+ languages and frameworks to send transactional and marketing emails, receive inbound emails, manage templates and audiences, and automate email workflows. It competes in the transactional email API category alongside SendGrid, Mailgun, Postmark, and AWS SES.

## Value proposition

Send transactional and marketing emails from your own domain with a developer-first API that handles deliverability, templates, and inbound parsing — so you can go from API key to first delivered email in <N minutes> without managing email infrastructure.

## ICPs

### ICP 1: Backend or full-stack developer at a SaaS startup (seed to Series B)

- **Technical context:** Node.js/TypeScript, Python, Go, or Ruby on Rails; deploys on Vercel, AWS, Railway, Fly.io, or Kubernetes; uses React Email or MJML for templates; integrates with auth (Clerk, Auth0, Better Auth) and databases (Postgres, Supabase, PlanetScale)
- **Company stage and team size:** 5–50 engineers; product has real users; email is a core workflow (auth, notifications, billing, onboarding)
- **Use case:** Replace SendGrid/Mailgun with a cleaner API, better debugging, and React Email components; send password resets, welcome sequences, invoice receipts, and marketing broadcasts from one platform
- **Decision:** Developer champions and implements; engineering lead or CTO approves spend (usually Pro or Scale plan)
- **Activation event:** First production email sent to a real user (not a test address) from a verified custom domain, with a webhook received confirming delivery
- **Target time to activation:** < 30 minutes from signup to first production send
- **Fit score:** unknown

### ICP 2: Developer building an AI agent or LLM application that needs to send email

- **Technical context:** Python (FastAPI, LangChain, LlamaIndex), TypeScript (Vercel AI SDK), or Go; uses Resend MCP server for agent tooling; needs idempotency, scheduling, and webhook replay for reliability
- **Company stage and team size:** 2–20 engineers; early-stage AI product or internal tooling team
- **Use case:** Agent sends confirmation emails, summaries, or notifications on behalf of users; needs deterministic, auditable email sending with idempotency keys
- **Decision:** Developer decides alone (often on Free or Pro plan)
- **Activation event:** First successful email sent via MCP tool call or SDK from agent workflow, verified via webhook
- **Target time to activation:** < 15 minutes from API key creation
- **Fit score:** unknown

### ICP 3: Growth/marketing engineer owning transactional-to-marketing migration

- **Technical context:** Works across Node.js, Python, or PHP codebases; owns the email stack; evaluates deliverability tooling (DMARC, BIMI, dedicated IPs); uses audiences/segments and broadcasts API
- **Company stage and team size:** 50–500 engineers; company sending 100k+ emails/month; moving off legacy ESP (Braze, Customer.io, Iterable) for transactional + marketing unification
- **Use case:** Consolidate transactional and marketing email on one platform; use broadcasts for newsletters, automations for drip campaigns; need deliverability insights and suppression management
- **Decision:** Marketing engineering lead champions; VP Engineering or CMO approves (Scale or Enterprise)
- **Activation event:** First broadcast sent to a real segment with open/click tracking enabled and deliverability insights populated
- **Target time to activation:** < 2 hours (includes domain setup, segment import, template creation)
- **Fit score:** unknown

## Anti-personas

- **Enterprise IT buyers evaluating RFP checklists** — Resend sells self-serve first; enterprise features (SSO, dedicated IPs, SLAs) exist but the buying motion is developer-led, not procurement-led
- **No-code/low-code marketers wanting a drag-and-drop builder** — Resend has a broadcast editor but no visual journey builder; the primary interface is code
- **High-volume spammers or cold-outreach teams** — Resend enforces strict anti-abuse policies, requires domain verification, and monitors reputation; not a fit for purchased lists or unsolicited mail
- **Teams needing on-premises or air-gapped deployment** — Resend is SaaS only; no self-hosted option

## North Star

- Time to Hello World: unknown today, < 5 minutes target
- Measured: signup to first successful API call returning an email ID (using test address `delivered@resend.dev`), via dashboard analytics (internal)
- First success means: a developer runs the quickstart, calls `resend.emails.send()`, receives `{ data: { id: '...' }, error: null }`, and sees the email in the dashboard logs

## Activation

- **Event:** Developer sends first email to a real recipient (not a test address) from a verified custom domain, and receives a `email.delivered` webhook
- **Target time:** < 30 minutes from signup
- **Current rate:** unknown

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | Strong developer word-of-mouth; testimonials from Infisical, Mintlify, MrBeast, Gumroad, Raycast, Replit, Tailwind, Braintrust, Turso, Inngest; high SEO for "email API" | yes |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | Quickstart requires API key + verified domain before first send; test addresses allow instant validation but domain verification adds DNS propagation time | unknown |
| Activation | Activation rate > 20% and production usage measurable | Free plan allows 100 emails/day; Pro removes daily limit; unknown what % of signups verify a domain and send to real recipients | unknown |
| Engagement | Community answers > 65% of questions within 24h | GitHub Discussions, Discord (link in footer), Twitter/X; no public answer-rate data | unknown |
| Monetization | Paying deepens trust rather than replacing it | Free plan is generous (100/day, 3 domains, all features); Pro/Scale add volume/domains/IPs; no feature gating on core API; Enterprise adds SSO/SLA | yes |

## Docs map

- **Quickstart:** https://resend.com/docs/send-with-nodejs (and 40+ framework-specific guides via llms.txt)
- **API reference:** https://resend.com/docs/api-reference/introduction
- **SDKs:** Node.js, Next.js, Remix, Nuxt, TanStack Start, SvelteKit, Express, RedwoodJS, Hono, Bun, Astro, Railway, Encore (TS/Go), PHP, Laravel, Symfony, Ruby, Rails, Sinatra, Python, Flask, FastAPI, Django, Go, Rust, Axum, Elixir, Phoenix, Java, .NET, SMTP
- **CLI:** https://resend.com/docs/cli-quickstart
- **MCP server:** https://resend.com/docs/mcp-server
- **Webhooks:** https://resend.com/docs/webhooks/introduction
- **Deliverability guides:** DMARC, BIMI, TLS, custom return path, tracking, suppressions, deliverability insights
- **Broadcasts (marketing):** https://resend.com/docs/dashboard/broadcasts/introduction
- **Automations:** https://resend.com/docs/dashboard/automations/introduction
- **Templates:** https://resend.com/docs/dashboard/templates/introduction
- **Audiences/Segments:** https://resend.com/docs/dashboard/audiences/introduction
- **Inbound email:** https://resend.com/docs/dashboard/receiving/introduction
- **llms.txt:** https://resend.com/docs/llms.txt
- **llms-full.txt:** https://resend.com/docs/llms-full.txt
- **Status page:** https://status.resend.com
- **Changelog:** https://resend.com/changelog
- **Pricing:** https://resend.com/pricing

## Developer archetypes

- **Hacker:** 30% — Quickstarts, one-click deploys (Vercel, Railway), test addresses, React Email starter kits
- **Integrator:** 40% — Framework guides, SDK reference, migration guides (SendGrid, Mailgun), webhook ingester, SMTP integration
- **Architect:** 20% — Dedicated IPs, DMARC/BIMI, multi-region, rate limits, idempotency, webhook replay, SOC 2, GDPR
- **Evangelist:** 10% — Case studies (Infisical, Raycast, Replit, etc.), conference talks, co-marketing with Vercel/Supabase/Cloudflare

## Community

- **Channels:** GitHub Discussions (resend/resend), Discord (invite in footer), Twitter/X (@resend), email support (help@resend.com)
- **Who answers:** Resend team (founders, engineers, DevRel); community contributors on GitHub
- **Answer rate within 24h:** unknown
- **Champion/ambassador program:** None publicly documented

## Business model

- **Type:** Freemium SaaS with usage-based overages
- **Tiers:**
  - Free: 100 emails/day, 3 custom domains, 30-day retention, 1 webhook, 5 AI credits/mo
  - Pro: $20/mo (estimated from add-on pricing), no daily limit, 10 domains, 5 webhooks, 100 AI credits/mo
  - Scale: $80/mo (estimated), 1,000 domains, 10 webhooks, 500 AI credits/mo, dedicated IP add-on ($30/mo), SSO add-on ($150/mo)
  - Enterprise: Custom contract, flexible limits, SSO included, SLA, deliverability expertise
- **Add-ons:** Domains (+100 for $20/mo), Dedicated IPs ($30/mo, requires 3k emails/day), SSO ($150/mo)
- **Paywall:** First paywall at Pro plan (removes daily limit); Free plan has no time limit
- **Overages:** Pay-as-you-go buckets of 1,000 emails at plan's overage rate (opt-in)
- **Transactional vs marketing:** Transactional (/emails API) counts against limits; Broadcasts (/broadcasts API) limited by contact count, not volume
- **Inbound emails:** Count against transactional quota

## Voice and guardrails

- **Tone:** Developer-first, pragmatic, concise, slightly opinionated (e.g., "don't use onboarding@resend.dev in production")
- **Words to use:** "email API", "deliverability", "verified domain", "idempotency", "webhook", "broadcast", "suppression"
- **Words to avoid:** "ESP" (prefer "email API"), "blast" (prefer "broadcast"), "newsletter tool" (Resend is code-first)
- **Claims never to make:** "100% deliverability", "guaranteed inbox placement", "no spam folder ever", "better than SendGrid" (show, don't tell)
- **Compliance:** SOC 2 Type II, GDPR, DDoS protection, automated backups, MFA, signed webhooks, API key permissions
- **AI must not generate without human review:** Security guidance (DKIM/DMARC/SPF setup), legal text (GDPR, CAN-SPAM, CASL), incident communication, deliverability guarantees, pricing calculations

## Competitors

| Competitor | When a developer picks them instead |
| --- | --- |
| SendGrid (Twilio) | Enterprise procurement process requires Twilio contract; need visual journey builder; existing Twilio stack |
| Mailgun (Sinch) | Need on-premises option; heavy SMTP-only legacy integration; pricing model fits better at very high volume |
| Postmark | Laser focus on transactional only (no marketing/broadcasts); best-in-class deliverability for pure transactional; simpler feature set |
| AWS SES | Cost optimization at massive scale (>1M/mo); already deep in AWS; willing to manage infrastructure |
| Brevo (Sendinblue) | Need built-in CRM, SMS, WhatsApp, landing pages; marketing-first team with less engineering capacity |
| Customer.io / Braze / Iterable | Need full customer data platform, multi-channel journeys, visual workflow builder; marketing-led buying motion |
| Build it yourself (Postfix + queue) | Total control required; air-gapped/on-prem; team has email ops expertise; cost avoidance at scale |

## Open questions

1. **What is the median time from signup to first successful API call (Hello World)?** — Measure via dashboard analytics: timestamp of first `resend.emails.send()` returning an email ID. Target: < 5 min.
2. **What % of signups verify a custom domain within 24 hours?** — Domain verification is the main friction point; DNS propagation varies. Track via domain verification webhook or polling.
3. **What is the activation rate (first production send to real recipient within 7 days)?** — Define "production send" as `to` address not in test list (`delivered@resend.dev`, `bounced@resend.dev`, etc.) and `from` using verified custom domain.
4. **What is the community answer rate within 24 hours on GitHub Discussions/Discord?** — Export question threads, measure % with a team or community reply within 24h.
5. **What are the top 3 drop-off steps in the quickstart funnel?** — Instrument: API key created → domain added → domain verified → first test send → first production send.
6. **What is the trial-to-paid conversion rate for Pro/Scale?** — Track Free → Pro/Scale upgrades within 30/60/90 days.
7. **Which ICP segment has the highest activation ease today?** — Survey activated developers: "What's your primary role?" + "What framework?" to weight ICP fit scores.

<!-- Generated with devrel.md -->