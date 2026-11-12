# Changelog

## Unreleased

- `devrel-md-init` 0.2.0: follows spec 0.2. `stage` counts activated developers a month (early under 20, growth 20 to 100, scale 100 to 400, enterprise over 400), and a signup figure alone leaves it `unknown`. ICP blocks name segments by what developers are building and cover hiring moment, goals, pains, alternatives and switching forces. North Star has a team-chosen metric on top of time to Hello World, Activation includes retention, and the Awareness and retention gates use placeholders until the team sets them. The Competitors section is gone. Files on spec 0.1 are migrated using the spec's migration note. The worked stage examples use the new bands

## 0.1.0, unreleased

- `devrel-md-init`: writes a DEVREL.md following spec 0.1 and reports failing stage gates
- `quickstart-friction-check`: walks a quickstart against the 5-minute window and rates each step
- `agent-readiness-check`: scores agent readiness of a docs site with a published rubric (0.1.0)
- `developer-funnel-audit`: stage-by-stage map with gate checks, stage skipping and anti-patterns
- `icp-builder`: ICP canvas, fit scoring and validation plan
- `devrel-metrics-plan`: vanity swaps, metric pairs, dashboard spec, event schema and starter SQL
- `devrel-launch-plan`: onboarding readiness gate, channel plan with metric pairs, relative-week timeline
- `devrel-90-day-plan`: Foundation or Justification roadmap, week by week, with exit criteria
- `devrel-md-init`: `stage` stays `unknown` unless monthly signup volume is sourced or supplied, keeps sourced facts, inferences, proposed targets and unknown metrics apart, and adds two worked stage examples
- Every skill carries a short human `summary` under `metadata`, used by devrel.md catalogs. `description` is unchanged, so agent routing is unaffected
