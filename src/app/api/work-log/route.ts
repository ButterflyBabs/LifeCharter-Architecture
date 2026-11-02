import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { planMembers } from "@/lib/taskAssignees";
import { crmAccount } from "../crm/guard";
import { canEditLines, cleanItem, csvCell, payFor, shiftMinutes, submitBlocker, type ShiftStatus } from "@/lib/workLog";

export const dynamic = "force-dynamic";

// Work Log: part-time and virtual team members clock in, list what they did (how many, how long), note challenges
// and help, clock out and submit the day; the account owner reviews and approves.
//   GET ?from=ISO&to=ISO[&format=csv] -> shifts with their lines. A team member gets only their own shifts and never
//                                        sees a rate or pay. The owner gets everyone's, with rates and pay.
//   POST { action: "clock_in" | "clock_out" | "update_shift" | "add_item" | "update_item" | "delete_item" | "submit"
//                  | "approve" | "return" | "set_rate", ... }
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const SHIFT_COLS = "id, person_email, person_name, clock_in, clock_out, status, summary, hourly_rate, submitted_at, reviewed_at, reviewed_by, review_note";
const ITEM_COLS = "id, shift_id, what, quantity, unit, minutes, task_id, project_id, challenge, help_asked_of, help_received_from, help_note, created_at";

type Shift = { id: string; person_email: string; person_name: string | null; clock_in: string; clock_out: string | null; status: ShiftStatus; summary: string | null; hourly_rate: number | string | null; submitted_at: string | null; reviewed_at: string | null; reviewed_by: string | null; review_note: string | null };
type Item = { id: string; shift_id: string; what: string; quantity: number | string | null; unit: string | null; minutes: number | null; task_id: number | null; project_id: string | null; challenge: string | null; help_asked_of: string | null; help_received_from: string | null; help_note: string | null; created_at: string };

/** Who is asking: their address and name, and whether they review (the account owner, or someone working their own account). */
async function viewer(sessionEmail: string | null) {
  const actor = await resolveActor().catch(() => null);
  const member = actor?.kind === "member";
  const email = ((member ? actor?.email : sessionEmail) || sessionEmail || "owner").toLowerCase();
  const db = createServerClient();
  let name = "";
  if (member && actor?.memberId) name = String((await db.from("workspace_members").select("name").eq("id", actor.memberId).maybeSingle()).data?.name || "");
  else if (actor?.userId) {
    const { data } = await db.from("profiles").select("full_name, display_name").eq("id", actor.userId).maybeSingle();
    name = String(data?.display_name || data?.full_name || "");
  }
  return { email, name: name || email.split("@")[0], reviewer: !member };
}

/** The account owner's own name, for the "who helped" list a team member sees. */
async function ownerName(planId: string): Promise<string | null> {
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  if (!plan?.user_id) return null;
  const { data } = await db.from("profiles").select("full_name, display_name").eq("id", plan.user_id as string).maybeSingle();
  return String(data?.display_name || data?.full_name || "").trim() || null;
}

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const v = await viewer(a.userEmail);
  const u = new URL(request.url);
  const from = u.searchParams.get("from") || new Date(Date.now() - 14 * 86_400_000).toISOString();
  const to = u.searchParams.get("to") || new Date(Date.now() + 86_400_000).toISOString();

  let q = db.from("work_shifts").select(SHIFT_COLS).eq("master_plan_id", a.planId).gte("clock_in", from).lt("clock_in", to).order("clock_in", { ascending: false }).limit(1000);
  if (!v.reviewer) q = q.eq("person_email", v.email);
  const { data: shiftRows } = await q;
  const shifts = (shiftRows ?? []) as Shift[];

  // The person's unfinished shifts (still clocked in, not yet submitted, or sent back) and the owner's waiting-for-review
  // list must always be reachable, whatever week is on screen.
  const working = ((await db.from("work_shifts").select(SHIFT_COLS).eq("master_plan_id", a.planId).eq("person_email", v.email).in("status", ["open", "returned"]).order("clock_in", { ascending: false }).limit(20)).data ?? []) as Shift[];
  const mineOpen = working.find((s) => !s.clock_out) ?? null;
  let waiting: Shift[] = [];
  if (v.reviewer) {
    waiting = ((await db.from("work_shifts").select(SHIFT_COLS).eq("master_plan_id", a.planId).eq("status", "submitted").order("clock_in", { ascending: true }).limit(200)).data ?? []) as Shift[];
  }
  const all = new Map<string, Shift>();
  for (const s of [...shifts, ...waiting, ...working]) all.set(s.id, s);
  const ids = Array.from(all.keys());
  const { data: itemRows } = ids.length ? await db.from("work_log_items").select(ITEM_COLS).in("shift_id", ids).order("created_at", { ascending: true }).limit(10000) : { data: [] };
  const items = (itemRows ?? []) as Item[];

  if (u.searchParams.get("format") === "csv") {
    const byShift = new Map<string, Item[]>();
    for (const i of items) byShift.set(i.shift_id, [...(byShift.get(i.shift_id) ?? []), i]);
    const head = ["Person", "Date", "Clock in", "Clock out", "Shift minutes", "Status", "What was done", "How many", "What was counted", "Minutes", "Challenge", "Help asked of", "Help received from", "About the help", ...(v.reviewer ? ["Hourly rate", "Shift pay"] : [])];
    const rows: string[][] = [];
    for (const s of shifts) {
      const mins = shiftMinutes(s);
      const pay = v.reviewer ? payFor(mins, s.hourly_rate) : null;
      const base = [s.person_name || s.person_email, s.clock_in.slice(0, 10), s.clock_in, s.clock_out ?? "", String(mins), s.status];
      const its = byShift.get(s.id) ?? [];
      const tail = v.reviewer ? [s.hourly_rate == null ? "" : String(s.hourly_rate), pay == null ? "" : String(pay)] : [];
      if (!its.length) rows.push([...base, "", "", "", "", "", "", "", "", ...tail]);
      for (const i of its) rows.push([...base, i.what, i.quantity == null ? "" : String(i.quantity), i.unit ?? "", i.minutes == null ? "" : String(i.minutes), i.challenge ?? "", i.help_asked_of ?? "", i.help_received_from ?? "", i.help_note ?? "", ...tail]);
    }
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="work-log.csv"`, "Cache-Control": "no-store" } });
  }

  const [{ data: projects }, { data: tasks }, members, owner, ratesRes] = await Promise.all([
    db.from("projects").select("id, name").eq("master_plan_id", a.planId).order("name").limit(300),
    db.from("tasks").select("id, title, project_id").eq("master_plan_id", a.planId).neq("status", "done").is("archived_at", null).order("updated_at", { ascending: false }).limit(300),
    planMembers(a.planId),
    v.reviewer ? Promise.resolve(null) : ownerName(a.planId),
    v.reviewer ? db.from("work_log_rates").select("person_email, hourly_rate").eq("master_plan_id", a.planId) : Promise.resolve({ data: [] as { person_email: string; hourly_rate: number }[] }),
  ]);

  const names = Array.from(new Set([...(members.map((m) => m.name || m.email)), ...(owner ? [owner] : []), ...(v.reviewer && v.name ? [v.name] : [])])).filter(Boolean);
  const outShifts = Array.from(all.values()).map((s) => ({
    id: s.id,
    personEmail: s.person_email,
    personName: s.person_name || s.person_email,
    clockIn: s.clock_in,
    clockOut: s.clock_out,
    status: s.status,
    summary: s.summary,
    submittedAt: s.submitted_at,
    reviewedAt: s.reviewed_at,
    reviewedBy: s.reviewed_by,
    reviewNote: s.review_note,
    ...(v.reviewer ? { hourlyRate: s.hourly_rate == null ? null : Number(s.hourly_rate) } : {}),
    items: items.filter((i) => i.shift_id === s.id).map((i) => ({
      id: i.id, what: i.what, quantity: i.quantity == null ? null : Number(i.quantity), unit: i.unit, minutes: i.minutes, taskId: i.task_id, projectId: i.project_id,
      challenge: i.challenge, helpAskedOf: i.help_asked_of, helpReceivedFrom: i.help_received_from, helpNote: i.help_note,
    })),
  }));

  return NextResponse.json({
    me: { email: v.email, name: v.name, reviewer: v.reviewer },
    shifts: outShifts,
    clockedIn: mineOpen?.id ?? null,
    waitingCount: waiting.length,
    projects: projects ?? [],
    tasks: tasks ?? [],
    names,
    rates: v.reviewer ? Object.fromEntries(((ratesRes.data ?? []) as { person_email: string; hourly_rate: number }[]).map((r) => [r.person_email.toLowerCase(), Number(r.hourly_rate)])) : undefined,
    team: v.reviewer ? members.map((m) => ({ name: m.name || m.email, email: m.email.toLowerCase() })) : undefined,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const v = await viewer(a.userEmail);
  const planId: string = a.planId;
  const now = new Date().toISOString();
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  /** A shift of this account the person may work on: their own, or any when they review. */
  async function shiftFor(id: unknown): Promise<Shift | null> {
    const sid = str(id, 60);
    if (!sid) return null;
    const { data } = await db.from("work_shifts").select(SHIFT_COLS).eq("id", sid).eq("master_plan_id", planId).maybeSingle();
    const s = data as Shift | null;
    return s && (v.reviewer || s.person_email === v.email) ? s : null;
  }
  async function links() {
    const out: { task_id: number | null; project_id: string | null } = { task_id: null, project_id: null };
    if (str(b.projectId, 60)) out.project_id = ((await db.from("projects").select("id").eq("id", str(b.projectId, 60)).eq("master_plan_id", planId).maybeSingle()).data?.id as string) ?? null;
    if (Number(b.taskId) > 0) {
      const { data: t } = await db.from("tasks").select("id, project_id").eq("id", Number(b.taskId)).eq("master_plan_id", planId).maybeSingle();
      out.task_id = (t?.id as number) ?? null;
      if (t?.project_id && !out.project_id) out.project_id = t.project_id as string;
    }
    return out;
  }
  const readTime = (key: string): string | null | undefined => {
    if (b[key] === undefined) return undefined;
    if (b[key] === null || b[key] === "") return null;
    const t = Date.parse(str(b[key], 40));
    return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
  };

  switch (b.action) {
    case "clock_in": {
      const { data: open } = await db.from("work_shifts").select("id").eq("master_plan_id", planId).eq("person_email", v.email).is("clock_out", null).maybeSingle();
      if (open) return fail("You are already clocked in.");
      const { data: rate } = await db.from("work_log_rates").select("hourly_rate").eq("master_plan_id", planId).eq("person_email", v.email).maybeSingle();
      const { error } = await db.from("work_shifts").insert({ master_plan_id: planId, person_email: v.email, person_name: v.name, clock_in: now, status: "open", hourly_rate: rate?.hourly_rate ?? null });
      return error ? fail("Clock in didn't work. Please try again.", 500) : NextResponse.json({ ok: true });
    }
    case "clock_out": {
      const s = await shiftFor(b.id);
      if (!s) return fail("That shift wasn't found.", 404);
      if (s.clock_out) return fail("That shift is already clocked out.");
      if (!canEditLines(s.status, v.reviewer)) return fail("That shift can't be changed now.");
      const at = readTime("clockOut") ?? now;
      if (Date.parse(at) < Date.parse(s.clock_in)) return fail("Clock out can't be before clock in.");
      const patch: Record<string, unknown> = { clock_out: at, updated_at: now };
      if (typeof b.summary === "string") patch.summary = str(b.summary, 2000) || null;
      await db.from("work_shifts").update(patch).eq("id", s.id);
      return NextResponse.json({ ok: true });
    }
    case "update_shift": {
      const s = await shiftFor(b.id);
      if (!s) return fail("That shift wasn't found.", 404);
      if (!canEditLines(s.status, v.reviewer)) return fail("That shift can't be changed now.");
      const cin = readTime("clockIn");
      const cout = readTime("clockOut");
      const nextIn = cin ?? s.clock_in;
      const nextOut = cout === undefined ? s.clock_out : cout;
      if (nextOut && Date.parse(nextOut) < Date.parse(nextIn)) return fail("Clock out can't be before clock in.");
      if (nextOut && Date.parse(nextOut) - Date.parse(nextIn) > 24 * 3_600_000) return fail("A shift can be up to 24 hours.");
      const patch: Record<string, unknown> = { updated_at: now };
      if (cin) patch.clock_in = cin;
      if (cout !== undefined) patch.clock_out = cout;
      if (b.summary !== undefined) patch.summary = str(b.summary, 2000) || null;
      const { error } = await db.from("work_shifts").update(patch).eq("id", s.id);
      return error ? fail("That didn't save. Please try again.", 500) : NextResponse.json({ ok: true });
    }
    case "add_item": {
      const s = await shiftFor(b.shiftId);
      if (!s) return fail("That shift wasn't found.", 404);
      if (!canEditLines(s.status, v.reviewer)) return fail("That shift is waiting for review or approved, so it can't be changed.");
      const c = cleanItem(b);
      if ("error" in c) return fail(c.error);
      const { error } = await db.from("work_log_items").insert({ shift_id: s.id, master_plan_id: planId, ...c.item, ...(await links()) });
      return error ? fail("That didn't save. Please try again.", 500) : NextResponse.json({ ok: true });
    }
    case "update_item": {
      const { data: it } = await db.from("work_log_items").select("id, shift_id").eq("id", str(b.id, 60)).eq("master_plan_id", planId).maybeSingle();
      const s = it ? await shiftFor(it.shift_id) : null;
      if (!it || !s) return fail("That line wasn't found.", 404);
      if (!canEditLines(s.status, v.reviewer)) return fail("That shift is waiting for review or approved, so it can't be changed.");
      const c = cleanItem(b);
      if ("error" in c) return fail(c.error);
      const { error } = await db.from("work_log_items").update({ ...c.item, ...(await links()), updated_at: now }).eq("id", it.id as string);
      return error ? fail("That didn't save. Please try again.", 500) : NextResponse.json({ ok: true });
    }
    case "delete_item": {
      const { data: it } = await db.from("work_log_items").select("id, shift_id").eq("id", str(b.id, 60)).eq("master_plan_id", planId).maybeSingle();
      const s = it ? await shiftFor(it.shift_id) : null;
      if (!it || !s) return fail("That line wasn't found.", 404);
      if (!canEditLines(s.status, v.reviewer)) return fail("That shift is waiting for review or approved, so it can't be changed.");
      await db.from("work_log_items").delete().eq("id", it.id as string);
      return NextResponse.json({ ok: true });
    }
    case "submit": {
      const s = await shiftFor(b.id);
      if (!s) return fail("That shift wasn't found.", 404);
      if (s.person_email !== v.email) return fail("Only the person who worked the shift can submit it.", 403);
      if (s.status !== "open" && s.status !== "returned") return fail("That shift is already submitted.");
      const { data: its } = await db.from("work_log_items").select("what").eq("shift_id", s.id);
      const blocked = submitBlocker(s, its ?? []);
      if (blocked) return fail(blocked);
      await db.from("work_shifts").update({ status: "submitted", submitted_at: now, review_note: null, updated_at: now }).eq("id", s.id);
      return NextResponse.json({ ok: true });
    }
    case "approve":
    case "return": {
      if (!v.reviewer) return fail("Only the account owner can review a shift.", 403);
      const s = await shiftFor(b.id);
      if (!s) return fail("That shift wasn't found.", 404);
      if (s.status !== "submitted" && !(b.action === "return" && s.status === "approved")) return fail("That shift isn't waiting for review.");
      const approving = b.action === "approve";
      const note = str(b.note, 1000) || null;
      if (!approving && !note) return fail("Add a short note so they know what to change.");
      await db.from("work_shifts").update({ status: approving ? "approved" : "returned", reviewed_at: now, reviewed_by: v.name, review_note: note, updated_at: now }).eq("id", s.id);
      return NextResponse.json({ ok: true });
    }
    case "set_rate": {
      if (!v.reviewer) return fail("Only the account owner can set a rate.", 403);
      const email = str(b.email, 200).toLowerCase();
      if (!email) return fail("Choose a person.");
      if (b.rate === null || b.rate === "" || b.rate === undefined) {
        await db.from("work_log_rates").delete().eq("master_plan_id", planId).eq("person_email", email);
        await db.from("work_shifts").update({ hourly_rate: null }).eq("master_plan_id", planId).eq("person_email", email).neq("status", "approved");
        return NextResponse.json({ ok: true });
      }
      const rate = Math.round(Number(b.rate) * 100) / 100;
      if (!Number.isFinite(rate) || rate < 0 || rate > 100_000) return fail("The rate needs to be a number, zero or more.");
      await db.from("work_log_rates").upsert({ master_plan_id: planId, person_email: email, hourly_rate: rate, updated_at: now }, { onConflict: "master_plan_id,person_email" });
      // Approved days keep the rate they were approved at; everything still open or waiting follows the new rate.
      await db.from("work_shifts").update({ hourly_rate: rate }).eq("master_plan_id", planId).eq("person_email", email).neq("status", "approved");
      return NextResponse.json({ ok: true });
    }
  }
  return fail("Unknown action.");
}
