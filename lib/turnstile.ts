import { env } from "@/lib/env";
import { isProductionRuntime, turnstileSecretProblem } from "@/lib/configCheck";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verifies a Turnstile token server-side. Cloudflare's documented always-pass
 * test secret (1x0000000000000000000000000000000AA, our local default)
 * verifies successfully for any token, so this works unchanged in local dev.
 * In production a missing or test secret fails closed instead. */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  if (!token) return false;
  if (isProductionRuntime() && turnstileSecretProblem()) {
    console.error("[config] refusing Turnstile check: TURNSTILE_SITE_SECRET is", turnstileSecretProblem());
    return false;
  }

  try {
    const body = new URLSearchParams({ secret: env.turnstileSecretKey, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed", err);
    return false;
  }
}
