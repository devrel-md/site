# AGENTS.md

Standing instructions for any coding agent working in this repo. `README.md` explains how the site works and how it deploys; trust it and the code.

## Every pull request

A pull request that changes behaviour without these is incomplete.

- **Changelog.** Any user-visible change adds a dated entry to `content/site/changelog.md` in the same PR. Newest first, plain and short, written for users, using the real date. Do not list internal work such as CI, backups or refactors. The page is served at `/changelog`.
- **README.** Any change to setup, configuration, deployment or behaviour that `README.md` describes updates the README in the same PR. Add new environment variables to `.env.example` too.

## Workflow

- Work on a branch and open a pull request against `main`. Never push to `main`.
- Before opening a PR run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`, the same four steps CI runs. In the PR, say what you ran and what you could not run, and wait for the `ci` check to pass.
- Merging to `main` deploys automatically once CI passes on `main` (see "Deployment" in the README). Deployment lives in a separate private repository: never add a deploy workflow, secrets or self-hosted runners to this one. After a merge, do not say a change is live until `https://devrel.md/healthz` reports the merged commit as `build_sha`.
- Add tests for what you change. Match the style of the surrounding code.

## Writing rules

- UK English everywhere: copy, code comments, docs, commit messages.
- Never use em dashes, en dashes or double hyphens as punctuation. Use commas, colons, full stops or brackets.
- No AI attribution in commits or pull requests: no `Co-Authored-By` trailer, no "Generated with" line, no emoji footer. Commit messages are short imperative sentences.

## Content

- Never hand-edit `content/spec` or `content/skills`. They are synced copies of `devrel-md/spec` and `devrel-md/skills`. Change the source repo, then run `scripts/sync-content.sh`.
- Every content page must keep working as Markdown: its `<path>.md` route (`/index.md` for the root), `Accept: text/markdown`, and plain `curl`. Every content response sends `Vary: Accept, User-Agent` and a `Link: <path.md>; rel="alternate"; type="text/markdown"` header, for browsers and for Markdown alike. Content pages are Route Handlers using `lib/negotiate.ts` and `lib/contentRoute.ts`, not React pages.
- Every h2 and h3 keeps a stable id, and code blocks declare a language.

## Code

- Read `node_modules/next/dist/docs/` before using a Next.js API you are not sure of. This is Next.js 16 and has breaking changes.
- Database changes are additive plain SQL files in `db/migrations`, numbered in order (`NNN_name.sql`). No ORM, and no drops or renames in the same change as the code that stops using the old name. Migrations run on production before the new code deploys, so the running version must keep working against the new schema.
- Never print, log, commit or paste a secret value, in code, tests, PR text or chat. Refer to secrets by name only.
- On the maintainer's machine, secrets come only from the project's Infisical environment, through `infisical run --env=dev -- <command>`, and there is no local Postgres and no Docker: anything that touches the database or calls OpenRouter, Resend or Folk runs through Infisical against the shared dev database. Elsewhere, use the local setup in the README. Tests mock the database, OpenRouter, Resend and Folk, so `npm test` needs neither.
- Store IPs only as `sha256(ip + IP_HASH_SALT)`, never raw.
- Keep hostnames, IP addresses and infrastructure project ids out of the README, the changelog and other public-facing docs.
