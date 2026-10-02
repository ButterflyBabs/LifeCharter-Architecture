import { randomBytes } from "crypto";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { readAccountKey } from "@/lib/ai/config";
import { isHousePlan } from "@/lib/housePlan";
import { sendAccEmail } from "@/lib/email/accountabilityEmail";
import { type CallRow, describe as describeCall, googleLink, icsFor, occurrences, validTz, zonedToUtc } from "@/lib/accountabilityCalls";

// Accountability partners. A partnership is its own record between two people
// (side "a" = the client who invited, side "b" = their partner), never a team seat:
// a partner sees only what is added to the partnership. Side b is either another
// Suite client (b_plan_id) or someone outside the system who works from a private
// no-login link (token). Everything runs through these functions so the in-app page
// and the partner's link behave identically.

type Db = ReturnType<typeof createServerClient>;
export type Side = "a" | "b";
export type Viewer = Side | "coach";

export interface Partnership {
  id: string;
  a_plan_id: string;
  a_name: string;
  b_plan_id: string | null;
  b_name: string;
  b_email: string;
  token: string;
  status: "invited" | "active" | "paused" | "ended";
  coach_visible: boolean;
  a_notify: boolean;
  b_notify: boolean;
}

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ITEM_KINDS = ["task", "milestone", "project", "deadline", "habit"];
const NUDGE_KINDS = ["encourage", "nudge", "inspire", "support", "celebrate", "custom"];
const MAX_PARTNERS = 3;
const AI_DAILY_CAP = 25;

const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const other = (s: Side): Side => (s === "a" ? "b" : "a");
const firstName = (s: string) => (s || "").trim().split(/\s+/)[0] || "Your partner";

export const mountainToday = (offsetDays = 0): string => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};
const mondayOf = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export const newToken = () => randomBytes(24).toString("hex");

export async function partnershipById(db: Db, id: string): Promise<Partnership | null> {
  const { data } = await db.from("accountability_partnerships").select("*").eq("id", id).maybeSingle();
  return (data as Partnership) ?? null;
}
export async function partnershipByToken(db: Db, token: string): Promise<Partnership | null> {
  if (!/^[0-9a-f]{20,64}$/i.test(token)) return null;
  const { data } = await db.from("accountability_partnerships").select("*").eq("token", token).maybeSingle();
  return (data as Partnership) ?? null;
}
export const sideOfPlan = (p: Partnership, planId: string): Side | null => (p.a_plan_id === planId ? "a" : p.b_plan_id === planId ? "b" : null);

async function planOwner(db: Db, planId: string | null): Promise<{ email: string; name: string; profileId: string | null }> {
  if (!planId) return { email: "", name: "", profileId: null };
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  const uid = (plan?.user_id as string) || null;
  if (!uid) return { email: "", name: "", profileId: null };
  const { data: prof } = await db.from("profiles").select("email, full_name").eq("id", uid).maybeSingle();
  return { email: ((prof?.email as string) || "").trim(), name: ((prof?.full_name as string) || "").trim(), profileId: uid };
}

const sideEmail = async (db: Db, p: Partnership, s: Side) => (s === "b" ? p.b_email : (await planOwner(db, p.a_plan_id)).email);
const sideName = (p: Partnership, s: Side) => firstName(s === "a" ? p.a_name : p.b_name);
// Where a side opens the partnership: a Suite client in the app, an outside partner on their private link.
const sideLink = (p: Partnership, s: Side) => (s === "b" && !p.b_plan_id ? `${APP_URL}/partner/${p.token}` : `${APP_URL}/accountability`);
const notifies = (p: Partnership, s: Side) => (s === "a" ? p.a_notify : p.b_notify);

// ---------------------------------------------------------------- creating

export async function createPartnership(db: Db, planId: string, inviterName: string, inviterEmail: string, name: string, email: string): Promise<{ ok: true; partnership: Partnership; emailed: boolean } | { error: string; status: number }> {
  const pn = clean(name, 80);
  const pe = clean(email, 200).toLowerCase();
  if (!pn) return { error: "Add your partner's name.", status: 400 };
  if (!EMAIL_RE.test(pe)) return { error: "That email doesn't look right.", status: 400 };
  if (pe === inviterEmail.toLowerCase()) return { error: "You can't be your own accountability partner. Invite someone else.", status: 400 };
  const { data: mine } = await db.from("accountability_partnerships").select("id, b_email, status").eq("a_plan_id", planId).neq("status", "ended");
  const open = (mine ?? []) as { id: string; b_email: string; status: string }[];
  if (open.some((m) => m.b_email.toLowerCase() === pe)) return { error: "You've already invited that person.", status: 409 };
  if (open.length >= MAX_PARTNERS) return { error: `You can have up to ${MAX_PARTNERS} accountability partners at a time.`, status: 400 };

  // If the invited email is another Suite client, the partnership shows in their app too.
  let bPlan: string | null = null;
  const { data: prof } = await db.from("profiles").select("id").ilike("email", pe).maybeSingle();
  if (prof?.id) {
    const { data: plan } = await db.from("client_master_plans").select("id").eq("user_id", prof.id).order("created_at").limit(1).maybeSingle();
    if (plan?.id && plan.id !== planId) bPlan = plan.id as string;
  }
  const { data, error } = await db
    .from("accountability_partnerships")
    .insert({ a_plan_id: planId, a_name: clean(inviterName, 80) || "Your partner", b_plan_id: bPlan, b_name: pn, b_email: pe, token: newToken(), status: "invited", invite_sent_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error || !data) return { error: "Couldn't save the invitation. Try again.", status: 500 };
  const p = data as Partnership;
  const inviter = firstName(p.a_name);
  const emailed = await sendAccEmail({
    to: pe,
    subject: `${inviter} would like you as an accountability partner`,
    heading: `${inviter} asked you to be their accountability partner`,
    body: `Hi ${firstName(pn)},\n\n${inviter} is using LifeCharter Command Suite and would like you beside them: someone they can share goals and deadlines with, and who cheers them on and nudges them when it matters.\n\nYou'll see only what ${inviter} chooses to share, you can add your own commitments too, and either of you can pause or end this whenever you like.${bPlan ? "\n\nYou already have a Command Suite login, so you'll find this under Accountability after you sign in." : "\n\nNo account or password needed. This is your own private link."}`,
    cta: "See the invitation",
    link: sideLink(p, "b"),
  });
  return { ok: true, partnership: p, emailed };
}

// ---------------------------------------------------------------- reading

interface Item {
  id: string;
  side: Side;
  kind: string;
  title: string;
  detail: string | null;
  due_on: string | null;
  status: "open" | "in_progress" | "done";
  committed: boolean;
  task_id: number | null;
  reward: string | null;
  if_missed: string | null;
  follow_through: string;
  completed_at: string | null;
}

export async function loadView(db: Db, p: Partnership, viewer: Viewer) {
  const [{ data: itemRows }, { data: notes }, { data: nudges }, { data: templates }, { data: agreements }, { data: checkins }, { data: callRows }] = await Promise.all([
    db.from("accountability_items").select("*").eq("partnership_id", p.id).order("created_at"),
    db.from("accountability_notes").select("*").eq("partnership_id", p.id).order("created_at").limit(800),
    db.from("accountability_nudges").select("*").eq("partnership_id", p.id).order("created_at", { ascending: false }).limit(60),
    viewer === "coach" ? Promise.resolve({ data: [] }) : db.from("accountability_templates").select("*").eq("partnership_id", p.id).eq("side", viewer).order("created_at"),
    db.from("accountability_agreements").select("*").eq("partnership_id", p.id),
    db.from("accountability_checkins").select("*").eq("partnership_id", p.id).order("week_of", { ascending: false }).limit(24),
    viewer === "coach" ? Promise.resolve({ data: [] }) : db.from("accountability_calls").select("*").eq("partnership_id", p.id).in("status", ["proposed", "confirmed"]).order("created_at"),
  ]);
  const items = (itemRows ?? []) as Item[];

  // Linked tasks mirror the live task: finishing the task in the app finishes the item.
  const linked = items.filter((i) => i.task_id && i.status !== "done");
  if (linked.length) {
    const { data: tasks } = await db.from("tasks").select("id, status, completed_at").in("id", linked.map((i) => i.task_id as number));
    const done = new Map(((tasks ?? []) as { id: number; status: string; completed_at: string | null }[]).filter((t) => t.status === "done").map((t) => [t.id, t.completed_at]));
    for (const i of linked) {
      if (done.has(i.task_id as number)) {
        const at = done.get(i.task_id as number) || new Date().toISOString();
        i.status = "done";
        i.completed_at = at;
        await db.from("accountability_items").update({ status: "done", completed_at: at, updated_at: new Date().toISOString() }).eq("id", i.id);
        await celebrate(db, p, i);
      }
    }
  }

  const today = mountainToday();
  const stats = (s: Side) => {
    const mine = items.filter((i) => i.side === s);
    const doneWeeks = new Set(mine.filter((i) => i.completed_at).map((i) => mondayOf(i.completed_at!.slice(0, 10))));
    let streak = 0;
    let wk = mondayOf(today);
    if (!doneWeeks.has(wk)) wk = mondayOf(mountainToday(-7)); // this week may not have a win yet
    while (doneWeeks.has(wk)) {
      streak++;
      const d = new Date(`${wk}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 7);
      wk = d.toISOString().slice(0, 10);
    }
    return {
      open: mine.filter((i) => i.status !== "done").length,
      done: mine.filter((i) => i.status === "done").length,
      overdue: mine.filter((i) => i.status !== "done" && i.due_on && i.due_on < today).length,
      streakWeeks: streak,
    };
  };

  const youSide: Side = viewer === "coach" ? "a" : viewer;
  const you = { side: youSide, name: sideName(p, youSide) };
  const partner = { side: other(youSide), name: sideName(p, other(youSide)), isClient: other(youSide) === "a" ? true : Boolean(p.b_plan_id) };
  const ags = (agreements ?? []) as { side: Side }[];
  const unread = viewer === "coach" ? 0 : ((nudges ?? []) as { to_side: Side; read_at: string | null }[]).filter((n) => n.to_side === viewer && !n.read_at).length;
  return {
    partnership: { id: p.id, status: p.status, coachVisible: p.coach_visible, notify: viewer === "coach" ? true : notifies(p, viewer), invitedAt: null },
    viewer,
    you,
    partner,
    today,
    items,
    notes: notes ?? [],
    nudges: nudges ?? [],
    templates: templates ?? [],
    agreements: { you: ags.find((a) => a.side === youSide) ?? null, partner: ags.find((a) => a.side === other(youSide)) ?? null },
    checkins: checkins ?? [],
    calls: viewer === "coach" ? [] : callViews(p, (callRows ?? []) as CallRow[], viewer),
    stats: { you: stats(youSide), partner: stats(other(youSide)) },
    unread,
  };
}

async function celebrate(db: Db, p: Partnership, item: Pick<Item, "id" | "side" | "title">) {
  await db.from("accountability_nudges").insert({
    partnership_id: p.id,
    from_side: "system",
    to_side: other(item.side),
    item_id: item.id,
    kind: "celebrate",
    message: `${sideName(p, item.side)} finished "${item.title}".`,
  });
}


// ---------------------------------------------------------------- calls

const MAX_CALLS = 6;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// What the page needs for each call: the next few occurrences as absolute instants (the
// browser shows them in the viewer's own timezone) plus a plain-English summary.
function callViews(p: Partnership, rows: CallRow[], viewer: Side) {
  const now = new Date();
  return rows
    .map((c) => {
      const next = occurrences(c, now, 3);
      return {
        id: c.id,
        kind: c.kind,
        title: c.title,
        status: c.status,
        mine: c.proposed_by === viewer,
        proposedBy: sideName(p, c.proposed_by),
        summary: describeCall(c),
        durationMin: c.duration_min,
        location: c.location,
        note: c.note,
        recurFreq: c.recur_freq,
        recurDays: c.recur_days,
        next: next.map((o) => ({ date: o.localDate, start: o.start.toISOString(), end: o.end.toISOString() })),
        google: googleLink(c, sideName(p, other(viewer))),
      };
    })
    .filter((c) => c.next.length > 0)
    .sort((a, b) => a.next[0].start.localeCompare(b.next[0].start));
}

// The calendar file for one call, as the given side sees it ("Check-in with <partner>").
export async function callIcs(db: Db, p: Partnership, side: Side, id: string) {
  const { data } = await db.from("accountability_calls").select("*").eq("id", id).eq("partnership_id", p.id).maybeSingle();
  const c = data as CallRow | null;
  if (!c || c.status === "canceled" || c.status === "declined") return null;
  return icsFor(c, sideName(p, other(side)));
}

async function mailCall(db: Db, p: Partnership, c: CallRow, to: Side, kind: "proposed" | "confirmed" | "declined" | "canceled") {
  if (!notifies(p, to)) return;
  const from = sideName(p, other(to));
  const when = describeCall(c);
  const link = sideLink(p, to);
  if (kind === "proposed") {
    await sendAccEmail({ to: await sideEmail(db, p, to), subject: `${from} wants to set up a call`, heading: `${from} proposed a ${c.kind === "recurring" ? "standing call" : "call"}`, body: `${c.title}\n${when}, ${c.duration_min} minutes${c.location ? `\nHow: ${c.location}` : ""}${c.note ? `\n\n"${c.note}"` : ""}\n\nSay yes, or let ${from} know it doesn't work.`, cta: "Answer", link });
  } else if (kind === "confirmed") {
    const ics = icsFor(c, from);
    await sendAccEmail({ to: await sideEmail(db, p, to), subject: `Call confirmed with ${from}`, heading: "It's on the calendar", body: `${c.title} with ${from}\n${when}, ${c.duration_min} minutes${c.location ? `\nHow: ${c.location}` : ""}\n\nThe attached calendar file adds it to Apple, Google or Outlook calendar with a reminder 10 minutes before.`, cta: "Open your page", link, attachments: [{ filename: ics.filename, content: Buffer.from(ics.text).toString("base64"), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }] });
  } else {
    await sendAccEmail({ to: await sideEmail(db, p, to), subject: kind === "declined" ? `${from} can't make that call` : `Call canceled: ${c.title}`, heading: kind === "declined" ? `${from} can't do that time` : "A call was canceled", body: `${c.title}\n${when}\n\n${kind === "declined" ? "Propose another time that works better." : "Set up a new one whenever you're ready."}`, cta: "Open your page", link });
  }
}

async function actCall(db: Db, p: Partnership, side: Side, action: string, body: Record<string, unknown>): Promise<Res> {
  const now = new Date();
  if (action === "call-add") {
    if (p.status !== "active") return bad(p.status === "invited" ? "You can schedule calls once your partner accepts." : "This partnership is paused.", 409);
    const { count } = await db.from("accountability_calls").select("id", { count: "exact", head: true }).eq("partnership_id", p.id).in("status", ["proposed", "confirmed"]);
    if ((count ?? 0) >= MAX_CALLS) return bad("That's plenty of calls on the calendar. Cancel one first.", 409);
    const kind = body.kind === "recurring" ? "recurring" : "one_off";
    const startsOn = String(body.date || "");
    const time = String(body.time || "");
    if (!DATE.test(startsOn) || !TIME_RE.test(time)) return bad("Pick a date and a time.");
    const tz = validTz(body.tz);
    const startAt = zonedToUtc(startsOn, time, tz);
    if (kind === "one_off" && startAt.getTime() < now.getTime() - 5 * 60_000) return bad("That time has already passed.");
    let days: number[] | null = null;
    if (kind === "recurring") {
      days = Array.isArray(body.days) ? Array.from(new Set((body.days as unknown[]).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).slice(0, 3) : [];
      if (!days.length) return bad("Pick at least one day of the week.");
    }
    const duration = Math.min(120, Math.max(5, Math.round(Number(body.durationMin)) || 20));
    const row = {
      partnership_id: p.id,
      kind,
      title: clean(body.title, 80) || (kind === "recurring" ? "Weekly check-in call" : "Quick call"),
      starts_on: startsOn,
      local_time: time,
      tz,
      duration_min: duration,
      recur_freq: kind === "recurring" ? (body.freq === "biweekly" ? "biweekly" : "weekly") : null,
      recur_days: days,
      location: clean(body.location, 300) || null,
      note: clean(body.note, 300) || null,
      proposed_by: side,
      status: "proposed",
      skips: [],
    };
    const { data, error } = await db.from("accountability_calls").insert(row).select("*").single();
    if (error || !data) return bad("Couldn't save that call. Try again.", 500);
    await mailCall(db, p, data as CallRow, other(side), "proposed");
    return { ok: true, id: (data as CallRow).id };
  }

  const { data: found } = await db.from("accountability_calls").select("*").eq("id", String(body.id || "")).eq("partnership_id", p.id).maybeSingle();
  const c = found as CallRow | null;
  if (!c || !["proposed", "confirmed"].includes(c.status)) return bad("That call isn't on the calendar anymore.", 404);
  const touch = { updated_at: now.toISOString() };

  if (action === "call-respond") {
    if (c.proposed_by === side) return bad("Your partner answers this one.", 409);
    if (c.status !== "proposed") return bad("That one is already answered.", 409);
    const yes = body.answer === "yes";
    const location = c.location || clean(body.location, 300) || null;
    await db.from("accountability_calls").update({ status: yes ? "confirmed" : "declined", location, ...touch }).eq("id", c.id);
    const updated = { ...c, location };
    if (yes) {
      await mailCall(db, p, updated, side, "confirmed");
      await mailCall(db, p, updated, other(side), "confirmed");
    } else await mailCall(db, p, updated, other(side), "declined");
    return { ok: true };
  }
  if (action === "call-cancel") {
    await db.from("accountability_calls").update({ status: "canceled", ...touch }).eq("id", c.id);
    if (c.status === "confirmed") await mailCall(db, p, c, other(side), "canceled");
    return { ok: true };
  }
  if (action === "call-skip") {
    const d = String(body.date || "");
    if (c.kind !== "recurring" || c.status !== "confirmed" || !occurrences(c, now, 6).some((o) => o.localDate === d)) return bad("That date isn't coming up.", 409);
    await db.from("accountability_calls").update({ skips: [...c.skips, d], ...touch }).eq("id", c.id);
    return { ok: true };
  }
  return bad("Unknown action.");
}

// ---------------------------------------------------------------- acting

type ErrRes = { error: string; status: number };
type Res = { ok: true; [k: string]: unknown } | ErrRes;
export const isErr = (r: Res): r is ErrRes => typeof (r as ErrRes).error === "string";
const bad = (error: string, status = 400): Res => ({ error, status });

async function ownItem(db: Db, p: Partnership, id: unknown, side: Side): Promise<Item | null> {
  if (typeof id !== "string") return null;
  const { data } = await db.from("accountability_items").select("*").eq("id", id).eq("partnership_id", p.id).maybeSingle();
  const it = data as Item | null;
  return it && it.side === side ? it : null;
}

async function sidePlanId(p: Partnership, s: Side) {
  return s === "a" ? p.a_plan_id : p.b_plan_id;
}

export async function act(db: Db, p: Partnership, side: Side, body: Record<string, unknown>): Promise<Res> {
  const action = clean(body.action, 40);
  const ended = p.status === "ended";
  const writeBlocked = ended && action !== "delete" ? bad("This partnership has ended, so it's read-only.", 409) : null;

  // ---- status changes
  if (action === "accept") {
    if (side !== "b" || p.status !== "invited") return bad("There's nothing to accept.", 409);
    await db.from("accountability_partnerships").update({ status: "active", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", p.id);
    await db.from("accountability_nudges").insert({ partnership_id: p.id, from_side: "system", to_side: "a", kind: "celebrate", message: `${sideName(p, "b")} said yes. You're accountability partners now.` });
    await sendAccEmail({ to: await sideEmail(db, p, "a"), subject: `${sideName(p, "b")} is your accountability partner`, heading: `${sideName(p, "b")} said yes`, body: `${sideName(p, "b")} accepted. Add what you want to be held to, write how you each like to be supported, and send your first word of encouragement.`, cta: "Open Accountability", link: `${APP_URL}/accountability` });
    return { ok: true };
  }
  if (action === "decline" && side === "b" && p.status === "invited") {
    await db.from("accountability_partnerships").update({ status: "ended", updated_at: new Date().toISOString() }).eq("id", p.id);
    return { ok: true };
  }
  if (action === "pause" || action === "resume" || action === "end") {
    if (ended) return writeBlocked as Res;
    const status = action === "pause" ? "paused" : action === "resume" ? "active" : "ended";
    await db.from("accountability_partnerships").update({ status, updated_at: new Date().toISOString() }).eq("id", p.id);
    return { ok: true };
  }
  if (action === "delete") {
    if (side !== "a") return bad("Only the person who started this can remove it.", 403);
    await db.from("accountability_partnerships").delete().eq("id", p.id);
    return { ok: true, deleted: true };
  }
  if (action === "coach-visible") {
    if (side !== "a") return bad("Only the client can choose this.", 403);
    await db.from("accountability_partnerships").update({ coach_visible: body.value === true, updated_at: new Date().toISOString() }).eq("id", p.id);
    return { ok: true };
  }
  if (action === "notify") {
    await db.from("accountability_partnerships").update({ [side === "a" ? "a_notify" : "b_notify"]: body.value !== false, updated_at: new Date().toISOString() }).eq("id", p.id);
    return { ok: true };
  }
  if (action === "nudges-read") {
    await db.from("accountability_nudges").update({ read_at: new Date().toISOString() }).eq("partnership_id", p.id).eq("to_side", side).is("read_at", null);
    return { ok: true };
  }
  if (writeBlocked) return writeBlocked;

  // ---- items
  if (action === "item-add") {
    const title = clean(body.title, 200);
    const kind = ITEM_KINDS.includes(String(body.kind)) ? String(body.kind) : "task";
    if (!title) return bad("Give it a title.");
    const dueOn = DATE.test(String(body.dueOn || "")) ? String(body.dueOn) : null;
    let taskId: number | null = null;
    if (body.taskId !== undefined && body.taskId !== null && body.taskId !== "") {
      const plan = await sidePlanId(p, side);
      const { data: t } = await db.from("tasks").select("id").eq("id", Number(body.taskId)).eq("master_plan_id", plan || "").maybeSingle();
      if (!t) return bad("That task wasn't found.", 404);
      taskId = Number(t.id);
    }
    const { data, error } = await db
      .from("accountability_items")
      .insert({ partnership_id: p.id, side, kind, title, detail: clean(body.detail, 600) || null, due_on: dueOn, committed: body.committed === true, task_id: taskId, reward: clean(body.reward, 300) || null, if_missed: clean(body.ifMissed, 300) || null })
      .select("*")
      .single();
    if (error) return bad("Couldn't add that. Try again.", 500);
    return { ok: true, item: data };
  }
  if (action === "item-update") {
    const it = await ownItem(db, p, body.id, side);
    if (!it) return bad("Only the person who added this can change it.", 403);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) patch.title = clean(body.title, 200) || it.title;
    if (body.kind !== undefined && ITEM_KINDS.includes(String(body.kind))) patch.kind = String(body.kind);
    if (body.detail !== undefined) patch.detail = clean(body.detail, 600) || null;
    if (body.dueOn !== undefined) {
      patch.due_on = DATE.test(String(body.dueOn || "")) ? String(body.dueOn) : null;
      patch.reminded_at = null;
      patch.missed_notified_at = null;
    }
    if (body.committed !== undefined) patch.committed = body.committed === true;
    if (body.reward !== undefined) patch.reward = clean(body.reward, 300) || null;
    if (body.ifMissed !== undefined) patch.if_missed = clean(body.ifMissed, 300) || null;
    await db.from("accountability_items").update(patch).eq("id", it.id);
    return { ok: true };
  }
  if (action === "item-delete") {
    const it = await ownItem(db, p, body.id, side);
    if (!it) return bad("Only the person who added this can remove it.", 403);
    await db.from("accountability_items").delete().eq("id", it.id);
    return { ok: true };
  }
  if (action === "item-status") {
    const it = await ownItem(db, p, body.id, side);
    if (!it) return bad("Only the person who added this can change it.", 403);
    const to = ["open", "in_progress", "done"].includes(String(body.status)) ? (String(body.status) as Item["status"]) : null;
    if (!to) return bad("Unknown status.");
    const now = new Date().toISOString();
    await db.from("accountability_items").update({ status: to, completed_at: to === "done" ? now : null, updated_at: now, ...(to !== "done" ? { reminded_at: null, missed_notified_at: null } : {}) }).eq("id", it.id);
    if (it.task_id) {
      const taskPatch = to === "done" ? { status: "done", completed_at: now } : it.status === "done" ? { status: "today", completed_at: null } : null;
      if (taskPatch) await db.from("tasks").update(taskPatch).eq("id", it.task_id);
    }
    if (to === "done" && it.status !== "done") await celebrate(db, p, it);
    return { ok: true };
  }
  if (action === "item-follow") {
    const { data: it } = await db.from("accountability_items").select("id, side").eq("id", String(body.id || "")).eq("partnership_id", p.id).maybeSingle();
    if (!it) return bad("Not found.", 404);
    const { data: ag } = await db.from("accountability_agreements").select("consequence_mode").eq("partnership_id", p.id).eq("side", it.side).maybeSingle();
    if (!["tracked", "both"].includes((ag?.consequence_mode as string) || "")) return bad("That person isn't tracking follow-through this way.", 409);
    const v = ["pending", "done", "skipped"].includes(String(body.value)) ? String(body.value) : "pending";
    await db.from("accountability_items").update({ follow_through: v, updated_at: new Date().toISOString() }).eq("id", it.id);
    return { ok: true };
  }

  // ---- notes
  if (action === "note-add") {
    const text = clean(body.body, 1000);
    if (!text) return bad("Write something first.");
    let itemId: string | null = null;
    if (body.itemId) {
      const { data: it } = await db.from("accountability_items").select("id").eq("id", String(body.itemId)).eq("partnership_id", p.id).maybeSingle();
      if (!it) return bad("Not found.", 404);
      itemId = it.id as string;
    }
    const { data } = await db.from("accountability_notes").insert({ partnership_id: p.id, item_id: itemId, side, body: text }).select("*").single();
    return { ok: true, note: data };
  }

  // ---- encouragement & nudges
  if (action === "nudge") {
    if (p.status !== "active") return bad(p.status === "invited" ? "You can send encouragement once your partner accepts." : "This partnership is paused.", 409);
    const kind = body.kind === "stuck" ? "stuck" : NUDGE_KINDS.includes(String(body.kind)) ? String(body.kind) : "custom";
    const message = clean(body.message, 500);
    if (!message) return bad("Write or pick a message.");
    let itemId: string | null = null;
    if (body.itemId) {
      const { data: it } = await db.from("accountability_items").select("id").eq("id", String(body.itemId)).eq("partnership_id", p.id).maybeSingle();
      itemId = (it?.id as string) || null;
    }
    const to = other(side);
    await db.from("accountability_nudges").insert({ partnership_id: p.id, from_side: side, to_side: to, item_id: itemId, kind, message });
    if (notifies(p, to)) {
      const from = sideName(p, side);
      await sendAccEmail({
        to: await sideEmail(db, p, to),
        subject: kind === "stuck" ? `${from} could use some support` : `A note from ${from}`,
        heading: kind === "stuck" ? `${from} is stuck and asked for you` : `${from} sent you a note`,
        body: `"${message}"`,
        cta: "Open your page",
        link: sideLink(p, to),
      });
    }
    return { ok: true };
  }
  if (action === "template-add") {
    const message = clean(body.message, 300);
    if (!message) return bad("Write the message first.");
    const kind = NUDGE_KINDS.filter((k) => k !== "custom").includes(String(body.kind)) ? String(body.kind) : "encourage";
    const { data } = await db.from("accountability_templates").insert({ partnership_id: p.id, side, kind, message }).select("*").single();
    return { ok: true, template: data };
  }
  if (action === "template-delete") {
    await db.from("accountability_templates").delete().eq("id", String(body.id || "")).eq("partnership_id", p.id).eq("side", side);
    return { ok: true };
  }

  // ---- the written agreement
  if (action === "agreement-save") {
    const mode = ["none", "pledge", "tracked", "both"].includes(String(body.consequenceMode)) ? String(body.consequenceMode) : "pledge";
    const tone = ["gentle", "balanced", "direct"].includes(String(body.tone)) ? String(body.tone) : "gentle";
    await db.from("accountability_agreements").upsert(
      {
        partnership_id: p.id,
        side,
        how_held: clean(body.howHeld, 1200) || null,
        tone,
        check_in: clean(body.checkIn, 400) || null,
        reward_self: clean(body.rewardSelf, 600) || null,
        reward_partner: clean(body.rewardPartner, 600) || null,
        miss_plan: clean(body.missPlan, 800) || null,
        stuck_plan: clean(body.stuckPlan, 600) || null,
        consequence_mode: mode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "partnership_id,side" }
    );
    return { ok: true };
  }

  // ---- weekly check-in
  if (action === "checkin-save") {
    const wk = DATE.test(String(body.weekOf || "")) ? mondayOf(String(body.weekOf)) : mondayOf(mountainToday());
    await db.from("accountability_checkins").upsert(
      { partnership_id: p.id, side, week_of: wk, wins: clean(body.wins, 1200) || null, stuck: clean(body.stuck, 1200) || null, next_commit: clean(body.nextCommit, 1200) || null },
      { onConflict: "partnership_id,side,week_of" }
    );
    return { ok: true };
  }

  if (action.startsWith("call-")) return writeBlocked ?? actCall(db, p, side, action, body);

  return bad("Unknown action.");
}

// ---------------------------------------------------------------- AI help

// Drafting help for both partners. It runs on the paying client's own OpenAI key
// (their own for a Suite client; the inviting client's for an outside partner, with a
// daily cap) and sees only what the person types here, never the client's business data.
export async function aiHelp(db: Db, p: Partnership, side: Side, body: Record<string, unknown>): Promise<Res> {
  const payerPlan = side === "a" ? p.a_plan_id : p.b_plan_id || p.a_plan_id;
  const owner = await planOwner(db, payerPlan);
  let key = owner.profileId ? await readAccountKey(owner.profileId) : "";
  if (!key && (await isHousePlan(payerPlan, db))) key = process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  if (!key) return side === "b" && !p.b_plan_id ? bad("AI writing help isn't switched on for this account.", 409) : { ok: true, needsKey: true };
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from("accountability_ai_uses").select("id", { count: "exact", head: true }).eq("partnership_id", p.id).eq("side", side).gte("created_at", since);
  if ((count ?? 0) >= AI_DAILY_CAP) return bad("That's the limit for today. Try again tomorrow, or write it yourself.", 429);

  const kind = clean(body.kind, 20);
  const me = sideName(p, side);
  const partnerName = sideName(p, other(side));
  const tone = ["gentle", "balanced", "direct"].includes(String(body.tone)) ? String(body.tone) : "gentle";
  const guard =
    `You help ${me} write things for their accountability partnership with ${partnerName}. ` +
    "Write in the first person as the person, plain and warm, no corporate language. Never invent facts. " +
    "Rewards and consequences must be self-chosen, kind and healthy: nothing that shames, harms, risks someone's health or relationships, or involves money paid to the other person unless they asked for that. " +
    "If a consequence is unkind, soften it into something supportive (a reset conversation, a smaller next step, giving up a treat). Keep every field short.";

  let system = "";
  let user = "";
  if (kind === "agreement") {
    system = `${guard}\nReturn STRICT JSON: {"how_held":"how I want to be held accountable (2-3 sentences)","check_in":"how and when we check in","reward_self":"what I'll give myself when I follow through","reward_partner":"how I'd like to celebrate with ${partnerName}","miss_plan":"what happens if I don't get something done, kind and specific","stuck_plan":"what I do and what I'd like ${partnerName} to do when I'm stuck"}. Match this tone: ${tone}.`;
    user = `What I told you about how I work and what helps me:\n${clean(body.notes, 1500) || "(nothing yet. Offer a sensible, flexible starting draft.)"}`;
  } else if (kind === "nudge") {
    system = `${guard}\nReturn STRICT JSON: {"messages":["...","...","..."]}: three different short messages (max 220 characters each) that ${me} could send ${partnerName} to ${clean(body.purpose, 20) || "encourage"} them. Tone: ${tone}.`;
    user = clean(body.context, 500) || "No specific item. A general note.";
  } else if (kind === "reward") {
    system = `${guard}\nReturn STRICT JSON: {"reward":"a small, specific reward for finishing this","if_missed":"a gentle, constructive 'if I don't' step"}.`;
    user = `The commitment: ${clean(body.title, 200)}${body.dueOn ? ` (due ${clean(body.dueOn, 12)})` : ""}.\nHow I like to be held to things: ${clean(body.notes, 600) || "(not written yet)"}`;
  } else return bad("Unknown AI request.");

  let out: Record<string, unknown> | null = null;
  try {
    const completion = await new OpenAI({ apiKey: key }).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    out = JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}");
  } catch (e) {
    console.error("accountability AI:", (e as Error).message);
    return bad("The AI couldn't answer just now. Try again in a moment.", 502);
  }
  await db.from("accountability_ai_uses").insert({ partnership_id: p.id, side });
  const s = (v: unknown, n: number) => clean(v, n);
  if (kind === "agreement") return { ok: true, draft: { howHeld: s(out?.how_held, 1200), checkIn: s(out?.check_in, 400), rewardSelf: s(out?.reward_self, 600), rewardPartner: s(out?.reward_partner, 600), missPlan: s(out?.miss_plan, 800), stuckPlan: s(out?.stuck_plan, 600) } };
  if (kind === "nudge") return { ok: true, messages: (Array.isArray(out?.messages) ? (out!.messages as unknown[]) : []).map((m) => s(m, 300)).filter(Boolean).slice(0, 3) };
  return { ok: true, reward: s(out?.reward, 300), ifMissed: s(out?.if_missed, 300) };
}

// ---------------------------------------------------------------- reminders (cron)

// Daily: a friendly "due tomorrow" to the person who owns the item, and one gentle
// note to both partners when something slips past its date. Pausing or ending stops it.
export async function runReminders(db: Db): Promise<{ reminded: number; slipped: number }> {
  const today = mountainToday();
  const tomorrow = mountainToday(1);
  const { data: parts } = await db.from("accountability_partnerships").select("*").eq("status", "active");
  let reminded = 0;
  let slipped = 0;
  for (const p of (parts ?? []) as Partnership[]) {
    const { data: items } = await db.from("accountability_items").select("*").eq("partnership_id", p.id).neq("status", "done").not("due_on", "is", null);
    for (const it of (items ?? []) as (Item & { reminded_at: string | null; missed_notified_at: string | null })[]) {
      const owner = it.side;
      const partner = other(owner);
      if (it.due_on === tomorrow && !it.reminded_at) {
        await db.from("accountability_items").update({ reminded_at: new Date().toISOString() }).eq("id", it.id);
        await db.from("accountability_nudges").insert({ partnership_id: p.id, from_side: "system", to_side: owner, item_id: it.id, kind: "reminder", message: `"${it.title}" is due tomorrow. ${sideName(p, partner)} is rooting for you.` });
        if (notifies(p, owner)) await sendAccEmail({ to: await sideEmail(db, p, owner), subject: `Due tomorrow: ${it.title}`, heading: "Due tomorrow", body: `"${it.title}" is due tomorrow.\n\n${sideName(p, partner)} is in your corner. Update it when it's done, or tell them if you're stuck.`, cta: "Open your page", link: sideLink(p, owner) });
        reminded++;
      } else if (it.due_on! < today && !it.missed_notified_at) {
        await db.from("accountability_items").update({ missed_notified_at: new Date().toISOString() }).eq("id", it.id);
        await db.from("accountability_nudges").insert([
          { partnership_id: p.id, from_side: "system", to_side: owner, item_id: it.id, kind: "reminder", message: `"${it.title}" slipped past its date. No judgment. Pick a new date or take a smaller step.` },
          { partnership_id: p.id, from_side: "system", to_side: partner, item_id: it.id, kind: "reminder", message: `"${it.title}" passed its date for ${sideName(p, owner)}. A kind check-in could help.` },
        ]);
        if (notifies(p, owner)) await sendAccEmail({ to: await sideEmail(db, p, owner), subject: `"${it.title}" slipped, and that's okay`, heading: "It slipped past its date", body: `"${it.title}" was due ${it.due_on}.\n\nNo judgment. Pick a new date, or shrink it to one small step you can do today.`, cta: "Reset it", link: sideLink(p, owner) });
        if (notifies(p, partner)) await sendAccEmail({ to: await sideEmail(db, p, partner), subject: `A nudge for ${sideName(p, owner)}?`, heading: `${sideName(p, owner)} could use a kind word`, body: `"${it.title}" passed its date. A short, caring check-in often does more than a reminder.`, cta: "Send encouragement", link: sideLink(p, partner) });
        slipped++;
      }
    }
  }
  return { reminded, slipped };
}
