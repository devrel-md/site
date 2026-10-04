import { env } from "@/lib/env";

/** A small, honest OpenAPI description of the one real API devrel.md has:
 * the generator. Not exhaustive (the content pages are plain Markdown/HTML,
 * not a JSON API), but enough for an agent to call it correctly. */
export function buildOpenApiDoc(): object {
  return {
    openapi: "3.0.3",
    info: {
      title: "devrel.md API",
      version: "0.1.0",
      description:
        "The generator drafts a DEVREL.md from a product's public docs or home page, gated by a Cloudflare Turnstile token. The validator checks the structure of any DEVREL.md against the spec (format only, not whether its facts are true); it needs no token.",
      contact: { url: `${env.siteUrl}/api` },
    },
    servers: [{ url: env.siteUrl }],
    paths: {
      "/api/generate": {
        post: {
          summary: "Generate a DEVREL.md draft",
          description: "Streams a text/event-stream response as the file is written, ending with a done or error event.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["url", "turnstileToken"],
                  properties: {
                    url: { type: "string", format: "uri", description: "The product's docs or home page URL. HTTPS only." },
                    turnstileToken: { type: "string", description: "A token from the Turnstile widget on /generate." },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "A text/event-stream of delta, done and error events.",
              content: { "text/event-stream": { schema: { type: "string" } } },
            },
            "400": { description: "Invalid URL or failed Turnstile check." },
            "429": { description: "Daily rate limit reached for this IP." },
          },
        },
      },
      "/api/validate": {
        post: {
          summary: "Validate a DEVREL.md",
          description: "The generator's structural check: format only, not whether the content is true. No authentication, rate limited by IP.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "text/markdown": { schema: { type: "string" } },
              "application/json": {
                schema: {
                  type: "object",
                  required: ["markdown"],
                  properties: { markdown: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Validation result.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      valid: { type: "boolean" },
                      problems: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: { problem: { type: "string" }, fix: { type: "string" } },
                        },
                      },
                      gates: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing or oversized body." },
            "429": { description: "Daily rate limit reached for this IP." },
          },
        },
      },
      "/r/{id}": {
        get: {
          summary: "Fetch a generated result",
          security: [],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "The result page. Send Accept: text/markdown, or request /r/{id}.md, for the raw file.",
              content: { "text/html": { schema: { type: "string" } }, "text/markdown": { schema: { type: "string" } } },
            },
            "404": { description: "No such result." },
          },
        },
      },
    },
  };
}
