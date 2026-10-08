import { env, isConfigured } from "@/lib/env";

const FOLK_API_BASE = "https://api.folk.app/v1";
const FOLK_API_URL = `${FOLK_API_BASE}/people`;

/** The Folk group that marks a person as a DEVREL.md community contact. It is
 * looked up by name and never created here: the owner creates it in Folk. */
export const COMMUNITY_GROUP_NAME = "DEVREL.md community";

interface FolkGroupRef {
  id: string;
  name?: string;
}

interface FolkPerson {
  id: string;
  groups?: FolkGroupRef[];
}

interface FolkResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

/** Keeps the cause of a failure readable in the log without leaking personal
 * data: email addresses are masked and the text is cut short. */
function safeMessage(text: string): string {
  return text.replace(/[^\s"'<>,]+@[^\s"'<>,]+/g, "[email]").slice(0, 300);
}

/** Pulls Folk's validation message out of an error body: the top-level message
 * plus each issue message. Falls back to the raw text when it is not JSON. */
function errorMessage(raw: string): string {
  try {
    const body = JSON.parse(raw) as { error?: { message?: string; details?: { issues?: { message?: string }[] } } };
    const parts = [body.error?.message, ...(body.error?.details?.issues ?? []).map((issue) => issue.message)];
    const message = parts.filter(Boolean).join("; ");
    if (message) return safeMessage(message);
  } catch {
    // Not JSON; use the raw text below.
  }
  return safeMessage(raw);
}

/** One Folk call. Failures are logged as status and message only (never the
 * key, never the request body), and returned rather than thrown. */
async function folkRequest<T>(label: string, url: string, method: string, body?: unknown): Promise<FolkResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${env.folkApiKey}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      console.error(`Folk ${label} failed: HTTP ${response.status}: ${errorMessage(raw)}`);
      return { ok: false, status: response.status, data: null };
    }
    const json = await response.json().catch(() => ({})) as { data?: T };
    return { ok: true, status: response.status, data: json.data ?? null };
  } catch (error) {
    console.error(`Folk ${label} failed: ${error instanceof Error ? error.message : "network error"}`);
    return { ok: false, status: 0, data: null };
  }
}

/** Finds the community group by name. When it does not exist, logs the names
 * Folk does have (group names are not personal data) so the mismatch is easy
 * to spot, and returns null. The person is then synced without a group. */
async function findCommunityGroupId(): Promise<string | null> {
  const wanted = COMMUNITY_GROUP_NAME.toLowerCase();
  const seen: string[] = [];
  let url: string | null = `${FOLK_API_BASE}/groups?limit=100`;
  for (let page = 0; url && page < 5; page++) {
    const result: FolkResult<{ items?: FolkGroupRef[]; pagination?: { nextLink?: string } }> = await folkRequest("group lookup", url, "GET");
    if (!result.ok || !result.data) return null;
    for (const group of result.data.items ?? []) {
      if ((group.name ?? "").trim().toLowerCase() === wanted) return group.id;
      seen.push(group.name ?? "");
    }
    const next: string | undefined = result.data.pagination?.nextLink;
    // Only follow a link on the Folk API itself, so the key is never sent elsewhere.
    url = next?.startsWith(`${FOLK_API_BASE}/`) ? next : null;
  }
  console.warn(`Folk group "${COMMUNITY_GROUP_NAME}" not found, syncing without a group. Groups in Folk: ${seen.join(", ") || "none"}`);
  return null;
}

async function findPersonByEmail(email: string): Promise<FolkPerson | null> {
  const url = `${FOLK_API_URL}?limit=1&filter[emails][eq]=${encodeURIComponent(email)}`;
  const result = await folkRequest<{ items?: FolkPerson[] }>("person search", url, "GET");
  return result.data?.items?.[0] ?? null;
}

async function addNote(personId: string, content: string): Promise<void> {
  await folkRequest("note", `${FOLK_API_BASE}/notes`, "POST", { entity: { id: personId }, visibility: "public", content });
}

/** Creates or updates the person for this email and marks them as a community
 * contact. Never throws: returns the Folk person id, or null when the sync
 * could not complete (the cause is logged). Duplicates are avoided by looking
 * the person up (by known id, then by email) before creating anyone. */
export async function syncCommunityToFolk(email: string, existingId: string | null): Promise<string | null> {
  if (!isConfigured("folk")) return null;
  try {
    const groupId = await findCommunityGroupId();

    let person: FolkPerson | null = null;
    if (existingId) {
      const known = await folkRequest<FolkPerson>("person lookup", `${FOLK_API_URL}/${encodeURIComponent(existingId)}`, "GET");
      person = known.data;
      if (!person && known.status !== 404) return null;
    }
    person ??= await findPersonByEmail(email);

    if (person) {
      // Folk replaces the whole groups list on update, so keep existing groups.
      const groups = person.groups ?? [];
      if (groupId && !groups.some((group) => group.id === groupId)) {
        const updated = await folkRequest<FolkPerson>("person update", `${FOLK_API_URL}/${encodeURIComponent(person.id)}`, "PATCH", {
          groups: [...groups.map((group) => ({ id: group.id })), { id: groupId }],
        });
        if (!updated.ok) return null;
      }
    } else {
      const created = await folkRequest<FolkPerson>("person create", FOLK_API_URL, "POST", {
        emails: [email],
        ...(groupId ? { groups: [{ id: groupId }] } : {}),
      });
      person = created.data;
      if (!person) return null;
    }

    // Community contacts carry an opt-in note only. No qualification, deal or sales note is created.
    await addNote(person.id, `Explicit opt-in to DEVREL.md community updates on ${new Date().toISOString().slice(0, 10)}. No sales consent.`);
    return person.id;
  } catch (error) {
    console.error("Folk community sync failed", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

/** Takes the person out of the community group (so a plain group filter no
 * longer lists them) and records the withdrawal as a note. Never throws. */
export async function markCommunityUnsubscribedInFolk(personId: string): Promise<void> {
  if (!isConfigured("folk")) return;
  try {
    const person = await folkRequest<FolkPerson>("person lookup", `${FOLK_API_URL}/${encodeURIComponent(personId)}`, "GET");
    if (!person.data) return;

    const wanted = COMMUNITY_GROUP_NAME.toLowerCase();
    const groups = person.data.groups ?? [];
    const remaining = groups.filter((group) => (group.name ?? "").trim().toLowerCase() !== wanted);
    if (remaining.length !== groups.length) {
      const updated = await folkRequest("person update", `${FOLK_API_URL}/${encodeURIComponent(personId)}`, "PATCH", {
        groups: remaining.map((group) => ({ id: group.id })),
      });
      if (!updated.ok) return;
    }
    await addNote(personId, `DEVREL.md community updates withdrawn on ${new Date().toISOString().slice(0, 10)}. Do not send community email.`);
  } catch (error) {
    console.error("Folk community unsubscribe sync failed", error instanceof Error ? error.message : "unknown error");
  }
}
