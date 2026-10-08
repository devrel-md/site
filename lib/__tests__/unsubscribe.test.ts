import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));
const unsubscribeAudienceMock = vi.fn();
vi.mock("@/lib/resend", () => ({ unsubscribeAudienceContact: (...args: unknown[]) => unsubscribeAudienceMock(...args) }));
const folkUnsubscribeMock = vi.fn();
vi.mock("@/lib/folk", () => ({ markCommunityUnsubscribedInFolk: (...args: unknown[]) => folkUnsubscribeMock(...args) }));

import { unsubscribeByToken } from "@/lib/unsubscribe";

describe("unsubscribeByToken", () => {
  beforeEach(() => {
    queryMock.mockReset();
    unsubscribeAudienceMock.mockReset();
    folkUnsubscribeMock.mockReset();
    queryMock.mockResolvedValue([]);
  });

  it("reports not found for an empty token without querying the database", async () => {
    const result = await unsubscribeByToken("");
    expect(result).toEqual({ found: false, alreadyUnsubscribed: false });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("reports not found for a token matching no lead", async () => {
    const result = await unsubscribeByToken("nope");
    expect(result).toEqual({ found: false, alreadyUnsubscribed: false });
  });

  it("unsubscribes a legacy lead without touching the retired outbox", async () => {
    queryMock
      .mockResolvedValueOnce([]) // no community subscriber
      .mockResolvedValueOnce([{ id: "lead-1", unsubscribed_at: null }]) // select
      .mockResolvedValueOnce([]); // update leads

    const result = await unsubscribeByToken("token-1");

    expect(result).toEqual({ found: true, alreadyUnsubscribed: false });
    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(String(queryMock.mock.calls[2]![0])).toMatch(/update leads set unsubscribed_at/i);
    expect(queryMock.mock.calls.some(([sql]) => /outbox/i.test(String(sql)))).toBe(false);
  });

  it("is idempotent for an already-unsubscribed lead", async () => {
    queryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "lead-1", unsubscribed_at: "2026-09-01T00:00:00Z" }]);

    const result = await unsubscribeByToken("token-1");

    expect(result).toEqual({ found: true, alreadyUnsubscribed: true });
    // No further writes once already unsubscribed.
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("withdraws community consent and updates the mailing audience", async () => {
    queryMock.mockResolvedValueOnce([{ email: "reader@example.com", unsubscribed_at: null, folk_person_id: "folk-123" }]);
    const result = await unsubscribeByToken("community-token");
    expect(result).toEqual({ found: true, alreadyUnsubscribed: false });
    expect(String(queryMock.mock.calls[1]![0])).toMatch(/update community_subscribers set unsubscribed_at/i);
    expect(unsubscribeAudienceMock).toHaveBeenCalledWith("reader@example.com");
    expect(folkUnsubscribeMock).toHaveBeenCalledWith("folk-123");
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("lets a pending, never-confirmed signup unsubscribe using the link in the confirmation email", async () => {
    // Pending rows have the same unsubscribe token column as confirmed ones.
    queryMock.mockResolvedValueOnce([{ email: "pending@example.com", unsubscribed_at: null, folk_person_id: null }]);
    const result = await unsubscribeByToken("pending-token");
    expect(result).toEqual({ found: true, alreadyUnsubscribed: false });
    expect(String(queryMock.mock.calls[1]![0])).toMatch(/update community_subscribers set unsubscribed_at/i);
    expect(folkUnsubscribeMock).not.toHaveBeenCalled();
  });
});
