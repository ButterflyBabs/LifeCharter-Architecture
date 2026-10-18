import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { EMAIL_RE } from "@/lib/crm";
import { sendPortalLink, type PortalRow } from "@/lib/portal";

export const dynamic = "force-dynamic";

// "Send me my link" (lccommandsuite.com/portal): emails every active portal for that address. The answer is always the
// same, so nobody can learn whether an address has a portal. At most one email per portal every 10 minutes.
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { email?: string; _hp?: string };
  const email = String(b.email || "").trim().toLowerCase();
  const same = NextResponse.json({ ok: true, message: "If you have a client portal, a link is on its way to that email address." });
  if (b._hp || !EMAIL_RE.test(email)) return same;
  const db = createServerClient();
  const { data: contacts } = await db.from("seq_contacts").select("id").eq("email", email).limit(20);
  const ids = ((contacts ?? []) as { id: string }[]).map((c) => c.id);
  if (!ids.length) return same;
  const { data: portals } = await db.from("client_portals").select("id, master_plan_id, contact_id, token, active, welcome, sent_at, last_seen_at").in("contact_id", ids).eq("active", true);
  for (const p of (portals ?? []) as PortalRow[]) {
    if (p.sent_at && Date.now() - Date.parse(p.sent_at) < 10 * 60_000) continue;
    await sendPortalLink(db, p).catch(() => null);
  }
  return same;
}
