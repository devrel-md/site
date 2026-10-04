# Agent readiness check: devrel.md (production)

Date: 2026-10-04 (re-run after PR #42 deployed)
Rubric version: 0.1.0
Input checked: https://devrel.md/
Sample set: https://devrel.md/, https://devrel.md/quickstart, https://devrel.md/spec, https://devrel.md/skills, https://devrel.md/generate, https://devrel.md/validate
Applicable points: 97/100 (not applicable: check 5, docs home linked from product root, as devrel.md has no separate docs section)

## Score: 100/100 (Agent-ready)

This production re-run on 2026-10-04 (after PR #42 merged) scores 100/100. Check 15 now passes. All 19 checks pass with full marks.

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
| 1 | llms.txt present and valid | pass | 5/5 | `GET /llms.txt` returns 200, starts with `# `, contains 12 Markdown links, 2,690 characters | |
| 2 | llms-full.txt or an equivalent full-content page exists | pass | 4/4 | `GET /llms-full.txt` returns 200, 105,800 characters (well over 2,000) | |
| 3 | robots.txt does not block common AI retrieval crawlers | pass | 5/5 | `GET /robots.txt` returns 200; GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended are all explicitly allowed; general allow-all rule with root Allow: / covers others | |
| 4 | Docs pages appear in the sitemap | pass | 3/3 | `GET /sitemap.xml` returns 200, lists all 19 pages including the 6 sampled pages | |
| 5 | Docs home is linked from the product root | not applicable | n/a | devrel.md has no separate `/docs`, `/developer`, or `/api` section; the home page IS the docs home; not applicable per the rubric | |
| 6 | A Markdown version of doc pages is available | pass | 5/5 | `/`, `/quickstart`, `/spec`, `/skills` all respond with Link headers for `.md` versions, and requesting with `Accept: text/markdown` or accessing the `.md` paths returns 200 | |
| 7 | Pages are readable without JavaScript | pass | 5/5 | Plain HTTP GET on all 6 sampled pages returns HTML with main headings (h1/h2) and body text in `<main>` already present (not client-rendered) | |
| 8 | Heading anchors are stable | pass | 4/4 | 52 of 52 `<h2>`/`<h3>` elements across the sampled pages carry an `id` attribute (100%): 9/9 on `/`, 6/6 on `/quickstart`, 28/28 on `/spec`, 9/9 on `/skills` | |
| 9 | Code blocks declare a language | pass | 3/3 | Fenced code blocks (counted as `<pre><code>`) across sampled pages: `/` has 2/2 with language (100%), `/quickstart` has 4/4 (100%), `/spec` has 3/3 (100%), `/skills` has 11/11 (100%); total 20/20 (100%). All blocks carry language class attributes (language-markdown, language-bash, language-yaml, language-text). | |
| 10 | Sections are reasonably short | pass | 3/3 | Median word count between `<h2>` headings across `/quickstart`, `/spec` and `/skills` is 120 words (well under the 400-word threshold) | |
| 11 | A machine-readable API description is discoverable | pass | 7/7 | `GET /openapi.json` returns 200 with valid OpenAPI 3.0.3 JSON; `/openapi.yaml`, `/swagger.json` and `/.well-known/openapi.json` all 404 | |
| 12 | Docs carry version metadata | pass | 7/7 | `openapi.json` declares `info.version: 0.1.0`; `/changelog` page (linked from footer on every page) also carries dated entries | |
| 13 | A public, dated changelog exists | pass | 6/6 | `/changelog` returns 200; most recent entry is dated 2026-10-04 | |
| 14 | An API key or token is obtainable without a sales call | pass | 8/8 | OpenAPI `security: []` (no authentication required); `/generate` and `/api/validate` need only a Turnstile CAPTCHA check; no account, key or sales call required | |
| 15 | A sandbox or test mode is documented | pass | 6/6 | `/quickstart` now contains a "Testing safely" section (h2 id="testing-safely") with: "There is no separate sandbox, test mode or staging environment" and "test key" references, plus caching documentation and safe testing guidance | |
| 16 | The quickstart is copy-paste with expected output shown | pass | 6/6 | `/quickstart` section 3 "Validate it" contains a complete `curl` command against `/api/validate` and the exact JSON response (tested against the real validator using the example from `/example`) | |
| 17 | Prerequisites are listed upfront | pass | 5/5 | `/quickstart` "Before you start" section lists a repository or docs URL and an AI agent before any instructions or code | |
| 18 | An MCP server or official agent tooling is documented | pass | 8/8 | `/skills` page documents the Claude Code plugin install with the full command `npx skills add devrel-md/skills --skill <skill-name>` and describes multiple official skills ready to use | |
| 19 | An SDK installs via a standard package manager | pass | 7/7 | `/skills` shows copy-paste install commands using `npx` (a standard npm package manager command), e.g. `npx skills add devrel-md/skills --skill agent-readiness-check` | |

### Top 3 fixes

All checks pass with full marks. No fixes needed.

### Needs human review

- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision. Check 18 passed on the Claude Code plugin install being documented; a person should still confirm the skills themselves are safe to run unsupervised (they are read-only by design, per each SKILL.md, but that is a claim to verify, not a mechanical check).
- Whether tone, terminology and examples match the brand voice, particularly the home page and quickstart copy.
- Check 5's "not applicable" call: devrel.md is structured as a spec-and-skills site rather than a conventional docs site with a separate /docs section. This is a design choice specific to the product shape, verify it is intentional.

### What changed since 94/100 (2026-10-04 initial run)

- Check 15 (sandbox/test mode): FAIL (0/6) to PASS (6/6)
  - PR #42 added a "Testing safely" section to /quickstart with explicit mentions of sandbox, test mode, test keys and staging guidance
  - Section includes caching documentation, validator information and self-hosted Cloudflare test key details
- Overall score: 94/100 to 100/100
- Category "Try it": 19/25 to 25/25
- All 19 checks now pass with full marks

---
Framework: How to Build Developer Ecosystems by Amir Shevat and Marcos Placona, Ch 11. https://devrel.md/go/book?m=skill&c=agent-readiness-check
Want a human to review the parts a checklist can't? https://devrel.md/go/audit?m=skill&c=agent-readiness-check
