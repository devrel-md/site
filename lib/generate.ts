import { MODEL_CHAIN, FIRST_TOKEN_TIMEOUT_MS } from "@/lib/generatorConfig";
import { streamCompletion } from "@/lib/openrouter";
import { validate } from "@/lib/validator";
import { logAttempt } from "@/lib/attempts";
import { isFreeModelCircuitOpen } from "@/lib/circuitBreaker";
import { isOverDailySpendCap } from "@/lib/spendCap";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/generatorPrompt";
import { discoverPages } from "@/lib/discoverPages";

export interface GenerateSuccess {
  status: "success";
  markdown: string;
  model: string;
  costUsd: number;
}

export interface GenerateFailure {
  status: "capped" | "exhausted";
}

export type GenerateOutcome = GenerateSuccess | GenerateFailure;

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
}): Promise<GenerateOutcome> {
  const chain = await buildChain();
  if (chain.length === 0) {
    return { status: "capped" };
  }

  const [pages, systemPrompt] = await Promise.all([
    discoverPages(params.inputUrl),
    buildSystemPrompt(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const userPrompt = buildUserPrompt(params.inputUrl, pages, today);

  for (const step of chain) {
    // Re-check the spend cap right before every paid call: an earlier step
    // in this same request, or a concurrent request, may have crossed it.
    if (step.isPaid && (await isOverDailySpendCap())) continue;

    params.onModelStart?.(step.model);
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
      continue;
    }

    const { result } = outcome;
    const problems = validate(result.text);

    await logAttempt({
      resultId: null,
      model: result.servedModel ?? step.model,
      outcome: problems.length === 0 ? "success" : "quality_fail",
      firstTokenMs: result.firstTokenMs,
      totalMs: result.totalMs,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costUsd: result.costUsd,
    });

    if (problems.length === 0) {
      return {
        status: "success",
        markdown: result.text.trim(),
        model: result.servedModel ?? step.model,
        costUsd: result.costUsd,
      };
    }
  }

  return { status: "exhausted" };
}
