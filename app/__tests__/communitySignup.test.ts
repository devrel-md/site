import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
const sendMock = vi.fn();
const releaseMock = vi.fn();
const purgeMock = vi.fn();
const audienceMock = vi.fn();
const folkMock = vi.fn();
const turnstileMock = vi.fn();
const rateLimitMock = vi.fn();
const resendConfiguredMock = vi.fn();
vi.mock("@/lib/community", () => ({
  CONFIRMATION_TTL_DAYS: 7,
  requestCommunitySignup: (...args: unknown[]) => requestMock(...args),
  sendCommunityConfirmation: (...args: unknown[]) => sendMock(...args),
  releaseConfirmation: (...args: unknown[]) => releaseMock(...args),
  purgeExpiredPending: (...args: unknown[]) => purgeMock(...args),
}));
vi.mock("@/lib/folk", () => ({ syncCommunityToFolk: (...args: unknown[]) => folkMock(...args) }));
vi.mock("@/lib/resend", () => ({ upsertAudienceContact: (...args: unknown[]) => audienceMock(...args) }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: (...args: unknown[]) => turnstileMock(...args) }));
vi.mock("@/lib/rateLimit", () => ({ checkAndIncrementRateLimit: (...args: unknown[]) => rateLimitMock(...args) }));
vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  isConfigured: () => resendConfiguredMock(),
}));

import { hashIp } from "@/lib/hash";
import { POST as subscribe } from "@/app/api/community/route";
import { POST as retiredLead } from "@/app/api/lead/route";

function request(fields: Record<string, string>): Request {
  return new Request("https://devrel.md/api/community", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9" },
    body: new URLSearchParams(fields),
  });
}

const valid = { email: "Reader@Example.com", communityConsent: "on", "cf-turnstile-response": "token-ok" };

function expectNothingStoredOrSynced() {
  expect(requestMock).not.toHaveBeenCalled();
  expect(sendMock).not.toHaveBeenCalled();
  expect(audienceMock).not.toHaveBeenCalled();
  expect(folkMock).not.toHaveBeenCalled();
}

describe("community signup", () => {
  beforeEach(() => {
    for (const m of [requestMock, sendMock, releaseMock, purgeMock, audienceMock, folkMock, turnstileMock, rateLimitMock, resendConfiguredMock]) {
      m.mockReset();
    }
    turnstileMock.mockResolvedValue(true);
    rateLimitMock.mockResolvedValue({ allowed: true, count: 1 });
    resendConfiguredMock.mockReturnValue(true);
    sendMock.mockResolvedValue({ sent: true, id: "email-1" });
    requestMock.mockResolvedValue({
      email: "reader@example.com",
      unsubscribe_token: "unsub-token",
      confirm_token: "confirm-token",
      folk_person_id: null,
    });
  });

  it("rate limits community signup on the trusted address, not a forged leftmost entry", async () => {
    const forged = new Request("https://devrel.md/api/community", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.77, 203.0.113.9" },
      body: new URLSearchParams(valid),
    });
    await subscribe(forged);
    expect(rateLimitMock).toHaveBeenCalledWith(hashIp("203.0.113.9"), "community");
    expect(turnstileMock).toHaveBeenCalledWith("token-ok", "203.0.113.9");
  });

  it("gives Turnstile no address when there is no single trusted one", async () => {
    const noProxy = new Request("https://devrel.md/api/community", { method: "POST", body: new URLSearchParams(valid) });
    await subscribe(noProxy);
    expect(turnstileMock).toHaveBeenCalledWith("token-ok", undefined);
    expect(rateLimitMock).toHaveBeenCalledWith(hashIp("unknown"), "community");
  });

  it("stores a pending signup and sends one confirmation, with no external sync", async () => {
    const response = await subscribe(request(valid));
    expect(response.status).toBe(200);
    expect(requestMock).toHaveBeenCalledWith("Reader@Example.com");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
    const text = await response.text();
    expect(text).toContain("You are not subscribed until you click that link");
    // The unsubscribe link goes in the email, not on the page.
    expect(text).not.toContain("unsub-token");
  });

  it("does not create a contact without explicit consent", async () => {
    const response = await subscribe(request({ email: "reader@example.com", "cf-turnstile-response": "token-ok" }));
    expect(response.status).toBe(400);
    expectNothingStoredOrSynced();
  });

  it("rejects a missing Turnstile token with a clear message and stores nothing", async () => {
    const response = await subscribe(request({ email: "reader@example.com", communityConsent: "on" }));
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("needs JavaScript");
    expect(turnstileMock).not.toHaveBeenCalled();
    expect(rateLimitMock).not.toHaveBeenCalled();
    expectNothingStoredOrSynced();
  });

  it("rejects a Turnstile token that fails verification and stores nothing", async () => {
    turnstileMock.mockResolvedValue(false);
    const response = await subscribe(request(valid));
    expect(response.status).toBe(400);
    expect(turnstileMock).toHaveBeenCalledWith("token-ok", "203.0.113.9");
    expect(rateLimitMock).not.toHaveBeenCalled();
    expectNothingStoredOrSynced();
  });

  it("applies a separate per-IP community limit and stores nothing once it is spent", async () => {
    rateLimitMock.mockResolvedValue({ allowed: false, count: 6 });
    const response = await subscribe(request(valid));
    expect(response.status).toBe(429);
    expect(rateLimitMock).toHaveBeenCalledTimes(1);
    expect(rateLimitMock.mock.calls[0]![1]).toBe("community");
    expectNothingStoredOrSynced();
  });

  it("gives the same reply and sends nothing when no new confirmation is due", async () => {
    requestMock.mockResolvedValue(null);
    const response = await subscribe(request(valid));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Check your inbox");
    expect(sendMock).not.toHaveBeenCalled();
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });

  it("reports a failed send, releases the cooldown and still syncs nothing", async () => {
    sendMock.mockResolvedValue({ sent: false });
    const response = await subscribe(request(valid));
    expect(response.status).toBe(502);
    expect(releaseMock).toHaveBeenCalledWith("reader@example.com");
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });

  it("carries on when Resend is not configured, as in local development", async () => {
    resendConfiguredMock.mockReturnValue(false);
    sendMock.mockResolvedValue({ sent: false });
    const response = await subscribe(request(valid));
    expect(response.status).toBe(200);
    expect(releaseMock).not.toHaveBeenCalled();
  });

  it("does not let a failing cleanup block a signup", async () => {
    purgeMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await subscribe(request(valid));
    expect(response.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("does not let old unlock forms create a sales lead", async () => {
    const response = await retiredLead();
    expect(response.status).toBe(410);
  });
});
