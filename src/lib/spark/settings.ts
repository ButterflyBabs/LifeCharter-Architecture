import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

// LC Spark settings, one row per account (master_plan_id). Everything in LC Spark
// is keyed by the account, so switching it on for a client account later needs
// no data changes — only the owner gate in ./guard.ts.

export interface SparkSite {
  origin: string; // "https://amilynnecarroll.com" (a bare host is accepted too)
  label: string;
  enabled: boolean;
  bookingSlug?: string | null;
  brandColor?: string | null;
  knowledgeNote?: string | null;
}

export interface SparkSettings {
  master_plan_id: string;
  enabled: boolean;
  public_key: string | null;
  assistant_name: string | null;
  greeting: string | null;
  knowledge: string | null;
  instructions: string | null;
  sites: SparkSite[];
  ig_enabled: boolean;
  ig_user_id: string | null;
  ig_username: string | null;
  ig_access_token: string | null;
  ig_token_expires_at: string | null;
  price_per_conversation_cents: number | null;
  monthly_conversation_cap: number | null;
  created_at?: string;
  updated_at?: string;
}

export const BOOKING_BASE = "https://lccommandsuite.com/book/";
export const bookingUrl = (slug?: string | null) => (slug && /^[a-z0-9-]{1,80}$/i.test(slug) ? `${BOOKING_BASE}${slug}` : null);
export const PUBLIC_KEY_RE = /^[a-f0-9]{16,64}$/;
export const newPublicKey = () => randomBytes(16).toString("hex");

function clean(row: Record<string, unknown> | null): SparkSettings | null {
  if (!row) return null;
  return { ...(row as unknown as SparkSettings), sites: Array.isArray(row.sites) ? (row.sites as SparkSite[]) : [] };
}

export async function loadSettingsByKey(publicKey: string): Promise<SparkSettings | null> {
  if (!PUBLIC_KEY_RE.test(publicKey)) return null;
  const { data } = await createServerClient().from("spark_settings").select("*").eq("public_key", publicKey).maybeSingle();
  return clean(data);
}

export async function loadSettingsByPlan(planId: string): Promise<SparkSettings | null> {
  const { data } = await createServerClient().from("spark_settings").select("*").eq("master_plan_id", planId).maybeSingle();
  return clean(data);
}

// The owner screen always has a row (and a public key) to work with.
export async function ensureSettings(planId: string): Promise<SparkSettings | null> {
  const db = createServerClient();
  const found = await loadSettingsByPlan(planId);
  if (found?.public_key) return found;
  if (found) {
    const { data } = await db.from("spark_settings").update({ public_key: newPublicKey(), updated_at: new Date().toISOString() }).eq("master_plan_id", planId).select("*").maybeSingle();
    return clean(data);
  }
  const { data } = await db.from("spark_settings").insert({ master_plan_id: planId, public_key: newPublicKey() }).select("*").maybeSingle();
  return clean(data);
}

// "amilynnecarroll.com", "https://www.amilynnecarroll.com/" → "amilynnecarroll.com"
export function siteHost(origin: string): string {
  const s = (origin || "").trim().toLowerCase();
  try {
    return new URL(s.includes("://") ? s : `https://${s}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Which of the account's sites is this browser Origin? Only https origins of an
// enabled site (bare or www.), plus http://localhost:* for testing. Null = refuse.
export function originAllowed(settings: SparkSettings, origin: string | null): SparkSite | null {
  if (!origin) return null;
  let u: URL;
  try {
    u = new URL(origin);
  } catch {
    return null;
  }
  const sites = settings.sites.filter((s) => s && s.enabled && s.origin);
  if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return sites[0] ?? null;
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  return sites.find((s) => siteHost(s.origin) === host) ?? null;
}

export function corsHeaders(origin: string | null, allowed: boolean): Record<string, string> {
  return allowed && origin
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", Vary: "Origin" }
    : { Vary: "Origin" };
}
