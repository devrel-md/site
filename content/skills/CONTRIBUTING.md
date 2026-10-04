# Contributing to devrel-skills

Thank you for helping. This repository holds the free DEVREL.md skills. The general rules (who reviews and decides, how decisions and breaking changes are recorded, confidentiality, credit and how to become a reviewer) are the same as for the spec, and are written once in the [spec's CONTRIBUTING.md](https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md). This page covers what is specific to skills.

## Which repository?

| You want to change | Go to |
| --- | --- |
| An existing skill, a new skill, or the skills README | This repository, [devrel-md/skills](https://github.com/devrel-md/skills) |
| The DEVREL.md format itself: sections, fields, the schema, the template | [devrel-md/spec](https://github.com/devrel-md/spec). If a skill needs a spec change, open the spec issue first and link it from your skill proposal |

## Fix a small mistake

A typo, a broken link or an unclear sentence in a skill or the README needs no proposal. Open a pull request directly: open the file on GitHub, choose the pencil icon (Edit this file), make the change, then propose it with a short, imperative title such as `Fix the link in the metrics plan skill`.

A change to what a skill does, asks or outputs is not a small correction. Open an issue first.

## Report a problem

Open an issue and say which skill, what you asked your agent, what it did, and what you expected. If it produced a wrong or odd DEVREL.md or report, include the relevant lines, with anything private removed.

## Propose a skill

Open an issue before you write a skill. Say:

- the problem the skill solves and who it is for
- where its framework comes from (see below)
- what it reads (it should start from the user's DEVREL.md) and what it produces
- whether an independently maintained skill already does this, see [Other people's work](#other-peoples-work)

The maintainer replies on the issue. There are no response-time promises, but a proposal agreed in an issue is far less likely to be turned down at pull request stage.

## What a skill needs

Each skill is a folder in `skills/<skill-name>/` with a `SKILL.md`, and optionally a `references/` folder. Follow an existing skill, for example [`quickstart-friction-check`](skills/quickstart-friction-check/SKILL.md), for the layout.

- **Frontmatter:** `name` (matches the folder), a `description` that says when to use the skill (with trigger phrases), `license: MIT`, and `metadata` with `version`, `summary`, `source` and `homepage`.
- **A named source for the framework.** Either:
  - **Book-derived:** `source` names the chapter or appendix of *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona, for example `Ch 8, App F`. The skill text credits both authors.
  - **Community pattern:** `source` names the pattern's own public source (a talk, a paper, documentation or an open project) and the skill says clearly that it is a community pattern, not a framework from the book. See [Patterns beyond the book](#patterns-beyond-the-book).
- **A small, reproducible sample.** Add `references/sample.md` with a short fictional input (a tiny DEVREL.md or a few lines of fictional docs) and the outcome you expect, so a reviewer can run the skill and compare. Keep it to a page.
- **Reads DEVREL.md first,** and asks the user only for what is missing. It writes `unknown` rather than inventing numbers, and labels qualitative inferences `(inferred)`, as the spec requires.
- **Consistent with the spec.** If the skill writes a DEVREL.md, the result must validate (see the spec's [validation notes](https://github.com/devrel-md/spec/blob/main/CONTRIBUTING.md#validate-your-change)).

Add a line to `CHANGELOG.md`, and add the skill to the table in `README.md`, in the same pull request.

## What a skill must not do

- **No telemetry.** A skill sends no data anywhere, needs no account or email, and never logs in to anything. This is a promise made in the README.
- **No client data.** Samples, references and examples use fictional products or `unknown`. Never include private metrics, customer or client names, internal URLs or credentials.
- **No hidden promotion.** A skill does not insert marketing calls to action into the user's files.

## Patterns beyond the book

The frameworks in the current skills come from the book and stay credited to both Amir Shevat and Marcos Placona. Well-supported patterns from elsewhere can be considered as new skills, or as clearly labelled additions. They need their own public source, evidence that the pattern works beyond one team, and a visible "community pattern" label that names the source. They are credited to that source and are never presented as the book's frameworks. The maintainer decides.

## Other people's work

If an independently maintained skill already covers what you have in mind, we would rather link to it than copy it. You can propose the link in an issue or a pull request against the README. A link is a pointer, not an endorsement: the maintainers have not necessarily reviewed or tested what is linked. Copy third-party text only if its licence allows it, with the author and licence credited.

## Submit a pull request

- One change per pull request, linked to its issue.
- Say what changed, why, and how you checked it (for a new skill, how you ran the sample).
- Use UK English and plain punctuation: commas, full stops, colons and brackets rather than dashes.
- No AI attribution lines in commit messages or pull request text. If you used an AI tool, you are still responsible for what you submit.

## Licence and credit

Skills are licensed under the [MIT licence](LICENSE). By contributing, you agree your contribution is licensed the same way, and you confirm you have the right to contribute it. Contributors are credited by name or GitHub handle in the [CHANGELOG](CHANGELOG.md) entry for the release that includes their work. Tell us in the pull request if you would rather not be named. Contributions to the spec are CC BY 4.0, see the spec repository.
