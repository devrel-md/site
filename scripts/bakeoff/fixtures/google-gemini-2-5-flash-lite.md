```yaml
---
spec: devrel.md/0.1
product: Resend
url: https://resend.com
stage: growth
updated: 2026-09-28
owner: devrel@resend.com
---

# DEVREL.md

Resend is an email API for developers, offering a modern, reliable, and developer-friendly alternative to traditional email sending services. It competes in the email API and transactional email service market.

## Value proposition

Send transactional and marketing emails reliably with a developer-first API and SDKs, without the complexity of managing email infrastructure.

## ICPs

### Developers building web applications

- **Technical context:** Node.js, Python, Go, Ruby, PHP, Java, .NET, Rust, Elixir, Swift, Kotlin. Frameworks like Express, Next.js, Remix, Nuxt, SvelteKit, Laravel, Rails, Django, Flask, FastAPI, Spring Boot, ASP.NET Core, Axum, Phoenix.
- **Company stage and team size:** Startups to mid-sized companies, 1-50 developers.
- **Use case:** Sending transactional emails (e.g., password resets, order confirmations, welcome emails), marketing emails, notifications, and alerts.
- **Decision:** Developers can often adopt Resend independently for transactional emails. Marketing teams or product managers may need to approve for marketing campaigns.
- **Activation event:** Successfully sending an email to a real recipient (not a test address) using a verified domain. Target time: 15 minutes from signup.

### Developers integrating with third-party services

- **Technical context:** Developers using platforms like Auth0, Customer.io, Django, Liferay, Metabase, NextAuth, Nodemailer, PHPMailer, Rails, Retool, Supabase, WordPress, Railway, Encore, Vercel Functions, Cloudflare Workers, Deno Deploy, AWS Lambda.
- **Company stage and team size:** Startups to mid-sized companies, 1-50 developers.
- **Use case:** Replacing or augmenting existing email sending capabilities within these platforms, leveraging Resend's deliverability and API.
- **Decision:** Developers can often integrate Resend via SMTP or SDKs independently.
- **Activation event:** Successfully sending an email through an integrated third-party service using Resend. Target time: 30 minutes from setup.

## Anti-personas

- Companies with complex, legacy on-premises email infrastructure requirements that cannot be met by cloud-based APIs.
- Developers primarily focused on building desktop applications without a web component.
- Users who require extensive, highly customized email deliverability consulting beyond Resend's standard offerings.

## North Star

- **Time to Hello World:** 15 min median today, 5 min target
- **Measured:** Signup to first successful API call sending an email to a real recipient using a verified domain.
- **First success means:** An email is successfully sent and received by a non-test email address, confirming basic integration and deliverability.

## Activation

- **Event:** Successfully sending an email to a real recipient (not a test address) using a verified domain.
- **Target time:** 15 minutes from signup.
- **Current rate:** unknown

## Funnel health

| Stage | Gate | Now | Pass |
| --- | --- | --- | --- |
| Awareness | Signups come from quality sources, not just traffic | unknown | unknown |
| Onboarding | Median time to first call < 5 min and first-call success > 80% | unknown | unknown |
| Activation | Activation rate > 20% and production usage measurable | unknown | unknown |
| Engagement | Community answers > 65% of questions within 24h | unknown | unknown |
| Monetization | Paying deepens trust rather than replacing it | unknown | unknown |

## Docs map

- **Quickstart:** [Send emails with Node.js](https://resend.com/docs/send-with-nodejs.md) (and many other languages/frameworks)
- **API Reference:** [Introduction](https://resend.com/docs/api-reference/introduction.md)
- **Use-case Guides:** Extensive guides for various frameworks, platforms, and features like sending broadcasts, receiving emails, and using templates.
- **SDK Repos:** Not explicitly listed, but implied by the documentation.
- **Supported Languages:** Node.js, Python, Go, Ruby, PHP, Java, .NET, Rust, Elixir, Swift, Kotlin.
- **Changelog:** Not explicitly linked, but implied by product updates.
- **Status Page:** Not explicitly linked.
- **llms.txt:** [https://resend.com/docs/llms.txt](https://resend.com/docs/llms.txt)
- **OpenAPI Spec:** Not explicitly linked.
- **MCP server:** [https://resend.com/docs/mcp-server](https://resend.com/docs/mcp-server)

## Business model

- **Model:** Freemium with usage-based overages.
- **Tiers:** Free, Pro, Scale, Enterprise.
- **Free Tier:** 100 emails/day, 3 custom domains.
- **Paid Tiers:** Offer higher limits, more domains, dedicated IPs, priority support, and advanced features.
- **Add-ons:** Additional domains, dedicated IPs, Single Sign-On.
- **Pricing Link:** [https://resend.com/pricing](https://resend.com/pricing)
- **Paywall:** Developers encounter limits on the free tier for daily sending volume and custom domains.

## Competitors

- **SendGrid:** A long-standing leader in email APIs, offering a comprehensive suite of features.
- **Mailgun:** Another established player with a strong focus on deliverability and developer tools.
- **Amazon SES:** A cost-effective option for high-volume sending, but with a steeper learning curve.
- **Postmark:** Known for excellent deliverability for transactional emails.
- **Brevo (formerly Sendinblue):** Offers a broader marketing platform including email sending.

## Open questions

- What is the current median time to first API call for a new developer?
- What is the first-call success rate for new developers?
- What is the current activation rate for new developers?
- What are the primary sources of developer signups?
- What is the current community engagement level (e.g., questions asked/answered on Discord/forums)?
- What is the current monetization funnel conversion rate (e.g., free to paid)?
- Are there specific metrics being tracked for each stage of the funnel?

---
<!-- Generated with devrel.md -->
```

**Stage gates**
| Stage | Pass | Why |
| --- | --- | --- |
| Awareness | unknown | Unknown sources of signups. |
| Onboarding | unknown | Median time to first call and first-call success are unknown. |
| Activation | unknown | Activation rate and production usage are unknown. |
| Engagement | unknown | Community engagement metrics are unknown. |
| Monetization | unknown | Monetization funnel metrics are unknown. |

**Fix first:** Awareness, Onboarding, Activation, Engagement, and Monetization are all unknown. Onboarding is typically the first bottleneck to address after initial awareness.

**Most useful unknowns to fill:**
1.  **Time to Hello World:** This is crucial for understanding the initial developer experience. Measure signup to the first successful API call sending an email to a real recipient.
2.  **Activation Event & Rate:** Understanding what constitutes "real adoption" and how many developers reach it is key to growth.
3.  **Onboarding Metrics:** Median time to first call and first-call success rate are critical indicators of onboarding friction.

**Next skills to run:**
- quickstart-friction-check: unknown
- agent-readiness-check: unknown