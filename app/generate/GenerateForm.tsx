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

type GenerateStatus =
  | { stage: "reading" }
  | { stage: "read"; pages: number }
  | { stage: "drafting"; attempt: number }
  | { stage: "retrying"; reason: "slow" | "error" | "quality" };

function describeStatus(status: GenerateStatus): string {
  switch (status.stage) {
    case "reading":
      return "Reading your docs";
    case "read":
      return status.pages === 1 ? "Read 1 page. Starting the draft" : `Read ${status.pages} pages. Starting the draft`;
    case "drafting":
      return status.attempt === 1 ? "Drafting your DEVREL.md" : "Drafting again with another model";
    case "retrying":
      if (status.reason === "quality") return "That draft didn't pass our checks. Trying another model";
      if (status.reason === "slow") return "The first model was too slow. Switching to another";
      return "A model failed. Switching to another";
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
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!streaming) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [streaming]);

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
    setStatus("Starting");
    setElapsed(0);
    setStreaming(true);
    let finished = false;

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
          } else if (eventName === "status") {
            const next = data as GenerateStatus;
            // A new model starts from scratch; drop the draft that failed.
            if (next.stage === "drafting" && next.attempt > 1) setOutput("");
            setStatus(describeStatus(next));
          } else if (eventName === "done") {
            finished = true;
            setStatus("Done. Opening your result");
            redirectRef.current = `/r/${data.id}`;
          } else if (eventName === "error") {
            finished = true;
            setError(data.message ?? "Something went wrong.");
            setAlternative(data.alternative ?? null);
          }
        }
      }
      if (!finished) {
        setError("The connection closed before the draft finished. Try again, and if it keeps happening, email hello@devrel.md.");
      }
    } catch {
      setError("The connection dropped. Try again.");
    } finally {
      setStreaming(false);
      if (redirectRef.current) {
        window.location.href = redirectRef.current;
      } else {
        // Turnstile tokens are single use; get a fresh one for the next try.
        setToken("");
        if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
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

      {streaming && (
        <div className="generate-progress" role="status" aria-live="polite">
          <span className="progress-dot" aria-hidden="true" />
          <span>
            {status}... <span className="progress-elapsed">{elapsed}s</span>
          </span>
          <p className="form-hint">A full draft usually takes 30 seconds to two minutes. You can watch it being written below.</p>
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
