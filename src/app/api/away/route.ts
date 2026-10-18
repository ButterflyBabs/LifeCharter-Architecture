import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { AWAY_COLUMNS, awayNote, dayIn, isAwayOn, type Away } from "@/lib/awayMode";

export const dynamic = "force-dynamic";

// Out-of-office mode (task 1155).
//   GET                          -> this account's away setting (or null), whether it is on today, and the note clients see
//   POST { startsOn, endsOn, message, blockBookings, autoReply, pauseNudges } -> save it
//   DELETE                       -> back in the office (clears it)
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const { data } = await createServerClient().from("away_mode").select(AWAY_COLUMNS).eq("master_plan_id", a.planId).maybeSingle();
  const away = data as Away | null;
  return NextResponse.json({ away, onNow: isAwayOn(away, dayIn()), note: away ? awayNote(away) : null, today: dayIn() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const startsOn = String(b.startsOn || "");
  const endsOn = String(b.endsOn || "");
  if (!DATE.test(startsOn) || !DATE.test(endsOn)) return NextResponse.json({ error: "Pick the first and last day you're away." }, { status: 400 });
  if (endsOn < startsOn) return NextResponse.json({ error: "The last day can't be before the first day." }, { status: 400 });
  if (endsOn < dayIn()) return NextResponse.json({ error: "Those dates are already over." }, { status: 400 });
  const row = {
    master_plan_id: a.planId,
    starts_on: startsOn,
    ends_on: endsOn,
    message: typeof b.message === "string" ? b.message.trim().slice(0, 1000) || null : null,
    block_bookings: b.blockBookings !== false,
    auto_reply: b.autoReply !== false,
    pause_nudges: b.pauseNudges !== false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await createServerClient().from("away_mode").upsert(row, { onConflict: "master_plan_id" });
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  await createServerClient().from("away_mode").delete().eq("master_plan_id", a.planId);
  return NextResponse.json({ ok: true });
}
