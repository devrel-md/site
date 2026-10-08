# Launch metrics

How the 90-day launch targets are measured now that results are free. Every number here comes from rows the site already keeps for running the product, or from public GitHub search. There are no visitor analytics, and skills and generated files carry no telemetry.

## Targets

| Measure | 90-day target | Source |
| --- | --- | --- |
| Generator runs | 1,000 | `npm run launch-metrics`: generations, fresh plus cached |
| Public repositories with a DEVREL.md | 50 | GitHub code search, see below |

### Replacing the 30% email capture rate

The launch plan's 30% email capture rate measured how many people gave an address to unlock a result. Results are now free and the unlock form is retired, so the rate no longer measures anything we want. It is replaced by:

- **Community signups per 100 fresh generations.** Confirmed signups divided by fresh generations over the same days. Confirmed only: a pending signup is not consent. There is no target until we have a month of data; watch the trend.
- **Net community growth.** Confirmed signups minus unsubscribes over the period.
- **`/go` clicks per 100 generations, by slug, medium and campaign.** Bot clicks excluded. This shows which surfaces send people on to the `/go` destinations.

Measures the issue suggested that the site cannot report today:

- **Results copied or downloaded.** Copy and Download happen in the browser and are not recorded. Recording them would mean adding client-side events, which is part of the open analytics decision.
- **`/go` clicks per result.** Result pages carry no `/go` links, and a click does not record which result it came from. Clicks carry no identifier beyond the hashed IP.

## Running the report

`scripts/launch-metrics.ts` reads the database named by `DATABASE_URL` and only runs `select` queries. Days are UTC.

```bash
infisical run --env=prod -- npm run launch-metrics
infisical run --env=prod -- npm run launch-metrics -- --since 2026-10-01
infisical run --env=prod -- npm run launch-metrics -- --json
```

It prints, per day and in total:

- **generations, fresh and cached.** Fresh is a row in `results` (a run that produced a file that passed every check). Cached is a row in `cache_hits` (the 24 hour cache served an existing result). Cache hits are recorded from migration `012_cache_hits.sql` onwards; earlier ones were not kept, so cached counts before that deploy read as zero. Runs that failed, were capped or could not read the site are not generations.
- **model calls and model cost.** Every row in `attempts`, failed and retried calls included, because those cost money too. Cost is what OpenRouter reported for each call, in US dollars. The free model reports zero.
- **signups and unsubscribes.** From `community_subscribers.confirmed_at` and `unsubscribed_at`. These columns hold the latest state, not a history: if someone unsubscribes and later confirms again, their earlier unsubscribe is cleared and their signup moves to the new day. Legacy `leads` rows are not counted.
- **`/go` clicks.** From `clicks`, by slug, medium and campaign. Clicks flagged `likely_bot` (see `lib/clickBot.ts`) are shown in their own column and left out of the click count. A medium outside the allowed list is logged as `site`.

## Counting public repositories with a DEVREL.md

The count comes from GitHub code search, not from anything the site records. Run both searches on github.com while signed in (code search needs an account), and record the date and both numbers.

1. **Every public DEVREL.md.** Search for the filename:

   ```text
   path:**/DEVREL.md
   ```

   This counts files called `DEVREL.md` at any depth, including monorepos. Count repositories, not files: open the result list and use the repository count, or see the `gh` command below.

2. **Files made with devrel.md.** The spec lets a generating tool add one attribution comment as the last line, and the `devrel-md-init` skill and the hosted generator's files end with it (`lib/resultPolicy.ts` keeps it last on result pages):

   ```text
   <!-- Generated with devrel.md -->
   ```

   Search for it inside DEVREL.md files:

   ```text
   path:**/DEVREL.md "Generated with devrel.md"
   ```

The first number is the target measure. The second is a lower bound for files that started from devrel.md, since users may delete the comment (the spec allows it). Leave out repositories owned by `devrel-md` and any test or fixture repositories when reporting.

The same counts from the command line. `gh search code` uses GitHub's legacy code search: `--filename` matches case-insensitively and by substring (`wg_devrel.md` matches), so the `jq` filter keeps only paths ending in exactly `DEVREL.md`. Legacy search also indexes fewer repositories than the web search, so treat the web numbers as the ones to report and these as a quick check:

```bash
gh search code --filename DEVREL.md --limit 1000 --json repository,path \
  --jq '[.[] | select(.path | test("(^|/)DEVREL\\.md$")) | .repository.nameWithOwner] | unique | length'
gh search code "Generated with devrel.md" --filename DEVREL.md --limit 1000 --json repository,path \
  --jq '[.[] | select(.path | test("(^|/)DEVREL\\.md$")) | .repository.nameWithOwner] | unique | length'
```
