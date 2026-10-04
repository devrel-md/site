import { describe, it, expect } from "vitest";
import { excludeHost } from "@/lib/excludeHost";

function recorder(rowCount = 3) {
  const calls: { text: string; params: unknown[] }[] = [];
  const run = async (text: string, params: unknown[] = []) => {
    calls.push({ text: text.replace(/\s+/g, " ").trim(), params });
    return { rowCount };
  };
  return { calls, run };
}

describe("excludeHost", () => {
  it("blocks the host, then marks its results excluded", async () => {
    const { calls, run } = recorder(3);
    const out = await excludeHost(run, "acme.dev", { remove: false, reason: "owner request" });
    expect(out).toEqual({ affected: 3 });
    expect(calls).toHaveLength(2);
    expect(calls[0]!.text).toContain("insert into excluded_hosts");
    expect(calls[0]!.text).toContain("on conflict (host) do update");
    expect(calls[0]!.params).toEqual(["acme.dev", "owner request"]);
    expect(calls[1]!.text).toBe("update results set excluded_at = coalesce(excluded_at, now()) where host = $1");
    expect(calls[1]!.params).toEqual(["acme.dev"]);
  });

  it("deletes the results with remove, and still blocks the host first", async () => {
    const { calls, run } = recorder(2);
    const out = await excludeHost(run, "acme.dev", { remove: true });
    expect(out).toEqual({ affected: 2 });
    expect(calls[0]!.text).toContain("insert into excluded_hosts");
    expect(calls[0]!.params).toEqual(["acme.dev", null]);
    expect(calls[1]!.text).toBe("delete from results where host = $1");
  });
});
