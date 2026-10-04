# Privacy

This is a short, plain notice, not a legal document dressed up as one.

## What we store

- **The generator.** The URL you submit, the generated DEVREL.md file, its funnel gates, which model produced it, and what it cost to generate. We store your IP address only as a one-way hash (`sha256(ip + salt)`), never the address itself, and only to enforce a daily rate limit and to log the tracked link clicks below.
- **Community updates.** You can read, copy and download a result without an email address. If you separately choose to join community updates, we store your email address, when you asked, when you confirmed, a one-off confirmation token, an unsubscribe token and when you unsubscribed. The form asks for no company, role or team size. It uses a Cloudflare Turnstile check, and your IP address is stored only as the same one-way hash, to enforce a daily limit on signups.
- **Tracked links.** When you follow a `/go/...` link (for example, to book a review), we log the slug, the campaign, a timestamp and the hashed IP, so we know which content leads to a conversation.

## Why

To run the generator and, only if you ask and then confirm, send occasional DEVREL.md community updates. A community signup is not a request for sales contact. Nothing here is sold or shared with anyone outside DevRel Bridge, other than the processors below.

## Who else touches it

- **OpenRouter**, to run the model that writes your file. Your submitted pages and the generated file pass through it; nothing else does.
- **Resend**, to send you the one confirmation email and to hold confirmed community contacts in an email audience so we can send updates. Your address is added to the audience only after you click the confirmation link. The site keeps its own consent and unsubscribe record. If Resend audience access is not configured, the confirmed signup stays in our database without syncing.
- **Cloudflare Turnstile** checks that a signup comes from a person. It runs in your browser on the form and receives the check result and your IP address.
- **Folk**, our contact database, receives a confirmed, voluntarily subscribed email tagged as a DEVREL.md community contact when configured, and never before you confirm. This consent does not create a deal or opt you into sales messages. We update a linked Folk contact when you withdraw consent.

## Confirming your signup

Submitting the form does not subscribe you. We send one email with a confirmation link, and you are subscribed only when you open it and press the confirm button. The link works for 7 days. If you never confirm, nothing is sent to you, nothing is added to Resend or Folk, and the unconfirmed record is deleted by a later signup request after the link expires. Entering someone else's address does not subscribe them. Asking again for an address that is waiting to confirm does not send another email for 10 minutes.

## How to delete your data

Email hello@devrel.md to request deletion of your community record or a generated result. The confirmation email also gives you an immediate unsubscribe link.

## Unsubscribe

The confirmation email and every community email carry an unsubscribe link, and a `List-Unsubscribe` header so your mail app can offer one-click unsubscribe. Unsubscribing marks your record inactive and also updates the Resend audience and Folk when configured. We keep the record, with your address, so that we do not email you again; ask hello@devrel.md to delete it entirely.
