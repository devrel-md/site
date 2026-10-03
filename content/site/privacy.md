# Privacy

This is a short, plain notice, not a legal document dressed up as one.

## What we store

- **The generator.** The URL you submit, the generated DEVREL.md file, its funnel gates, which model produced it, and what it cost to generate. We store your IP address only as a one-way hash (`sha256(ip + salt)`), never the address itself, and only to enforce a daily rate limit and to log the tracked link clicks below.
- **Community updates.** You can read, copy and download a result without an email address. If you separately choose to join community updates, we store your email address, when you consented, an unsubscribe token and when you unsubscribed. The form asks for no company, role or team size.
- **Tracked links.** When you follow a `/go/...` link (for example, to book a review), we log the slug, the campaign, a timestamp and the hashed IP, so we know which content leads to a conversation.

## Why

To run the generator and, only if you ask, send occasional DEVREL.md community updates. A community signup is not a request for sales contact. Nothing here is sold or shared with anyone outside DevRel Bridge, other than the processors below.

## Who else touches it

- **OpenRouter**, to run the model that writes your file. Your submitted pages and the generated file pass through it; nothing else does.
- **Resend**, to hold opted-in community contacts in an email audience so we can send updates. The site keeps its own consent and unsubscribe record. If Resend audience access is not configured, the signup stays in our database without syncing.
- **Folk**, our contact database, receives a voluntarily subscribed email tagged as a DEVREL.md community contact when configured. This consent does not create a deal or opt you into sales messages. We update a linked Folk contact when you withdraw consent.

## How to delete your data

Email hello@devrel.md to request deletion of your community record or a generated result. The signup confirmation also gives you an immediate unsubscribe link.

## Unsubscribe

You can unsubscribe with the link shown when you sign up. Community emails will carry an unsubscribe link. Unsubscribing marks your record inactive and also updates the Resend audience when configured.
