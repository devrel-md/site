import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmMock = vi.fn();
const saveFolkMock = vi.fn();
const audienceMock = vi.fn();
const folkMock = vi.fn();
const retryMock = vi.fn();
vi.mock("@/lib/community", () => ({
  confirmCommunitySubscriber: (...args: unknown[]) => confirmMock(...args),
  saveCommunityFolkId: (...args: unknown[]) => saveFolkMock(...args),
  retryMissingFolkSyncs: (...args: unknown[]) => retryMock(...args),
}));
vi.mock("@/lib/folk", () => ({ syncCommunityToFolk: (...args: unknown[]) => folkMock(...args) }));
vi.mock("@/lib/resend", () => ({ upsertAudienceContact: (...args: unknown[]) => audienceMock(...args) }));

import { GET, POST } from "@/app/api/community/confirm/route";

const subscriber = { email: "reader@example.com", unsubscribe_token: "u", folk_person_id: null };

function post(token: string): Request {
  return new Request("https://devrel.md/api/community/confirm", { method: "POST", body: new URLSearchParams({ token }) });
}

describe("community confirmation", () => {
  beforeEach(() => {
    for (const m of [confirmMock, saveFolkMock, audienceMock, folkMock, retryMock]) m.mockReset();
    folkMock.mockResolvedValue("folk-123");
  });

  it("does not confirm or sync on a plain GET, so link scanners cannot subscribe anyone", async () => {
    const response = await GET(new Request("https://devrel.md/api/community/confirm?token=abc"));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('value="abc"');
    expect(confirmMock).not.toHaveBeenCalled();
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });

  it("rejects a GET with no token", async () => {
    const response = await GET(new Request("https://devrel.md/api/community/confirm"));
    expect(response.status).toBe(400);
  });

  it("syncs to the Resend audience and Folk only when the link is confirmed", async () => {
    confirmMock.mockResolvedValue({ status: "confirmed", subscriber });
    const response = await POST(post("abc"));
    expect(response.status).toBe(200);
    expect(confirmMock).toHaveBeenCalledWith("abc");
    expect(audienceMock).toHaveBeenCalledWith({ email: "reader@example.com" });
    expect(folkMock).toHaveBeenCalledWith("reader@example.com", null);
    expect(saveFolkMock).toHaveBeenCalledWith("reader@example.com", "folk-123");
    // Heals earlier confirmations whose Folk sync failed, without redoing this one.
    expect(retryMock).toHaveBeenCalledWith(10, "reader@example.com");
  });

  it("is idempotent: a second use of the link syncs nothing", async () => {
    confirmMock.mockResolvedValue({ status: "already_confirmed" });
    const response = await POST(post("abc"));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("already confirmed");
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("does not resubscribe someone who unsubscribed after confirming", async () => {
    confirmMock.mockResolvedValue({ status: "unsubscribed" });
    const response = await POST(post("abc"));
    expect(await response.text()).toContain("unsubscribed");
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });

  it("rejects an expired or unknown token and syncs nothing", async () => {
    confirmMock.mockResolvedValue({ status: "invalid" });
    const response = await POST(post("nope"));
    expect(response.status).toBe(400);
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });
});
