# Agent readiness check: devrel.md (local production build)

Date: 2026-09-29
Rubric version: 0.1.0
Input checked: http://localhost:3312/ (local `next build` + `next start`, standing in for https://devrel.md before deploy)
Sample set: http://localhost:3312/, http://localhost:3312/spec, http://localhost:3312/skills, http://localhost:3312/generate, http://localhost:3312/validate
Applicable points: 97/100 (not applicable: check 5, docs home linked from product root, see below)

## Score: 82/100 (Mostly ready)

This is a re-run after the home page rebuild (the spec moved from `/` to `/spec`, plus a new `/validate` page). The score dropped from the previous run's 100/100 to 82/100, entirely in the "Try it" category. See "What changed" below: it is a real, mechanical consequence of the redesign, not a regression in content quality.

### Category subtotals

| Category | Score | Max |
| --- | --- | --- |
| Discoverability | 17 | 17 |
| Readability | 20 | 20 |
| Reference | 20 | 20 |
| Try it | 8 | 25 |
| Agent integration | 15 | 15 |

### Checks

| # | Check | Result | Points | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | llms.txt present and valid | pass | 5/5 | `GET /llms.txt` → 200, starts with `# DEVREL.md`, contains Markdown links | |
| 2 | llms-full.txt or an equivalent full-content page exists | pass | 4/4 | `GET /llms-full.txt` → 200, 100,944 characters | |
| 3 | robots.txt does not block common AI retrieval crawlers | pass | 5/5 | `GET /robots.txt`: `User-agent: *` allow `/`, plus explicit `Allow: /` rules for GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended | |
| 4 | Docs pages appear in the sitemap | pass | 3/3 | `GET /sitemap.xml` → 200, lists the root (the docs path, see check 5) and every other page, including `/spec` and `/validate` | |
| 5 | Docs home is linked from the product root | not applicable | n/a | The home page's header/nav/main has no link whose href starts with `/docs`, `/developer`, `/developers`, `/api` or `/reference`, or whose host starts with `docs.`/`developer.`: devrel.md has no separate docs section by that definition | Not applicable per the rubric's own rule |
| 6 | A Markdown version of doc pages is available | pass | 5/5 | `/`, `/spec`, `/skills` and `/validate` each send `Link: <path.md>; rel="alternate"; type="text/markdown"`, and the `.md` routes all return 200 | |
| 7 | Pages are readable without JavaScript | pass | 5/5 | Plain `GET` (no JS execution) on all 5 sampled pages returns HTML whose body already contains the page's heading and text | |
| 8 | Heading anchors are stable | pass | 4/4 | 46 of 46 `<h2>`/`<h3>` elements across the sample carry an `id` (100%) | |
| 9 | Code blocks declare a language | pass | 3/3 | 10 of 10 code blocks across the sample carry a `language-*` class (100%) | |
| 10 | Sections are reasonably short | pass | 3/3 | Median words between `<h2>`s across the sample: 111 words (max 585, well under the 400 threshold) | |
| 11 | A machine-readable API description is discoverable | pass | 7/7 | `GET /openapi.json` → 200, valid OpenAPI 3.0 JSON describing `POST /api/generate`, `POST /api/validate` and `GET /r/{id}` | |
| 12 | Docs carry version metadata | pass | 7/7 | `openapi.json`'s `info.version` is `0.1.0`. (The home page itself carries no frontmatter; `/spec` still shows the full version panel, but `/spec` is one hop from the docs home the algorithm used this time, see below) | |
| 13 | A public, dated changelog exists | pass | 6/6 | `/changelog` is linked from the footer on every page, returns 200, newest entry dated 2026-09-28 | |
| 14 | An API key or token is obtainable without a sales call | pass | 8/8 | `/generate` and `POST /api/generate` need no account, API key or sales call, only a Turnstile check | |
| 15 | A sandbox or test mode is documented | fail | 0/6 | No quickstart page was discovered from the docs home's own links (see check 16), so there was no quickstart/auth page left to search for sandbox language. The content exists at `/api#testing-safely`, one hop from the sample set | Link a page with "sandbox" or "test mode" language directly from the docs home (`/`) itself, with anchor text containing one of the rubric's quickstart keywords, if scoring against this exact rubric matters more than the current homepage design |
| 16 | The quickstart is copy-paste with expected output shown | fail | 0/6 | The home page (now the docs home, since `/` has no qualifying `/docs`-style link) has no link on itself whose text or href contains quickstart, quick-start, getting-started, get-started or guide. `/spec` has one ("API quickstart" → `/api#quickstart`), but it is not reachable from the home page by that link text, so the algorithm never finds it | Same fix as check 15: a quickstart-labelled link from `/` itself |
| 17 | Prerequisites are listed upfront | fail | 0/5 | No quickstart page in the sample set (see check 16) | Same fix |
| 18 | An MCP server or official agent tooling is documented | pass | 8/8 | `/skills` documents the Claude Code plugin install (`/plugin marketplace add devrel-md/skills`) with full setup instructions | |
| 19 | An SDK installs via a standard package manager | pass | 7/7 | `/skills` shows `npx skills add devrel-md/skills` | |

### Top 3 fixes

1. Check 16 (6 points): add a link from the home page itself, with anchor text containing "quickstart" or "guide", to whichever page should serve as the discoverable quickstart (`/spec#quickstart` or `/api#quickstart` are both candidates).
2. Check 15 (6 points): once a quickstart page is discoverable from `/`, its "Testing safely" content (already written, at `/api`) will be found automatically.
3. Check 17 (5 points): same fix as check 16; prerequisites are already written on `/api`, they just aren't reachable by the rubric's discovery algorithm from the current home page.

All three share one root cause and one fix.

### Needs human review

- **The score drop is a rubric-discovery artefact of the redesign, not a content regression.** Before this change, `/` (then the spec) had a link to `/api#quickstart` in its own body, so the rubric's docs-home-search-for-quickstart step found it directly. Now `/` is the new marketing-style home page (content/home.md, written by the team, not to be rewritten without asking), and the quickstart pointer lives on `/spec`'s page instead, one hop away from where the algorithm looks. Marcos or team-lead should decide whether to add a quickstart-labelled link to the home page (a small, code-level addition, not a change to the home page's copy) or accept the lower score on this rubric as the cost of a friendlier home page.
- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision. Check 18 passed on the Claude Code plugin install being documented; a person should still confirm the skills themselves are safe to run unsupervised (they are read-only by design, per each `SKILL.md`, but that is a claim to verify, not a mechanical check).
- Whether tone, terminology and examples match the brand voice, particularly the new home page copy and the FAQ.
- This run was done by hand (the `agent-readiness-check` skill from the `devrel-skills` submodule is not installed as a Claude Code skill in this session), cross-checked with a small local script for the mechanical counts (heading ids, code-block languages, section word counts). Re-run with the actual skill, and against the real `https://devrel.md` origin, before relying on this score for a launch decision.
- Check 5's "not applicable" call is a judgement call specific to devrel.md's shape as a spec-and-skills site rather than a conventional docs site with a separate `/docs` section.

### Previous run

The run before the home page rebuild scored 100/100 (see git history for this file). That run's docs home was `/` (then the spec itself), which carried the quickstart pointer directly.

---
Framework: How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 11. https://devrelbridge.com/book
Want a human to review the parts a checklist can't? https://devrel.md/go/audit
