import { safeFetch } from "@/lib/ssrf";

interface RobotsRule {
  userAgent: string;
  disallow: string[];
}

function parseRobots(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let current: RobotsRule | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (!key) continue;
    if (key.toLowerCase() === "user-agent") {
      current = { userAgent: value.toLowerCase(), disallow: [] };
      rules.push(current);
    } else if (key.toLowerCase() === "disallow" && current) {
      if (value) current.disallow.push(value);
    }
  }
  return rules;
}

/** True when robots.txt disallows `pathname` for our generator UA or `*`.
 * Fails open (allowed) when robots.txt is missing or unreadable, per convention. */
export async function isDisallowed(origin: string, pathname: string): Promise<boolean> {
  let text: string;
  try {
    const res = await safeFetch(`${origin}/robots.txt`);
    if (res.status !== 200) return false;
    text = res.text;
  } catch {
    return false;
  }

  const rules = parseRobots(text);
  const ua = "devrel.md-generator";
  const specific = rules.filter((r) => ua.toLowerCase().includes(r.userAgent) && r.userAgent !== "*");
  const wildcard = rules.filter((r) => r.userAgent === "*");
  const applicable = specific.length > 0 ? specific : wildcard;

  return applicable.some((rule) =>
    rule.disallow.some((prefix) => prefix === "/" || pathname.startsWith(prefix))
  );
}
