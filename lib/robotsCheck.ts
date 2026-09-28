import { safeFetch } from "@/lib/ssrf";

interface RobotsRule {
  userAgent: string;
  disallow: string[];
}

const ROBOTS_CACHE_TTL_MS = 5 * 60 * 1000;
const robotsCache = new Map<string, { rules: RobotsRule[]; fetchedAt: number }>();

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

async function getRules(origin: string): Promise<RobotsRule[]> {
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < ROBOTS_CACHE_TTL_MS) return cached.rules;

  let rules: RobotsRule[] = [];
  try {
    const res = await safeFetch(`${origin}/robots.txt`);
    if (res.status === 200) rules = parseRobots(res.text);
  } catch {
    rules = [];
  }
  robotsCache.set(origin, { rules, fetchedAt: Date.now() });
  return rules;
}

/** True when robots.txt disallows `pathname` for our generator UA or `*`.
 * Fails open (allowed) when robots.txt is missing or unreadable, per convention.
 * Caches robots.txt per origin for a few minutes, since discoverPages checks
 * several paths on the same origin in one generation. */
export async function isDisallowed(origin: string, pathname: string): Promise<boolean> {
  const rules = await getRules(origin);
  const ua = "devrel.md-generator";
  const specific = rules.filter((r) => ua.toLowerCase().includes(r.userAgent) && r.userAgent !== "*");
  const wildcard = rules.filter((r) => r.userAgent === "*");
  const applicable = specific.length > 0 ? specific : wildcard;

  return applicable.some((rule) =>
    rule.disallow.some((prefix) => prefix === "/" || pathname.startsWith(prefix))
  );
}
