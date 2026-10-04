# Changelog

Dated, newest first.

## 2026-10-04

- Generated files are free. You can read, copy and download the full DEVREL.md for any result without giving an email address.
- Joining community updates is optional and separate from the result. It asks for an email address only, and signing up is not a request for sales contact. It is double opt-in: the form checks you are human, we email a confirmation link that works for seven days, and you are only subscribed once you confirm. Every email carries an unsubscribe link.
- The old "unlock copy and download" form is retired.
- The skills catalog and `llms.txt` show a one-line summary and an install command for each skill. Chapter references are shown on their own, with the book and both authors credited once above the table.
- Pages now send standard security headers and a strict content security policy. Links and images inside generated files are checked before they are shown, so a generated file cannot link to `javascript:` addresses or load remote images.
- `/healthz` now reports whether the production configuration is complete, and features that would be unsafe on development defaults refuse to run instead.
- Daily limits can no longer be bypassed by sending a forged `X-Forwarded-For` header. Visitors on IPv6 are limited per network rather than per address, and requests with no trustworthy address share one small allowance.
- `/robots.txt` and `/sitemap.xml` now use the live site address instead of a localhost one.

## 2026-09-30

- The generator only states what the fetched pages say. It now reads robots.txt properly, so sites that allow some paths inside a disallowed folder are no longer treated as blocked. Every figure in a draft has to appear in the pages it read, and if it could not read enough of a site it says so instead of guessing.
- Results explain unknown stage gates. When none of the gates can be judged from public pages, the result says why, shows what we found for each stage, and names the first thing to measure.
- Clearer messages when a site cannot be read: a mistyped URL says the page returned 404, a robots.txt block says so, and a refused request names the HTTP status. Each still offers the no-install agent prompt.
- The generator shows its progress: reading your docs, pages read, drafting, and a retry on another model with the reason, plus an elapsed-seconds counter. Runs that stall now stop instead of hanging, and a failed run lets you retry without reloading.
- Cached results and sites we could not read no longer use up your daily generation limit. Only a run that calls a model counts.

## 2026-09-29

- The home page is now a short introduction to DEVREL.md. The full specification moved to `/spec`.
- Added `/quickstart`, a real getting-started page.
- Added `/validate`: paste a DEVREL.md and get a plain-language fix for every problem, plus a stage-gates summary when the file can be read. It needs no login, and also works from `POST /api/validate`. Validating has its own daily limit, separate from the generator's.
- Added the API reference at `/api` and the OpenAPI document at `/openapi.json`, covering the generator and the validator. Neither needs a key or an account.
- The generator form now tells you when verification fails instead of sitting silent, and its output streams as it is written.
- One shared header and footer on every page, the DEVREL.md logo and favicons, and updated navigation, sitemap and `llms.txt`.
- Replies to emails from the site now reach hello@devrel.md.

## 2026-09-28

- First build of the site: the spec, the example, the template, the skills catalog, the generator, tracked `/go/` links, and content negotiation so `curl devrel.md` and a browser both get the right thing.
- Generator model fallback: `nvidia/nemotron-3-ultra-550b-a55b:free` first, then `openai/gpt-6-luna`, then `deepseek/deepseek-v4-flash`, gated by a quality check and a daily spend cap.
