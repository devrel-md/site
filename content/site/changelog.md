# Changelog

Dated, newest first.

## 2026-09-28

- First build of the site: the spec, the example, the template, the skills catalog, the generator, tracked `/go/` links, and content negotiation so `curl devrel.md` and a browser both get the right thing.
- Generator model fallback: `nvidia/nemotron-3-ultra-550b-a55b:free` first, then `openai/gpt-6-luna`, then `deepseek/deepseek-v4-flash`, gated by a quality check and a daily spend cap.
