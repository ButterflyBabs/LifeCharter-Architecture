import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { upsertContact } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { addMeetingRegistrant, isZoomConfigured, masterclassMeetingId } from "@/lib/zoom";
import { AFF_COOKIE, affiliateByCode, recordReferral } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

// The public MasterClass signup (lccommandsuite.com/masterclass-signup): registers the person on Zoom (register
// once, attend any session), puts them in Babs's Contacts, and credits the affiliate whose link sent them.
// Zoom's own confirmation email goes to them; the usual Zoom sync then tags them and starts the Suite emails.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "Something went wrong. Please reload and try again." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (str(b._hp, 100)) return NextResponse.json({ ok: true }); // a bot filled the hidden field; pretend it worked
  const firstName = str(b.firstName, 80);
  const lastName = str(b.lastName, 80);
  const email = str(b.email, 200).toLowerCase();
  if (!firstName) return NextResponse.json({ error: "Please add your first name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  if (!isZoomConfigured()) return NextResponse.json({ error: "Registration is unavailable right now. Please try again shortly." }, { status: 503 });

  let registrant;
  try {
    registrant = await addMeetingRegistrant(masterclassMeetingId(), { email, firstName, lastName });
  } catch (e) {
    console.error("masterclass-signup zoom:", (e as Error).message);
    return NextResponse.json({ error: "We couldn't save your seat just now. Please try again in a minute." }, { status: 502 });
  }

  // From here the seat is saved, so nothing below may fail the request.
  try {
    const db = createServerClient();
    const plan = await ownerMasterPlanId();
    if (plan) {
      const c = await upsertContact({ masterPlanId: plan, email, firstName, lastName: lastName || null, source: "masterclass-signup" }, db);
      const code = str(b._ref, 60) || cookies().get(AFF_COOKIE)?.value || "";
      if (c && code) {
        const aff = await affiliateByCode(db, plan, code);
        if (aff) await recordReferral(db, plan, aff, c.id, "lead", "masterclass-signup");
      }
    }
  } catch (e) {
    console.error("masterclass-signup crm:", (e as Error).message);
  }
  return NextResponse.json({ ok: true, joinUrl: registrant.joinUrl || null });
}
