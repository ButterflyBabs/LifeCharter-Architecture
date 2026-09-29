import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { senderProfile, senderVerdict, SENDING_SETUP_PATH } from "@/lib/email/accountSender";

export const dynamic = "force-dynamic";

// The signed-in account's email sequences (every account, each sees only its own).
//   GET → every sequence with step and people counts, plus who the account sends as
//   POST { key, name, fromEmail? } → a new (paused) sequence

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: seqs } = await db.from("sequences").select("*").eq("master_plan_id", a.planId).order("created_at");
  const ids = (seqs ?? []).map((s) => s.id as string);
  const [{ data: steps }, { data: enrs }, profile] = await Promise.all([
    ids.length ? db.from("sequence_steps").select("sequence_id").in("sequence_id", ids) : Promise.resolve({ data: [] as { sequence_id: string }[] }),
    ids.length ? db.from("sequence_enrollments").select("sequence_id, status").in("sequence_id", ids) : Promise.resolve({ data: [] as { sequence_id: string; status: string }[] }),
    senderProfile(a.planId, db),
  ]);
  const out = (seqs ?? []).map((s) => {
    const mine = (enrs ?? []).filter((e) => e.sequence_id === s.id);
    return {
      ...s,
      step_count: (steps ?? []).filter((x) => x.sequence_id === s.id).length,
      people: { total: mine.length, active: mine.filter((e) => e.status === "active").length, completed: mine.filter((e) => e.status === "completed").length },
    };
  });
  const v = senderVerdict(profile, true);
  return NextResponse.json({
    sequences: out,
    sender: profile.house
      ? { house: true, ok: true }
      : { house: false, ok: v.ok, reason: v.ok ? null : v.reason, setupPath: SENDING_SETUP_PATH, fromName: profile.senderName, fromEmail: profile.fromEmail, replyTo: profile.replyTo },
  });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const key = String(b.key || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  if (!name || !key) return NextResponse.json({ error: "Give the sequence a name." }, { status: 400 });
  const db = createServerClient();
  let row: Record<string, unknown>;
  if (a.house) {
    // Babs's account: exactly as before.
    const fromEmail = /^[^@\s]+@(lifecharter\.life|lccommandsuite\.com)$/i.test(String(b.fromEmail || "")) ? String(b.fromEmail) : "hello@lifecharter.life";
    row = { master_plan_id: a.planId, key, name, from_email: fromEmail, brand: name };
  } else {
    // A client's sequence: their own name/reply-to; the From address is always
    // their own verified domain at send time (the stored one is for display only).
    const p = await senderProfile(a.planId, db);
    row = { master_plan_id: a.planId, key, name, brand: name, from_name: p.senderName, from_email: p.fromEmail ?? "", reply_to: p.replyTo };
  }
  const { data, error } = await db.from("sequences").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A sequence with that name already exists." : "Couldn't create it." }, { status: 400 });
  return NextResponse.json({ sequence: data });
}
