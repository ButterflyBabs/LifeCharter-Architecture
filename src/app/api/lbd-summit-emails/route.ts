import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { OWNER_TZ, zonedToUtc } from "@/lib/broadcasts/shared";

export const dynamic = "force-dynamic";

// Campaigns & Broadcasts > Life by Design Summit (Babs's account only). One place for the Summit's emails:
// the dated nurture broadcasts and the registration confirmation sequences, plus who has registered.
// Edits and scheduling happen here; the sending itself is the normal broadcast and sequence engines.

const OFFER = "LBD · Life by Design Summit";
const TAG = "lbd-summit-registered";
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

async function guard() {
  if (!(await isAlignmentArchitect())) return { err: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const db = createServerClient();
  const plan = await housePlanId(db);
  if (!plan) return { err: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  return { db, plan };
}

export async function GET() {
  const g = await guard();
  if ("err" in g) return g.err;
  const { db, plan } = g;
  const { data: bs } = await db
    .from("crm_broadcasts")
    .select("id, name, subject, preview, body, status, scheduled_at, recipient_count, finished_at, tags")
    .eq("master_plan_id", plan)
    .eq("offer", OFFER)
    .order("name");
  const broadcasts = ((bs ?? []) as { id: string; name: string }[]).sort((a, b) => {
    const n = (s: string) => Number((s.match(/APR 15 - (\d+) -/) ?? [])[1] ?? 99);
    return n(a.name) - n(b.name);
  });
  const ids = broadcasts.map((b) => b.id);
  const sent = new Map<string, { sent: number; failed: number }>();
  if (ids.length) {
    const { data: rows } = await db.from("crm_broadcast_sends").select("broadcast_id, status").in("broadcast_id", ids).limit(20000);
    for (const r of (rows ?? []) as { broadcast_id: string; status: string }[]) {
      const c = sent.get(r.broadcast_id) ?? { sent: 0, failed: 0 };
      if (r.status === "failed") c.failed++;
      else c.sent++;
      sent.set(r.broadcast_id, c);
    }
  }
  const { data: seqs } = await db.from("sequences").select("id, key, name, active, description").eq("master_plan_id", plan).eq("offer", OFFER).order("name");
  const seqIds = ((seqs ?? []) as { id: string }[]).map((s) => s.id);
  const { data: steps } = seqIds.length
    ? await db.from("sequence_steps").select("id, sequence_id, position, subject, preview, body").in("sequence_id", seqIds).order("position")
    : { data: [] as never[] };
  const { count } = await db.from("seq_contacts").select("id", { count: "exact", head: true }).eq("master_plan_id", plan).contains("tags", [TAG]);
  const { data: recent } = await db
    .from("seq_contacts")
    .select("first_name, last_name, email, tags, created_at")
    .eq("master_plan_id", plan)
    .contains("tags", [TAG])
    .order("created_at", { ascending: false })
    .limit(25);
  return NextResponse.json(
    {
      broadcasts: broadcasts.map((b) => ({ ...b, ...(sent.get(b.id) ?? { sent: 0, failed: 0 }) })),
      sequences: ((seqs ?? []) as { id: string }[]).map((s) => ({ ...s, steps: ((steps ?? []) as { sequence_id: string }[]).filter((x) => x.sequence_id === s.id) })),
      registrants: { count: count ?? 0, recent: recent ?? [] },
      audienceTag: TAG,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const g = await guard();
  if ("err" in g) return g.err;
  const { db, plan } = g;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof b.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : "";
  const fail = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
  if (!id) return fail("Missing email.");
  const now = new Date().toISOString();

  if (b.action === "save") {
    const patch = { subject: str(b.subject, 200).trim(), preview: str(b.preview, 200).trim() || null, body: str(b.body, 20000) };
    if (!patch.subject) return fail("Add a subject line.");
    const { data: cur } = await db.from("crm_broadcasts").select("status").eq("id", id).eq("master_plan_id", plan).eq("offer", OFFER).maybeSingle();
    if (!cur) return fail("Not found.", 404);
    if (cur.status !== "draft" && cur.status !== "scheduled") return fail("This one has already gone out, so it can't be edited.");
    await db.from("crm_broadcasts").update({ ...patch, updated_at: now }).eq("id", id).eq("master_plan_id", plan);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "save_step") {
    const { data: step } = await db.from("sequence_steps").select("id, sequence_id").eq("id", id).maybeSingle();
    if (!step) return fail("Not found.", 404);
    const { data: ok } = await db.from("sequences").select("id").eq("id", step.sequence_id as string).eq("master_plan_id", plan).eq("offer", OFFER).maybeSingle();
    if (!ok) return fail("Not found.", 404);
    const subject = str(b.subject, 200).trim();
    if (!subject) return fail("Add a subject line.");
    await db.from("sequence_steps").update({ subject, preview: str(b.preview, 200).trim() || null, body: str(b.body, 20000), updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "schedule") {
    const { data: cur } = await db.from("crm_broadcasts").select("status, subject, body").eq("id", id).eq("master_plan_id", plan).eq("offer", OFFER).maybeSingle();
    if (!cur) return fail("Not found.", 404);
    if (cur.status !== "draft" && cur.status !== "scheduled") return fail("This one has already gone out.");
    if (/\[UPDATE BEFORE SENDING|\[[A-Z][A-Z0-9 :,'.-]{3,}\]/.test(`${cur.subject}\n${cur.body}`)) return fail("This email still has a [PLACEHOLDER] or an UPDATE BEFORE SENDING note in it. Fix that first.");
    const when = zonedToUtc(str(b.date, 10), str(b.time, 5), OWNER_TZ);
    if (!when) return fail("Pick a date and time.");
    if (when.getTime() < Date.now() - 60_000) return fail("That time has already passed.");
    await db.from("crm_broadcasts").update({ status: "scheduled", scheduled_at: when.toISOString(), timezone: OWNER_TZ, updated_at: now }).eq("id", id).eq("master_plan_id", plan);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "unschedule") {
    await db.from("crm_broadcasts").update({ status: "draft", scheduled_at: null, updated_at: now }).eq("id", id).eq("master_plan_id", plan).eq("offer", OFFER).eq("status", "scheduled");
    return NextResponse.json({ ok: true });
  }
  return fail("Unknown action.");
}
