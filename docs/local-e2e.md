# Local end-to-end run

Date: 2026-09-28
Branch: `build/v1`, commit `0981261` (the app was rebuilt after this to fix a small Dockerfile/robots-cache issue; the run below is otherwise representative of the current build)

There is no local Postgres for this project. Dev Postgres is a dedicated `postgres:16-alpine` container (`devrelmd-db`) on the home server (`porg`), reachable over the tailnet, with `DATABASE_URL` supplied by the devrel.md Infisical project (dev environment). No Docker was used or started on this machine, per the standing rule.

## Setup

```bash
infisical run --env=dev -- npm run migrate
```

```
apply 001_results.sql
apply 002_attempts.sql
apply 003_leads.sql
apply 004_outbox.sql
apply 005_clicks.sql
apply 006_rate_limits.sql
Migrations up to date.
```

Built and ran the production standalone server (the same artifact the Dockerfile produces), against the real dev database, with `RESEND_API_KEY`, `FOLK_API_KEY` and `RESEND_AUDIENCE_ID` explicitly cleared for this run (Infisical's dev environment now has a Resend key for other purposes; this run tests the unset path the brief asks for):

```bash
infisical run --env=dev -- npx next build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
infisical run --env=dev -- env RESEND_API_KEY= FOLK_API_KEY= RESEND_AUDIENCE_ID= \
  SITE_URL=http://localhost:3311 PORT=3311 node .next/standalone/server.js
```

`GET /healthz` returned `{"status":"ok","build_sha":"0981261"}`.

## Generation 1: https://resend.com

```bash
curl -N -X POST http://localhost:3311/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://resend.com", "turnstileToken": "e2e-test-token"}'
```

Streamed 2,053 `delta` events over 47.1 seconds, then:

```
event: done
data: {"id":"fdcb253169622746","status":"success"}
```

The `attempts` table shows exactly the fallback chain working as designed: the free model hit our own 15-second first-token timeout (OpenRouter itself never errored; it was simply slower than that on this run) and the chain moved on to the paid primary, which succeeded and passed the quality gate on the first try:

| Model | Outcome | First token | Total | Tokens in/out | Cost |
| --- | --- | --- | --- | --- | --- |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | timeout | n/a | 15.0s | n/a | $0 |
| `openai/gpt-6-luna` | success | 13.0s | 29.6s | 16,196 / 3,080 | $0.003564 |

The result (`GET /r/fdcb253169622746.md`, `HTTP 200`) is a well-formed, 122-line DEVREL.md: valid frontmatter (`product: Resend`, `stage: unknown`), all seven required sections in order, a five-row Funnel health table (all `unknown`, which is honest for a page fetched without any account or analytics access), ending with `<!-- Generated with devrel.md -->` and nothing promotional.

`GET /r/fdcb253169622746` (HTML) rendered the frontmatter panel, the stage gates callout ("Fix first: Awareness" and "Next skill to run: developer-funnel-audit", both correctly derived from the funnel table), the raw-Markdown `<details>` toggle, and the email-gated lead form.

## Cache hit

Re-running the identical request for `https://resend.com` returned in 79ms, not another 47 seconds:

```
event: done
data: {"id":"fdcb253169622746","status":"success","cached":true}
```

No new row was written to `attempts` or `results`: the 24-hour URL cache worked.

## Generation 2: https://resend.com/pricing

A second, different URL, to see the free-model timeout and paid fallback again under real conditions and to check the daily spend cap logic reads real data:

| Model | Outcome | First token | Total | Tokens in/out | Cost |
| --- | --- | --- | --- | --- | --- |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | timeout | n/a | 15.0s | n/a | $0 |
| `openai/gpt-6-luna` | success | 12.9s | 29.1s | 15,708 / 2,970 | $0.002874 |

**Total OpenRouter spend for this whole e2e run: $0.006438**, well inside the $0.05 budget and the two-real-runs guidance.

## Lead capture, with Resend and Folk unset

```bash
curl -i -X POST http://localhost:3311/api/lead \
  --data-urlencode "resultId=fdcb253169622746" \
  --data-urlencode "email=e2e-test@example.com" \
  --data-urlencode "company=Acme E2E Test Co" \
  --data-urlencode "role=Founder / CEO" \
  --data-urlencode "teamSize=11 to 50" \
  --data-urlencode "seriesOptIn=on"
```

`303 See Other` back to `/r/fdcb253169622746`, with an unlock cookie set. Server log, in order:

```
[resend:not-configured] would upsert audience contact e2e-test@example.com
[resend:not-configured] would send "Your DEVREL.md for Acme E2E Test Co" to e2e-test@example.com
[series:disabled] would schedule series for lead faa941d72f149012
[folk:not-configured] would push lead e2e-test@example.com (Acme E2E Test Co)
```

The `leads` row: `qualified: true` (Founder / CEO, 11 to 50 people), `series_opt_in: true`, correctly linked to `result_id: fdcb253169622746`. Nothing was sent or pushed, exactly as required when Resend and Folk are unset; the `outbox` table stayed empty because `SERIES_ENABLED=false` skips scheduling rather than sending prematurely.

With the unlock cookie, `GET /r/fdcb253169622746` showed the "Copy and download" panel instead of the lead form, and because the lead is qualified, the single handoff line:

> Want someone to find and fix the break with you? [Book a 20-minute review of this file](/go/audit?m=generator&c=result&t=b2da2ff394c2205453d28f738dcf5799)

`GET /r/fdcb253169622746.md?download=1` returned `Content-Disposition: attachment; filename="DEVREL.md"`.

## Tracked redirects and click logging

```
GET /go/book        -> 302 https://devrelbridge.com/book?utm_source=devrel.md&utm_medium=site
GET /go/audit?m=generator&c=result&t=<lead token>
                     -> 302 https://devrelbridge.com/audit?utm_source=devrel.md&utm_medium=generator&utm_campaign=result&lt=<lead token>
```

Both landed in the `clicks` table with the right slug, medium and campaign.

## What this run did not exercise

- A generation that exhausts the whole chain (both paid models failing or failing the quality gate) and the resulting "friendly error" path. Covered instead by the mocked fallback-order tests in `lib/__tests__/generate.test.ts`.
- The daily spend cap actually tripping, and the circuit breaker actually opening (needs 7 of 10 free-model attempts to fail; this run only made 2). Both are covered by mocked tests (`spendCap.test.ts`, `circuitBreaker.test.ts`) against the exact SQL each reads.
- Sending a real email or a real Folk push (Resend and Folk are correctly unset in this environment, by design).
- The outbox worker actually sending a series email (`SERIES_ENABLED=false`, per the brief, until the copy is approved).
