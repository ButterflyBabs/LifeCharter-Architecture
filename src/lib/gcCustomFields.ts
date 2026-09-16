import { createServerClient } from "@/lib/supabase/server";

/**
 * Shared Global Control custom-field writer, used by both the Executive
 * Consultation qualification flow (execConsultGC.ts) and the New Client
 * Onboarding flow (onboard-client/route.ts).
 *
 * Field maps (JSON: {"<our key>": "<Global Control customFieldId>"}) are
 * read from the RLS-locked app_settings table first, falling back to a
 * Vercel env var of the same logical name for backward compatibility. This
 * means a field map can be set directly (e.g. right after creating the
 * fields via the GC API) without needing a manual Vercel dashboard paste.
 */

const GC_BASE = process.env.GC_BASE || "https://api.globalcontrol.io/api/ai";

async function getFieldMap(settingsKey: string, envVarName: string): Promise<Record<string, string>> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("app_settings").select("value").eq("key", settingsKey).maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
    }
  } catch {
    // fall through to the env var
  }
  try {
    return JSON.parse(process.env[envVarName] || "{}");
  } catch {
    return {};
  }
}

// The account-wide-key contacts search, used to resolve a contact id when
// the tag-fire call that created/updated the contact doesn't hand one back
// (tag-form-submission never does — see onboard-client/route.ts).
export async function findGcContactIdByEmail(email: string): Promise<string | null> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${GC_BASE}/contacts?search=${encodeURIComponent(email)}&limit=5&page=1`, {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const envelope = data && typeof data === "object" && "data" in data ? (data as { data: unknown }).data : data;
    let rows: Record<string, unknown>[] = [];
    if (Array.isArray(envelope)) rows = envelope as Record<string, unknown>[];
    else if (envelope && typeof envelope === "object") {
      const e = envelope as Record<string, unknown>;
      const candidate = e.contacts ?? e.results ?? e.items ?? e.data;
      if (Array.isArray(candidate)) rows = candidate as Record<string, unknown>[];
    }
    const match = rows.find((r) => String(r.email ?? "").toLowerCase() === email.toLowerCase()) ?? rows[0];
    if (!match) return null;
    const id = match._id ?? match.id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

// Writes `values` onto a contact's custom fields, using whichever keys both
// have a value and are present in the resolved field map. Best-effort —
// a missing map, a missing map entry, or a missing contact id all degrade
// to a no-op rather than failing the caller's request.
export async function writeGcCustomFields(
  contactId: string | null,
  values: Record<string, string | undefined>,
  settingsKey: string,
  envVarName: string
): Promise<"written" | "skipped"> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey || !contactId) return "skipped";

  const fieldMap = await getFieldMap(settingsKey, envVarName);
  if (!Object.keys(fieldMap).length) return "skipped";

  const customFields = Object.entries(fieldMap)
    .filter(([key]) => values[key] !== undefined && values[key] !== "")
    .map(([key, customFieldId]) => ({ customFieldId, value: values[key] as string }));

  if (!customFields.length) return "skipped";

  try {
    await fetch(`${GC_BASE}/contacts/${encodeURIComponent(contactId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({ customFields }),
    });
    return "written";
  } catch (err) {
    console.error(`[gcCustomFields] write error for contact ${contactId}:`, err);
    return "skipped";
  }
}
