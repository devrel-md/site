import { MODEL_CHAIN, FIRST_TOKEN_TIMEOUT_MS, GENERATION_DEADLINE_MS } from "@/lib/generatorConfig";
import { streamCompletion } from "@/lib/openrouter";
import { validate } from "@/lib/validator";
import { logAttempt } from "@/lib/attempts";
import { isFreeModelCircuitOpen } from "@/lib/circuitBreaker";
import { isOverDailySpendCap } from "@/lib/spendCap";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/generatorPrompt";
import { discoverPages, type InputPageStatus } from "@/lib/discoverPages";
import { groundingProblems, hasEnoughSource } from "@/lib/grounding";

export interface GenerateSuccess {
  status: "success";
  markdown: string;
  model: string;
  costUsd: number;
  resultId: string | null;
}

export interface GenerateFailure {
  status: "capped" | "exhausted";
}

/** Why we couldn't read enough of the site to write anything true. */
export type NoSourcesReason = "not_found" | "blocked_by_robots" | "refused" | "unreadable";

export interface GenerateNoSources {
  status: "no_sources";
  reason: NoSourcesReason;
  httpStatus: number | null;
}

export type GenerateOutcome = GenerateSuccess | GenerateFailure | GenerateNoSources;

function noSourcesReason(input: InputPageStatus | undefined): NoSourcesReason {
  if (input?.blockedByRobots) return "blocked_by_robots";
  if (input?.httpStatus === 404 || input?.httpStatus === 410) return "not_found";
  if (input?.httpStatus && input.httpStatus >= 400) return "refused";
  return "unreadable";
}

/** Progress the page shows while it waits, so a slow run never looks dead. */
export type GenerateStatus =
  | { stage: "reading" }
  | { stage: "read"; pages: number }
  | { stage: "drafting"; attempt: number }
  | { stage: "retrying"; reason: "slow" | "error" | "quality" };

interface ChainStep {
  model: string;
  models: string[]; // OpenRouter's own fallback list for this call
  firstTokenTimeoutMs: number;
  isPaid: boolean;
}

async function buildChain(): Promise<ChainStep[]> {
  const steps: ChainStep[] = [];

  if (!(await isFreeModelCircuitOpen())) {
    steps.push({
      model: MODEL_CHAIN.free,
      models: [MODEL_CHAIN.free],
      firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS.free,
      isPaid: false,
    });
  }

  if (!(await isOverDailySpendCap())) {
    steps.push({
      model: MODEL_CHAIN.paidPrimary,
      models: [MODEL_CHAIN.paidPrimary, MODEL_CHAIN.paidBackup],
      firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS.paid,
      isPaid: true,
    });
    steps.push({
      model: MODEL_CHAIN.paidBackup,
      models: [MODEL_CHAIN.paidBackup],
      firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS.paid,
      isPaid: true,
    });
  }

  return steps;
}

export async function generateDevrelMd(params: {
  inputUrl: string;
  onDelta?: (chunk: string) => void;
  onModelStart?: (model: string) => void;
  onStatus?: (status: GenerateStatus) => void;
  /** Called once, just before the first model call: the point at which a run
   * starts costing money, and so counts against the daily limit. */
  beforeFirstModelCall?: () => Promise<void>;
  /** Called once validation passes, before the attempt is logged, so the
   * logged attempt can carry the resulting row's id. */
  persistResult?: (markdown: string, model: string, costUsd: number) => Promise<string>;
}): Promise<GenerateOutcome> {
  const chain = await buildChain();
  if (chain.length === 0) {
    return { status: "capped" };
  }

  const startedAt = Date.now();
  params.onStatus?.({ stage: "reading" });
  const [pages, systemPrompt] = await Promise.all([
    discoverPages(params.inputUrl),
    buildSystemPrompt(),
  ]);
  params.onStatus?.({ stage: "read", pages: pages.length });
  // Never let a model write from memory: with nothing to read, it invents.
  if (!hasEnoughSource(pages)) {
    return { status: "no_sources", reason: noSourcesReason(pages.input), httpStatus: pages.input?.httpStatus ?? null };
  }
  await params.beforeFirstModelCall?.();

  const today = new Date().toISOString().slice(0, 10);
  const userPrompt = buildUserPrompt(params.inputUrl, pages, today);

  let attempt = 0;
  for (const step of chain) {
    if (Date.now() - startedAt > GENERATION_DEADLINE_MS) break;
    // Re-check the spend cap right before every paid call: an earlier step
    // in this same request, or a concurrent request, may have crossed it.
    if (step.isPaid && (await isOverDailySpendCap())) continue;

    attempt += 1;
    params.onModelStart?.(step.model);
    params.onStatus?.({ stage: "drafting", attempt });
    const outcome = await streamCompletion({
      models: step.models,
      systemPrompt,
      userPrompt,
      firstTokenTimeoutMs: step.firstTokenTimeoutMs,
      onDelta: params.onDelta,
    });

    if (outcome.kind === "timeout") {
      await logAttempt({
        resultId: null,
        model: step.model,
        outcome: "timeout",
        firstTokenMs: null,
        totalMs: outcome.elapsedMs,
        tokensIn: null,
        tokensOut: null,
        costUsd: 0,
      });
      params.onStatus?.({ stage: "retrying", reason: "slow" });
      continue;
    }

    if (outcome.kind === "error") {
      await logAttempt({
        resultId: null,
        model: step.model,
        outcome: "error",
        firstTokenMs: null,
        totalMs: outcome.elapsedMs,
        tokensIn: null,
        tokensOut: null,
        costUsd: 0,
      });
      params.onStatus?.({ stage: "retrying", reason: "error" });
      continue;
    }

    const { result } = outcome;
    // Structure first, then provenance: a well-formed file with invented
    // figures is still a failure.
    const problems = [...validate(result.text), ...groundingProblems(result.text, pages)];
    const servedModel = result.servedModel ?? step.model;
    const markdown = result.text.trim();

    let resultId: string | null = null;
    if (problems.length === 0 && params.persistResult) {
      resultId = await params.persistResult(markdown, servedModel, result.costUsd);
    }

    await logAttempt({
      resultId,
      model: servedModel,
      outcome: problems.length === 0 ? "success" : "quality_fail",
      firstTokenMs: result.firstTokenMs,
      totalMs: result.totalMs,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costUsd: result.costUsd,
    });

    if (problems.length === 0) {
      return { status: "success", markdown, model: servedModel, costUsd: result.costUsd, resultId };
    }
    params.onStatus?.({ stage: "retrying", reason: "quality" });
  }

  return { status: "exhausted" };
}
