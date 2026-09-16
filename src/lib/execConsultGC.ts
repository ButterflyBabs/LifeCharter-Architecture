// Global Control writes for the Executive Consultation qualification
// questionnaires (/schedule/masterclass and /schedule/website).
//
// Uses the same "AI" API Global Control's own MasterClass/Challenge/
// Assessment integrations use (api.globalcontrol.io/api/ai), authenticated
// with the account-wide GLOBAL_CONTROL_API_KEY — not the per-client key
// stored in client_integrations (that one is scoped to each Suite client's
// own connected account, a different concern).
//
// fireExecConsultTag is also reused by the New Client Onboarding flow
// (onboard-client/route.ts) — it's generic (tag id + contact -> status and
// a real contact id), not specific to the exec-consult questionnaires.

import { writeGcCustomFields } from "@/lib/gcCustomFields";

const GC_BASE = process.env.GC_BASE || "https://api.globalcontrol.io/api/ai";

// The fire-tag endpoint's real response is double-wrapped —
// {type:"response", data:{type:"response", data:{_id:...contact}}} — one
// level deeper than the single .data envelope everywhere else in this app.
// Confirmed by inspecting the raw response directly; every candidate below
// that only unwraps one level was silently missing the id, so custom-field
// writes on this flow have never actually fired regardless of whether
// GC_EXEC_FIELD_MAP is configured. Walk through nested .data wrappers
// defensively so this keeps working if GC's nesting depth ever changes.
function pickContact(data: unknown): Record<string, unknown> | null {
  let o: unknown = data;
  for (let depth = 0; depth < 4 && o && typeof o === "object"; depth++) {
    const rec = o as Record<string, unknown>;
    const id = rec._id ?? rec.id ?? rec.contactId ?? (rec.contact as Record<string, unknown> | undefined)?._id;
    if (typeof id === "string" && id) return rec;
    o = rec.data;
  }
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
    const data = (await res.json().catch(() => null)) as { type?: string } | null;

    // GC returns HTTP 200 for real failures too (a bad API key: {type:"error"};
    // a bad tag id: {type:"response"} with a real contact but its tags array
    // empty) — both confirmed directly against the live API. res.ok alone
    // reads either as success, so check the body's own signals instead.
    if (!res.ok || data?.type === "error") {
      console.error(`[execConsultGC] fire-tag failed for ${contact.email}:`, res.status, data);
      return { status: "failed", contactId: null };
    }

    const record = pickContact(data);
    const contactId = typeof record?._id === "string" ? record._id : typeof record?.id === "string" ? (record.id as string) : null;
    const tags = Array.isArray(record?.tags) ? (record!.tags as unknown[]) : [];
    if (!contactId || !tags.includes(tagId)) {
      console.error(`[execConsultGC] tag did not actually apply for ${contact.email} (tag ${tagId}):`, data);
      return { status: "failed", contactId };
    }

    return { status: "tagged", contactId };
  } catch (err) {
    console.error(`[execConsultGC] fire-tag error for ${contact.email}:`, err);
    return { status: "error", contactId: null };
  }
}

// Writes questionnaire answers onto the contact's custom fields, using the
// gc_exec_field_map field map (app_settings, falling back to the
// GC_EXEC_FIELD_MAP env var). Silently writes only the keys that both have
// a value and are mapped — the questionnaire still works end-to-end before
// every field exists in GC.
export async function writeExecConsultFields(
  contactId: string | null,
  values: Record<string, string | undefined>
): Promise<"written" | "skipped"> {
  return writeGcCustomFields(contactId, values, "gc_exec_field_map", "GC_EXEC_FIELD_MAP");
}
