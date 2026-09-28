# Privacy

This is a short, plain notice, not a legal document dressed up as one.

## What we store

- **The generator.** The URL you submit, the generated DEVREL.md file, its funnel gates, which model produced it, and what it cost to generate. We store your IP address only as a one-way hash (`sha256(ip + salt)`), never the address itself, and only to enforce a daily rate limit and to log the tracked link clicks below.
- **The email form.** If you choose to see the copy and download buttons on a result, we store the email, company, role and team size you give us, and whether you asked for the 5-email series on fixing a failing stage gate. Ticking that box is optional and off by default.
- **Tracked links.** When you follow a `/go/...` link (for example, to book a review), we log the slug, the campaign, a timestamp and the hashed IP, so we know which content leads to a conversation.

## Why

To run the generator, send you the file you asked for, and understand which parts of devrel.md are useful enough that people want a human to look at their result. Nothing here is sold or shared with anyone outside DevRel Bridge, other than the processors below.

## Who else touches it

- **OpenRouter**, to run the model that writes your file. Your submitted pages and the generated file pass through it; nothing else does.
- **Resend**, to send the result email and, if you opt in, the series. If `RESEND_API_KEY` is not configured (as in local development), no email is sent and this step is logged instead.
- **Folk**, to give a human a place to see a qualified, opted-in lead before reaching out. Only qualified leads who ticked the series checkbox are pushed, and only the fields shown on the form.

## How to delete your data

Email hello@devrel.md and ask, or unsubscribe below and we'll remove your contact record on request. Generated results are not personal data on their own (they describe a product, not a person) and stay up as part of the public archive unless you ask us to take one down.

## Unsubscribe

Every email from devrel.md carries a one-click unsubscribe link and a `List-Unsubscribe` header. It works without logging in and stops both the result follow-up and the series immediately.
