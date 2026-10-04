import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: (...args: unknown[]) => sendMock(...args) }; } }));
vi.mock("@/lib/env", () => ({
  env: { resendApiKey: "key", emailFrom: "DEVREL.md <hello@devrel.md>", emailReplyTo: "hello@devrel.md", siteUrl: "https://devrel.md", resendAudienceId: "" },
  isConfigured: () => true,
}));

import { sendEmail } from "@/lib/resend";

describe("sendEmail unsubscribe headers", () => {
  beforeEach(() => sendMock.mockReset());

  it("adds List-Unsubscribe and one-click List-Unsubscribe-Post for the given token", async () => {
    sendMock.mockResolvedValue({ data: { id: "e1" }, error: null });
    await sendEmail({ to: "a@example.com", subject: "s", html: "h", text: "t", leadToken: "tok en" });
    const payload = sendMock.mock.calls[0]![0] as { headers: Record<string, string> };
    expect(payload.headers["List-Unsubscribe"]).toContain("<https://devrel.md/api/unsubscribe?token=tok%20en>");
    expect(payload.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});
