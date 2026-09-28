export const ROLES = [
  "Founder / CEO",
  "CTO / engineering lead",
  "Head of product",
  "Head of marketing or growth",
  "Developer advocate",
  "Engineer",
  "Other",
] as const;

export const TEAM_SIZES = ["1 to 10", "11 to 50", "51 to 200", "201 to 1,000", "1,000+"] as const;

export type Role = (typeof ROLES)[number];
export type TeamSize = (typeof TEAM_SIZES)[number];

const QUALIFYING_ROLES: ReadonlySet<string> = new Set([
  "Founder / CEO",
  "CTO / engineering lead",
  "Head of product",
  "Head of marketing or growth",
]);

const QUALIFYING_TEAM_SIZES: ReadonlySet<string> = new Set(["11 to 50", "51 to 200", "201 to 1,000", "1,000+"]);

/** A lead is qualified when the role is a buyer/champion role and the team
 * is 11 or more people. */
export function isQualified(role: string, teamSize: string): boolean {
  return QUALIFYING_ROLES.has(role) && QUALIFYING_TEAM_SIZES.has(teamSize);
}
