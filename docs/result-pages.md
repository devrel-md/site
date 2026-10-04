# Result pages: indexing, provenance and removal

Maintainer notes for `/r/<id>` (the generated results). Policy decided on 4 October 2026 (issue #25): result pages stay indexable by default, with the safeguards below.

## Policy

- **Indexable only when it earns it.** A result is open to search engines only when the draft passed the validator and the grounding check with nothing flagged and states at least one sourced fact (a Funnel health row that is `yes` or `no` with something written in its Now cell). Everything else gets `<meta name="robots" content="noindex">` and an `X-Robots-Tag: noindex` header, on the HTML page, the `.md` view and the download. The decision is stored as `results.indexable` when the row is created (`lib/resultPolicy.ts`, `isIndexable`). Rows created before migration 010 are `indexable = false`, because the grounding outcome was not recorded then and the rules have tightened since.
- **Provenance on every page.** A line above the file: "Automated draft generated on <date> from <n> public pages of <host>. It is a starting point, not an audit. To correct or remove it, email hello@devrel.md." The `.md` view carries the same sentence as an HTML comment placed before the closing `<!-- Generated with devrel.md -->` line, which stays the last line. `?download=1` returns the stored file byte for byte. Rows from before the migration have no page count and read "from public pages of <host>".
- **No sitemap entries.** Results are not in `sitemap.xml`; search engines find them only through links.
- **Retention.** Results are kept until someone asks for removal. There is no automatic expiry yet; that is a separate decision.

## Opting out and removal

- **robots.txt.** The fetcher identifies as `devrel.md-generator`. When a run is refused because the whole site is disallowed for that agent (the root path), every existing result for the host is marked excluded: `noindex`, plus the line "The site owner has asked for this not to be indexed." A rule for one path only (for example `/admin`) refuses that run but does not exclude the host. The 24 hour URL cache skips excluded results, so the page is never served again as a fresh copy. Removing the robots.txt rule allows new runs again; it does not undo the exclusion of old results.
- **Email.** Requests to hello@devrel.md. Action them with the script:

  ```bash
  # Hide: marks every result for the host excluded and blocks new runs for it.
  infisical run --env=prod -- npm run exclude-host -- example.com --reason "request from owner, 2026-10-05"

  # Delete: the same block, and the result rows are deleted (their attempts keep a null result id).
  infisical run --env=prod -- npm run exclude-host -- example.com --delete
  ```

  The host is lower-cased and a leading `www.` is dropped, so `https://www.Example.com/docs` and `example.com` are the same host. Subdomains are separate hosts: run the script for `docs.example.com` too if it applies. The script writes to `excluded_hosts`, which `/api/generate` checks before the cache and before any run (HTTP 403), and which `findCachedResult` joins against, so neither a cached copy nor a new run can bring the page back. To reverse a block: `delete from excluded_hosts where host = '...'` (and clear `results.excluded_at` if the results should show again).
- Reply to the requester once the script has run, and check `https://devrel.md/r/<id>` shows the note, or returns 404 after a delete.

## Canonical to the company's own file

During discovery (`lib/discoverPages.ts`, `findOwnDevrel`) the generator tries `https://<host>/DEVREL.md` and then `https://<host>/.well-known/DEVREL.md`, through the SSRF-safe fetcher and subject to robots.txt. A file counts only when it returns 200, stays on the same host after redirects, is not truncated and passes `validate()`. The URL is stored in `results.own_devrel_url`, and the result page then renders `<link rel="canonical">` to it, a visible "This company publishes its own DEVREL.md" line, and a `Link: <url>; rel="canonical"` header on the `.md` view. Otherwise the canonical stays the result page itself. The company's file is never given to the model as a source, so it cannot leak into the draft. Only the site's own host is checked; a repository's DEVREL.md is not fetched.
