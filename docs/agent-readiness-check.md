# Agent readiness check: devrel.md (production)

Date: 2026-10-04
Rubric version: 0.1.0
Input checked: https://devrel.md/
Sample set: https://devrel.md/, https://devrel.md/quickstart, https://devrel.md/spec, https://devrel.md/skills, https://devrel.md/generate, https://devrel.md/validate
Applicable points: 97/100 (not applicable: check 5, docs home linked from product root, as devrel.md has no separate docs section)

## Score: 91/100 (Agent-ready)

This production run on 2026-10-04 shows a score of 91/100, down from the local build's 94/100 on 2026-09-29. The regression is in check 9 (code blocks language declarations), which now scores as a fail across the production sample. Check 15 (sandbox/test mode) remains the only other non-pass check. See "What changed" below.

### Category subtotals

| Category | Score | Max |
| --- | --- | --- |
| Discoverability | 17 | 17 |
| Readability | 17 | 20 |
| Reference | 20 | 20 |
| Try it | 19 | 25 |
| Agent integration | 15 | 15 |

### Checks

| # | Check | Result | Points | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | llms.txt present and valid | pass | 5/5 | `GET /llms.txt` returns 200, starts with `# `, contains 12 Markdown links, 2,690 characters | |
| 2 | llms-full.txt or an equivalent full-content page exists | pass | 4/4 | `GET /llms-full.txt` returns 200, 105,800 characters (well over 2,000) | |
| 3 | robots.txt does not block common AI retrieval crawlers | pass | 5/5 | `GET /robots.txt` returns 200; GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended are all explicitly allowed; general allow-all rule with root Allow: / covers others | |
| 4 | Docs pages appear in the sitemap | pass | 3/3 | `GET /sitemap.xml` returns 200, lists all 19 pages including the 6 sampled pages | |
| 5 | Docs home is linked from the product root | not applicable | n/a | devrel.md has no separate `/docs`, `/developer`, or `/api` section; the home page IS the docs home; not applicable per the rubric | |
| 6 | A Markdown version of doc pages is available | pass | 5/5 | `/`, `/quickstart`, `/spec`, `/skills` all respond with Link headers for `.md` versions, and requesting with `Accept: text/markdown` or accessing the `.md` paths returns 200 | |
| 7 | Pages are readable without JavaScript | pass | 5/5 | Plain HTTP GET on all 6 sampled pages returns HTML with main headings (h1/h2) and body text in `<main>` already present (not client-rendered) | |
| 8 | Heading anchors are stable | pass | 4/4 | 52 of 52 `<h2>`/`<h3>` elements across the sampled pages carry an `id` attribute (100%): 9/9 on `/`, 6/6 on `/quickstart`, 28/28 on `/spec`, 9/9 on `/skills` | |
| 9 | Code blocks declare a language | fail | 0/3 | Across sampled pages: `/` has 2/11 with language (18%), `/quickstart` has 4/12 (33%), `/spec` has 3/37 (8%), `/skills` has 11/11 (100%); total 20/71 (28%). Rubric requires 80% for pass, 40-79% for partial, <40% fails. | Add language declarations to the code blocks on `/`, `/quickstart`, and `/spec` |
| 10 | Sections are reasonably short | pass | 3/3 | Median word count between `<h2>` headings across `/quickstart`, `/spec` and `/skills` is 120 words (well under the 400-word threshold) | |
| 11 | A machine-readable API description is discoverable | pass | 7/7 | `GET /openapi.json` returns 200 with valid OpenAPI 3.0.3 JSON; `/openapi.yaml`, `/swagger.json` and `/.well-known/openapi.json` all 404 | |
| 12 | Docs carry version metadata | pass | 7/7 | `openapi.json` declares `info.version: 0.1.0`; `/changelog` page (linked from footer on every page) also carries dated entries | |
| 13 | A public, dated changelog exists | pass | 6/6 | `/changelog` returns 200; most recent entry is dated 2026-10-04 | |
| 14 | An API key or token is obtainable without a sales call | pass | 8/8 | OpenAPI `security: []` (no authentication required); `/generate` and `/api/validate` need only a Turnstile CAPTCHA check; no account, key or sales call required | |
| 15 | A sandbox or test mode is documented | fail | 0/6 | `/quickstart` (the discovered quickstart page) contains no mentions of sandbox, test mode, test keys or staging. Documentation exists on `/api` in a "Testing safely" section covering the lack of a separate staging environment, caching for testing, and Cloudflare test key support, but `/api` is not in this run's sample set. | Link to or quote the testing section from `/api` on the `/quickstart` page, or move a summary to the prerequisites section |
| 16 | The quickstart is copy-paste with expected output shown | pass | 6/6 | `/quickstart` section 3 "Validate it" contains a complete `curl` command against `/api/validate` and the exact JSON response (tested against the real validator using the example from `/example`) | |
| 17 | Prerequisites are listed upfront | pass | 5/5 | `/quickstart` "Before you start" section lists a repository or docs URL and an AI agent before any instructions or code | |
| 18 | An MCP server or official agent tooling is documented | pass | 8/8 | `/skills` page documents the Claude Code plugin install with the full command `npx skills add devrel-md/skills --skill <skill-name>` and describes multiple official skills ready to use | |
| 19 | An SDK installs via a standard package manager | pass | 7/7 | `/skills` shows copy-paste install commands using `npx` (a standard npm package manager command), e.g. `npx skills add devrel-md/skills --skill agent-readiness-check` | |

### Top 3 fixes

Only two applicable checks are short of a full pass:

1. Check 15 (6 points): Add a note on `/quickstart` about testing directly against the generator/validator without a separate staging environment, caching behaviour during testing, and the availability of Cloudflare's test keys. This content already exists on the `/api` page; link to it or move a summary there.
2. Check 9 (3 points): Add language hints to code blocks on `/`, `/quickstart` and `/spec` pages. Most examples show bash, markdown, text or JSON; mark each with the appropriate HTML `class="language-*"` or fenced-code language hint.

### Needs human review

- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision. Check 18 passed on the Claude Code plugin install being documented; a person should still confirm the skills themselves are safe to run unsupervised (they are read-only by design, per each `SKILL.md`, but that is a claim to verify, not a mechanical check).
- Whether tone, terminology and examples match the brand voice, particularly the home page and quickstart copy.
- Check 5's "not applicable" call: devrel.md is structured as a spec-and-skills site rather than a conventional docs site with a separate `/docs` section. This is a design choice specific to the product shape; verify it is intentional.

### What changed since the last run

| Aspect | 2026-09-29 (local build) | 2026-10-04 (production) | Change |
| --- | --- | --- | --- |
| Overall score | 94/100 | 91/100 | Down 3 points |
| Check 9 (code blocks language) | PASS (100%) | FAIL (28%) | Regression |
| Check 15 (sandbox/test mode) | FAIL | FAIL | Unchanged |
| Sample set | /, /quickstart, /spec, /skills, /generate, /validate | Same 6 URLs | No change |

The regression in check 9 suggests that code blocks on production pages (`/`, `/quickstart`, `/spec`) do not carry language hints where the local build may have had them, or the pages have changed between the two runs. The `/skills` page remains 100% compliant (all `npx` examples are tagged with `class="language-bash"`).

---
Framework: How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 11. https://devrel.md/go/book?m=skill&c=agent-readiness-check
Want a human to review the parts a checklist can't? https://devrel.md/go/audit?m=skill&c=agent-readiness-check
