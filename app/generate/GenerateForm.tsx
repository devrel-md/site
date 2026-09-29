"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

type TurnstileOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback": (code?: string) => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileOptions) => string;
      reset: (id?: string) => void;
    };
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

  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitHint, setSubmitHint] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: turnstileSiteKey,
      callback: (t) => {
        setToken(t);
        setVerifyError(null);
        setSubmitHint(null);
      },
      "error-callback": (code) => {
        setToken("");
        setVerifyError(
          `We couldn't confirm you're human${code ? ` (error ${code})` : ""}. Refresh the page and try again. If it keeps happening, email hello@devrel.md.`,
        );
      },
      "expired-callback": () => {
        setToken("");
        setVerifyError("The check expired. It will refresh automatically, or reload the page.");
      },
      "timeout-callback": () => {
        setToken("");
        setVerifyError("The check timed out. Reload the page to try again.");
      },
    });
  }, [turnstileSiteKey]);

  // The script may already be loaded when this component mounts (client-side navigation).
  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setSubmitHint(verifyError ?? "Still checking you're human. This usually takes a second or two.");
      return;
    }
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
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget} onReady={renderWidget} />
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
        <div ref={widgetRef} className="turnstile-widget" />
        {verifyError && (
          <p className="form-error" role="alert">
            {verifyError}
          </p>
        )}
        {submitHint && !verifyError && (
          <p className="form-hint" role="status">
            {submitHint}
          </p>
        )}
        <button className="primary" type="submit" disabled={streaming || !url}>
          {streaming ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && (
        <div className="callout">
          <p className="error-text">{error}</p>
          {alternative && <pre className="install-block">{alternative}</pre>}
        </div>
      )}

      {streaming && !output && (
        <p className="form-hint" role="status">
          Reading your docs and drafting the file. The first lines usually appear within 20 seconds; the whole draft can take a minute or two.
        </p>
      )}
      {output && (
        <pre className="install-block" aria-live="polite" style={{ whiteSpace: "pre-wrap" }}>
          {output}
        </pre>
      )}
    </>
  );
}
