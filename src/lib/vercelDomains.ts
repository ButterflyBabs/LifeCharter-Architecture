// Vercel's Domains API: lets an account point its OWN domain at its short
// links instead of sharing lccommandsuite.com/l/ with every other account.
// Needs VERCEL_TOKEN (an API token with access to this project) and, if the
// project lives under a Vercel Team rather than a personal account,
// VERCEL_PROJECT_ID (or VERCEL_PROJECT_NAME) and VERCEL_TEAM_ID.
//
// Unlike Resend (email domains), Vercel doesn't hand back the DNS record to
// add — it's always the same fixed target: a CNAME to cname.vercel-dns.com
// for a subdomain (go.yourbusiness.com), or an A record to 76.76.21.21 for a
// bare root domain (yourbusiness.com) — dnsInstructionsFor() below. Vercel
// does sometimes ask for an extra TXT ownership-verification record (shown
// under `verification` on the add response) when a domain was recently used
// elsewhere; check-domain surfaces that too, if present.

export type DomainStatus = "not_started" | "pending" | "verified" | "failed";
export interface OwnershipChallenge {
  type: string; // "TXT"
  domain: string;
  value: string;
  reason: string;
}
export interface VercelDomain {
  name: string;
  verified: boolean;
  verification: OwnershipChallenge[];
}
type Result<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

const UNAVAILABLE = "Custom short-link domains aren't available yet. Please contact support.";
const PROJECT = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || "lifecharter-architecture";

async function call(method: string, path: string, body?: unknown): Promise<Result<Record<string, unknown>>> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { ok: false, error: UNAVAILABLE, status: 503 };
  const team = process.env.VERCEL_TEAM_ID;
  const qs = team ? `${path.includes("?") ? "&" : "?"}teamId=${encodeURIComponent(team)}` : "";
  try {
    const res = await fetch(`https://api.vercel.com${path}${qs}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const out = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data: out };
    const err = (out.error as Record<string, unknown>) || {};
    const code = typeof err.code === "string" ? err.code : "";
    const msg = typeof err.message === "string" ? err.message : "";
    if (res.status === 401 || res.status === 403) return { ok: false, error: UNAVAILABLE, status: res.status };
    if (code === "domain_already_in_use" || /already (?:in )?use/i.test(msg))
      return { ok: false, error: "That domain is already set up for links somewhere else. Use a different subdomain, e.g. go2.yourbusiness.com.", status: 409 };
    if (code === "not_found" || res.status === 404) return { ok: false, error: "That domain wasn't found. Remove it and add it again.", status: 404 };
    if (code === "forbidden") return { ok: false, error: "That domain couldn't be added. Double-check you own it and try again.", status: 403 };
    return { ok: false, error: msg ? `Vercel said: ${msg.slice(0, 200)}` : "Vercel didn't respond. Please try again.", status: res.status || 502 };
  } catch {
    return { ok: false, error: "Vercel didn't respond. Please try again.", status: 502 };
  }
}

function cleanVerification(v: unknown): OwnershipChallenge[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 10).map((c: Record<string, unknown>) => ({
    type: String(c.type ?? "TXT"),
    domain: String(c.domain ?? ""),
    value: String(c.value ?? ""),
    reason: String(c.reason ?? ""),
  }));
}
const toDomain = (d: Record<string, unknown>): VercelDomain => ({
  name: String(d.name ?? ""),
  verified: Boolean(d.verified),
  verification: cleanVerification(d.verification),
});

export async function addDomain(name: string): Promise<Result<VercelDomain>> {
  const r = await call("POST", `/v10/projects/${encodeURIComponent(PROJECT)}/domains`, { name });
  if (!r.ok) return r;
  return { ok: true, data: toDomain(r.data) };
}

export async function getDomain(name: string): Promise<Result<VercelDomain>> {
  const r = await call("GET", `/v9/projects/${encodeURIComponent(PROJECT)}/domains/${encodeURIComponent(name)}`);
  return r.ok ? { ok: true, data: toDomain(r.data) } : r;
}

// Nudges Vercel to re-check now, rather than waiting for its own background
// recheck. A domain with no outstanding ownership challenge, once its DNS
// genuinely points here, verifies on the very next GET with no verify call
// needed — this just speeds that up.
export async function verifyDomain(name: string): Promise<Result<true>> {
  const r = await call("POST", `/v9/projects/${encodeURIComponent(PROJECT)}/domains/${encodeURIComponent(name)}/verify`);
  if (!r.ok && r.status !== 400) return r; // "already verified" / "nothing to verify" are fine
  return { ok: true, data: true };
}

export async function removeDomain(name: string): Promise<Result<true>> {
  const r = await call("DELETE", `/v9/projects/${encodeURIComponent(PROJECT)}/domains/${encodeURIComponent(name)}`);
  if (!r.ok && r.status !== 404) return r; // already gone is fine
  return { ok: true, data: true };
}

// What to tell the client to add at their DNS provider. Vercel's own fixed
// targets — not something the API hands back per-domain the way Resend does.
export function dnsInstructionsFor(domain: string): { type: string; name: string; value: string } {
  const isApex = domain.split(".").length === 2; // "yourbusiness.com" vs "go.yourbusiness.com"
  return isApex ? { type: "A", name: "@", value: "76.76.21.21" } : { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" };
}
