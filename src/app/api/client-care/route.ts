import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { senderProfile, senderVerdict, SENDING_SETUP_PATH } from "@/lib/email/accountSender";
import { CC, CLIENT_TAGS, FORMER_TAG, ensureClientCare, setCareOn, setQuietBooking, type CareKey } from "@/lib/clientCareAccounts";

export const dynamic = "force-dynamic";

// Clients & Sales › Client Care (task 1148).
//   GET                                   -> { ready, house, sender, pieces, booking, calendars, counts }
//   POST { action: "setup" }              -> loads the forms and series into this account (switched off)
//   POST { action: "toggle", key, on }    -> switch a piece on or off
//   POST { action: "booking", slug }      -> the calendar the third quiet-client note links to ("" removes it)
const KEYS: CareKey[] = ["thirty", "pulse", "exit", "quiet"];

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  if (a.house) return NextResponse.json({ house: true, ready: false });
  const db = createServerClient();
  const [{ data: forms }, { data: seqs }, { data: settings }, { data: cals }, profile] = await Promise.all([
    db.from("crm_forms").select("id, key, active").eq("master_plan_id", a.planId).in("key", [CC.thirty.form, CC.pulse.form, CC.exit.form]),
    db.from("sequences").select("id, key, active").eq("master_plan_id", a.planId).in("key", KEYS.map((k) => CC[k].seq)),
    db.from("client_care_settings").select("quiet_on, booking_slug").eq("master_plan_id", a.planId).maybeSingle(),
    db.from("booking_calendars").select("slug, name, active").eq("master_plan_id", a.planId).order("name"),
    senderProfile(a.planId, db),
  ]);
  const v = senderVerdict(profile, false);
  const form = (k: CareKey) => (k === "quiet" ? null : (forms ?? []).find((f) => f.key === CC[k].form) ?? null);
  const seq = (k: CareKey) => (seqs ?? []).find((s) => s.key === CC[k].seq) ?? null;
  const pieces = Object.fromEntries(
    KEYS.map((k) => [k, { on: k === "quiet" ? Boolean(settings?.quiet_on) : Boolean(seq(k)?.active), formId: form(k)?.id ?? null, sequenceId: seq(k)?.id ?? null }]),
  );
  const [{ count: clients }, { count: former }] = await Promise.all([
    db.from("seq_contacts").select("id", { count: "exact", head: true }).eq("master_plan_id", a.planId).overlaps("tags", CLIENT_TAGS).not("tags", "cs", `{${FORMER_TAG}}`),
    db.from("seq_contacts").select("id", { count: "exact", head: true }).eq("master_plan_id", a.planId).contains("tags", [FORMER_TAG]),
  ]);
  return NextResponse.json(
    {
      house: false,
      ready: Boolean(settings) && Boolean(seq("thirty")),
      sender: { ok: v.ok, reason: v.ok ? null : v.reason, setupPath: SENDING_SETUP_PATH },
      pieces,
      booking: settings?.booking_slug ?? null,
      calendars: cals ?? [],
      counts: { clients: clients ?? 0, former: former ?? 0 },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (a.house) return NextResponse.json({ error: "Your own Client Care runs from your account's CLIENT CARE campaigns." }, { status: 400 });
  const b = (await request.json().catch(() => ({}))) as { action?: string; key?: string; on?: boolean; slug?: string };
  const db = createServerClient();
  if (b.action === "setup") {
    await ensureClientCare(db, a.planId);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "toggle") {
    const k = KEYS.find((x) => x === b.key);
    if (!k) return NextResponse.json({ error: "Unknown piece." }, { status: 400 });
    await ensureClientCare(db, a.planId);
    await setCareOn(db, a.planId, k, Boolean(b.on));
    return NextResponse.json({ ok: true });
  }
  if (b.action === "booking") {
    const slug = String(b.slug || "").trim();
    if (slug) {
      const { data: cal } = await db.from("booking_calendars").select("slug").eq("master_plan_id", a.planId).eq("slug", slug).maybeSingle();
      if (!cal) return NextResponse.json({ error: "That calendar isn't in your account." }, { status: 400 });
    }
    await ensureClientCare(db, a.planId);
    await setQuietBooking(db, a.planId, slug || null);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
