# API reference

devrel.md has two APIs: the generator and the validator. Neither needs an API key, an account or a sales call. The full machine-readable description is at [`/openapi.json`](/openapi.json).

## Quickstart

Prerequisites:

- A `curl` or other HTTP client.
- A public HTTPS URL to a product's docs or home page.
- A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) token from the widget on [`/generate`](/generate). There is no server-side way around this: it exists to keep the generator usable for people, not scrapers.

## Generate a DEVREL.md

```bash
curl -N -X POST https://devrel.md/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/docs", "turnstileToken": "<token from the widget>"}'
```

The response is a stream of `text/event-stream` events while the file is written, then a final event with the result id:

```text
event: delta
data: "---\nspec: devrel.md/0.1\n"

event: delta
data: "product: Example\n"

event: done
data: {"id": "a1b2c3d4", "status": "success"}
```

Once you have the id, fetch the finished file as Markdown:

```bash
curl https://devrel.md/r/a1b2c3d4.md
```

Every result carries a provenance line (when it was generated, from how many public pages of which site) and is sent with `X-Robots-Tag: noindex` unless it passed our checks and states at least one sourced fact. The Markdown view at `/r/<id>.md` adds the provenance as an HTML comment just before the closing `<!-- Generated with devrel.md -->` line, and `?download=1` returns the stored file unchanged. If the site publishes its own valid DEVREL.md at `/DEVREL.md` or `/.well-known/DEVREL.md`, the result links to it as canonical.

To opt a site out, disallow `devrel.md-generator` in its robots.txt: the generator then refuses that site, and its existing results are marked excluded. To have results removed, email hello@devrel.md. A request for an excluded site returns HTTP 403 with an `error` message.

## Testing safely

There is no separate staging environment: it is the same generator everyone else uses. It is still safe to test against directly. Every generation is cached per URL for 24 hours, so retrying the same request during testing returns the cached result instead of spending another model call. If you are integration-testing your own client against a self-hosted copy of this app, Cloudflare's documented always-pass Turnstile test keys work locally exactly as they do in this project's own development setup (see `.env.example` in the repository).

## Rate limits and errors

- Five generations per hashed IP address per day.
- A cached result (the same URL generated in the last 24 hours) returns immediately instead of running the model again.
- If every model in the fallback chain fails, the stream ends with an `error` event and a plain-language message. Nothing is charged or stored for a failed run.

## Validate a DEVREL.md

No token needed. See [`/validate`](/validate) for the full description, or call it directly:

```bash
curl -X POST https://devrel.md/api/validate \
  -H "Content-Type: text/markdown" \
  --data-binary @DEVREL.md
```

Rate limited separately from the generator, since it calls no paid model.

## Every other page

Every content page on devrel.md, not only the generator, is available as Markdown: send `Accept: text/markdown`, request `<path>.md`, or just use `curl`, which gets Markdown by default. See the [spec](/spec) for what each page contains.
