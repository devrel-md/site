# devrel.md

The open DEVREL.md spec and a free skill library, plus a generator that drafts a DEVREL.md from a product's public docs. Built with Next.js 16 (App Router), TypeScript and Postgres.

## Why it looks the way it does

The site is the file. Every content page (`/`, `/example`, `/template`, `/skills`, `/skills/[name]`, `/privacy`, `/changelog`, `/api`, `/r/[id]`) is a Route Handler, not a React page. Each one:

- Renders the same Markdown to full server-side HTML for browsers.
- Returns the raw Markdown, unchanged, for `curl`, `wget`, `HTTPie` and anything else sending `Accept: text/markdown` or a wildcard `Accept` from a non-browser user agent, or for the matching `<path>.md` route.
- Sends `Vary: Accept, User-Agent` and a `Link: <path.md>; rel="alternate"; type="text/markdown"` header either way.

Only `/generate` (the interactive form) and its `GenerateForm` client component use React for anything beyond the page shell, because that page genuinely needs client-side streaming. Everything else is a plain HTML string built server-side, on purpose: it keeps the negotiation logic in one place (`lib/negotiate.ts`, `lib/contentRoute.ts`) instead of splitting it between a page and a parallel API route.

## Setup

Prerequisites: Node 20+, the [Infisical CLI](https://infisical.com/docs/cli/overview), `gh` (for the submodules, if you need to re-clone them).

There is no local Postgres and no Docker for local development: dev Postgres runs in a dedicated container (`devrelmd-db`, `postgres:16-alpine`) on the home server, reachable over the tailnet, and `DATABASE_URL` for it lives in Infisical. Don't try to run Postgres in Docker on your own machine for this project.

```bash
npm install
infisical run --env=dev -- npm run migrate
infisical run --env=dev -- npm run dev
```

The repo's `.infisical.json` binds it to the devrel.md Infisical project (EU, workspace `be37b6f4-0afa-4772-a1df-e01992b7dc9a`). It holds no secret itself. Secrets only ever come from that project, never from any other. Run every command that touches the database or calls OpenRouter/Resend/Folk through `infisical run --env=dev --`, from this directory or its parent (the CLI walks up to find `.infisical.json`).

Everything also runs with `RESEND_API_KEY`, `FOLK_API_KEY` unset (both log instead of sending/pushing) and the Turnstile keys defaulted to Cloudflare's documented always-pass test pair. See `.env.example` for every variable.

### Content submodules

`content/spec` (`devrel-md/spec`) and `content/skills` (`mplacona/devrel-skills`) are git submodules, both private. The site reads them at request time; it never copies their content by hand. If they are empty after cloning:

```bash
git submodule update --init --recursive
```

## Architecture

```
app/                    Route Handlers (content pages, the generator API, /go, /r/[id])
  generate/             The one React page: the streaming generator form
lib/                    Everything else: content loading, Markdown, negotiation,
                         the SSRF-safe fetcher, the generator's pipeline, email, Folk
db/migrations/          Plain numbered SQL, applied by db/migrate.ts (no ORM)
emails/                 Markdown + frontmatter templates for the result email and
                         the (currently disabled) failing-gate series
content/spec, content/skills   Git submodules: the spec and the skill library
scripts/bakeoff/        The prompt/model bake-off this generator's prompt and
                         quality gate are ported from (kept for reference)
```

### Data

Postgres, `pg`, no ORM. Tables: `results`, `attempts`, `leads`, `outbox`, `clicks`, `rate_limits`. IPs are never stored raw, only `sha256(ip + IP_HASH_SALT)`. `npm run delete-lead -- <email>` removes a lead and their outbox rows, the DELETE path required by the privacy notice.

### The generator's fallback chain

`lib/generate.ts` builds an ordered list of model attempts and works down it, logging every attempt to `attempts` (model, outcome, timing, tokens, cost):

1. **Free**: `nvidia/nemotron-3-ultra-550b-a55b:free`, skipped if the circuit breaker is open (7 of its last 10 logged attempts failed within the last 60 minutes; derived live from the `attempts` table, not separate state, so it self-heals once the cooldown passes).
2. **Paid primary**: `openai/gpt-6-luna`, skipped once today's (UTC) paid spend, summed from `attempts`, reaches `DAILY_SPEND_CAP_USD`.
3. **Paid backup**: `deepseek/deepseek-v4-flash`.

Each call streams from OpenRouter (`lib/openrouter.ts`) with our own first-token timeout (15s free, 30s paid) layered on top of OpenRouter's own `models` fallback array. Every result, technical success or not, runs through `lib/validator.ts` (a line-for-line TypeScript port of `scripts/bakeoff/run.py`'s `validate()`, tested against the same fixtures) before it counts as a success. A quality-gate failure moves to the next model in the chain, which is how "regenerate once on the next paid model" falls out of a single ordered loop rather than special-cased retry logic. If both the circuit breaker and the spend cap are closed, the chain is empty and the request reports `capped` (the "back tomorrow" message plus the no-install prompt) without calling OpenRouter at all. If every model in the chain fails, it reports `exhausted`.

Model IDs and timeouts live in `lib/generatorConfig.ts`, not inline in the call sites.

### Security

`lib/ssrf.ts` is the safe page fetcher: HTTPS only, resolves the hostname and refuses private, loopback, link-local, CGNAT and cloud-metadata IPv4/IPv6 ranges, including after each hop of a manually-followed, capped redirect chain (max 3). `lib/discoverPages.ts` uses it for the input page plus up to five discovered pages (`llms.txt`, docs home, quickstart, pricing, API reference), respecting `robots.txt` and the per-page character caps from the bake-off script.

## Testing

```bash
npm run lint
npm run build
npm test
```

Tests cover content negotiation (browser vs. curl vs. `.md` routes, headers), the SSRF guard (private ranges, blocked redirects), the validator (all 6 bake-off fixtures, asserted against the same problems `scripts/bakeoff/results.json` recorded), the fallback order and circuit breaker (OpenRouter mocked), the spend cap, `/go` redirects with UTM params, lead qualification, and unsubscribe.

## Local end-to-end run

See `docs/local-e2e.md` for a recorded run against the dev database on porg: migrations applied, one real generation against `https://resend.com` through OpenRouter, a lead captured with Resend and Folk unset, and the result page rendering.

## Agent readiness

`docs/agent-readiness-check.md` is a run of our own rubric (`content/skills/skills/agent-readiness-check/references/rubric.md`) against the local production build. See that file for the full checklist and score.

## Deployment

Out of scope for this PR by design. The production `Dockerfile` (Next.js standalone output) is here and builds; nothing here touches OpenShip, the Hetzner box, Cloudflare or DNS.
