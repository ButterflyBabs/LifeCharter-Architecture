import { createServerClient } from "@/lib/supabase/server";
import * as google from "@/lib/google";
import { boardStages, moveCard, markDoNotContact, movesForward, type DmStage } from "@/lib/dmPipeline";
import { isZoomConfigured, masterclassMeetingId, meetingSchedule } from "@/lib/zoom";
import { DEFAULT_FOOTER, DEFAULT_STEPS, classifyMessage, daysBetween, dueStep, footer, inSendWindow, listUnsubscribeHeaders, localParts, rampCap, render, varsFor, type ColdStep } from "@/lib/coldEmail";

type Db = ReturnType<typeof createServerClient>;
const SITE = "https://lccommandsuite.com";
const SENDABLE = ["to_reach", "sent", "followed_up"];
const MAX_PER_SENDER_PER_RUN = 2;

type Settings = { master_plan_id: string; board_id: string | null; enabled: boolean; steps: ColdStep[]; tz: string; window_start: number; window_end: number; weekdays_only: boolean; footer: string | null; started_on: string | null };
type Sender = { id: string; master_plan_id: string; account_key: string; email: string | null; daily_cap: number; paused: boolean; fail_count: number };
type CardRow = { id: string; board_id: string; stage_id: string; name: string; email: string | null; notes: string | null; link_code: string | null };

export async function coldEmailSwitchOn(db: Db): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", "cold_email_on").maybeSingle();
  return String(data?.value ?? "").replace(/["\s]/g, "") === "true";
}

const code7 = () => Array.from({ length: 7 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");

async function nextSessionLabel(): Promise<string> {
  try {
    if (!isZoomConfigured()) return "this Thursday";
    const sch = await meetingSchedule(masterclassMeetingId());
    const o = sch.occurrences.find((x) => new Date(x.start).getTime() > Date.now() + 24 * 3600_000);
    if (!o) return "this Thursday";
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", weekday: "long", month: "long", day: "numeric" }).format(new Date(o.start));
  } catch {
    return "this Thursday";
  }
}

// ── Replies, stop requests and bounces ─────────────────────────────────────────────────────────────────────────────
async function scanReplies(db: Db, s: Settings, senders: Sender[], ownerId: string, stages: DmStage[], boardName: string) {
  const out = { replies: 0, stops: 0, bounces: 0 };
  if (!s.board_id) return out;
  const byKey = new Map(stages.map((x) => [x.key, x]));
  const stageById = new Map(stages.map((x) => [x.id, x]));
  for (const sender of senders) {
    const token = await google.getValidAccessToken({ ownerId, accountKey: sender.account_key });
    if (!token) {
      await db.from("cold_email_senders").update({ last_error: "Not connected. Reconnect this mailbox in Settings > Integrations." }).eq("id", sender.id);
      continue;
    }
    let msgs: Awaited<ReturnType<typeof google.searchInbox>> = [];
    try {
      msgs = await google.searchInbox(token, "in:inbox newer_than:4d", 60);
    } catch {
      await db.from("cold_email_senders").update({ last_error: "The Suite cannot read this mailbox, so replies are not seen. Reconnect it and allow reading mail." }).eq("id", sender.id);
      continue;
    }
    const { data: seenRows } = await db.from("cold_email_seen").select("message_id").eq("sender_id", sender.id).in("message_id", msgs.map((m) => m.id));
    const seen = new Set(((seenRows ?? []) as { message_id: string }[]).map((r) => r.message_id));
    const fresh = msgs.filter((m) => !seen.has(m.id) && m.fromEmail.toLowerCase() !== (sender.email ?? "").toLowerCase());
    const classified = fresh.map((m) => ({ m, c: classifyMessage({ fromEmail: m.fromEmail, subject: m.subject, preview: m.preview }, sender.email ?? "") }));
    const emails = new Set<string>();
    for (const { m, c } of classified) {
      if (c.kind === "bounce") c.addresses.forEach((a) => emails.add(a));
      else emails.add(m.fromEmail.toLowerCase());
    }
    const cardBy = new Map<string, CardRow>();
    const list = Array.from(emails);
    for (let i = 0; i < list.length; i += 150) {
      const { data } = await db.from("dm_cards").select("id, board_id, stage_id, name, email, notes, link_code").eq("master_plan_id", s.master_plan_id).eq("board_id", s.board_id).in("email", list.slice(i, i + 150));
      for (const c of (data ?? []) as CardRow[]) if (c.email) cardBy.set(c.email.toLowerCase(), c);
    }
    for (const { m, c } of classified) {
      const kind: string = c.kind;
      let cardId: string | null = null;
      const targets: string[] = c.kind === "bounce" ? c.addresses : [m.fromEmail.toLowerCase()];
      for (const t of targets) {
        const card = cardBy.get(t);
        if (!card) continue;
        cardId = card.id;
        const cur = stageById.get(card.stage_id);
        if (c.kind === "reply") {
          const to = byKey.get("conversation");
          if (to && cur && movesForward(cur.key, cur.kind, "conversation") && (await moveCard(db, s.master_plan_id, card.id, to, boardName, s.tz))) out.replies++;
        } else if (c.kind === "stop" || c.kind === "bounce") {
          const to = byKey.get("not_now");
          if (to && cur && cur.kind !== "closed") await moveCard(db, s.master_plan_id, card.id, to, boardName, s.tz);
          if (card.email) await markDoNotContact(db, s.master_plan_id, card.email, card.name);
          if (c.kind === "stop") out.stops++;
          else out.bounces++;
        }
      }
      await db.from("cold_email_seen").upsert({ sender_id: sender.id, message_id: m.id, kind, card_id: cardId }, { onConflict: "sender_id,message_id" });
    }
    await db.from("cold_email_senders").update({ scanned_at: new Date().toISOString(), last_error: null }).eq("id", sender.id);
  }
  return out;
}

// ── Sends ──────────────────────────────────────────────────────────────────────────────────────────────────────────
async function sendDue(db: Db, s: Settings, senders: Sender[], ownerId: string, stages: DmStage[], boardName: string, now: Date) {
  const out = { sent: 0, failed: 0, waiting: 0, skipped: "" };
  if (!s.board_id) return out;
  if (!inSendWindow(now, s.tz, s.window_start, s.window_end, s.weekdays_only)) return { ...out, skipped: "outside the send window" };
  const steps = s.steps && s.steps.length ? s.steps : DEFAULT_STEPS;
  const sendable = stages.filter((x) => SENDABLE.includes(x.key ?? ""));
  const stageIds = sendable.map((x) => x.id);
  if (!stageIds.length || !senders.length) return { ...out, skipped: "no mailbox or no stages" };
  const cards: CardRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("dm_cards").select("id, board_id, stage_id, name, email, notes, link_code").eq("master_plan_id", s.master_plan_id).eq("board_id", s.board_id).in("stage_id", stageIds).not("email", "is", null).order("created_at").order("id").range(from, from + 999);
    const part = (data ?? []) as CardRow[];
    cards.push(...part);
    if (part.length < 1000) break;
  }
  if (!cards.length) return out;
  const sendsBy = new Map<string, { step: number; sentAt: Date; sender_id: string | null }[]>();
  const stopped = new Set<string>();
  for (let i = 0; i < cards.length; i += 200) {
    const part = cards.slice(i, i + 200);
    const { data: sr } = await db.from("cold_email_sends").select("card_id, step, sent_at, sender_id, status").in("card_id", part.map((c) => c.id));
    for (const r of (sr ?? []) as { card_id: string; step: number; sent_at: string; sender_id: string | null; status: string }[]) {
      if (r.status === "sending" && Date.now() - new Date(r.sent_at).getTime() > 3600_000) continue; // an old unfinished claim is retried
      const list = sendsBy.get(r.card_id) ?? [];
      list.push({ step: r.step, sentAt: new Date(r.sent_at), sender_id: r.sender_id });
      sendsBy.set(r.card_id, list);
    }
    const { data: cs } = await db.from("seq_contacts").select("email, tags, unsubscribed_at").eq("master_plan_id", s.master_plan_id).in("email", part.map((c) => (c.email as string).toLowerCase()));
    for (const c of (cs ?? []) as { email: string; tags: string[] | null; unsubscribed_at: string | null }[]) if (c.unsubscribed_at || (c.tags ?? []).includes("do-not-contact")) stopped.add(c.email.toLowerCase());
  }
  const due: { card: CardRow; step: number }[] = [];
  for (const c of cards) {
    if (!c.email || stopped.has(c.email.toLowerCase())) continue;
    const step = dueStep(sendsBy.get(c.id) ?? [], steps, now);
    if (step !== null) due.push({ card: c, step });
  }
  due.sort((a, b) => b.step - a.step); // finish people already started before beginning new ones
  if (!due.length) return out;

  const { ymd, hour } = localParts(now, s.tz);
  const sinceMidnight = new Date(now.getTime() - (hour * 60 + now.getUTCMinutes()) * 60_000);
  const left = new Map<string, number>();
  const perRun = new Map<string, number>();
  for (const sd of senders) {
    const { count } = await db.from("cold_email_sends").select("id", { count: "exact", head: true }).eq("sender_id", sd.id).gte("sent_at", sinceMidnight.toISOString());
    left.set(sd.id, Math.max(0, rampCap(daysBetween(s.started_on, ymd), sd.daily_cap) - (count ?? 0)));
    perRun.set(sd.id, 0);
  }
  const session = await nextSessionLabel();
  const stageByKey = new Map(stages.map((x) => [x.key, x]));
  const tokens = new Map<string, string | null>();
  for (const { card, step } of due) {
    const prior = (sendsBy.get(card.id) ?? []).find((x) => x.sender_id)?.sender_id ?? null;
    const usable = (sd: Sender) => (left.get(sd.id) ?? 0) > 0 && (perRun.get(sd.id) ?? 0) < MAX_PER_SENDER_PER_RUN;
    const sender = senders.find((x) => x.id === prior && usable(x)) ?? senders.filter(usable).sort((a, b) => (left.get(b.id) ?? 0) - (left.get(a.id) ?? 0))[0];
    if (!sender) {
      out.waiting++;
      continue;
    }
    if (!tokens.has(sender.id)) tokens.set(sender.id, await google.getValidAccessToken({ ownerId, accountKey: sender.account_key }));
    const token = tokens.get(sender.id);
    if (!token || !sender.email) {
      left.set(sender.id, 0);
      continue;
    }
    let linkCode = card.link_code;
    if (!linkCode) {
      linkCode = code7();
      await db.from("dm_cards").update({ link_code: linkCode }).eq("id", card.id);
    }
    const claim = await db.from("cold_email_sends").insert({ master_plan_id: s.master_plan_id, card_id: card.id, step, sender_id: sender.id, to_email: card.email, status: "sending" });
    if (claim.error) continue; // someone else (or an earlier run) has this step
    const vars = varsFor({ name: card.name, notes: card.notes, link_code: linkCode }, session);
    const subject = render(steps[step].subject, vars);
    const body = render(steps[step].body, vars) + footer(s.footer || DEFAULT_FOOTER, `${SITE}/unsubscribe?c=${linkCode}`);
    try {
      const r = await google.sendEmail(token, { to: card.email as string, subject, body, extraHeaders: listUnsubscribeHeaders(`${SITE}/api/cold-unsubscribe?c=${linkCode}`, sender.email) });
      await db.from("cold_email_sends").update({ status: "sent", subject, message_id: r.id, thread_id: r.threadId, sent_at: new Date().toISOString() }).eq("card_id", card.id).eq("step", step);
      await db.from("cold_email_senders").update({ fail_count: 0, last_error: null }).eq("id", sender.id);
      const to = stageByKey.get(step === 0 ? "sent" : "followed_up");
      const cur = stages.find((x) => x.id === card.stage_id);
      if (to && cur && to.id !== cur.id && movesForward(cur.key, cur.kind, to.key as string)) await moveCard(db, s.master_plan_id, card.id, to, boardName, s.tz);
      out.sent++;
      left.set(sender.id, (left.get(sender.id) ?? 1) - 1);
      perRun.set(sender.id, (perRun.get(sender.id) ?? 0) + 1);
    } catch (e) {
      await db.from("cold_email_sends").delete().eq("card_id", card.id).eq("step", step).eq("status", "sending");
      const fails = sender.fail_count + 1;
      sender.fail_count = fails;
      await db.from("cold_email_senders").update({ fail_count: fails, last_error: String(e).slice(0, 300), paused: fails >= 3 ? true : sender.paused }).eq("id", sender.id);
      if (fails >= 3) left.set(sender.id, 0);
      out.failed++;
    }
  }
  return out;
}

export async function runColdEmail(now = new Date()) {
  const db = createServerClient();
  if (!(await coldEmailSwitchOn(db))) return { skipped: "switch off" };
  const { data: all } = await db.from("cold_email_settings").select("*").eq("enabled", true);
  const results: Record<string, unknown>[] = [];
  for (const row of (all ?? []) as Settings[]) {
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", row.master_plan_id).maybeSingle();
    const ownerId = plan?.user_id as string | undefined;
    if (!ownerId || !row.board_id) continue;
    const { data: sd } = await db.from("cold_email_senders").select("*").eq("master_plan_id", row.master_plan_id).eq("paused", false);
    const senders = (sd ?? []) as Sender[];
    const { data: board } = await db.from("pipeline_boards").select("name").eq("id", row.board_id).maybeSingle();
    const stages = await boardStages(db, row.master_plan_id, row.board_id);
    const boardName = (board?.name as string) || "Cold Email";
    const scan = await scanReplies(db, row, senders, ownerId, stages, boardName);
    const send = await sendDue(db, row, senders, ownerId, stages, boardName, now);
    results.push({ plan: row.master_plan_id, scan, send });
  }
  return { results };
}
