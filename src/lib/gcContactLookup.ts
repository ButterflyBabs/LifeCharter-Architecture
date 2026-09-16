// Pulls a prospect's real Global Control record for display on
// /sales-reference during a live call — tags, status, and every non-empty
// custom field, all resolved from raw ids to human-readable names.
//
// Uses the same account-wide GLOBAL_CONTROL_API_KEY as execConsultGC.ts —
// this is a read, not a write, so it's kept separate rather than growing
// that file into a general-purpose GC client.

const GC_BASE = process.env.GC_BASE || "https://api.globalcontrol.io/api/ai";

async function gcGet<T>(path: string): Promise<T | null> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${GC_BASE}${path}`, {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    return (payload?.data ?? null) as T;
  } catch (err) {
    console.error(`[gcContactLookup] GET ${path} failed:`, err);
    return null;
  }
}

interface RawTag {
  _id?: string;
  id?: string;
  name?: string;
}

interface RawCustomFieldDef {
  _id?: string;
  id?: string;
  name?: string;
}

interface RawCustomFieldValue {
  customFieldId?: string;
  fieldId?: string;
  value?: unknown;
}

interface RawContact {
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  currentStatus?: string;
  lastActiveAt?: string | null;
  lastContactedAt?: string | null;
  customFields?: RawCustomFieldValue[];
}

export interface GcContactLookupResult {
  found: boolean;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  lastActiveAt?: string | null;
  lastContactedAt?: string | null;
  tags?: string[];
  customFields?: { name: string; value: string }[];
}

export async function lookupContactByEmail(email: string): Promise<GcContactLookupResult> {
  const apiKey = process.env.GLOBAL_CONTROL_API_KEY;
  if (!apiKey) return { found: false };

  const [contactsData, tagDefs, fieldDefs] = await Promise.all([
    gcGet<{ contacts?: RawContact[] }>(`/contacts?search=${encodeURIComponent(email)}&limit=1`),
    gcGet<RawTag[]>("/tags"),
    gcGet<RawCustomFieldDef[]>("/custom-fields"),
  ]);

  const contact = contactsData?.contacts?.[0];
  if (!contact) return { found: false };

  const tagNameById = new Map<string, string>();
  for (const t of tagDefs || []) {
    const id = t._id || t.id;
    if (id && t.name) tagNameById.set(id, t.name);
  }

  const fieldNameById = new Map<string, string>();
  for (const f of fieldDefs || []) {
    const id = f._id || f.id;
    if (id && f.name) fieldNameById.set(id, f.name);
  }

  const tags = (contact.tags || []).map((id) => tagNameById.get(id) || id);

  const customFields = (contact.customFields || [])
    .map((cf) => {
      const id = cf.customFieldId || cf.fieldId || "";
      const name = fieldNameById.get(id) || id;
      const value = cf.value;
      return { name, value: value == null ? "" : String(value) };
    })
    .filter((cf) => cf.value.trim() !== "");

  return {
    found: true,
    name: contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email,
    email: contact.email,
    phone: contact.phone || undefined,
    status: contact.currentStatus,
    lastActiveAt: contact.lastActiveAt,
    lastContactedAt: contact.lastContactedAt,
    tags,
    customFields,
  };
}
