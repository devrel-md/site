import { safeFetch } from "@/lib/ssrf";

// robots.txt handling per RFC 9309: consecutive User-agent lines share one
// group, Allow and Disallow both count, the longest matching rule wins (Allow
// on a tie), and rules may use * and a trailing $.

const PRODUCT_TOKEN = "devrel.md-generator";

interface Rule {
  allow: boolean;
  pattern: string;
}

interface Group {
  agents: string[];
  rules: Rule[];
}

const ROBOTS_CACHE_TTL_MS = 5 * 60 * 1000;
const robotsCache = new Map<string, { groups: Group[]; fetchedAt: number }>();

export function parseRobots(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && current) {
      // An empty Disallow means "nothing is disallowed": no rule to add.
      if (value) current.rules.push({ allow: key === "allow", pattern: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

function patternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${regex}${anchored ? "$" : ""}`).test(path);
}

/** True when these robots.txt groups disallow `path` for our product token. */
export function isPathDisallowed(groups: Group[], path: string): boolean {
  const token = PRODUCT_TOKEN.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  const applicable = specific.length > 0 ? specific : groups.filter((g) => g.agents.includes("*"));
  const rules = applicable.flatMap((g) => g.rules);

  let best: Rule | null = null;
  for (const rule of rules) {
    if (!patternMatches(rule.pattern, path)) continue;
    if (
      !best ||
      rule.pattern.length > best.pattern.length ||
      (rule.pattern.length === best.pattern.length && rule.allow)
    ) {
      best = rule;
    }
  }
  return best !== null && !best.allow;
}

async function getGroups(origin: string): Promise<Group[]> {
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < ROBOTS_CACHE_TTL_MS) return cached.groups;

  let groups: Group[] = [];
  try {
    const res = await safeFetch(`${origin}/robots.txt`);
    if (res.status === 200) groups = parseRobots(res.text);
  } catch {
    groups = [];
  }
  robotsCache.set(origin, { groups, fetchedAt: Date.now() });
  return groups;
}

/** True when robots.txt disallows `pathname` for our generator.
 * Fails open (allowed) when robots.txt is missing or unreadable, per convention.
 * Caches robots.txt per origin for a few minutes, since discoverPages checks
 * several paths on the same origin in one generation. */
export async function isDisallowed(origin: string, pathname: string): Promise<boolean> {
  return isPathDisallowed(await getGroups(origin), pathname);
}
