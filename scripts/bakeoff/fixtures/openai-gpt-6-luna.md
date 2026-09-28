---
spec: devrel.md/0.1
product: Resend
url: https://resend.com
stage: unknown
updated: 2026-09-28
---

# DEVREL.md

## Product

Resend is an email API for developers building applications that send transactional or marketing email. It provides a REST API, official SDKs, SMTP, a CLI, webhooks, and dashboard features; it competes in the developer email infrastructure category. (Source: [documentation introduction](https://resend.com/docs/introduction.md), [API reference](https://resend.com/docs/api-reference/introduction.md), [documentation index](https://resend.com/docs/llms.txt))

## Value proposition

Add email sending to an application and measure success by receiving a successful send response and email event for a message sent through Resend.

## ICPs

### Application developers adding transactional email (inferred)

- **Technical context:** Developers using a supported language or framework; public quickstarts cover JavaScript/TypeScript frameworks, PHP, Ruby, Python, Go, Rust, Elixir, Java, .NET, SMTP, and serverless platforms. (Source: [documentation index](https://resend.com/docs/llms.txt))
- **Company stage and team size:** Unknown.
- **Use case:** Send application-triggered email such as account or order messages through an API or SDK. (Source: [pricing FAQ](https://resend.com/pricing))
- **Decision:** Individual developer adoption is possible through account signup and API keys; who approves spend at a company is unknown.
- **Activation event:** A production email is successfully sent from a verified domain to an application user (inferred). Target time from signup: unknown.

### Developers and teams replacing or consolidating email infrastructure (inferred)

- **Technical context:** Teams integrating email into existing services and workflows; Resend documents REST, SDK, SMTP, webhooks, CLI, and framework integrations. (Source: [API reference](https://resend.com/docs/api-reference/introduction.md), [documentation index](https://resend.com/docs/llms.txt))
- **Company stage and team size:** Unknown.
- **Use case:** Send and troubleshoot transactional email, receive event webhooks, or migrate an existing email workflow.
- **Decision:** Champion may be an application developer or engineering lead; buyer and approval requirements are unknown.
- **Activation event:** A migrated or newly integrated application sends production email and processes relevant delivery events (inferred). Target time from signup: unknown.

## Anti-personas

- Developers who need a sending provider that does not require adding and verifying a domain: Resend documentation says a verified domain is required to send email. (Source: [verified domains](https://resend.com/docs/dashboard/domains/introduction.md))
- Teams seeking a general-purpose email marketing or CRM product without a developer-integrated sending workflow (inferred).
- Teams that cannot operate within the plan’s sending limits or purchase a plan with suitable capacity (inferred; check current [pricing](https://resend.com/pricing)).

## North Star

- **Time to Hello World:** Current median unknown; target unknown.
- **Measured:** Measurement method and telemetry source unknown.
- **First success means:** A developer receives a successful API response for an email send. A stronger activation milestone is sending from a verified domain in the developer’s application context.
- **Documented prerequisite:** An API key and verified domain are required; the Node.js quickstart demonstrates a test send to `delivered@resend.dev`. (Source: [Node.js quickstart](https://resend.com/docs/send-with-nodejs.md), [verified domains](https://resend.com/docs/dashboard/domains/introduction.md))

## Activation

- **Real adoption event:** A production application sends email from a verified domain and the team can observe or handle the resulting delivery status (proposed operational definition).
- **Target time from signup:** Unknown.
- **Current activation rate:** Unknown.
- An API integration or test-address send alone is not sufficient evidence of production adoption.

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups arrive from quality sources, not just traffic spikes | Signup volume, acquisition sources, and source quality are unknown. | unknown |
| Onboarding | Median time to first call is under 5 minutes and first-call success is above 80% | Docs provide SDK quickstarts; current time and success rate are unknown. | unknown |
| Activation | Activation rate is above 20% and production usage is measurable | Activation rate and production-usage measurement are unknown. | unknown |
| Engagement | Community answers more than 65% of questions within 24 hours, and engagement sustains itself | Support channels, answer rate, and engagement data are unknown. | unknown |
| Monetization | Paying deepens trust rather than replacing it | Paid plans and a free-forever plan are listed; developer sentiment and monetization outcomes are unknown. | unknown |

## Docs map

- [Documentation index (`llms.txt`)](https://resend.com/docs/llms.txt)
- [Introduction](https://resend.com/docs/introduction.md)
- [Node.js quickstart](https://resend.com/docs/send-with-nodejs.md)
- [Create an API key](https://resend.com/docs/create-an-api-key.md)
- [Add and verify a domain](https://resend.com/docs/add-a-domain.md)
- [Verified domains](https://resend.com/docs/dashboard/domains/introduction.md)
- [API reference introduction](https://resend.com/docs/api-reference/introduction.md)
- [Pricing](https://resend.com/pricing)
- Framework and language quickstarts, SMTP, CLI, webhooks, and other product guides are indexed in the [documentation index](https://resend.com/docs/llms.txt).
- SDK repository links, changelog, status page, OpenAPI specification, and MCP server details: unknown from the provided pages.

## Business model

Resend lists a free-forever plan and paid Pro, Scale, and Enterprise plans. Pricing includes sending limits, domains, and other plan features; the listed free-plan sending limit is 100 per day. Some capabilities are plan-specific or available as paid add-ons. A developer first encounters a limit or paywall when they need capacity or a feature beyond their plan; exact plan prices and the applicable limit for a particular use case should be checked on the [pricing page](https://resend.com/pricing). (Source: [pricing](https://resend.com/pricing))

## Competitors

These alternatives are inferred from the developer email infrastructure category; no comparative evaluation is asserted.

- **SendGrid (inferred):** A developer may choose it when their organization already uses its email delivery tooling.
- **Amazon SES (inferred):** A developer may choose it when they prefer AWS-native email infrastructure and are prepared to manage more of the surrounding setup.
- **Postmark (inferred):** A developer may choose it when they are evaluating another transactional email provider.
- **Build it yourself (inferred):** A developer may choose direct SMTP infrastructure when they want to own delivery systems and operations.

## Voice and guardrails

- Explain the concrete developer task and prerequisites plainly; distinguish test sends from production sending.
- Never recommend hardcoding API keys. Store keys in environment variables or an appropriate secret store. (Source: [Node.js quickstart](https://resend.com/docs/send-with-nodejs.md))
- Production examples must not present `onboarding@resend.dev` as a production sender; use a verified domain. (Source: [Node.js quickstart](https://resend.com/docs/send-with-nodejs.md))
- Do not claim a particular deliverability outcome, service level, or compliance scope without current approved evidence. The pricing page lists GDPR compliance and SOC 2 Type II certification; AI-generated legal, compliance, security, and incident claims require human review. (Source: [pricing](https://resend.com/pricing))

## Open questions

- What action is the agreed activation event, and how soon should it happen? Define it around production use, then measure signup-to-event time and the share activating.
- What is the current median time to Hello World, and how is it measured? Track signup to first successful API call, with first-call success rate, over a defined period.
- Which developer segment activates fastest and creates the most value? Compare activation and retention by use case, stack, and company context.
- Which segments should Resend deliberately not serve right now?
- Who typically approves paid adoption, and where does that approval become necessary?
- What are quickstart completion, first-call success, and activation rates? Report values with dates and measurement sources.
- Which community or support channels are active, who answers questions, and what share are answered within 24 hours?
- Which acquisition sources produce activated developers rather than just traffic or signups?
- What are the current SDK repository, changelog, status page, OpenAPI specification, and MCP server links?

<!-- Generated with devrel.md -->