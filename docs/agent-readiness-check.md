# Agent readiness check: devrel.md (local production build)

Date: 2026-09-28
Rubric version: 0.1.0
Input checked: http://localhost:3311/ (local `next build` + `next start`, standing in for https://devrel.md before deploy)
Sample set: http://localhost:3311/, http://localhost:3311/api, http://localhost:3311/skills, http://localhost:3311/generate
Applicable points: 97/100 (not applicable: check 5, docs home linked from product root, see below)

## Score: 100/100 (Agent-ready)

### Category subtotals

| Category | Score | Max |
| --- | --- | --- |
| Discoverability | 17 | 17 |
| Readability | 20 | 20 |
| Reference | 20 | 20 |
| Try it | 25 | 25 |
| Agent integration | 15 | 15 |

### Checks

| # | Check | Result | Points | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | llms.txt present and valid | pass | 5/5 | `GET /llms.txt` → 200, starts with `# DEVREL.md`, contains Markdown links | |
| 2 | llms-full.txt or an equivalent full-content page exists | pass | 4/4 | `GET /llms-full.txt` → 200, 95,019 characters | |
| 3 | robots.txt does not block common AI retrieval crawlers | pass | 5/5 | `GET /robots.txt`: `User-agent: *` allow `/`, plus explicit `Allow: /` rules for GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended | |
| 4 | Docs pages appear in the sitemap | pass | 3/3 | `GET /sitemap.xml` → 200, lists the root (the docs path, see check 5) and every other page | |
| 5 | Docs home is linked from the product root | not applicable | n/a | Root page's header/nav/main has no link to a separate `/docs` section, because devrel.md has none: the spec at `/` is the whole "docs" | Not applicable per the rubric's own rule: no separate docs section exists |
| 6 | A Markdown version of doc pages is available | pass | 5/5 | `/`, `/api` and `/skills` each send `Link: <path.md>; rel="alternate"; type="text/markdown"`, and `/index.md`, `/api.md`, `/skills.md` all return 200 Markdown | |
| 7 | Pages are readable without JavaScript | pass | 5/5 | Plain `GET` (no JS execution) on all 4 sampled pages returns HTML whose body already contains the page's heading and text; every content route is a Route Handler that renders full HTML server-side | |
| 8 | Heading anchors are stable | pass | 4/4 | 42 of 42 `<h2>`/`<h3>` elements across the sample carry an `id` (100%), via `rehype-slug` on Markdown pages and explicit ids on hand-built ones (`/skills`, the install block) | |
| 9 | Code blocks declare a language | pass | 3/3 | 9 of 9 code blocks across the sample carry a `language-*` class (100%) | |
| 10 | Sections are reasonably short | pass | 3/3 | Median words between `<h2>`s across the quickstart (`/api`) plus `/` and `/skills`: 87 words (max 585, well under the 400 threshold) | |
| 11 | A machine-readable API description is discoverable | pass | 7/7 | `GET /openapi.json` → 200, valid OpenAPI 3.0 JSON describing `POST /api/generate` and `GET /r/{id}`; also linked from `/api` | |
| 12 | Docs carry version metadata | pass | 7/7 | The spec's frontmatter (`spec: devrel.md`, `version: 0.1.0`) renders as a visible panel at the top of `/`; also present in `openapi.json`'s `info.version` | |
| 13 | A public, dated changelog exists | pass | 6/6 | `/changelog` is linked from the footer on every page, returns 200, newest entry dated 2026-09-28 | |
| 14 | An API key or token is obtainable without a sales call | pass | 8/8 | `/generate` and `POST /api/generate` need no account, API key or sales call, only a Turnstile check | |
| 15 | A sandbox or test mode is documented | pass | 6/6 | `/api#testing-safely` documents 24h response caching (safe to retry while testing) and Cloudflare's documented always-pass Turnstile test keys for local integration testing | |
| 16 | The quickstart is copy-paste with expected output shown | pass | 6/6 | `/api` (discovered as the quickstart via the "API quickstart" link on `/`) has a complete `curl` request and the exact `text/event-stream` response shape, including the final `done` event | |
| 17 | Prerequisites are listed upfront | pass | 5/5 | `/api`'s Quickstart section lists prerequisites (an HTTP client, a public HTTPS URL, a Turnstile token) before the first code block | |
| 18 | An MCP server or official agent tooling is documented | pass | 8/8 | `/skills` documents the Claude Code plugin install (`/plugin marketplace add mplacona/devrel-skills`) with full setup instructions | |
| 19 | An SDK installs via a standard package manager | pass | 7/7 | `/skills` shows `npx skills add mplacona/devrel-skills`; `/api` shows a working `curl` example against the documented `POST /api/generate` endpoint | |

### Top 3 fixes

None. Every applicable check passed on this run.

### Needs human review

- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision. Check 18 passed on the Claude Code plugin install being documented; a person should still confirm the skills themselves are safe to run unsupervised (they are read-only by design, per each `SKILL.md`, but that is a claim to verify, not a mechanical check).
- Whether the single quickstart path chosen (`/api`, the generator's HTTP API) is genuinely the best path for the primary ICP, versus merely present. devrel.md's real "quickstart" for most human visitors is arguably the `/generate` web form, not a `curl` command; the rubric's checks 16 and 17 are written for a traditional API/SDK product and only fit `/api`.
- Whether tone, terminology, and examples match the brand voice.
- This run was done by hand (the `agent-readiness-check` skill from the `devrel-skills` submodule is not installed as a Claude Code skill in this session), cross-checked with a small local script for the mechanical counts (heading ids, code-block languages, section word counts). Re-run with the actual skill, and against the real `https://devrel.md` origin, before relying on this score for a launch decision.
- Check 5's "not applicable" call and check 15's "sandbox" framing (response caching and Turnstile test keys, rather than a traditional staging environment) are both judgement calls specific to devrel.md's shape as a spec-and-skills site rather than a conventional API product. Worth a second opinion if the rubric is later used to compare devrel.md against a traditional API/SDK docs site.

---
Framework: How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 11. https://devrelbridge.com/book
Want a human to review the parts a checklist can't? https://devrel.md/go/audit
