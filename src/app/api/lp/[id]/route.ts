import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { submitForm } from "@/lib/crm";
import { register, type EventRow } from "@/lib/events";
import { AFF_COOKIE, affiliateByCode, recordReferral } from "@/lib/affiliates";
import { PAGE_COLUMNS, recordHit, type PageRow } from "@/lib/landingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// A published landing page's public actions (task 1153). Reached from lccommandsuite.com/go/<slug> and from the
// account's own domain (middleware lets /api/lp/ through there).
//   POST { action: "view", v }                         -> counts a visit
//   POST { action: "submit", v, ...form fields }       -> opt-in: the page's Suite form, then a conversion
//   POST { action: "register", v, firstName, email }   -> webinar: the page's event, then a conversion
//   POST { action: "click", v }                        -> sales: a Buy click (the conversion for a sales page)
//   POST { action: "booked", v }                       -> book a call: sent by the booking page after a booking
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const { data } = await db.from("landing_pages").select(PAGE_COLUMNS).eq("id", params.id).eq("status", "published").maybeSingle();
  const p = data as PageRow | null;
  if (!p) return NextResponse.json({ error: "This page isn't available." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const v = typeof b.v === "string" ? b.v : null;
  const action = String(b.action || "");
  if (typeof b._hp === "string" && b._hp.trim()) return NextResponse.json({ ok: true, message: "Thank you!" });

  if (action === "view") {
    await recordHit(db, p.id, "view", v);
    return NextResponse.json({ ok: true });
  }
  if (action === "click" && p.template === "sales") {
    await recordHit(db, p.id, "conversion", v);
    return NextResponse.json({ ok: true });
  }
  if (action === "booked" && p.template === "booking") {
    await recordHit(db, p.id, "conversion", v);
    return NextResponse.json({ ok: true });
  }
  if (action === "submit" && p.template === "optin") {
    if (!p.form_id) return NextResponse.json({ error: "This page isn't ready yet." }, { status: 409 });
    const pageUrl = typeof b._page === "string" ? b._page.slice(0, 500) : request.headers.get("referer");
    const r = await submitForm(p.form_id, b, pageUrl);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    await recordHit(db, p.id, "conversion", v);
    // Came through an affiliate's link: credit the lead, as the hosted form does.
    if (r.lead) {
      const code = (typeof b._ref === "string" && b._ref) || cookies().get(AFF_COOKIE)?.value || "";
      if (code) {
        const aff = await affiliateByCode(db, r.lead.masterPlanId, code).catch(() => null);
        if (aff) await recordReferral(db, r.lead.masterPlanId, aff, r.lead.contactId, "lead", `landing:${p.slug}`).catch(() => null);
      }
    }
    return NextResponse.json({ ok: true, message: r.message });
  }
  if (action === "register" && p.template === "webinar") {
    if (!p.event_id) return NextResponse.json({ error: "This page isn't ready yet." }, { status: 409 });
    const { data: e } = await db.from("events").select("*").eq("id", p.event_id).eq("master_plan_id", p.master_plan_id).maybeSingle();
    if (!e) return NextResponse.json({ error: "This event isn't available." }, { status: 404 });
    const s = (x: unknown) => (typeof x === "string" ? x : "");
    const r = await register(db, e as EventRow, { email: s(b.email), firstName: s(b.firstName), lastName: s(b.lastName), timezone: s(b.timezone) || null });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    if (!r.already) await recordHit(db, p.id, "conversion", v);
    const ev = e as EventRow;
    return NextResponse.json({ ok: true, already: r.already, challenge: ev.kind === "challenge" ? `https://lccommandsuite.com/e/${ev.slug}/c/${r.token}` : null });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
