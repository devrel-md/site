import { env } from "@/lib/env";
import {
  OPENROUTER_URL,
  GENERATION_MAX_TOKENS,
  GENERATION_TEMPERATURE,
  STREAM_IDLE_TIMEOUT_MS,
  STREAM_TOTAL_TIMEOUT_MS,
} from "@/lib/generatorConfig";

export interface StreamResult {
  text: string;
  servedModel: string | null;
  finishReason: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number;
  firstTokenMs: number | null;
  totalMs: number;
}

export type StreamOutcome =
  | { kind: "success"; result: StreamResult }
  | { kind: "timeout"; firstTokenMs: null; elapsedMs: number }
  | { kind: "error"; message: string; elapsedMs: number };

/** Streams a chat completion from OpenRouter, calling onDelta as text arrives.
 * `models` is OpenRouter's own fallback list: the primary plus any backups
 * OpenRouter may fail over to mid-request if the primary provider errors.
 * We additionally enforce our own first-token timeout, since a provider that
 * is merely slow (not erroring) won't trigger OpenRouter's own fallback. */
export async function streamCompletion(params: {
  models: string[];
  systemPrompt: string;
  userPrompt: string;
  firstTokenTimeoutMs: number;
  idleTimeoutMs?: number;
  totalTimeoutMs?: number;
  onDelta?: (chunk: string) => void;
}): Promise<StreamOutcome> {
  const {
    models,
    systemPrompt,
    userPrompt,
    firstTokenTimeoutMs,
    idleTimeoutMs = STREAM_IDLE_TIMEOUT_MS,
    totalTimeoutMs = STREAM_TOTAL_TIMEOUT_MS,
    onDelta,
  } = params;
  const start = Date.now();
  const controller = new AbortController();
  let firstTokenTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    controller.abort();
  }, firstTokenTimeoutMs);
  const totalTimer = setTimeout(() => controller.abort(), totalTimeoutMs);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const clearTimers = () => {
    if (firstTokenTimer) clearTimeout(firstTokenTimer);
    if (idleTimer) clearTimeout(idleTimer);
    clearTimeout(totalTimer);
  };

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.siteUrl,
        "X-Title": "devrel.md generator",
      },
      body: JSON.stringify({
        model: models[0],
        models,
        stream: true,
        max_tokens: GENERATION_MAX_TOKENS,
        temperature: GENERATION_TEMPERATURE,
        usage: { include: true },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch (err) {
    clearTimers();
    const elapsedMs = Date.now() - start;
    if (controller.signal.aborted) return { kind: "timeout", firstTokenMs: null, elapsedMs };
    return { kind: "error", message: (err as Error).message, elapsedMs };
  }

  if (!response.ok || !response.body) {
    clearTimers();
    const bodyText = await response.text().catch(() => "");
    return {
      kind: "error",
      message: `HTTP ${response.status}: ${bodyText.slice(0, 300)}`,
      elapsedMs: Date.now() - start,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let servedModel: string | null = null;
  let finishReason: string | null = null;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  let costUsd = 0;
  let firstTokenMs: number | null = null;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        let parsed: {
          model?: string;
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
        };
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        if (parsed.model) servedModel = parsed.model;
        const choice = parsed.choices?.[0];
        const delta = choice?.delta?.content;
        if (delta) {
          if (firstTokenMs === null) {
            firstTokenMs = Date.now() - start;
            if (firstTokenTimer) {
              clearTimeout(firstTokenTimer);
              firstTokenTimer = null;
            }
          }
          // A stream that has started but then stalls would otherwise hang
          // the request forever.
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => controller.abort(), idleTimeoutMs);
          text += delta;
          onDelta?.(delta);
        }
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        if (parsed.usage) {
          tokensIn = parsed.usage.prompt_tokens ?? tokensIn;
          tokensOut = parsed.usage.completion_tokens ?? tokensOut;
          costUsd = parsed.usage.cost ?? costUsd;
        }
      }
    }
  } catch (err) {
    if (firstTokenMs === null) {
      const elapsedMs = Date.now() - start;
      if (controller.signal.aborted) return { kind: "timeout", firstTokenMs: null, elapsedMs };
      return { kind: "error", message: (err as Error).message, elapsedMs };
    }
    // We already have some text; treat a mid-stream drop as a truncated success
    // rather than losing the generation outright. The quality gate will catch
    // anything that matters.
  } finally {
    clearTimers();
  }

  if (firstTokenMs === null) {
    return { kind: "timeout", firstTokenMs: null, elapsedMs: Date.now() - start };
  }

  return {
    kind: "success",
    result: {
      text,
      servedModel,
      finishReason,
      tokensIn,
      tokensOut,
      costUsd,
      firstTokenMs,
      totalMs: Date.now() - start,
    },
  };
}
