"use client";

import { useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    onDevrelmdTurnstile?: (token: string) => void;
  }
}

export function GenerateForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alternative, setAlternative] = useState<string | null>(null);
  const redirectRef = useRef<string | null>(null);

  if (typeof window !== "undefined") {
    window.onDevrelmdTurnstile = (t: string) => setToken(t);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setAlternative(null);
    setOutput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, turnstileToken: token }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: "Something went wrong." }));
        setError(data.error ?? "Something went wrong.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const lines = raw.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;
          const eventName = eventLine.slice(6).trim();
          const data = JSON.parse(dataLine.slice(5).trim());

          if (eventName === "delta") {
            setOutput((prev) => prev + data);
          } else if (eventName === "done") {
            redirectRef.current = `/r/${data.id}`;
          } else if (eventName === "error") {
            setError(data.message ?? "Something went wrong.");
            setAlternative(data.alternative ?? null);
          }
        }
      }
    } catch {
      setError("The connection dropped. Try again.");
    } finally {
      setStreaming(false);
      if (redirectRef.current) {
        window.location.href = redirectRef.current;
      }
    }
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <form className="generate-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="url">Docs or home page URL</label>
          <input
            id="url"
            type="url"
            required
            placeholder="https://example.com/docs"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={streaming}
          />
        </div>
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-callback="onDevrelmdTurnstile"
        />
        <button className="primary" type="submit" disabled={streaming || !token || !url}>
          {streaming ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && (
        <div className="callout">
          <p className="error-text">{error}</p>
          {alternative && <pre className="install-block">{alternative}</pre>}
        </div>
      )}

      {output && (
        <pre className="install-block" aria-live="polite" style={{ whiteSpace: "pre-wrap" }}>
          {output}
        </pre>
      )}
    </>
  );
}
