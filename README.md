# devrel.md

The open DEVREL.md spec and a free skill library, plus a generator that drafts a DEVREL.md from a product's public docs. Built with Next.js 16 (App Router), TypeScript and Postgres.

## Why it looks the way it does

The site is the file. Every content page (`/`, `/spec`, `/quickstart`, `/example`, `/template`, `/skills`, `/skills/[name]`, `/validate`, `/privacy`, `/changelog`, `/api`, `/r/[id]`) is a Route Handler, not a React page. Each one:

- Renders the same Markdown to full server-side HTML for browsers.
- Returns the raw Markdown, unchanged, for `curl`, `wget`, `HTTPie` and anything else sending `Accept: text/markdown` or a wildcard `Accept` from a non-browser user agent, or for the matching `<path>.md` route.
- Sends `Vary: Accept, User-Agent` and a `Link: <path.md>; rel="alternate"; type="text/markdown"` header either way.

Only `/generate` (the interactive form) and its `GenerateForm` client component use React for anything beyond the page shell, because that page genuinely needs client-side streaming. Everything else is a plain HTML string built server-side, on purpose: it keeps the negotiation logic in one place (`lib/negotiate.ts`, `lib/contentRoute.ts`) instead of splitting it between a page and a parallel API route.

`/` is `content/home.md`, a welcoming page styled like agents.md: generous whitespace, a two-card "Without / With DEVREL.md" comparison, and an FAQ that scans as a list of `<details>` questions rather than a wall of headings (`lib/homeMarkdown.ts` restructures those two sections after the normal Markdown pipeline runs; everything else on the page is the same pipeline as any other page). The full specification lives at `/spec` (moved there from `/` when the home page shipped).

`/validate` (+ `POST /api/validate`) runs the generator's structural check (`lib/validator.ts`, format only) against a pasted DEVREL.md, with a plain-language fix for every problem (`lib/validateExplain.ts`) and the stage-gates summary when the file is parseable enough to have one. It has no source pages, so it never runs the grounding check described under the generator. No login, no storage beyond a rate-limit counter, and its own daily budget separate from the generator's, since it never calls a paid model.

## Setup

Prerequisites: Node 20+ and the [Infisical CLI](https://infisical.com/docs/cli/overview).

There is no local Postgres and no Docker for local development: dev Postgres runs in a dedicated container (`devrelmd-db`, `postgres:16-alpine`) on the home server, reachable over the tailnet, and `DATABASE_URL` for it lives in Infisical. Don't try to run Postgres in Docker on your own machine for this project.

```bash
npm install
infisical run --env=dev -- npm run migrate
infisical run --env=dev -- npm run dev
```

The repo's `.infisical.json` binds it to the devrel.md Infisical project (EU, workspace `be37b6f4-0afa-4772-a1df-e01992b7dc9a`). It holds no secret itself. Secrets only ever come from that project, never from any other. Run every command that touches the database or calls OpenRouter/Resend/Folk through `infisical run --env=dev --`, from this directory or its parent (the CLI walks up to find `.infisical.json`).

Everything also runs with `RESEND_API_KEY`, `FOLK_API_KEY` unset (both log instead of sending/pushing) and the Turnstile keys defaulted to Cloudflare's documented always-pass test pair (`TURNSTILE_SITE_KEY`, `TURNSTILE_SITE_SECRET`; `TURNSTILE_SECRET_KEY` also works, as a fallback for the brief's original naming). See `.env.example` for every variable.

Community signup is double opt-in. The form needs a valid Turnstile token and has its own per-IP daily limit (`rate_limits.kind = 'community'`, `RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY`). A signup is stored as pending and one confirmation email (with the unsubscribe link and `List-Unsubscribe` headers) is sent through Resend; with `RESEND_API_KEY` unset it is only logged, so locally read the `confirm_token` column to build `/api/community/confirm?token=...`. Only pressing the confirm button on that page (a POST, so link scanners cannot confirm) sets `confirmed_at` and syncs to Resend and Folk. Links last 7 days; later signup requests delete expired pending rows. Rows that predate migration 009 are not treated as confirmed. To sync confirmed contacts to a Resend audience for later community broadcasts, configure `RESEND_AUDIENCE_ID` and a full-access `RESEND_API_KEY`. A sending-only key cannot manage contacts. With `FOLK_API_KEY`, the same voluntarily subscribed email is created in Folk (found by email first, so nobody is duplicated), added to a Folk group named "DEVREL.md community" and given an opt-in note; unsubscribing removes them from the group and adds a withdrawal note. The group is looked up by name and never created by the app, so create it in Folk first; if it is missing the person is still synced, without a group, and the log lists the group names Folk has. Each confirmation also retries up to 10 earlier confirmed subscribers whose Folk sync failed, and `infisical run --env=prod -- npm run resync-folk` retries all of them. The database remains the source of consent; the community form never qualifies leads or schedules the old sales series.

### Synced content

`content/spec` and `content/skills` are generated copies of `devrel-md/spec` and `devrel-md/skills`. Never edit them here: change the source repo instead. `content/SOURCES.json` records the commit each copy came from, and `scripts/sync-content.sh` refreshes them and opens a pull request (run it after changing either source). They're plain files (not submodules) so every builder, OpenShip, Dokploy previews and a fresh clone, gets them without extra credentials.

## Configuration

`.env.example` lists every variable. `lib/env.ts` gives each one a local fallback so the app runs with nothing set, which would hide a missing secret in production. `lib/configCheck.ts` closes that gap: when `NODE_ENV=production` at runtime (never during `next build`, dev or tests), a required variable that is missing, empty or still on its development value is reported.

| Variable | Production | If it is wrong in production |
| --- | --- | --- |
| `DATABASE_URL` | Required | Reported; database routes fail. |
| `OPENROUTER_API_KEY` | Required, its own key and credit limit | Reported; every generation fails. |
| `TURNSTILE_SITE_KEY` | Required, not a Cloudflare test key | Reported; test tokens fail real verification. |
| `TURNSTILE_SITE_SECRET` (or `TURNSTILE_SECRET_KEY`) | Required, not a Cloudflare test key | Reported, and every Turnstile check is refused (generator and community signup), so nothing can bypass the bot check. |
| `IP_HASH_SALT` | Required, not `local-dev-salt` | Reported. |
| `CRON_SECRET` | Required, not `local-dev-cron-secret` | Reported, and `/api/cron/outbox` answers 503 to everyone. |
| `SITE_URL` | Required, an https URL, not localhost | Reported. |
| `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `EMAIL_FROM`, `FOLK_API_KEY` | Optional | Start-up warning only. Audience sync needs a full-access Resend key. |
| `TRUSTED_PROXY_HOPS` | Optional; the default 1 matches the OpenShip edge alone. Production is behind Cloudflare too and sets 2 | Not checked (see Data, below). |

How a problem surfaces, without ever showing a value:

- Start-up (`instrumentation.ts`) logs `PRODUCTION CONFIGURATION INVALID` with each variable name and reason, plus a warning per unset optional integration.
- `/healthz` keeps `status: "ok"` and the exact `build_sha` (it is a liveness check and touches neither the database nor any third party), and adds `config` (`ok`, `invalid`, or `unchecked` outside production) and `config_problems` (names only).
- `scripts/openship-deploy.py` lets a verified deploy finish, then fails the job with an error annotation naming the variables, so the problem is visible without the site going down.

To set or fix production variables, put the value in Infisical `prod` first, then copy it into OpenShip without printing it. From this directory on a Mac (after `infisical login`), naming each variable to copy:

```bash
infisical export --env=prod --format=json \
  | ssh -o BatchMode=yes ubuntu-8gb-hel1.tailbb74a2.ts.net \
      "python3 -c \"\$(echo $(base64 < scripts/openship-set-env.py | tr -d '\n') | base64 -d)\" RESEND_API_KEY"
```

`scripts/openship-set-env.py` runs on the box, reads the export from stdin, refuses empty values and development defaults, and prints only the names it set. Setting variables does not redeploy: rerun the Deploy workflow (or merge to `main`), then check that `/healthz` reports `config: "ok"`.

## Architecture

```
app/                    Route Handlers (content pages, the generator API, /go, /r/[id])
  generate/             The one React page: the streaming generator form
lib/                    Everything else: content loading, Markdown, negotiation,
                         the SSRF-safe fetcher, the generator's pipeline, email, Folk
db/migrations/          Plain numbered SQL, applied by db/migrate.ts (no ORM)
emails/                 Markdown + frontmatter templates from the retired email flow
                         (result email, failing-gate series). Nothing schedules them now
content/spec, content/skills   Synced copies of the spec and the skill library
scripts/bakeoff/        The prompt/model bake-off this generator's prompt and
                         quality gate are ported from (kept for reference)
```

### Data

Postgres, `pg`, no ORM. Tables: `results`, `attempts`, `community_subscribers` (consent, confirmation and unsubscribe state for the optional community signup), legacy `leads` and `outbox` (the retired unlock flow; nothing writes to them now), `clicks`, `cache_hits` (one row per result served from the 24 hour cache, with no visitor data), `rate_limits` (keyed by IP hash, day and `kind`, so the generator and the validator have separate daily budgets). IPs are never stored raw, only `sha256(ip + IP_HASH_SALT)`. The client IP is the `X-Forwarded-For` entry that many places from the right as `TRUSTED_PROXY_HOPS` (default 1, the OpenShip edge, which appends the peer address); entries further left are client-controlled and ignored. IPv6 is keyed on its /64. A request with no trustworthy address shares one strict bucket (2 generations and 10 validations a day in total). `npm run delete-lead -- <email>` removes a subscriber or legacy lead and their outbox rows. `results` also records the host, pages read, whether the page may be indexed and any opt-out; `npm run exclude-host -- <host> [--delete]` actions a removal request (see `docs/result-pages.md`). `npm run launch-metrics -- [--since YYYY-MM-DD] [--json]` reports generations (fresh and cached), model cost, community signups and unsubscribes, and `/go` clicks per UTC day and in total (see `docs/metrics.md`, which also explains how the public DEVREL.md repository count is measured).

### The generator's fallback chain

`lib/generate.ts` builds an ordered list of model attempts and works down it, logging every attempt to `attempts` (model, outcome, timing, tokens, cost):

1. **Free**: `nvidia/nemotron-3-ultra-550b-a55b:free`, skipped if the circuit breaker is open (7 of its last 10 logged attempts failed within the last 60 minutes; derived live from the `attempts` table, not separate state, so it self-heals once the cooldown passes).
2. **Paid primary**: `openai/gpt-6-luna`, skipped once today's (UTC) paid spend, summed from `attempts`, reaches `DAILY_SPEND_CAP_USD`.
3. **Paid backup**: `deepseek/deepseek-v4-flash`.

Each call streams from OpenRouter (`lib/openrouter.ts`) with our own first-token timeout (15s free, 30s paid) layered on top of OpenRouter's own `models` fallback array. Every result, technical success or not, runs through `lib/validator.ts` (a line-for-line TypeScript port of `scripts/bakeoff/run.py`'s `validate()`, tested against the same fixtures) before it counts as a success. It then runs through `lib/grounding.ts`, which is number matching and not fact checking: a current value (anything not labelled a target) passes only if the number, in a compatible unit, appears in the fetched pages next to a word that describes the same metric, or the same line cites a fetched page that states it. A gate threshold or an unrelated figure never supports a current value, and targets and proposals may only restate a number from the pages, one of the spec's default gate thresholds, or a placeholder. A quality-gate failure moves to the next model in the chain, which is how "regenerate once on the next paid model" falls out of a single ordered loop rather than special-cased retry logic. If both the circuit breaker and the spend cap are closed, the chain is empty and the request reports `capped` (the "back tomorrow" message plus the no-install prompt) without calling OpenRouter at all. If every model in the chain fails, it reports `exhausted`.

Model IDs and timeouts live in `lib/generatorConfig.ts`, not inline in the call sites.

### Security

`lib/ssrf.ts` is the safe page fetcher: HTTPS only, resolves the hostname and refuses private, loopback, link-local, CGNAT and cloud-metadata IPv4/IPv6 ranges, including after each hop of a manually-followed, capped redirect chain (max 3). `lib/discoverPages.ts` uses it for the input page plus up to five discovered pages (`llms.txt`, docs home, quickstart, pricing, API reference), respecting `robots.txt` and the per-page character caps from the bake-off script.

Every response carries HSTS, `X-Content-Type-Options: nosniff`, a `Referrer-Policy` and `X-Frame-Options: DENY` (static, from `next.config.ts` via `lib/securityHeaders.ts`), plus a `Content-Security-Policy` built per request in `proxy.ts` from `lib/csp.ts`. Scripts are allowed by nonce (Next's own inline scripts and the Turnstile `<Script>`) and by SHA-256 hash (our fixed inline scripts in `renderPage`, the layout and the result page), with no `unsafe-inline` or `unsafe-eval`. If you add an inline script, add its text to `INLINE_SCRIPTS` in `lib/csp.ts`; `lib/__tests__/csp.test.ts` fails if a rendered page carries one that is not covered. New third-party origins must be added to the policy deliberately.

Generated Markdown (`/r/[id]`) is rendered with raw HTML dropped, and `lib/markdown.ts` also keeps only http, https, mailto and relative links and replaces non-same-origin images with their alt text. Tests with hostile input are in `lib/__tests__/markdownSanitise.test.ts` and `app/__tests__/freeResult.test.ts`.

## Testing

```bash
npm run lint
npm run build
npm test
```

Tests cover content negotiation (browser vs. curl vs. `.md` routes, headers, including `/`, `/spec` and `/validate`), the SSRF guard (private ranges, blocked redirects), the validator (all 6 bake-off fixtures, asserted against the same problems `scripts/bakeoff/results.json` recorded), the fallback order and circuit breaker (OpenRouter mocked), the spend cap, `/go` redirects with UTM params, the free result page (raw Markdown, Copy and Download for everyone), the optional community signup and its consent rules, unsubscribe, the retired unlock endpoint returning 410, the legacy lead qualification rules, `POST /api/validate` (both body formats, the rate limit, its own budget separate from the generator's), and the home page's FAQ/comparison restructuring.

## Local end-to-end run

`docs/local-e2e.md` preserves a historical generator run; its email unlock steps describe the retired flow. The current checklist is `docs/production-e2e.md`, to be run against production once deploys work again. Before sending a community broadcast, reconcile the active Postgres subscriptions with the Resend audience and the Folk group (`npm run resync-folk` fills in missing Folk contacts), especially if a sync call previously failed.

## Agent readiness

`docs/agent-readiness-check.md` is a run of our own rubric (`content/skills/skills/agent-readiness-check/references/rubric.md`) against the local production build. See that file for the full checklist and score.

## Deployment

Merging to `main` deploys to production automatically, but only after CI passes. Two workflows are involved:

- `.github/workflows/ci.yml` runs on every pull request and on every push to `main`: `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`, on a GitHub-hosted runner with no secrets and no database. Its job is named `ci`, and that is the check a pull request must pass.
- `.github/workflows/deploy.yml` starts when CI finishes on `main`, and only if it succeeded for a push. It deploys that same commit. It has two jobs. `migrate` runs on a self-hosted runner on ubuntu-4gb-fsn1, the server that hosts the app and its database. `deploy` then runs on a self-hosted runner on ubuntu-8gb-hel1, the OpenShip control plane, the only place OpenShip's API can be reached from. Deploys are serialised: a second one waits for the first rather than overlapping it. A deploy run first checks that its commit is still the tip of `main` and, if `main` has moved on, deploys nothing (an annotation names the newer commit, whose own run deploys it), so CI runs that finish out of order cannot put an older commit over a newer one. If CI fails on `main`, nothing deploys.

For each deploy, in order:

1. **Migrations first.** The fsn1 runner applies any pending `db/migrations/*.sql` to the production database with `db/migrate.ts`, inside a `node:22-alpine` container on the host network (the box has no Node). The connection string comes from a credentials file on the runner, not from GitHub secrets. If a migration fails, the job stops and nothing deploys.
2. **Deploy.** `scripts/openship-deploy.py` sets `GIT_COMMIT_SHA` to the commit CI ran on, asks OpenShip to build and release exactly that commit, refuses to start while a previous build is still running, and waits for OpenShip to report it ready.
3. **Health check.** The script then polls `/healthz` for up to two minutes until it returns `status: ok` with a `build_sha` equal to that commit. If it never does, the job fails.

A deploy is only finished when `/healthz` reports the commit you merged. Check it before telling anyone a change is live:

```bash
curl -s https://devrel.md/healthz
```

Because migrations run before the new code does, keep every migration additive (new tables and columns, no drops or renames in the same change as the code that stops using them) so the version still running keeps working in between.

### Previews

Every pull request gets a preview deployment, and the preview tool posts its address as a comment on the pull request. Previews are separate from the production deploy above: they are built from the pull request branch and never touch production. CI runs on the pull request alongside the preview.

### Backups

The production database is backed up nightly, encrypted, to object storage. `ops/backup/README.md` documents what runs, where the keys live, how to install the job on the host and how to restore.

### Rolling back

The deploy workflow always deploys a single commit. Its manual trigger (`workflow_dispatch`) takes no inputs and only runs on `main`, so running it by hand redeploys the current head of `main`, not an earlier commit. It skips CI, so use it only for a commit that has already passed.

- **Normal route:** open a pull request that reverts the bad change (`git revert`), merge it once `ci` passes, and let the usual deploy run. Then confirm `/healthz` reports the revert commit.
- **Not an option:** re-running the `Deploy` run for an earlier commit. A re-run keeps the commit of the original run, so the head-of-`main` guard skips it and deploys nothing.
- **The database is not rolled back.** Migrations only go forward, and additive migrations leave older code working against the newer schema. If data itself is damaged, restore from a backup as described in `ops/backup/README.md`.
