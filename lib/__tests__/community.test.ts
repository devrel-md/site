import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => queryMock(...args),
  queryOne: async (...args: unknown[]) => (await queryMock(...args))[0],
}));
const sendEmailMock = vi.fn();
vi.mock("@/lib/resend", () => ({ sendEmail: (...args: unknown[]) => sendEmailMock(...args) }));

import {
  CONFIRMATION_RESEND_COOLDOWN_MINUTES,
  CONFIRMATION_TTL_DAYS,
  confirmCommunitySubscriber,
  purgeExpiredPending,
  requestCommunitySignup,
  sendCommunityConfirmation,
} from "@/lib/community";

const row = {
  email: "reader@example.com",
  unsubscribe_token: "unsub-token",
  confirm_token: "confirm-token",
  confirmed_at: null,
  unsubscribed_at: null,
  folk_person_id: null,
};

describe("requestCommunitySignup", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sendEmailMock.mockReset();
  });

  it("stores the signup as pending, lower-cases the email and keeps the unsubscribe token on conflict", async () => {
    queryMock.mockResolvedValue([row]);
    expect(await requestCommunitySignup("Reader@Example.com")).toEqual(row);
    const [sql, params] = queryMock.mock.calls[0]!;
    expect(params[0]).toBe("reader@example.com");
    expect(params[3]).toBe(CONFIRMATION_RESEND_COOLDOWN_MINUTES);
    // Never marks a signup confirmed, and never rotates the unsubscribe token.
    expect(String(sql)).not.toMatch(/confirmed_at\s*=\s*now\(\)/i);
    expect(String(sql)).not.toMatch(/unsubscribe_token\s*=\s*excluded/i);
    expect(String(sql)).toMatch(/confirmed_at = null/i);
  });

  it("returns null when the guarded upsert changes nothing (already subscribed or just asked)", async () => {
    queryMock.mockResolvedValue([]);
    expect(await requestCommunitySignup("reader@example.com")).toBeNull();
  });
});

describe("confirmCommunitySubscriber", () => {
  beforeEach(() => queryMock.mockReset());

  it("rejects an empty token without touching the database", async () => {
    expect(await confirmCommunitySubscriber("")).toEqual({ status: "invalid" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("confirms through one guarded update limited to unconfirmed, unexpired, not-since-unsubscribed rows", async () => {
    queryMock.mockResolvedValueOnce([{ ...row, confirmed_at: "2026-10-04T10:00:00Z" }]);
    const outcome = await confirmCommunitySubscriber("confirm-token");
    expect(outcome.status).toBe("confirmed");
    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0]!;
    expect(String(sql)).toMatch(/confirmed_at is null/i);
    expect(String(sql)).toMatch(/confirmation_sent_at > now\(\)/i);
    expect(String(sql)).toMatch(/unsubscribed_at < confirmation_sent_at/i);
    expect(params).toEqual(["confirm-token", CONFIRMATION_TTL_DAYS]);
  });

  it("reports an already-used link as a no-op", async () => {
    queryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ confirmed_at: "2026-10-04T10:00:00Z", unsubscribed_at: null }]);
    expect(await confirmCommunitySubscriber("confirm-token")).toEqual({ status: "already_confirmed" });
  });

  it("does not report a confirmed then unsubscribed address as subscribed", async () => {
    queryMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ confirmed_at: "2026-10-04T10:00:00Z", unsubscribed_at: "2026-10-05T10:00:00Z" }]);
    expect(await confirmCommunitySubscriber("confirm-token")).toEqual({ status: "unsubscribed" });
  });

  it("treats an expired or unknown token as invalid", async () => {
    queryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ confirmed_at: null, unsubscribed_at: null }]);
    expect(await confirmCommunitySubscriber("old")).toEqual({ status: "invalid" });
    queryMock.mockReset();
    queryMock.mockResolvedValue([]);
    expect(await confirmCommunitySubscriber("unknown")).toEqual({ status: "invalid" });
  });
});

describe("purgeExpiredPending", () => {
  it("only deletes unconfirmed, never-unsubscribed rows that have a confirm token", async () => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([]);
    await purgeExpiredPending();
    const [sql, params] = queryMock.mock.calls[0]!;
    expect(String(sql)).toMatch(/^\s*delete from community_subscribers/i);
    expect(String(sql)).toMatch(/confirmed_at is null/i);
    expect(String(sql)).toMatch(/unsubscribed_at is null/i);
    expect(String(sql)).toMatch(/confirm_token is not null/i);
    expect(params).toEqual([CONFIRMATION_TTL_DAYS]);
  });
});

describe("sendCommunityConfirmation", () => {
  it("sends the confirm and unsubscribe links, and the token behind the List-Unsubscribe header", async () => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ sent: true });
    await sendCommunityConfirmation(row as never);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const params = sendEmailMock.mock.calls[0]![0] as { to: string; text: string; html: string; leadToken: string };
    expect(params.to).toBe("reader@example.com");
    expect(params.text).toContain("/api/community/confirm?token=confirm-token");
    expect(params.text).toContain("/api/unsubscribe?token=unsub-token");
    expect(params.html).toContain("/api/unsubscribe?token=unsub-token");
    // sendEmail turns this into the List-Unsubscribe and List-Unsubscribe-Post headers.
    expect(params.leadToken).toBe("unsub-token");
  });
});
