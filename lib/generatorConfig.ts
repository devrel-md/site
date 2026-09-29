// Model list and generator tuning, kept as config rather than buried in code
// so the fallback chain can change without a code review of the call site.
export const MODEL_CHAIN = {
  free: "nvidia/nemotron-3-ultra-550b-a55b:free",
  paidPrimary: "openai/gpt-6-luna",
  paidBackup: "deepseek/deepseek-v4-flash",
};

export const FIRST_TOKEN_TIMEOUT_MS = {
  free: 15_000,
  paid: 30_000,
};

export const CIRCUIT_BREAKER = {
  windowSize: 10,
  failureThreshold: 7,
  cooldownMs: 60 * 60 * 1000,
};

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const GENERATION_MAX_TOKENS = 8000;
export const GENERATION_TEMPERATURE = 0.2;

// 5 runs per hashed IP per day, per the brief. Not an env var: it is not in
// the brief's .env.example list, and belongs next to the other generator
// tuning here rather than as an extra undocumented variable.
export const RATE_LIMIT_PER_IP_PER_DAY = 5;

// The validator calls no paid model, just the local quality gate, so it gets
// a much more generous budget than the generator.
export const RATE_LIMIT_VALIDATE_PER_IP_PER_DAY = 30;
