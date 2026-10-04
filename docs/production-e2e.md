# Production end-to-end run

**Status: NOT YET RUN.** This is the checklist for issue #24. It cannot run until production deploys work again (OpenShip's GitHub clone token is invalid, so PR #15 and later merges have not reached devrel.md). Fill in each result as you go, then change the status line to the date, the commit `/healthz` reported and who ran it.

`docs/local-e2e.md` is the earlier, local-only run (28 Sep, retired email unlock flow) and is kept for history only.

## Before you start

- [ ] Deploys work: the latest Deploy workflow run on `main` is green.
- [ ] `curl -s https://devrel.md/healthz` shows the commit you expect, `"status":"ok"`, `"config":"ok"` and `"config_problems":[]`. If `config` is `invalid`, stop and fix the named variables (README, Configuration).
- [ ] Launch budget decided: `DAILY_SPEND_CAP_USD` (currently 2.00, about 600 paid runs at 0.003 USD each) and the production OpenRouter key's own limit (currently 5 USD, resetting daily) agree with each other.
- [ ] Use a real inbox you control for the community steps, for example a `+e2e` alias.

Read-only database checks below run on the box, against the production database container:

```bash
ssh -o BatchMode=yes ubuntu-8gb-hel1.tailbb74a2.ts.net
docker exec -i devrelmd-prod-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Only run `select` statements. Do not edit rows by hand.

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
- [ ] Folk: the person exists, tagged `source: devrel.md` and `community: subscribed`.
- [ ] Open the unsubscribe link from the email. `unsubscribed_at` is now set, Resend marks the contact unsubscribed, and Folk shows `community: unsubscribed`.

## 5. Tracked redirect

The result page no longer links to `/go/audit` (since PR #15); the skill pages and email series do. Use the link directly so the click is easy to find:

- [ ] Open https://devrel.md/go/audit?m=site&c=e2e-production in the browser. It lands on the live devrelbridge.com page with `utm_source=devrel.md&utm_medium=site&utm_campaign=e2e-production`.
- [ ] `select slug, medium, campaign, created_at from clicks order by created_at desc limit 3;` shows the `audit` click with medium `site` and campaign `e2e-production`.

## 6. Clean up

- [ ] Either leave the test subscriber unsubscribed and say so here, or remove it with `infisical run --env=prod -- npm run delete-lead <address>` from a machine that can reach the production database.
- [ ] Record total OpenRouter spend for the run:

## Results

Not yet run.
