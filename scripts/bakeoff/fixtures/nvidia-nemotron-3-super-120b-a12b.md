---
spec: devrel.md/0.1
product: Resend
url: https://resend.com
stage: growth (inferred)
updated: 2026-09-28
---

# DEVREL.md

## Product
Resend is an email API for developers that lets you send, receive, and track emails via REST API and official SDKs. It is built for developers who need to add transactional email (password resets, notifications, etc.) to their applications without managing email infrastructure. Resend competes in the email API category alongside SendGrid, Mailgun, and Postmark.

## Value proposition
Send transactional emails from your app in under 2 minutes, with the first email delivered to your inbox, using a verified domain and API key. (proposed)

## ICPs
### Web app developer building SaaS or internal tools
- **Technical context:** JavaScript/TypeScript, Node.js, Next.js, React, Python, Go, Ruby, etc.; frameworks like Express, Vercel, Supabase, Cloudflare Workers, AWS Lambda.
- **Company stage and team size:** Early-stage startups to growth companies; 1‑10 engineers where a single developer can adopt the API.
- **Use case:** Sending transactional emails triggered by user actions (sign‑ups, order confirmations, password resets) using real data from the application.
- **Decision:** The developer can adopt alone by creating an API key and verifying a domain; no managerial or procurement approval needed.
- **Activation event:** First email sent via the API arrives in a test inbox (e.g., delivered@resend.dev) using a verified domain.
- **Fit score:** (not scored)

## Anti-personas
- Marketing teams that need a drag‑and‑rop email campaign builder without coding (inferred).
- Developers who require an on‑premises, self‑hosted email server due to data‑residency or compliance restrictions (inferred).

## North Star
- Time to Hello World: unknown today, <2 min target
- Measured: signup to first successful email delivery, unknown
- First success means: an email arrives in the inbox of a test address (e.g., delivered@resend.dev)

## Activation
- Activation event: sending a transactional email triggered by a real user action (sign‑up, purchase, etc.) using dynamic data and a verified domain.
- Target time: unknown
- Current rate: unknown

## Funnel health
| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | unknown | unknown |
| Onboarding | Median time to first call < 5 min and first‑call success > 80% | unknown | unknown |
| Activation | Activation rate > 20% and production usage measurable | unknown | unknown |
| Engagement | Community answers > 65% of questions within 24 h | unknown | unknown |
| Monetization | Paying deepens trust rather than replacing it | unknown | unknown |

## Docs map
- **Quickstart:** https://resend.com/docs/send-with-nodejs.md (example; similar guides exist for many languages/frameworks)
- **API reference:** https://resend.com/docs/api-reference/introduction.md
- **llms.txt:** https://resend.com/docs/llms.txt
- **MCP server:** https://resend.com/docs/mcp-server
- **SDK repos:** unknown
- **Changelog:** unknown
- **Status page:** unknown
- **OpenAPI spec:** unknown

## Community
- Live channels: unknown
- Who answers questions: unknown
- Answer rate within 24 h: unknown
- Champion/ambassador program: unknown

## Business model
Freemium with a free tier (100 emails per day). Paid plans: Pro, Scale, Enterprise. Pricing: https://resend.com/pricing. Paywall appears when the free daily limit is exceeded; users are prompted to upgrade or pay for overages.

## Voice and guardrails
- **Tone:** Developer‑friendly, clear, concise, practical.
- **Words to use:** “send email”, “API key”, “verified domain”, “webhook”, “SDK”.
- **Words to avoid:** hardcoding API keys, snake_case parameter names, using `onboarding@resend.dev` in production.
- **Claims that must never be made:** Guarantees of 100 % deliverability, unlimited free emails, HIPAA compliance without the appropriate add‑on.
- **Compliance constraints:** SOC 2 Type II, GDPR compliance (self‑serve); HIPAA requires enterprise add‑on.
- **AI‑generated content that must never be used without human review:** Security guidance, legal text, incident communication, compliance advice.

## Competitors
- **SendGrid:** Established email API with broader marketing suite; choose if you need advanced marketing tools or legacy integrations.
- **Mailgun:** Strong focus on email parsing and routing; choose if you need inbound email handling or flexible SMTP.
- **Postmark:** Emphasis on deliverability and fast transactional email; choose if you prioritize inbox placement over feature breadth.
- **Amazon SES:** Low‑cost, AWS‑integrated email service; choose if you are already deep in AWS and want the cheapest sending price.
- **Build it yourself:** Running your own SMTP server (e.g., Postfix); choose only if you have full‑time email ops expertise and need absolute control over data.

## Open questions
- What is the observed median time from signup to first successful email delivery (Hello World)?
- What percentage of developers who send a test email go on to send a real transactional email within 24 h (activation rate)?
- What is the community answer rate within 24 h on forums, Discord, Slack, or GitHub Discussions?
- What are the current quickstart completion rates and drop‑off points?
- What percentage of activated developers upgrade to a paid plan or exceed the free tier?