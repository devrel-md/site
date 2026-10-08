# Privacy

This is a short, plain notice, not a legal document dressed up as one.

## What we store

- **The generator.** The URL you submit, the generated DEVREL.md file, its funnel gates, which model produced it, and what it cost to generate. We store your IP address only as a one-way hash (`sha256(ip + salt)`), never the address itself, and only to enforce a daily rate limit and to log the tracked link clicks below.
- **Community updates.** You can read, copy and download a result without an email address. If you separately choose to join community updates, we store your email address, when you asked, when you confirmed, a one-off confirmation token, an unsubscribe token and when you unsubscribed. The form asks for no company, role or team size. It uses a Cloudflare Turnstile check, and your IP address is stored only as the same one-way hash, to enforce a daily limit on signups.
- **The retired unlock form.** An earlier version of the site asked for an email address, company, role and team size before you could copy or download a result. We no longer collect any of this, nothing uses those records, and we will delete them. You can ask hello@devrel.md to delete your record now.
- **Tracked links.** When you follow a `/go/...` link (for example, to book a review), we log the slug, the campaign, a timestamp, the hashed IP and whether the request looked automated (worked out from its headers at the time, which we don't keep), so we know which content leads to a conversation.

## Generated results and search engines

A result page is an automated draft built only from the public pages of the site you gave us. Every page says when it was generated, from how many pages, and that it is a starting point, not an audit. A result is open to search engines only when the draft passed our checks and states at least one fact that came from those pages; every other result is sent with `noindex`. If a company publishes its own DEVREL.md at `/DEVREL.md` or `/.well-known/DEVREL.md` and it validates, the result page points to it as the canonical version.

A site owner can opt out by disallowing `devrel.md-generator` in their robots.txt. We then refuse new runs for that site, mark its existing results as not to be indexed, and do not serve a cached copy. Results are kept until someone asks for removal; we do not delete them automatically.

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

Email hello@devrel.md to request deletion of your community record or a generated result. If you speak for the company a result describes, say so and we will take down every result for your site and stop anyone generating a new one, usually within a working day. The confirmation email also gives you an immediate unsubscribe link.

## Unsubscribe

The confirmation email and every community email carry an unsubscribe link, and a `List-Unsubscribe` header so your mail app can offer one-click unsubscribe. Unsubscribing marks your record inactive and also updates the Resend audience and Folk when configured. We keep the record, with your address, so that we do not email you again; ask hello@devrel.md to delete it entirely.
