import { beforeEach, describe, expect, it, vi } from "vitest";

const subscribeMock = vi.fn();
const audienceMock = vi.fn();
const folkMock = vi.fn();
const saveFolkMock = vi.fn();
vi.mock("@/lib/community", () => ({
  subscribeToCommunity: (...args: unknown[]) => subscribeMock(...args),
  saveCommunityFolkId: (...args: unknown[]) => saveFolkMock(...args),
}));
vi.mock("@/lib/folk", () => ({ syncCommunityToFolk: (...args: unknown[]) => folkMock(...args) }));
vi.mock("@/lib/resend", () => ({ upsertAudienceContact: (...args: unknown[]) => audienceMock(...args) }));

import { POST as subscribe } from "@/app/api/community/route";
import { POST as retiredLead } from "@/app/api/lead/route";

function request(fields: Record<string, string>): Request {
  return new Request("https://devrel.md/api/community", {
    method: "POST",
    body: new URLSearchParams(fields),
  });
}

describe("community signup", () => {
  beforeEach(() => {
    subscribeMock.mockReset();
    audienceMock.mockReset();
    folkMock.mockReset();
    saveFolkMock.mockReset();
    folkMock.mockResolvedValue("folk-123");
    subscribeMock.mockResolvedValue({ email: "reader@example.com", unsubscribe_token: "secret-token", folk_person_id: null });
  });

  it("stores only explicit consent and returns a withdrawal link", async () => {
    const response = await subscribe(request({ email: "reader@example.com", communityConsent: "on", company: "ignored" }));
    expect(response.status).toBe(200);
    expect(subscribeMock).toHaveBeenCalledWith("reader@example.com");
    expect(audienceMock).toHaveBeenCalledWith({ email: "reader@example.com" });
    expect(folkMock).toHaveBeenCalledWith("reader@example.com", null);
    expect(saveFolkMock).toHaveBeenCalledWith("reader@example.com", "folk-123");
    expect(await response.text()).toContain("/api/unsubscribe?token=secret-token");
  });

  it("does not create a contact without explicit consent", async () => {
    const response = await subscribe(request({ email: "reader@example.com" }));
    expect(response.status).toBe(400);
    expect(subscribeMock).not.toHaveBeenCalled();
    expect(audienceMock).not.toHaveBeenCalled();
    expect(folkMock).not.toHaveBeenCalled();
  });

  it("does not let old unlock forms create a sales lead", async () => {
    const response = await retiredLead();
    expect(response.status).toBe(410);
  });
});
