const DESTINATIONS: Record<string, string> = {
  audit: "https://devrelbridge.com/audit",
  launch: "https://devrelbridge.com/devrel-launch-sprint",
  program: "https://devrelbridge.com/90-day-developer-adoption-program",
  book: "https://devrelbridge.com/book",
};

const ALLOWED_MEDIUMS = new Set(["skill", "generator", "site", "email"]);

export interface GoParams {
  slug: string;
  medium: string;
  campaign: string | null;
  leadToken: string | null;
}

/** Resolve a /go/[slug] request into a destination URL and the UTM/lead params to log and append. */
export function resolveGo(slug: string, searchParams: URLSearchParams): { destination: string | null; params: GoParams } {
  const destination = DESTINATIONS[slug] ?? null;

  const rawMedium = searchParams.get("m") ?? "site";
  const medium = ALLOWED_MEDIUMS.has(rawMedium) ? rawMedium : "site";
  const campaign = searchParams.get("c");
  const leadToken = searchParams.get("t");

  return { destination, params: { slug, medium, campaign, leadToken } };
}

export function buildTrackedUrl(destination: string, params: GoParams): string {
  const url = new URL(destination);
  url.searchParams.set("utm_source", "devrel.md");
  url.searchParams.set("utm_medium", params.medium);
  if (params.campaign) url.searchParams.set("utm_campaign", params.campaign);
  if (params.leadToken) url.searchParams.set("lt", params.leadToken);
  return url.toString();
}

export function knownSlugs(): string[] {
  return Object.keys(DESTINATIONS);
}
