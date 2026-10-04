// Runs once when the server starts. In production, report any required variable
// that is missing or still on its development default (names only). It never
// throws: /healthz carries the result, and the affected features refuse on their own.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkConfig, isProductionRuntime, logConfigReport } = await import("@/lib/configCheck");
  if (!isProductionRuntime()) return;
  logConfigReport(checkConfig());
}
