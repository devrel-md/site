# Contributing to DEVREL.md

Thank you for helping. This repository holds the DEVREL.md specification, its template, its worked example and its frontmatter schema. Corrections and ideas are welcome, and small fixes do not need any ceremony.

## Which repository?

| You want to change | Go to |
| --- | --- |
| The spec text, the template, the example file or the frontmatter schema | This repository, [devrel-md/spec](https://github.com/devrel-md/spec) |
| A skill that reads or writes DEVREL.md, or the skills README | [devrel-md/skills](https://github.com/devrel-md/skills), see its [CONTRIBUTING.md](https://github.com/devrel-md/skills/blob/main/CONTRIBUTING.md) |
| Wording on [devrel.md](https://devrel.md) | The page shows copies of the spec and skills files, so fix the source file in the repository above. For a problem with the site itself, open an issue here |

## Fix a small mistake

A typo, a broken link, an unclear sentence or a wrong example needs no proposal. Open a pull request directly.

1. Open the file on GitHub and choose the pencil icon (Edit this file). GitHub forks the repository for you.
2. Make the change and choose Propose changes. Give it a short, imperative title, such as `Fix the broken link in README`.
3. Open the pull request. One sentence saying what you fixed is enough.

If the fix changes what the spec requires, or the allowed values of a field, it is not a small correction. Follow Suggest a change below instead.

## Report a problem

Open an issue and say:

- where the problem is (file and section)
- what you expected and what you found
- what you were doing, for example generating a DEVREL.md with an agent

If an agent produced a bad DEVREL.md, include the relevant lines and say which agent. Remove anything private first, see [Confidential material](#confidential-material).

## Suggest a change or a pattern

Open an issue before you write a pull request, unless it is a small fix. Describe:

- the problem a team or an agent hits today
- what you propose, with an example of the resulting DEVREL.md text
- the evidence that the problem is real (see [Evidence and examples](#evidence-and-examples))

New optional sections and fields can be added in a minor version. Anything that renames or removes a required section, or changes an allowed value, is a breaking change and follows the [Versioning](SPEC.md#versioning) rules.

## Improve the examples

The file in `examples/` describes a fictional product, Acme Vector. Improvements are welcome if the example stays fictional and stays valid (see [Validate your change](#validate-your-change)). To add a new example, open an issue first and say which situation it shows that the existing one does not, for instance an open source product, or one with no paid tier.

## Propose a skill

Skills live in [devrel-md/skills](https://github.com/devrel-md/skills). Read its [CONTRIBUTING.md](https://github.com/devrel-md/skills/blob/main/CONTRIBUTING.md) and open the proposal there. If a skill needs a change to the spec (a new field or section), open the spec issue first and link it from the skill proposal.

If an independently maintained skill already does what you have in mind, link to it instead of copying it, see [Other people's work](#other-peoples-work).

## Submit a pull request

- Keep it to one change. Smaller pull requests are reviewed sooner and merged more easily.
- Say what changed and why, and link the issue it closes.
- Use UK English, and plain punctuation: commas, full stops, colons and brackets rather than dashes.
- Do not edit generated copies of these files elsewhere. The source here is canonical.
- Do not add AI attribution lines to commit messages or pull request text. If you used an AI tool, you are still responsible for what you submit.

## Validate your change

Anything that touches an example, the template or the schema must still validate.

- Frontmatter must validate against [`schema/frontmatter.schema.json`](schema/frontmatter.schema.json).
- The required sections must appear as `##` headings, in the order the spec gives: Product, Value proposition, ICPs, Anti-personas, North Star, Activation, Funnel health.
- Machine-read values stay bare: no labels or comments next to a frontmatter value or in the `Pass` column.

If you have Python, this script checks the first two. Save it as `check.py`, run `pip install pyyaml jsonschema`, then run `python check.py examples/acme-vector.DEVREL.md` from the root of this repository. It prints `ok` or the first problem it finds.

```python
import json, re, sys, yaml, jsonschema

text = open(sys.argv[1]).read()
front = yaml.load(re.match(r"---\n(.*?)\n---", text, re.S).group(1), yaml.BaseLoader)
jsonschema.validate(front, json.load(open("schema/frontmatter.schema.json")))

required = ["Product", "Value proposition", "ICPs", "Anti-personas", "North Star", "Activation", "Funnel health"]
found = [h for h in re.findall(r"^## (.+)$", text, re.M) if h in required]
assert found == required, f"required sections out of order or missing: {found}"
print("ok")
```

`TEMPLATE.md` deliberately fails this check until you replace `YYYY-MM-DD` with a real date.

## Evidence and examples

A proposal is stronger when it shows its working.

- **Say where it comes from.** Link a public source, or describe the situation plainly (for example, "a docs team with no analytics access"). Say whether a claim is measured, reported by someone else or your own judgement.
- **Show it in a DEVREL.md.** Give the exact text you would add, using the fictional example product or `unknown` values.
- **Name the failure it catches.** A good addition lets a reader or an agent notice something that would otherwise be missed.
- **Numbers need a source and a date.** A benchmark with no source is a guess, and the spec does not accept guesses as facts.

## Confidential material

Issues and pull requests here are public and are kept in git history, so treat anything you paste as published.

- Never paste private metrics, client or customer data, internal URLs, credentials or screenshots that show them.
- Use `unknown` where you do not have a sourced figure, or use fictional examples (the Acme Vector example is a good model).
- If you paste something private by mistake, open an issue asking for it to be removed without repeating it, and rotate any credential that was exposed.

## Other people's work

The spec is not the place to copy someone else's framework or skill.

- If an independently maintained skill, tool or article covers a topic well, we prefer to link to it over reproducing it.
- A link is a pointer, not an endorsement. The maintainers have not necessarily reviewed, tested or approved what is linked, and a link is not a partnership.
- Copy third-party text only if its licence allows it, with the licence and author credited. When in doubt, link instead.

## Patterns beyond the book

The funnel stages, stage gates, ICP canvas and benchmarks in the spec come from *How to Build Developer Ecosystems* by Amir Shevat and Marcos Placona. They stay credited to both authors, and changes to them are decided by the maintainer.

Well-supported patterns from elsewhere can be considered. To be accepted, a pattern needs:

- a public source of its own (a talk, a paper, documentation, a published case or an open project)
- evidence under [Evidence and examples](#evidence-and-examples), ideally from more than one product
- a clear label in the text, such as "Community pattern", naming its source, so that readers can tell it apart from the book's frameworks

Community patterns are credited to their own sources and are never merged into, or presented as, the book's frameworks.

## Who reviews and decides

Today the maintainer, Marcos Placona, reviews every pull request and makes the final decision on what is merged. This is a small project run by one person, so there are no response-time promises. Issues and pull requests are read, and they may take a while.

### Disagreements and breaking changes

- Discuss the disagreement in the issue. Say what you would change and why. The maintainer decides when the discussion has what it needs, and explains the decision.
- The decision is recorded in the pull request as a dated decision note: what was decided, why, and what was considered and rejected.
- A breaking change (renaming or removing a required section, or changing an allowed value) also needs a migration note, as described in [Versioning](SPEC.md#versioning), and an entry in [CHANGELOG.md](CHANGELOG.md).

### Becoming a reviewer or maintainer

Sustained, good contributions (corrections, well-evidenced proposals, careful reviews of other people's pull requests) are the route. The maintainer invites reviewers, and later maintainers, from the people doing that work. There is no application process and no quota.

## Licence and credit

- The specification, template, example and schema in this repository are licensed under [CC BY 4.0](LICENSE). By contributing, you agree that your contribution is licensed the same way, and you confirm you have the right to contribute it. Skills are MIT licensed and live in the skills repository.
- Contributors are credited by name or GitHub handle in the [CHANGELOG.md](CHANGELOG.md) entry for the release that includes their work, and substantial contributors can also be named in the credits in [README.md](README.md). Tell us in the pull request if you would rather not be named.
