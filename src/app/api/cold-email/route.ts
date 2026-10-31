import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount, testRecipient } from "../crm/guard";
import * as google from "@/lib/google";
import { ensureBoards, boardStages } from "@/lib/dmPipeline";
import { DEFAULT_FOOTER, DEFAULT_STEPS, STARTER_STEPS, cleanLinkUrl, coldNotReady, rampCap, daysBetween, localParts, render, senderStart, varsFor, footer, listUnsubscribeHeaders, type ColdStep } from "@/lib/coldEmail";
import { coldEmailSwitchOn } from "@/lib/coldEmailRun";

export const dynamic = "force-dynamic";

// The cold email sender for the account's Cold Email pipeline: settings, mailboxes, the three emails, and the on/off switch.
//   GET  → settings, mailboxes (with today's count and cap), connected Google mailboxes that could be added, counts
//   POST { action: save | add-sender | update-sender | remove-sender | toggle | test }
const clean = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

async function coldBoard(db: ReturnType<typeof createServerClient>, planId: string) {
  const boards = await ensureBoards(db, planId, "outreach");
  for (const b of boards) {
    const st = await boardStages(db, planId, b.id);
    if (st.some((s) => s.key === "followed_up" && /^Emails 2 and 3/.test(s.name))) return b;
  }
  return null;
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const board = await coldBoard(db, a.planId);
  const [{ data: s }, { data: senders }, switchOn] = await Promise.all([
    db.from("cold_email_settings").select("*").eq("master_plan_id", a.planId).maybeSingle(),
    db.from("cold_email_senders").select("*").eq("master_plan_id", a.planId).order("created_at"),
    coldEmailSwitchOn(db),
  ]);
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", a.planId).maybeSingle();
  const conns = plan?.user_id ? await google.listConnections({ ownerId: plan.user_id as string }) : [];
  const tz = (s?.tz as string) || "America/Denver";
  const { data: bd } = board ? await db.from("pipeline_boards").select("personal_link_url").eq("id", board.id).maybeSingle() : { data: null };
  const { ymd, hour } = localParts(new Date(), tz);
  const since = new Date(Date.now() - (hour * 60 + new Date().getUTCMinutes()) * 60_000).toISOString();
  const rows = [];
  for (const sd of (senders ?? []) as { id: string; account_key: string; email: string | null; daily_cap: number; paused: boolean; last_error: string | null; scanned_at: string | null; created_at?: string }[]) {
    const { count } = await db.from("cold_email_sends").select("id", { count: "exact", head: true }).eq("sender_id", sd.id).gte("sent_at", since);
    rows.push({ ...sd, sentToday: count ?? 0, todayCap: rampCap(daysBetween(senderStart((s?.started_on as string) ?? null, sd.created_at, tz), ymd), sd.daily_cap) });
  }
  const { count: sentTotal } = await db.from("cold_email_sends").select("id", { count: "exact", head: true }).eq("master_plan_id", a.planId).eq("status", "sent");
  return NextResponse.json({
    boardId: board?.id ?? null,
    boardName: board?.name ?? null,
    globalOn: switchOn,
    enabled: Boolean(s?.enabled),
    house: a.house,
    steps: ((s?.steps as ColdStep[] | undefined) ?? []).length ? s!.steps : a.house ? DEFAULT_STEPS : STARTER_STEPS,
    bookingUrl: (s?.booking_url as string | null) ?? "",
    personalLinkUrl: (bd?.personal_link_url as string | null) ?? "",
    tz,
    windowStart: s?.window_start ?? 9,
    windowEnd: s?.window_end ?? 16,
    weekdaysOnly: s?.weekdays_only ?? true,
    footer: s?.footer || (a.house ? DEFAULT_FOOTER : ""),
    startedOn: s?.started_on ?? null,
    senders: rows,
    connections: conns.map((c) => ({ accountKey: c.accountKey, email: c.email, canReadMail: c.canReadMail })),
    sentTotal: sentTotal ?? 0,
  });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const board = await coldBoard(db, a.planId);
  if (!board) return NextResponse.json({ error: "Make a pipeline with the Cold email stages first (New pipeline, Cold email stages)." }, { status: 400 });
  const ensure = async () => {
    await db.from("cold_email_settings").upsert({ master_plan_id: a.planId, board_id: board.id }, { onConflict: "master_plan_id", ignoreDuplicates: true });
  };

  if (b.action === "save") {
    await ensure();
    const steps = Array.isArray(b.steps) ? (b.steps as ColdStep[]).slice(0, 5).map((x, i) => ({ day: Math.max(0, Math.min(60, Math.round(Number(x.day) || 0))) * (i === 0 ? 0 : 1), subject: clean(x.subject, 200), body: clean(x.body, 4000) })) : null;
    if (steps && steps.some((x) => !x.subject.trim() || !x.body.trim())) return NextResponse.json({ error: "Every email needs a subject and a message." }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (steps) patch.steps = steps;
    if (typeof b.footer === "string") patch.footer = clean(b.footer, 300);
    if (b.bookingUrl !== undefined) {
      const url = cleanLinkUrl(b.bookingUrl);
      if (String(b.bookingUrl).trim() && !url) return NextResponse.json({ error: "Enter the whole booking link, starting with https://" }, { status: 400 });
      patch.booking_url = url || null;
    }
    if (b.windowStart !== undefined) patch.window_start = Math.max(0, Math.min(22, Math.round(Number(b.windowStart))));
    if (b.windowEnd !== undefined) patch.window_end = Math.max(1, Math.min(23, Math.round(Number(b.windowEnd))));
    if (typeof b.weekdaysOnly === "boolean") patch.weekdays_only = b.weekdaysOnly;
    await db.from("cold_email_settings").update(patch).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "add-sender") {
    await ensure();
    const key = clean(b.accountKey, 80);
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", a.planId).maybeSingle();
    const conns = plan?.user_id ? await google.listConnections({ ownerId: plan.user_id as string }) : [];
    const c = conns.find((x) => x.accountKey === key);
    if (!c) return NextResponse.json({ error: "That Google mailbox is not connected. Connect it in Settings > Integrations first." }, { status: 400 });
    const { data: have } = await db.from("cold_email_senders").select("id").eq("master_plan_id", a.planId).eq("account_key", key).is("send_as", null).maybeSingle();
    if (!have) await db.from("cold_email_senders").insert({ master_plan_id: a.planId, account_key: key, email: c.email, daily_cap: 30 });
    return NextResponse.json({ ok: true, canReadMail: c.canReadMail });
  }

  if (b.action === "update-sender") {
    const patch: Record<string, unknown> = {};
    if (b.dailyCap !== undefined) patch.daily_cap = Math.max(1, Math.min(100, Math.round(Number(b.dailyCap) || 30)));
    if (typeof b.paused === "boolean") {
      patch.paused = b.paused;
      if (!b.paused) {
        patch.fail_count = 0;
        patch.last_error = null;
      }
    }
    await db.from("cold_email_senders").update(patch).eq("id", clean(b.id, 60)).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "remove-sender") {
    await db.from("cold_email_senders").delete().eq("id", clean(b.id, 60)).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "toggle") {
    await ensure();
    const on = b.enabled === true;
    if (on) {
      const { data: sd } = await db.from("cold_email_senders").select("id").eq("master_plan_id", a.planId).eq("paused", false);
      if (!(sd ?? []).length) return NextResponse.json({ error: "Add at least one sending mailbox first." }, { status: 400 });
      const { data: cur } = await db.from("cold_email_settings").select("started_on, tz, steps, footer, booking_url").eq("master_plan_id", a.planId).maybeSingle();
      if (!a.house) {
        const { data: bd } = await db.from("pipeline_boards").select("personal_link_url").eq("id", board.id).maybeSingle();
        const problem = coldNotReady((cur?.steps as ColdStep[] | undefined) ?? [], (cur?.footer as string) ?? "", { personal: (bd?.personal_link_url as string | null) ?? "", booking: (cur?.booking_url as string | null) ?? "" });
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
      }
      const patch: Record<string, unknown> = { enabled: true, updated_at: new Date().toISOString() };
      if (!cur?.started_on) patch.started_on = localParts(new Date(), (cur?.tz as string) || "America/Denver").ymd;
      await db.from("cold_email_settings").update(patch).eq("master_plan_id", a.planId);
    } else {
      await db.from("cold_email_settings").update({ enabled: false, updated_at: new Date().toISOString() }).eq("master_plan_id", a.planId);
    }
    return NextResponse.json({ ok: true });
  }

  // A test of one of the emails to the signed-in person only, from the first mailbox, filled in with example details.
  if (b.action === "test") {
    const pick = db.from("cold_email_senders").select("*").eq("master_plan_id", a.planId);
    const { data: sd } = await (typeof b.senderId === "string" && b.senderId ? pick.eq("id", clean(b.senderId, 60)) : pick.order("created_at")).limit(1);
    const sender = (sd ?? [])[0] as { account_key: string; email: string | null; send_as?: string | null } | undefined;
    if (!sender) return NextResponse.json({ error: "Add a sending mailbox first." }, { status: 400 });
    const { data: plan } = await db.from("client_master_plans").select("user_id, client_email").eq("id", a.planId).maybeSingle();
    const to = testRecipient(a, (plan?.client_email as string) || "");
    if (!to) return NextResponse.json({ error: "No address to send the test to." }, { status: 400 });
    const token = await google.getValidAccessToken({ ownerId: plan?.user_id as string, accountKey: sender.account_key });
    if (!token) return NextResponse.json({ error: "That mailbox is not connected." }, { status: 400 });
    const { data: s } = await db.from("cold_email_settings").select("steps, footer, booking_url").eq("master_plan_id", a.planId).maybeSingle();
    const steps = ((s?.steps as ColdStep[] | undefined) ?? []).length ? (s!.steps as ColdStep[]) : a.house ? DEFAULT_STEPS : STARTER_STEPS;
    const n = Math.max(0, Math.min(steps.length - 1, Math.round(Number(b.step) || 0)));
    const vars = varsFor({ name: "Jane Example", notes: "Example Studio · Founder · Denver", link_code: "example" }, a.house ? "this Wednesday" : "", a.house ? undefined : { personal: "example", booking: (s?.booking_url as string | null) ?? "" });
    await google.sendEmail(token, {
      to,
      subject: "[TEST" + (sender.send_as ? ` from ${sender.send_as}` : "") + "] " + render(steps[n].subject, vars),
      body: render(steps[n].body, vars) + footer((s?.footer as string) || (a.house ? DEFAULT_FOOTER : ""), "https://lccommandsuite.com/unsubscribe?c=example"),
      extraHeaders: [...(sender.send_as ? [`From: AmiLynne Carroll <${sender.send_as}>`] : []), ...listUnsubscribeHeaders("https://lccommandsuite.com/api/cold-unsubscribe?c=example", to), `Reply-To: ${to}`],
    }).catch((e) => {
      throw new Error(String(e));
    });
    return NextResponse.json({ ok: true, to });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
