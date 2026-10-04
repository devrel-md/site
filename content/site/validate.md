# Validate a DEVREL.md

Paste a DEVREL.md file and get the structural check the generator uses: valid frontmatter, every required section present and in order, a well-formed Funnel health table, and a sensible length. It checks format only. The generator also checks that the numbers in a draft appear in the pages it read, next to the metric they describe; a pasted file has no source pages, so this page cannot tell you whether its content is true. No login, no account, and nothing is stored except a daily rate-limit counter against your hashed IP.

## API

`POST /api/validate` accepts either a raw `text/markdown` body or JSON `{"markdown": "..."}`, and returns JSON:

```json
{
  "valid": false,
  "problems": [
    { "problem": "funnel row Awareness missing", "fix": "Add a Funnel health table row for Awareness." }
  ],
  "gates": [
    { "stage": "Onboarding", "gate": "...", "now": "...", "pass": "no" }
  ]
}
```

`gates` is the Funnel health table, parsed if the file is well-formed enough to have one, even when `valid` is `false`.

```bash
curl -X POST https://devrel.md/api/validate \
  -H "Content-Type: text/markdown" \
  --data-binary @DEVREL.md
```

Rate limited separately from the generator (validating calls no paid model), by hashed IP, per day.
