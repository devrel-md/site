import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }));

import { unsubscribeByToken } from "@/lib/unsubscribe";

describe("unsubscribeByToken", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("reports not found for an empty token without querying the database", async () => {
    const result = await unsubscribeByToken("");
    expect(result).toEqual({ found: false, alreadyUnsubscribed: false });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("reports not found for a token matching no lead", async () => {
    queryMock.mockResolvedValueOnce([]);
    const result = await unsubscribeByToken("nope");
    expect(result).toEqual({ found: false, alreadyUnsubscribed: false });
  });

  it("unsubscribes a lead and cancels their pending outbox rows", async () => {
    queryMock
      .mockResolvedValueOnce([{ id: "lead-1", unsubscribed_at: null }]) // select
      .mockResolvedValueOnce([]) // update leads
      .mockResolvedValueOnce([]); // update outbox

    const result = await unsubscribeByToken("token-1");

    expect(result).toEqual({ found: true, alreadyUnsubscribed: false });
    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(String(queryMock.mock.calls[1]![0])).toMatch(/update leads set unsubscribed_at/i);
    expect(String(queryMock.mock.calls[2]![0])).toMatch(/update outbox/i);
  });

  it("is idempotent for an already-unsubscribed lead", async () => {
    queryMock.mockResolvedValueOnce([{ id: "lead-1", unsubscribed_at: "2026-09-01T00:00:00Z" }]);

    const result = await unsubscribeByToken("token-1");

    expect(result).toEqual({ found: true, alreadyUnsubscribed: true });
    // No further writes once already unsubscribed.
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
