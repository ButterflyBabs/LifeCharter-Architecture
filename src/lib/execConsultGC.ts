// Global Control writes for the Executive Consultation qualification
// questionnaires (/schedule/masterclass and /schedule/website).
//
// Uses the same "AI" API Global Control's own MasterClass/Challenge/
// Assessment integrations use (api.globalcontrol.io/api/ai), authenticated
// with the account-wide GLOBAL_CONTROL_API_KEY — not the per-client key
// stored in client_integrations (that one is scoped to each Suite client's
// own connected account, a different concern).
//
// Pattern proven in commandsuite-landing-page's assessment route: fire the
// tag first (creates/updates the contact by email and returns its id), then
// PUT customFields onto that same contact id. Both steps are best-effort —
// a missing GC_EXEC_FIELD_MAP entry or tag id degrades gracefully instead of
// failing the submission, same as the sales onboarding flow.

const GC_BASE = process.env.GC_BASE || "https://api.globalcontrol.io/api/ai";

function pickContactId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const candidates = [
    o._id,
    o.id,
    o.contactId,
    (o.contact as Record<string, unknown> | undefined)?._id,
    (o.data as Record<string, unknown> | undefined)?._id,
    (o.data as Record<string, unknown> | undefined)?.id,
  ];
  for (const c of candidates) if (typeof c === "string" && c) return c;
  return null;
}

export interface FireExecTagResult {
  status: "tagged" | "skipped_no_key" | "skipped_no_tag_id" | "failed" | "error";
  contactId: string | null;
}

// Fires one of the lccs-execconsult-* tags on a contact (creating/updating
// it by email), returning the contact id so custom fields can be written
// next.
export async function fireExecConsultTag(
  tagId: string | undefined,
  contact: { email: string; firstName?: string; lastName?: string; phone?: string }
): Promise<FireExecTagResult> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey) return { status: "skipped_no_key", contactId: null };
  if (!tagId) return { status: "skipped_no_tag_id", contactId: null };

  try {
    const res = await fetch(`${GC_BASE}/tags/fire-tag/${encodeURIComponent(tagId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        email: contact.email,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        phone: contact.phone || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`[execConsultGC] fire-tag failed for ${contact.email}:`, res.status, data);
      return { status: "failed", contactId: pickContactId(data) };
    }
    return { status: "tagged", contactId: pickContactId(data) };
  } catch (err) {
    console.error(`[execConsultGC] fire-tag error for ${contact.email}:`, err);
    return { status: "error", contactId: null };
  }
}

// Writes questionnaire answers onto the contact's custom fields, using
// GC_EXEC_FIELD_MAP (JSON: {"<our key>": "<Global Control customFieldId>"}).
// Silently writes only the keys that both have a value and are mapped —
// the questionnaire still works end-to-end before every field exists in GC.
export async function writeExecConsultFields(
  contactId: string | null,
  values: Record<string, string | undefined>
): Promise<"written" | "skipped"> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey || !contactId) return "skipped";

  let fieldMap: Record<string, string> = {};
  try {
    fieldMap = JSON.parse(process.env.GC_EXEC_FIELD_MAP || "{}");
  } catch {
    fieldMap = {};
  }
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
    console.error(`[execConsultGC] custom field write error for contact ${contactId}:`, err);
    return "skipped";
  }
}
