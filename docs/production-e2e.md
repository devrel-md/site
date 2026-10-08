# Production end-to-end run

**Status: passed, 7 and 8 Oct 2026**, run by Marcos against production behind Cloudflare (commits `574ef38` to `39c5585`). Every section passed; see Results. This is the checklist for issue #24.

`docs/local-e2e.md` is the earlier, local-only run (28 Sep, retired email unlock flow) and is kept for history only.

## Before you start

- [ ] Deploys work: the latest deploy of `main` succeeded.
- [ ] `curl -s https://devrel.md/healthz` shows the commit you expect, `"status":"ok"`, `"config":"ok"` and `"config_problems":[]`. If `config` is `invalid`, stop and fix the named variables (README, Configuration).
- [ ] Launch budget decided: `DAILY_SPEND_CAP_USD` (currently 2.00, about 600 paid runs at 0.003 USD each) and the production OpenRouter key's own limit (currently 5 USD, resetting daily) agree with each other.
- [ ] Use a real inbox you control for the community steps, for example a `+e2e` alias.

Read-only database checks below run in `psql` against the production database, from wherever a maintainer can reach it. Only run `select` statements. Do not edit rows by hand.

## 1. One real generation, in a browser

- [ ] Open https://devrel.md/generate in a normal browser (not a script), let Turnstile pass, and generate for a public product URL that has not been generated in the last 24 hours.
- [ ] The stream completes and lands on `/r/<id>`. Result id:
- [ ] `select model, outcome, cost_usd from attempts order by created_at desc limit 5;` shows the attempt(s) for this run. Models and cost:

## 2. The result page, anonymously

In a private window with no cookies:

- [ ] `/r/<id>` shows the file, with copy and download available without any signup.
- [ ] Copy puts the full Markdown on the clipboard.
- [ ] Download saves `DEVREL.md`. `curl -sI "https://devrel.md/r/<id>.md?download=1"` shows `Content-Disposition: attachment; filename="DEVREL.md"`.
- [ ] `curl -s https://devrel.md/r/<id>.md` returns the raw Markdown.

## 3. The 24 hour cache

- [ ] Generate again for the same URL. It returns the same result id immediately, and `attempts` gains no new row for it.

## 4. Community signup (double opt-in) and unsubscribe

- [ ] From the result page, subscribe with the real inbox, the consent box ticked and Turnstile passed. The page says to check the inbox and that you are not subscribed until you click the link.
- [ ] Exactly one confirmation email arrives, from the `mail.devrel.md` sender, with links to `https://devrel.md` (not localhost) and an unsubscribe link. Gmail or similar shows a one-click unsubscribe option (List-Unsubscribe headers).
- [ ] Before confirming: `select email, consented_at, confirmed_at, unsubscribed_at, folk_person_id is not null as in_folk from community_subscribers where email = '<address>';` shows the row pending (`confirmed_at` empty, not in Folk), and the address is not yet in the Resend audience or Folk.
- [ ] Click the confirmation link. The page says you are subscribed, and the same query now shows `confirmed_at` set and `in_folk` true.
- [ ] Resend: the address is in the community audience (Resend dashboard, Audiences). Needs a full-access `RESEND_API_KEY`; with a sending-only key the app logs "Resend audience upsert skipped" instead.
- [ ] Folk: the person exists, is in the "DEVREL.md community" group and has an opt-in note.
- [ ] Open the unsubscribe link from the email. `unsubscribed_at` is now set, Resend marks the contact unsubscribed, and Folk has removed them from the "DEVREL.md community" group and added a withdrawal note.

## 5. Tracked redirect

The result page no longer links to `/go/audit` (since PR #15); the skill pages do. Use the link directly so the click is easy to find:

- [ ] Open https://devrel.md/go/audit?m=site&c=e2e-production in the browser. It lands on the live devrelbridge.com page with `utm_source=devrel.md&utm_medium=site&utm_campaign=e2e-production`.
- [ ] `select slug, medium, campaign, created_at from clicks order by created_at desc limit 3;` shows the `audit` click with medium `site` and campaign `e2e-production`.

## 6. Clean up

- [ ] Either leave the test subscriber unsubscribed and say so here, or remove it with `infisical run --env=prod -- npm run delete-subscriber -- <address>` from a machine that can reach the production database.
- [ ] Record total OpenRouter spend for the run:

## Results

7 Oct 2026, production behind Cloudflare, commit `574ef38`. Checked by Marcos in a browser and by read-only database queries.

- Before you start: deploy green ("Deployed and health-verified 574ef3834d71"); `/healthz` `config: ok`. Launch budget decided by Marcos: keep `DAILY_SPEND_CAP_USD=2.00`; the OpenRouter key's 5 USD daily limit is the hard cap.
- 1. Generation: passed. Result `bf91b25fc551e7e1` for `https://docs.replay.io/basics/replay-qa/overview`. Attempts: `nvidia/nemotron-3-ultra-550b-a55b:free` timed out, then `openai/gpt-6-luna` succeeded at 0.003064 USD. The rate-limit row is keyed to the visitor's real address (no "no trustworthy client address" warnings in the logs).
- 2. Result page: `/r/bf91b25fc551e7e1` 200; `.md?download=1` sends `Content-Disposition: attachment; filename="DEVREL.md"`; `.md` returns the raw Markdown. Copy not separately recorded.
- 3. 24 hour cache: passed. A second generation for the same URL at 14:51:34 returned the existing result and added no attempt row.
- 4. Community: passed on 8 Oct with a new Gmail address. Subscribed 08:01:01, confirmation email sent, confirmed 08:01:20 (added to Folk), unsubscribed 08:01:36. Resend audience and Folk group removal checked by Marcos.
- 5. Tracked redirect: passed. `/go/audit?m=site&c=e2e-production` logged slug `audit`, medium `site`, campaign `e2e-production` at 08:01:48 on 8 Oct. Separately, home page `/go/book` clicks in pairs turned out to be crawlers, not visitors; since PR #52 clicks carry `likely_bot` and `robots.txt` disallows `/go/` (a `curl` check click was flagged).
- 6. Clean up: the 8 Oct test subscriber is left unsubscribed. OpenRouter spend for the run: 0.003064 USD.

Behind Cloudflare since 7 Oct: production runs with `TRUSTED_PROXY_HOPS=2`. A validate request through Cloudflare with a forged `X-Forwarded-For: 1.2.3.4, 5.6.7.8` landed in the visitor's real bucket.
