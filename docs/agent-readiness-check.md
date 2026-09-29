# Agent readiness check: devrel.md (local production build)

Date: 2026-09-29
Rubric version: 0.1.0
Input checked: http://localhost:3313/ (local `next build` + `next start`, standing in for https://devrel.md before deploy)
Sample set: http://localhost:3313/, http://localhost:3313/quickstart, http://localhost:3313/spec, http://localhost:3313/skills, http://localhost:3313/generate, http://localhost:3313/validate
Applicable points: 97/100 (not applicable: check 5, docs home linked from product root, see below)

## Score: 94/100 (Agent-ready)

This is a third run, after adding a real `/quickstart` page (not a pointer) and linking it from the home page's own body copy and the nav. The score recovered from the previous run's 82/100 to 94/100: checks 16 and 17 now pass on real content, and check 15 is the one remaining gap. See "What changed" below.

### Category subtotals

| Category | Score | Max |
| --- | --- | --- |
| Discoverability | 17 | 17 |
| Readability | 20 | 20 |
| Reference | 20 | 20 |
| Try it | 19 | 25 |
| Agent integration | 15 | 15 |

### Checks

| # | Check | Result | Points | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | llms.txt present and valid | pass | 5/5 | `GET /llms.txt` → 200, starts with `# DEVREL.md`, contains Markdown links, including the new `/quickstart` entry | |
| 2 | llms-full.txt or an equivalent full-content page exists | pass | 4/4 | `GET /llms-full.txt` → 200, 104,012 characters | |
| 3 | robots.txt does not block common AI retrieval crawlers | pass | 5/5 | `GET /robots.txt`: `User-agent: *` allow `/`, plus explicit `Allow: /` rules for GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended | |
| 4 | Docs pages appear in the sitemap | pass | 3/3 | `GET /sitemap.xml` → 200, lists `/`, `/quickstart`, `/spec` and every other page | |
| 5 | Docs home is linked from the product root | not applicable | n/a | The home page's header/nav/main has no link whose href starts with `/docs`, `/developer`, `/developers`, `/api` or `/reference`, or whose host starts with `docs.`/`developer.`: devrel.md has no separate docs section by that definition | Not applicable per the rubric's own rule |
| 6 | A Markdown version of doc pages is available | pass | 5/5 | `/`, `/quickstart`, `/spec`, `/skills` and `/validate` each send `Link: <path.md>; rel="alternate"; type="text/markdown"`, and the `.md` routes all return 200 | |
| 7 | Pages are readable without JavaScript | pass | 5/5 | Plain `GET` (no JS execution) on all 6 sampled pages returns HTML whose body already contains the page's heading and text | |
| 8 | Heading anchors are stable | pass | 4/4 | 52 of 52 `<h2>`/`<h3>` elements across the sample carry an `id` (100%) | |
| 9 | Code blocks declare a language | pass | 3/3 | 14 of 14 code blocks across the sample carry a `language-*` class (100%) | |
| 10 | Sections are reasonably short | pass | 3/3 | Median words between `<h2>`s across the sample: 104 words (max 585, well under the 400 threshold) | |
| 11 | A machine-readable API description is discoverable | pass | 7/7 | `GET /openapi.json` → 200, valid OpenAPI 3.0 JSON describing `POST /api/generate`, `POST /api/validate` and `GET /r/{id}` | |
| 12 | Docs carry version metadata | pass | 7/7 | `openapi.json`'s `info.version` is `0.1.0`; `/spec` (in the sample set) also shows the full frontmatter panel with `version: 0.1.0` and an updated date | |
| 13 | A public, dated changelog exists | pass | 6/6 | `/changelog` is linked from the footer on every page, returns 200, newest entry dated 2026-09-28 | |
| 14 | An API key or token is obtainable without a sales call | pass | 8/8 | `/generate` and `POST /api/generate` need no account, API key or sales call, only a Turnstile check | |
| 15 | A sandbox or test mode is documented | fail | 0/6 | `/quickstart` (the discovered quickstart page) contains no "sandbox", "test mode", "test key" or "staging" language. That content exists at `/api#testing-safely`, which isn't in this run's sample set | Add a line to `/quickstart` (or wherever the rubric's discovery lands) about the generator/validator being safe to test against directly, mirroring `/api`'s existing "Testing safely" section |
| 16 | The quickstart is copy-paste with expected output shown | pass | 6/6 | `/quickstart` was discovered via its "Follow the quickstart" link on the home page. Section 3 has a complete `curl` command against `/api/validate` and the exact JSON it returns, verified against the real validator run over `content/spec/examples/acme-vector.DEVREL.md` | |
| 17 | Prerequisites are listed upfront | pass | 5/5 | `/quickstart`'s "Before you start" section lists prerequisites (a repo or docs URL, an AI agent) before the first code block | |
| 18 | An MCP server or official agent tooling is documented | pass | 8/8 | `/skills` documents the Claude Code plugin install (`/plugin marketplace add devrel-md/skills`) with full setup instructions | |
| 19 | An SDK installs via a standard package manager | pass | 7/7 | `/skills` shows `npx skills add devrel-md/skills` | |

### Top 3 fixes

Only one applicable check was short of a full pass on this run:

1. Check 15 (6 points): mention that testing the generator or validator directly is safe (caching, no charge for a failed run, Turnstile test keys) somewhere on `/quickstart` or another page the discovery algorithm reaches from the home page. The content already exists on `/api`; it just isn't in this run's sample set.

### Needs human review

- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision. Check 18 passed on the Claude Code plugin install being documented; a person should still confirm the skills themselves are safe to run unsupervised (they are read-only by design, per each `SKILL.md`, but that is a claim to verify, not a mechanical check).
- Whether tone, terminology and examples match the brand voice, particularly the home page and quickstart copy.
- This run was done by hand (the `agent-readiness-check` skill from `content/skills` is not installed as a Claude Code skill in this session), cross-checked with a small local script for the mechanical counts (heading ids, code-block languages, section word counts). Re-run with the actual skill, and against the real `https://devrel.md` origin, before relying on this score for a launch decision.
- Check 5's "not applicable" call is a judgement call specific to devrel.md's shape as a spec-and-skills site rather than a conventional docs site with a separate `/docs` section.

### Score history

| Run | Score | Note |
| --- | --- | --- |
| 1 (spec at `/`) | 100/100 | Before the home page rebuild; `/` was the spec itself and carried the quickstart pointer directly |
| 2 (home page added) | 82/100 | The quickstart pointer moved to `/spec`, one hop from the new docs home (`/`); checks 15 to 17 failed |
| 3 (this run) | 94/100 | A real `/quickstart` page, linked from the home page's own copy, recovered checks 16 and 17. Check 15 remains, since its content lives on `/api`, still outside this sample set |

---
Framework: How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 11. https://devrelbridge.com/book
Want a human to review the parts a checklist can't? https://devrel.md/go/audit
