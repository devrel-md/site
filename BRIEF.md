# devrel.md site: build brief

Owner: Marcos Placona, DevRel Bridge. Status: approved to build locally on 2026-09-28. Deployment is a separate, approved step.

## Why this exists

devrel.md hosts the open DEVREL.md spec and a free skill library built from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona. It is generous and genuinely useful, and its business purpose is to bring qualified clients to DevRel Bridge (default handoff: the Developer Adoption Audit) and recognition to Marcos. It must never feel like a lead-farming trick.

Audience: developer-facing B2B companies (APIs, SDKs, AI tools, infrastructure). Buyers are founders and heads of product, marketing or growth. Indie builders use it too, and are welcome, but aren't leads.

## Stack

- Next.js 16 (App Router), TypeScript, React 19. Read `node_modules/next/dist/docs/` before writing code: this version has breaking changes.
- Postgres via `pg` with plain SQL migrations in `db/migrations/NNN_name.sql` and a tiny migration runner. No ORM.
- Local dev: `docker compose` with `postgres:16-alpine`.
- The spec and skills come from the private repos `devrel-md/spec` and `devrel-md/skills`, synced into the site as generated copies at `content/spec` and `content/skills`. The site reads them at build time. Never copy their content by hand.
- Deployment target: OpenShip on the Hetzner box, behind Cloudflare. Build a production `Dockerfile` (Next.js standalone output). Don't write deploy workflows or touch the server; that's a later, approved step.
- UK English in all copy. No em dashes, en dashes or double hyphens anywhere: copy, code comments, commit messages. Commit messages and PRs carry no AI attribution lines.

## Pages and serving

The site is the file. Every page exists as Markdown first.

| Route | Content |
| --- | --- |
| `/` | `content/spec/SPEC.md`. The spec IS the home page |
| `/example` | `content/spec/examples/acme-vector.DEVREL.md` |
| `/template` | `content/spec/TEMPLATE.md` |
| `/skills` | Catalog built from each skill's SKILL.md frontmatter: name, description, book chapters, install commands |
| `/skills/[name]` | That skill's SKILL.md |
| `/generate` | The generator (below) |
| `/r/[id]` | A generated result |
| `/privacy` | Short, plain privacy notice (what we store, why, how to delete, unsubscribe) |
| `/llms.txt`, `/llms-full.txt` | Standard llms.txt index and full-content export |
| `/sitemap.xml`, `/robots.txt` | Allow all, explicitly including GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended |
| `/healthz` | `{"status":"ok","build_sha":"<GIT_COMMIT_SHA>"}` |
| `/go/[slug]` | Tracked redirects (below) |

Content negotiation for every content page:
- `Accept: text/markdown`, or a request for `<path>.md` (`/index.md` for the root), returns the raw Markdown with `Content-Type: text/markdown; charset=utf-8`.
- `curl`, `wget`, `HTTPie` and similar non-browser user agents with `Accept: */*` also get Markdown, so `curl devrel.md` prints the spec.
- Browsers get the same Markdown rendered to HTML on the server, with no client JavaScript needed to read.
- Every content response sends `Vary: Accept, User-Agent` and a `Link: <.../path.md>; rel="alternate"; type="text/markdown"` header.

The site must score at least 95 on our own `agent-readiness-check` (`content/skills/skills/agent-readiness-check/references/rubric.md`). In particular: every h2 and h3 has a stable id, code blocks declare a language, pages render server-side, and there's a dated changelog at `/changelog`.

Design: it should read like a well-typeset Markdown document, calm and fast, with a narrow text column, not a marketing site. A small header (DEVREL.md wordmark; Spec, Skills, Generate links) and a footer: "Created and maintained by Marcos Placona, DevRel Bridge. Framework from How to Build Developer Ecosystems by Amir Shevat and Marcos Placona." Light and dark themes. Mobile first. No stock illustrations, no gradients, no emoji.

## Tracked redirects: `/go/[slug]`

| Slug | Destination |
| --- | --- |
| `audit` | `https://devrelbridge.com/audit` |
| `launch` | `https://devrelbridge.com/devrel-launch-sprint` |
| `program` | `https://devrelbridge.com/90-day-developer-adoption-program` |
| `book` | `https://devrelbridge.com/book` |

Append `utm_source=devrel.md`, `utm_medium` (`skill`, `generator`, `site` or `email`, from query `m`, default `site`) and `utm_campaign` (from query `c`, e.g. the skill name). Preserve an incoming lead token `t` as `lt`. Log each click (slug, medium, campaign, timestamp, hashed IP) and return a 302. Unknown slugs go to `/`.

## The generator

Someone pastes a product's docs or home URL and gets a draft DEVREL.md in about half a minute, watching it stream.

### Flow
1. `/generate`: a URL field, a Cloudflare Turnstile check, and one line saying what happens and that nothing is stored except the result and, if they choose, their email.
2. `POST /api/generate`: validates the Turnstile token, rate limits (5 runs per hashed IP per day; configurable), and checks the 24h URL cache. A cache hit returns the existing result id.
3. **Safe page fetcher.** HTTPS only. Resolve the host and refuse private, loopback, link-local and metadata IP ranges (SSRF protection), including after redirects (max 3). 10s timeout, 2 MB cap per page, respect robots.txt, identify as `devrel.md-generator (+https://devrel.md)`. Fetch the given page plus up to five discovered pages: `/llms.txt`, docs home, quickstart or getting-started, pricing, API reference. Prefer `.md` versions when a Link header or llms.txt offers them. Convert HTML to text. Cap each page (as in `scripts/bakeoff` caps: roughly 20k characters for llms.txt, 15k for the quickstart, 12k for docs home, 8k pricing, 4k others), about 20k tokens total.
4. **Model call** via OpenRouter (`OPENROUTER_API_KEY`), streaming, with the system prompt built from SPEC.md plus the devrel-md-init SKILL.md plus the unattended-run instruction (see `scripts/bakeoff/run.py`, the tested prompt). Order:
   1. Free: `nvidia/nemotron-3-ultra-550b-a55b:free`. Abandon if no token has streamed within 15 seconds.
   2. Paid primary: `openai/gpt-6-luna`.
   3. Paid backup: `deepseek/deepseek-v4-flash`.
   Use OpenRouter's `models` array for automatic error fallback within a request, plus our own first-token timeout. Keep the model list in config, not code.
5. **Quality gate.** Port the validator from `scripts/bakeoff/run.py` to TypeScript: frontmatter present and valid (bare values), all required sections in order, five Funnel health rows with Pass in `yes|no|unknown|n/a`, sensible length, not wrapped in a code fence. On failure, regenerate once on the next paid model. If that fails too, show a friendly error and log it.
6. **Circuit breaker.** Log every attempt (model, outcome, first-token ms, total ms, tokens, cost). If 7 of the last 10 free attempts failed (error, timeout or quality), skip free models for 60 minutes.
7. **Spend cap.** Sum paid cost from OpenRouter usage per UTC day. Over `DAILY_SPEND_CAP_USD` (default 2.00), stop generating and show "back tomorrow" plus the no-install agent prompt as the alternative.
8. **Result page `/r/[id]`.** The file, rendered with a Raw toggle. Above it, a Stage gates summary (from the Funnel health table) with the earliest failing or unknown stage called out, and "Next skills to run". The file is viewable free. Copy and download are gated behind the email form. Each result also has `/r/[id].md`. The generated file ends with `<!-- Generated with devrel.md -->` and nothing promotional.
9. **Email form.** Email, company, role (select: Founder / CEO, CTO / engineering lead, Head of product, Head of marketing or growth, Developer advocate, Engineer, Other), team size (select: 1 to 10, 11 to 50, 51 to 200, 201 to 1,000, 1,000+), and an optional checkbox "Send me the 5-email series on fixing my failing stage gates". Unticked by default. The result email is sent regardless.
10. **Handoff.** A lead is qualified when the role is Founder / CEO, CTO / engineering lead, Head of product or Head of marketing or growth, and the team size is 11 or more. Qualified leads see one calm line under the file: "Want someone to find and fix the break with you? Book a 20-minute review of this file." linking `/go/audit?m=generator&c=result&t=<lead token>`. Everyone else sees the book link and the skills. Never both, never a pop-up.

### Email (Resend, `RESEND_API_KEY`)
- The result email: sent immediately, with the DEVREL.md attached and a link to the result.
- The optional series: 5 emails over 10 days, one per failed or unknown stage gate, each teaching the book's fix and linking the chapter, the fifth offering the review. Store templates in `emails/` as Markdown with frontmatter. Draft the copy in plain, direct UK English, but set `SERIES_ENABLED=false` by default: Marcos approves the copy before it's switched on.
- Sending is a DB-backed outbox table processed by a worker loop in the app (or a `/api/cron/outbox` endpoint protected by `CRON_SECRET`), so nothing depends on a third-party scheduler.
- Every email has a one-click unsubscribe (`List-Unsubscribe` header plus a link) that works without logging in.
- Also upsert the contact to a Resend audience (`RESEND_AUDIENCE_ID`) with the fields above, for future broadcasts.
- From: `DEVREL.md <hello@devrel.md>` (env `EMAIL_FROM`). The domain is verified at deploy time.

### Folk (`FOLK_API_KEY`)
Push only qualified leads who opted in to email, as a person with the company, tagged `source: devrel.md`, the failing gate as a note, and the result link. Failure to push must never break the user flow (queue and retry).

## Data

Tables, at least: `results` (id, url, normalised_url, markdown, gates jsonb, model, cost_usd, created_at), `attempts` (result_id, model, outcome, first_token_ms, total_ms, tokens_in, tokens_out, cost_usd, created_at), `leads` (id, email, company, role, team_size, qualified, series_opt_in, result_id, lead_token, unsubscribed_at, created_at), `outbox` (id, lead_id, template, send_after, sent_at, attempts, last_error), `clicks` (slug, medium, campaign, lead_token, ip_hash, created_at), `rate_limits` or equivalent. IPs are only stored as `sha256(ip + IP_HASH_SALT)`. Provide a `DELETE` path for a lead by email (admin script is fine).

## Secrets and config

All secrets come from the devrel.md Infisical project (EU, workspace `be37b6f4-0afa-4772-a1df-e01992b7dc9a`), never from any other project. Run locally with `infisical run --env=dev -- npm run dev`. Provide `.env.example` listing every variable with a comment: `DATABASE_URL`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `EMAIL_FROM`, `FOLK_API_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`, `CRON_SECRET`, `DAILY_SPEND_CAP_USD`, `SERIES_ENABLED`, `GIT_COMMIT_SHA`, `SITE_URL`. Everything must run locally with the Turnstile test keys and with Resend and Folk unset (log instead of send).

## Done means

- `npm run lint`, `npm run build` and `npm test` pass. Tests cover: content negotiation (curl gets Markdown, a browser gets HTML, the `.md` routes, `Vary` and `Link` headers), the SSRF guard (private IPs and redirects blocked), the validator (good and bad fixtures, including the bake-off outputs), the fallback order and circuit breaker (mocked OpenRouter), the spend cap, `/go` redirects with UTM, qualification rules, and unsubscribe.
- A local end-to-end run: `docker compose up`, migrations applied, one real generation for `https://resend.com` through OpenRouter (dev key, spend under $0.05), a lead captured with Resend unset, and the result page rendering. Record the run in `docs/local-e2e.md`.
- `agent-readiness-check` run against the local production build, scoring 95 or more, with the report saved to `docs/`.
- README covering setup, architecture, config, and how the generator's fallback chain works.
- Work on a branch, commit in logical steps, push, and open a PR against `main` for review. Do not merge.
