// Resend Domains API: each client account sends from its OWN verified domain.
// Uses the app's existing RESEND_API_KEY (never logged or returned).

export type DomainStatus = "not_started" | "pending" | "verified" | "failed";
export interface DnsRecord {
  record: string; // e.g. "SPF", "DKIM", "MX"
  type: string; // TXT, MX, CNAME
  name: string;
  value: string;
  priority: number | null;
  ttl: string | null;
  status: string | null;
}
export interface ResendDomain {
  id: string;
  name: string;
  status: DomainStatus;
  records: DnsRecord[];
}
type Result<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

const API = "https://api.resend.com/domains";
const UNAVAILABLE = "Sending domains aren't available yet. Please contact support.";

// Resend's statuses → the four the Suite shows.
export function mapStatus(s: unknown): DomainStatus {
  const v = String(s || "");
  if (v === "verified") return "verified";
  if (v === "failed" || v === "partially_failed") return "failed";
  if (v === "not_started") return "not_started";
  return "pending"; // pending, partially_verified, temporary_failure, …
}

function cleanRecords(v: unknown): DnsRecord[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 20).map((r: Record<string, unknown>) => ({
    record: String(r.record ?? ""),
    type: String(r.type ?? ""),
    name: String(r.name ?? ""),
    value: String(r.value ?? ""),
    priority: typeof r.priority === "number" ? r.priority : null,
    ttl: r.ttl != null ? String(r.ttl) : null,
    status: r.status != null ? String(r.status) : null,
  }));
}

async function call(method: string, path: string, body?: unknown): Promise<Result<Record<string, unknown>>> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: UNAVAILABLE, status: 503 };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const out = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data: out };
    // A key that can only send (no domain permission) answers 401/403.
    if (res.status === 401 || res.status === 403) return { ok: false, error: UNAVAILABLE, status: res.status };
    const msg = typeof out.message === "string" ? out.message : "";
    if (/already|exists|registered/i.test(msg)) return { ok: false, error: "That domain is already set up for sending somewhere else. Use a different subdomain, e.g. mail2.yourbusiness.com.", status: 409 };
    if (res.status === 404) return { ok: false, error: "That domain wasn't found at the email service. Remove it and add it again.", status: 404 };
    return { ok: false, error: msg ? `The email service said: ${msg.slice(0, 200)}` : "The email service didn't respond. Please try again.", status: res.status };
  } catch {
    return { ok: false, error: "The email service didn't respond. Please try again.", status: 502 };
  }
}

const toDomain = (d: Record<string, unknown>): ResendDomain => ({ id: String(d.id ?? ""), name: String(d.name ?? ""), status: mapStatus(d.status), records: cleanRecords(d.records) });

export async function createDomain(name: string): Promise<Result<ResendDomain>> {
  const r = await call("POST", "", { name });
  if (!r.ok) return r;
  if (!r.data.id) return { ok: false, error: "The email service didn't return the domain. Please try again.", status: 502 };
  return { ok: true, data: toDomain(r.data) };
}

export async function getDomain(id: string): Promise<Result<ResendDomain>> {
  const r = await call("GET", `/${encodeURIComponent(id)}`);
  return r.ok ? { ok: true, data: toDomain(r.data) } : r;
}

export async function verifyDomain(id: string): Promise<Result<true>> {
  const r = await call("POST", `/${encodeURIComponent(id)}/verify`);
  return r.ok ? { ok: true, data: true } : r;
}

export async function deleteDomain(id: string): Promise<Result<true>> {
  const r = await call("DELETE", `/${encodeURIComponent(id)}`);
  if (!r.ok && r.status !== 404) return r; // already gone is fine
  return { ok: true, data: true };
}
