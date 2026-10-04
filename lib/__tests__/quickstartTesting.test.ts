import { describe, expect, it } from "vitest";
import { readQuickstart } from "@/lib/content";
import { markdownToHtml } from "@/lib/markdown";
import { RATE_LIMIT_PER_IP_PER_DAY, RATE_LIMIT_VALIDATE_PER_IP_PER_DAY } from "@/lib/generatorConfig";

// Agent-readiness check 15 looks for sandbox or test wording on the quickstart.
describe("quickstart testing section", () => {
  it("explains how to test safely, with a stable heading id", async () => {
    const html = await markdownToHtml(await readQuickstart());
    expect(html).toContain('<h2 id="testing-safely">Testing safely</h2>');
  });

  it("covers the sandbox question, caching and the free validator", async () => {
    const md = await readQuickstart();
    expect(md).toMatch(/no separate sandbox/i);
    expect(md).toMatch(/test mode/i);
    expect(md).toMatch(/test key/i);
    expect(md).toMatch(/staging/i);
    expect(md).toContain("24 hours");
    expect(md).toContain("`POST /api/validate`");
    expect(md).toContain("(/api)");
  });

  it("quotes the real daily limits", async () => {
    const md = await readQuickstart();
    expect(md).toContain(`${RATE_LIMIT_VALIDATE_PER_IP_PER_DAY} checks a day`);
    expect(md).toContain("five generations a day");
    expect(RATE_LIMIT_PER_IP_PER_DAY).toBe(5);
  });
});
