import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { IB_FORM_ID } from "@/lib/investorAccess";

export const dynamic = "force-dynamic";

export type IbRequestRow = {
  email: string; name: string; company: string; city: string; state: string; zip: string; phone: string;
  requestedAt: string; status: "pending" | "approved" | "denied" | "revoked"; emailedAt: string | null; lastLoginAt: string | null; callAt: string | null;
};

// Alignment Architect only: every request from the "Investor access request" form, newest first, with its decision.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const [{ data: subs }, { data: access }, { data: cal }, { data: seq }] = await Promise.all([
    db.from("crm_submissions").select("data, created_at").eq("form_id", IB_FORM_ID).order("created_at", { ascending: false }).limit(300),
    db.from("investor_access").select("email, status, emailed_at, last_login_at"),
    db.from("booking_calendars").select("id").eq("slug", "investor-interest").maybeSingle(),
    db.from("sequences").select("active").eq("key", "investor-access-approved").maybeSingle(),
  ]);
  const calls = new Map<string, string>();
  if (cal?.id) {
    const { data: bk } = await db.from("bookings").select("invitee_email, start_at, status").eq("calendar_id", cal.id).in("status", ["confirmed", "completed", "no_show"]).order("start_at", { ascending: false }).limit(300);
    for (const x of bk ?? []) {
      const e = String(x.invitee_email || "").toLowerCase();
      if (e && !calls.has(e)) calls.set(e, x.start_at as string);
    }
  }
  const byEmail = new Map((access ?? []).map((a) => [String(a.email).toLowerCase(), a]));
  const seen = new Set<string>();
  const rows: IbRequestRow[] = [];
  for (const s of subs ?? []) {
    const d = (s.data ?? {}) as Record<string, string>;
    const email = (d.email || "").toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const a = byEmail.get(email);
    rows.push({
      email,
      name: d.name || "",
      company: d.company || "",
      city: d.city || "",
      state: d.state || "",
      zip: d.zip || "",
      phone: d.phone || "",
      requestedAt: s.created_at as string,
      status: ((a?.status as IbRequestRow["status"]) || "pending"),
      emailedAt: (a?.emailed_at as string | null) ?? null,
      lastLoginAt: (a?.last_login_at as string | null) ?? null,
      callAt: calls.get(email) ?? null,
    });
  }
  return NextResponse.json({ rows, campaignOn: Boolean(seq?.active), calendar: "https://lccommandsuite.com/book/investor-interest" });
}
