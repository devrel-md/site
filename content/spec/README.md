<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/devrel-md-mark-light.svg">
    <img src="assets/devrel-md-mark-dark.svg" alt="DEVREL.md" width="64" height="64">
  </picture>
</p>

# DEVREL.md

A Markdown file that tells people and AI agents who your developer product is for, what a developer's first success looks like, and where the developer journey breaks.

```
Read https://devrel.md and create a DEVREL.md for this repo.
```

Paste that into Claude Code, Cursor, Codex or any agent that can fetch a URL. That's the whole install.

- [The spec](SPEC.md)
- [A worked example](examples/acme-vector.DEVREL.md) (fictional product)
- [A blank template](TEMPLATE.md)
- [Frontmatter JSON Schema](schema/frontmatter.schema.json)
- [Free skills that read DEVREL.md](https://github.com/devrel-md/skills)

## Why

Every agent writing a quickstart, a launch post or a docs page starts by asking who the product is for. The answer lives in people's heads, so each tool asks again and gets a slightly different answer. DEVREL.md writes it down once, in the vocabulary of the developer funnel: ICPs, time to Hello World, activation, and stage gates that say which part of the journey to fix first.

## Contributing

Open an issue before a pull request. Changes to required sections need a migration note. See [Versioning](SPEC.md#versioning).

## Credits

Created and maintained by Marcos Placona ([DevRel Bridge](https://devrelbridge.com)). The framework comes from [*How to Build Developer Ecosystems*](https://devrelbridge.com/book) by Amir Shevat and Marcos Placona.

Licensed under [CC BY 4.0](LICENSE).
