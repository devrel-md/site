# Agent readiness rubric

Rubric version: 0.1.0

This is the published scoring method for the agent readiness check. Scores are only comparable across sites when they were produced by the same rubric version. If this file changes in a way that changes a check's points or pass condition, bump the version.

## Principles

- Every check uses a public, mechanical signal: a file exists, a page returns certain content, a link is present. Nothing here scores writing quality, product quality, or whether a decision was the right one. Those questions go in "Needs human review" in the output, not into the score.
- Every check has exactly one of five results: `pass`, `partial`, `fail`, `could not test`, or `not applicable`. `could not test` scores 0 points, same as `fail`, but is reported separately so a reader can tell "this site failed" from "we couldn't reach this site's answer."
- `not applicable` is allowed only where a check's row says so, under the exact condition given. Never use it because a check seems unfair. A not-applicable check is removed from the denominator.
- The reported score is normalised to 100: `round(points earned / applicable points × 100)`. A check that could not be tested stays in the denominator. The report always states the applicable points, so a reader can see when the denominator was reduced.
- Keyword checks count only visible text in the page's main content that describes the product itself. Words inside markup, SVG paths, scripts, styles, or text describing other companies or services do not count.
- Counting checks (headings, words, code blocks) use the page's main content: the `<main>` or `<article>` element if present, otherwise `<body>` without `<header>`, `<nav>` and `<footer>`.

## Deterministic sample set

Several checks need more than one page. To keep results reproducible, build this fixed sample set before scoring anything, and use it for every check that says "sampled pages":

1. **Docs home**: the input URL if it is a docs page. If the input is a product root, take the first link in the root page's `<header>`, `<nav>` or `<main>` (not `<footer>`) whose href path starts with `/docs`, `/developer`, `/developers`, `/api` or `/reference`, or whose host starts with `docs.` or `developer.`. Ignore links to booking, calendar, contact, pricing or third-party domains. If no link qualifies, the site has no separate docs section: the input URL is the docs home, and check 5 is `not applicable`.
2. **Quickstart page**: the first link found on the docs home whose link text or URL contains one of, in this order of preference: "quickstart", "quick-start", "getting-started", "get-started", "guide". Only consider links to technical pages: skip anything under `/blog`, `/news`, `/articles`, `/posts` or `/case-studies`. Fall back to the first tutorial-labelled link if none of those match. If nothing matches, there is no quickstart: checks 16 and 17 are `fail`, not `not applicable`.
3. **Up to four more pages**: the first four links, in DOM order, inside the docs home's primary sidebar or navigation element, excluding external links, anchors on the same page, and anything already in the sample set.

This gives a sample set of one to six pages. Record the exact URLs used as evidence; a re-run against an unchanged site should produce the same sample set.

## Categories and checks

### Discoverability (20 points)

| # | Check | Points | Pass condition | How to test |
| - | - | - | - | - |
| 1 | `llms.txt` present and valid | 5 | GET `{origin}/llms.txt` returns 200, the body starts with an H1 (`# `), and contains at least one Markdown link | Fetch `{origin}/llms.txt` |
| 2 | `llms-full.txt` or an equivalent full-content page exists | 4 | `{origin}/llms-full.txt` returns 200 with over 2,000 characters of content, OR `llms.txt` links to a page explicitly labelled as the full or complete docs export and that page returns 200 | Fetch `{origin}/llms-full.txt`; if 404, check the links inside `llms.txt` |
| 3 | `robots.txt` does not block common AI retrieval crawlers | 5 (partial 2.5) | Full marks if `robots.txt` is missing (treated as allow-all) or none of GPTBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended, CCBot, anthropic-ai are disallowed on docs paths. Partial if some but not all are blocked, or docs paths are excluded while the root is not. Zero if all or most are disallowed with `Disallow: /` | Fetch `{origin}/robots.txt` |
| 4 | Docs pages appear in the sitemap | 3 | `{origin}/sitemap.xml` (or `/sitemap_index.xml`) returns 200 and lists at least one URL under the docs path | Fetch `{origin}/sitemap.xml`, then `/sitemap_index.xml` if the first 404s |
| 5 | Docs home is linked from the product root | 3 | The root page (`{origin}/`) contains a visible `<a>` link to the docs home or its path prefix, in the raw HTML. `not applicable` when the site has no separate docs section (see the sample set, step 1) | Fetch `{origin}/` and search the HTML for the docs link |

### Readability (20 points)

| # | Check | Points | Pass condition | How to test |
| - | - | - | - | - |
| 6 | A Markdown version of doc pages is available | 5 | For at least one sampled page, any of: the response carries a `Link` header with `rel="alternate"; type="text/markdown"` that resolves; appending `.md` to the URL returns 200 with Markdown (for a root or trailing-slash URL, try `{path}index.md`); or requesting the page with `Accept: text/markdown` returns Markdown. Also a pass if `llms.txt` links to `.md` versions of pages and at least one resolves | Check the `Link` header, then `{page}.md` or `index.md`, then `Accept: text/markdown`, then the `.md` links in `llms.txt` |
| 7 | Pages are readable without JavaScript | 5 | For at least four of the sampled pages, a plain HTTP GET (no script execution) returns HTML whose body already contains the page's main heading and body text | Fetch each sampled page as raw HTTP, not through a JS-rendering browser tool, and inspect the body |
| 8 | Heading anchors are stable | 4 | At least 80% of `<h2>`/`<h3>` elements across the sampled pages carry an `id` attribute | Fetch each sampled page and count headings with and without `id` |
| 9 | Code blocks declare a language | 3 (partial 1.5) | Full marks if 80% or more of code blocks across sampled pages are tagged with a language (for example `language-python` or a fenced-code language hint); partial for 40 to 79%; zero below 40%. If no sampled page contains a code block, mark `could not test` | Inspect `<pre><code class="language-*">` or fenced code blocks on each sampled page |
| 10 | Sections are reasonably short | 3 | The median word count between consecutive `<h2>` headings, across the quickstart page and up to two other sampled pages, is under 400 words | Count words between headings on the quickstart page plus up to two more sampled pages |

### Reference (20 points)

| # | Check | Points | Pass condition | How to test |
| - | - | - | - | - |
| 11 | A machine-readable API description is discoverable | 7 | One of `{origin}/openapi.json`, `{origin}/openapi.yaml`, `{origin}/swagger.json`, `{origin}/.well-known/openapi.json` returns 200 with valid JSON or YAML, or the API reference page contains a clearly labelled link to an OpenAPI or Swagger file | Fetch the common paths, then scan the API reference page for a linked spec file |
| 12 | Docs carry version metadata | 7 | At least one of: a version selector or dropdown, a version number in the doc URL path (for example `/v2/`), a `version` field in the discovered OpenAPI document, or an explicit "applies to version X", "last updated" or "last verified" note on a sampled page | Inspect main content of docs home and sampled pages, and the OpenAPI `info.version`. Keyword rule applies |
| 13 | A public, dated changelog exists | 6 | A changelog, release notes, or "what's new" page is linked from the docs home or footer, returns 200, and its most recent entry carries a date | Follow the changelog link from docs home or footer and check the newest entry |

### Try it (25 points)

| # | Check | Points | Pass condition | How to test |
| - | - | - | - | - |
| 14 | An API key or token is obtainable without a sales call | 8 | Either the documented API needs no authentication (the OpenAPI document declares no security requirement, or the docs say so), or following the signup path from docs home reaches a self-serve signup (email, GitHub, or Google) or a free-tier key page, without being routed only to "contact sales" or "book a demo" | Check the OpenAPI `security` fields, then follow the signup link from docs home or quickstart |
| 15 | A sandbox or test mode is documented | 6 | An explicit explanation of the product's own sandbox, test mode, test key, or staging environment, with how to use it, appears in the docs. `not applicable` when the discovered OpenAPI document contains only GET operations (nothing an agent calls can change state) | Search main content of the quickstart and auth pages for "sandbox", "test mode", "test key", or "staging". Keyword rule applies |
| 16 | The quickstart is copy-paste with expected output shown | 6 | The quickstart page contains both a complete, runnable code sample and an explicit expected result (an output block, a screenshot, or a described response) | Inspect the quickstart page for both elements |
| 17 | Prerequisites are listed upfront | 5 | The quickstart page states prerequisites (language or runtime version, account, API key) before the first instruction or code block | Inspect the quickstart page's structure above its first code block |

### Agent integration (15 points)

| # | Check | Points | Pass condition | How to test |
| - | - | - | - | - |
| 18 | An MCP server or official agent tooling is documented | 8 | The docs or site describe an official MCP server, or other official agent tooling, with setup instructions; or a `{origin}/.well-known/mcp` (or equivalent documented) path resolves | Search docs and site navigation for "MCP", "Model Context Protocol", or an agent-tooling integration page |
| 19 | An SDK installs via a standard package manager | 7 | A copy-paste install command using a standard package manager (for example npm, pip, gem, cargo, go get) is shown on the SDK or reference page. For an HTTP-only API with a discoverable OpenAPI document, a copy-paste HTTP example also passes: either a `curl` (or HTTPie, fetch) command block against a documented endpoint, or a complete, working GET URL for a documented endpoint that needs no further parameters | Inspect the SDK or reference page for an install command, or the docs for a runnable HTTP example |

## Grade bands

| Score | Band |
| - | - |
| 85 to 100 | Agent-ready |
| 65 to 84 | Mostly ready |
| 40 to 64 | Partly ready |
| Under 40 | Not ready |

## What this rubric does not score

These need a person, not a checklist, and belong in "Needs human review" rather than the score:

- Whether the docs are strategically right for the product's actual audience and positioning.
- Whether an MCP server or agent-facing integration is the right fit, and whether its actions are safe for an agent to call without supervision.
- Whether the single quickstart path chosen is genuinely the best path for the primary ICP, versus merely present.
- Whether tone, terminology, and examples match the brand voice.

## Changelog

- 0.1.0: initial rubric, 19 checks across 5 categories, 100 points before normalisation. Tested against devrelbridge.com and resend.com before release.
