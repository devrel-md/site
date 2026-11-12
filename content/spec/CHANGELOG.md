# Changelog

All notable changes to the DEVREL.md spec are recorded here, newest first. Breaking changes carry a migration note, see [Versioning](SPEC.md#versioning).

## 0.2.0 (draft)

### 2026-10-12

Thanks to Tessa Kriesel for the review behind these changes.

- ICPs: name each segment by what its developers are building, and add hiring moment, goals and pains in priority order, alternatives, switching forces (push, pull, anxiety, habit), and where the product plugs into the stack. Hiring moment and switching forces are labelled as a Jobs to be Done pattern
- North Star: a team-chosen North Star metric now sits on top, with time to Hello World underneath it
- Activation: add retention, the share of activated developers still active after a window the team picks. The Activation gate now includes it
- Awareness gate: replaced "quality sources" with a number, more than X% of signups fit an ICP segment, with X set by the team
- **Breaking:** `stage` now counts activated developers a month instead of signups. Bands: early under 20, growth 20 to 100, scale 100 to 400, enterprise over 400
- Removed the optional Competitors section. Alternatives now live in each ICP

**Migration from 0.1:**

1. Change `spec: devrel.md/0.1` to `spec: devrel.md/0.2`.
2. Recompute `stage` from activated developers a month. If you only have a signup figure, set `stage: unknown` and record the signup figure under Metrics.
3. Move each line of Competitors into the Alternatives field of the segment that would choose it, then delete the section.
4. Add the new ICP fields, the North Star metric line and the Retention line, writing `unknown` where you don't know yet.
5. Rewrite the Awareness and Activation gate rows. Until the team sets X and the retention window, use placeholders and mark `Pass` `unknown`.

Required section names and order are unchanged.

## 0.1.0 (draft)

### 2026-10-04

- Added CONTRIBUTING.md: how to report problems, suggest patterns, improve examples, propose skills and submit pull requests, plus who reviews and decides, how decisions are recorded, and how contributors are credited
- Principles: replaced the frontmatter inference example with one that labels an inference in body text, and stated that `stage` is `unknown` unless the monthly signup figure is sourced

### 2026-09-29

- Added the DEVREL.md mark to the README
- Pointed references at the devrel-md/skills repository after it moved into the organisation

### 2026-09-28

- Frontmatter values and the `Pass` column of Funnel health must stay bare, and a gate passes only on evidence
- First published draft of the spec, template, worked example and frontmatter schema
