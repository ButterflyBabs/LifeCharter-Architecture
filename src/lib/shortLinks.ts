import type { SupabaseClient } from "@supabase/supabase-js";

// Short links: a Bitly/Short.io-style link shortener built into the Suite.
// lccommandsuite.com/l/<code> -> the destination URL. One shared code
// namespace across every account (first come, first served) — same
// convention already used for affiliate codes and calendar slugs.

type Db = SupabaseClient;

export const slugCode = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

const RANDOM_ABC = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o, 1/i/l — easy to read aloud
const randomCode = () => Array.from({ length: 6 }, () => RANDOM_ABC[Math.floor(Math.random() * RANDOM_ABC.length)]).join("");

// A code nobody (in any account) is using yet. With no preference, generate a
// short random one; given a wanted slug, use it (or the next free `-2`, `-3`…).
export async function uniqueShortCode(db: Db, wanted?: string): Promise<string> {
  if (wanted && wanted.trim()) {
    const base = slugCode(wanted) || "link";
    for (let i = 0; i < 50; i++) {
      const code = i === 0 ? base : `${base}-${i + 1}`;
      const { data } = await db.from("short_links").select("id").eq("code", code).maybeSingle();
      if (!data) return code;
    }
  }
  for (let i = 0; i < 20; i++) {
    const code = randomCode();
    const { data } = await db.from("short_links").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  return `${randomCode()}${Date.now().toString(36).slice(-4)}`;
}

// The address to actually share for a code: the account's own verified
// domain (go.yourbusiness.com/<code>, no /l/ — that whole domain exists only
// for this), or the shared lccommandsuite.com/l/<code> fallback until one is
// set up and verified.
export function shortUrlFor(code: string, domain: { status: string; domain: string | null } | null): string {
  if (domain?.status === "verified" && domain.domain) return `https://${domain.domain}/${code}`;
  return `${process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com"}/l/${code}`;
}

export function normalizeDestination(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// One short link per person per purpose ("join" the Zoom class, "workbook"), so a click can be tied to the contact
// (tagged clicked-join-live / clicked-workbook by the /l/<code> redirect). Reuses the link if it already exists.
export async function personalLink(db: Db, planId: string, o: { contactId: string; purpose: "join" | "workbook"; url: string; title?: string }): Promise<string> {
  const { data: have } = await db.from("short_links").select("code").eq("master_plan_id", planId).eq("contact_id", o.contactId).eq("purpose", o.purpose).eq("destination_url", o.url).maybeSingle();
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
  if (have?.code) return `${base}/l/${have.code}`;
  const code = await uniqueShortCode(db);
  const { error } = await db.from("short_links").insert({ master_plan_id: planId, code, destination_url: o.url, title: o.title ?? null, contact_id: o.contactId, purpose: o.purpose });
  if (error) return o.url; // never block a reminder on the shortener: send the full link
  return `${base}/l/${code}`;
}
