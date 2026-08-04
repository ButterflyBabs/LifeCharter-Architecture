import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

// Client for the Global Control (Titanium Suite) AI API.
//   Base:  https://api.globalcontrol.io/api/ai
//   Auth:  X-API-KEY: <client key>
//   Body:  responses are wrapped as { type: "response", data: <payload> }
//
// Keys are per client and stored server-side in client_integrations; nothing
// here ever runs client-side.

const BASE = "https://api.globalcontrol.io/api/ai";
const PROVIDER = "global_control";

export class GcError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Normalized contact shape the app uses.
export interface GcContact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  lastActiveAt: string | null;
  isDead: boolean;
}

// Only attach Content-Type: application/json when there's actually a JSON body.
// Sending it on a bodyless GET makes Global Control try to parse an empty body
// and fail with "Invalid Json Format" (HTTP 400).
function authHeaders(key: string, hasBody: boolean): Record<string, string> {
  const h: Record<string, string> = { "X-API-KEY": key, Accept: "application/json" };
  if (hasBody) h["Content-Type"] = "application/json";
  return h;
}

// Low-level call. Unwraps the { type, data } envelope and throws GcError on
// non-2xx with the most useful message we can find.
async function gc<T = unknown>(
  key: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...authHeaders(key, init?.body != null), ...(init?.headers || {}) },
      cache: "no-store",
    });
  } catch {
    throw new GcError("Couldn't reach Global Control.", 502);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const j = (json || {}) as Record<string, unknown>;
    const nested =
      j.error && typeof j.error === "object"
        ? ((j.error as Record<string, unknown>).message as string)
        : typeof j.error === "string"
        ? (j.error as string)
        : "";
    const msg =
      (j.message as string) ||
      nested ||
      (text ? text.replace(/<[^>]*>/g, "").trim().slice(0, 160) : "") ||
      `HTTP ${res.status}`;
    throw new GcError(msg, res.status);
  }
  const envelope = json as { data?: T } | T;
  return (envelope && typeof envelope === "object" && "data" in (envelope as object)
    ? (envelope as { data: T }).data
    : (envelope as T));
}

// Pull the raw contact fields into our normalized shape (defensive about the
// exact field names the API returns).
function normalize(raw: Record<string, unknown>): GcContact {
  const id = String(raw._id ?? raw.id ?? "");
  const firstName = String(raw.firstName ?? "");
  const lastName = String(raw.lastName ?? "");
  const name = `${firstName} ${lastName}`.trim() || String(raw.name ?? raw.email ?? "Unnamed");
  const tags = Array.isArray(raw.tags) ? (raw.tags as unknown[]).map((t) => String(t)) : [];
  return {
    id,
    firstName,
    lastName,
    name,
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    tags,
    lastActiveAt: (raw.lastActiveAt as string) ?? (raw.lastContactedAt as string) ?? null,
    isDead: Boolean(raw.isContactDead),
  };
}

// The current client's stored Global Control key, or null if not connected.
export async function getClientGcKey(): Promise<string | null> {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data } = await supabase
    .from("client_integrations")
    .select("api_key")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  const key = ((data?.api_key as string) || "").trim();
  return key || null;
}

// Validate a key by making a tiny authenticated request. Throws GcError if the
// key is rejected or the service is unreachable.
export async function validateKey(key: string): Promise<boolean> {
  await gc(key, "/contacts?limit=1&page=1");
  return true;
}

// List contacts (supports search + pagination). Handles the response whether
// `data` is the array itself or an object wrapping it.
export async function listContacts(
  key: string,
  opts: { page?: number; limit?: number; search?: string } = {}
): Promise<{ contacts: GcContact[] }> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("limit", String(opts.limit ?? 25));
  if (opts.search) params.set("search", opts.search);
  const data = await gc<unknown>(key, `/contacts?${params.toString()}`);

  let rows: Record<string, unknown>[] = [];
  if (Array.isArray(data)) rows = data as Record<string, unknown>[];
  else if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const candidate = d.contacts ?? d.results ?? d.items ?? d.data;
    if (Array.isArray(candidate)) rows = candidate as Record<string, unknown>[];
  }
  return { contacts: rows.map(normalize) };
}

export async function getContact(key: string, id: string): Promise<GcContact> {
  const data = await gc<Record<string, unknown>>(key, `/contacts/${encodeURIComponent(id)}`);
  return normalize(data || {});
}

export async function updateContact(
  key: string,
  id: string,
  body: { firstName?: string; lastName?: string; email?: string; phone?: string }
): Promise<GcContact> {
  const data = await gc<Record<string, unknown>>(key, `/contacts/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return normalize(data || {});
}
