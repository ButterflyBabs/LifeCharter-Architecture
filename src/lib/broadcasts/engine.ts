import { createServerClient } from "@/lib/supabase/server";
import { renderStep } from "@/lib/sequences/render";
import { clientFrom, sendRendered } from "@/lib/sequences/engine";
import { accountSender, type EmailFooter } from "@/lib/email/accountSender";
import { housePlanId } from "@/lib/housePlan";
import { logEvent } from "@/lib/crm";
import { OWNER_TZ, fillSlots, slotsIn } from "./shared";
import { dailyCap, parseGuard } from "./warmup";

// Broadcasts: one-off emails to everyone with a tag. When one goes out, the
// recipients are snapshotted into crm_broadcast_sends (one row each, unique per
// contact). Each row is claimed just before its send, so nobody is ever emailed
// twice, and a run that stops part-way is picked up by the next cron run.

type Db = ReturnType<typeof createServerClient>;

export interface BroadcastRow {
  id: string;
  master_plan_id: string;
  template_key: string | null;
  name: string;
  subject: string;
  preview: string | null;
  body: string;
  button_label: string | null;
  button_url: string | null;
  brand: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  tags: string[];
  contact_ids: string[];
  tag_match: "any" | "all";
  skip_prior_template: boolean;
  offer?: string | null; // the section it sits under in Campaigns & Broadcasts
  skip_tags?: string[] | null; // leave out anyone carrying any of these tags
  once_group?: string | null; // broadcasts sent in weekly sets: one set per person, ever
  once_set?: string | null; // which set this broadcast belongs to (e.g. the class date)
  skip_active_sequences?: string[] | null; // campaign keys: leave out anyone still receiving one of these
  variables: Record<string, string>;
  status: "draft" | "scheduled" | "sending" | "sent" | "canceled";
  scheduled_at: string | null;
  timezone: string;
  queued_at: string | null;
  recipient_count: number;
}

// The zone an account schedules broadcasts in: Babs's is Mountain (as always);
// a client's is their own profile time zone.
export async function accountTimezone(db: Db, planId: string, house: boolean): Promise<string> {
  if (house) return OWNER_TZ;
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  const { data: prof } = plan?.user_id ? await db.from("profiles").select("timezone").eq("id", plan.user_id).maybeSingle() : { data: null };
  const tz = (prof?.timezone as string) || "";
  try {
    if (tz) {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    }
  } catch {
    /* fall through */
  }
  return OWNER_TZ;
}

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

// Contacts who are still in the middle of any of these campaigns (an active enrollment).
async function inActiveCampaigns(db: Db, planId: string, keys: string[]): Promise<Set<string>> {
  const busy = new Set<string>();
  if (!keys.length) return busy;
  const { data: seqs } = await db.from("sequences").select("id").eq("master_plan_id", planId).in("key", keys);
  const ids = ((seqs ?? []) as { id: string }[]).map((x) => x.id);
  if (!ids.length) return busy;
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("sequence_enrollments").select("contact_id").in("sequence_id", ids).eq("status", "active").range(from, from + 999);
    for (const r of (data ?? []) as { contact_id: string }[]) busy.add(r.contact_id);
    if (!data || data.length < 1000) break;
  }
  return busy;
}

// Everyone this broadcast would reach right now (not unsubscribed, and not still in a campaign it skips).
export async function listRecipients(
  db: Db,
  b: Pick<BroadcastRow, "id" | "master_plan_id" | "tags" | "contact_ids" | "tag_match" | "skip_prior_template" | "template_key" | "skip_active_sequences" | "skip_tags" | "once_group" | "once_set">
): Promise<{ id: string; email: string }[]> {
  const busy = await inActiveCampaigns(db, b.master_plan_id, b.skip_active_sequences ?? []);
  // Anyone already sent (or queued for) a different set in this group has had their one set.
  if (b.once_group) {
    const { data: others } = await db.from("crm_broadcasts").select("id").eq("master_plan_id", b.master_plan_id).eq("once_group", b.once_group).neq("once_set", b.once_set ?? "").neq("id", b.id);
    const ids = ((others ?? []) as { id: string }[]).map((x) => x.id);
    for (let i = 0; i < ids.length; i += 100) {
      for (let from = 0; ; from += 1000) {
        const { data } = await db.from("crm_broadcast_sends").select("contact_id").in("broadcast_id", ids.slice(i, i + 100)).in("status", ["queued", "claimed", "sent"]).range(from, from + 999);
        for (const r of (data ?? []) as { contact_id: string }[]) busy.add(r.contact_id);
        if (!data || data.length < 1000) break;
      }
    }
  }
  const skipTags = (b.skip_tags ?? []).filter(Boolean);
  if (skipTags.length) {
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("seq_contacts").select("id").eq("master_plan_id", b.master_plan_id).overlaps("tags", skipTags).range(from, from + 999);
      for (const r of (data ?? []) as { id: string }[]) busy.add(r.id);
      if (!data || data.length < 1000) break;
    }
  }
  const everyone = await matchingRecipients(db, b);
  return busy.size ? everyone.filter((c) => !busy.has(c.id)) : everyone;
}

async function matchingRecipients(
  db: Db,
  b: Pick<BroadcastRow, "id" | "master_plan_id" | "tags" | "contact_ids" | "tag_match" | "skip_prior_template" | "template_key">
): Promise<{ id: string; email: string }[]> {
  const picked = b.contact_ids ?? [];
  if (!b.tags.length && !picked.length) return [];
  const out: { id: string; email: string }[] = [];
  // People added by hand (only this account's, never unsubscribed ones).
  for (let i = 0; i < picked.length; i += 500) {
    const { data, error } = await db.from("seq_contacts").select("id, email").eq("master_plan_id", b.master_plan_id).is("unsubscribed_at", null).in("id", picked.slice(i, i + 500));
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as { id: string; email: string }[]));
  }
  const seen = new Set(out.map((c) => c.id));
  for (let from = 0; b.tags.length; from += 1000) {
    let q = db.from("seq_contacts").select("id, email").eq("master_plan_id", b.master_plan_id).is("unsubscribed_at", null).order("created_at").range(from, from + 999);
    q = b.tag_match === "all" ? q.contains("tags", b.tags) : q.overlaps("tags", b.tags);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    for (const c of (data ?? []) as { id: string; email: string }[]) if (!seen.has(c.id)) out.push(c);
    if (!data || data.length < 1000) break;
  }
  if (!b.skip_prior_template || !b.template_key) return out;
  const { data: earlier } = await db.from("crm_broadcasts").select("id").eq("master_plan_id", b.master_plan_id).eq("template_key", b.template_key).neq("id", b.id);
  const ids = ((earlier ?? []) as { id: string }[]).map((x) => x.id);
  if (!ids.length) return out;
  const already = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("crm_broadcast_sends").select("contact_id").in("broadcast_id", ids).eq("status", "sent").range(from, from + 999);
    for (const r of (data ?? []) as { contact_id: string }[]) already.add(r.contact_id);
    if (!data || data.length < 1000) break;
  }
  return out.filter((c) => !already.has(c.id));
}

// What still has to be done before it can go out (empty = ready).
export function problems(b: Pick<BroadcastRow, "subject" | "body" | "tags" | "contact_ids" | "preview" | "button_label" | "button_url" | "variables">): string[] {
  const p: string[] = [];
  if (!b.subject.trim()) p.push("Add a subject.");
  if (!b.body.trim()) p.push("Add the email itself.");
  if (!b.tags.length && !(b.contact_ids ?? []).length) p.push("Pick at least one tag or person to send to.");
  for (const k of slotsIn(b.subject, b.preview, b.body, b.button_url)) {
    const v = (b.variables?.[k] || "").trim();
    if (!v) p.push(`Fill in {{${k}}}.`);
    else if (k.endsWith("_url") && !isUrl(v)) p.push(`{{${k}}} must be a full link starting with https://`);
  }
  if (b.button_url && b.button_label) {
    const url = fillSlots(b.button_url, b.variables || {});
    if (!slotsIn(url).length && !isUrl(url)) p.push("The button link must start with https://");
  }
  return p;
}

export function renderBroadcast(b: BroadcastRow, contact: { id: string; first_name: string | null }, subjectPrefix = "", footer?: EmailFooter) {
  const v = b.variables || {};
  return renderStep({
    brand: b.brand,
    subject: subjectPrefix + fillSlots(b.subject, v),
    preview: fillSlots(b.preview || "", v),
    body: fillSlots(b.body, v),
    buttonLabel: b.button_label,
    buttonUrl: b.button_url ? fillSlots(b.button_url, v) : null,
    contact,
    footer,
    list: isNewsletter(b) ? "newsletter" : undefined,
  });
}

// A broadcast to the Head Up, Wings Out list: its Unsubscribe link leaves the newsletter only.
export const NEWSLETTER_TAG = "headup-wingsout";
export const isNewsletter = (b: Pick<BroadcastRow, "tags">) => (b.tags ?? []).includes(NEWSLETTER_TAG);

// Snapshot recipients (idempotent: the unique key keeps a re-run from doubling).
async function queue(db: Db, b: BroadcastRow) {
  const people = await listRecipients(db, b);
  for (let i = 0; i < people.length; i += 500) {
    const rows = people.slice(i, i + 500).map((c) => ({ broadcast_id: b.id, contact_id: c.id, email: c.email, status: "queued" }));
    const { error } = await db.from("crm_broadcast_sends").upsert(rows, { onConflict: "broadcast_id,contact_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  const { count } = await db.from("crm_broadcast_sends").select("id", { count: "exact", head: true }).eq("broadcast_id", b.id);
  await db.from("crm_broadcasts").update({ queued_at: new Date().toISOString(), recipient_count: count ?? people.length, updated_at: new Date().toISOString() }).eq("id", b.id);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Sends as much of one broadcast as fits before `deadline` (epoch ms), at about
// BROADCAST_PER_SECOND (default 10) emails a second. Returns how many went out.

// Warm-up guard (house account only): how many more emails may go out today, or null when the guard is off.
async function warmupRemaining(db: Db, planId: string): Promise<number | null> {
  try {
    const { data: rows } = await db.from("app_settings").select("key, value").like("key", "warmup_guard_%");
    const raw = Object.fromEntries(((rows ?? []) as { key: string; value: string }[]).map((r) => [r.key, String(r.value ?? "")]));
    const today = new Date().toLocaleDateString("en-CA", { timeZone: OWNER_TZ });
    const g = parseGuard(raw, today);
    if (!g.on) return null;
    const cap = dailyCap(g, today);
    // Start of today in the owner's time zone, as a UTC instant.
    const probe = new Date();
    const local = new Date(probe.toLocaleString("en-US", { timeZone: OWNER_TZ }));
    const startOfDay = new Date(probe.getTime() - (local.getHours() * 3600 + local.getMinutes() * 60 + local.getSeconds()) * 1000 - probe.getMilliseconds()).toISOString();
    const { count: bc } = await db
      .from("crm_broadcast_sends")
      .select("id, crm_broadcasts!inner(master_plan_id)", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", startOfDay)
      .eq("crm_broadcasts.master_plan_id", planId);
    const { count: sq } = await db
      .from("sequence_sends")
      .select("id, sequence_enrollments!inner(sequences!inner(master_plan_id))", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", startOfDay)
      .eq("sequence_enrollments.sequences.master_plan_id", planId);
    return Math.max(0, cap - (bc ?? 0) - (sq ?? 0));
  } catch (e) {
    console.error("warmup guard:", e instanceof Error ? e.message : e);
    return null; // never block sending because the guard itself failed
  }
}

export async function processBroadcast(db: Db, id: string, deadline: number): Promise<number> {
  const now = new Date().toISOString();
  // A client account that can't send (no verified domain of its own, or no mailing
  // address) sends nothing, and never falls back to a Babs address. A due scheduled
  // one goes back to draft rather than going out days late once they're set up.
  const { data: head } = await db.from("crm_broadcasts").select("master_plan_id, status, queued_at").eq("id", id).maybeSingle();
  if (!head) return 0;
  const who = await accountSender(head.master_plan_id as string, { marketing: true }, db);
  if (!who.ok) {
    // Only revert when we positively know whose account this is (a failed lookup of
    // Babs's account must never knock her scheduled broadcast back to draft).
    const houseKnown = Boolean(await housePlanId(db));
    if (houseKnown && (head.status === "scheduled" || (head.status === "sending" && !head.queued_at))) {
      await db.from("crm_broadcasts").update({ status: "draft", updated_at: now }).eq("id", id).in("status", ["scheduled", "sending"]).lte("scheduled_at", now);
    }
    return 0;
  }
  // A due scheduled broadcast becomes "sending" exactly once.
  await db.from("crm_broadcasts").update({ status: "sending", started_at: now, updated_at: now }).eq("id", id).eq("status", "scheduled").lte("scheduled_at", now);
  const { data } = await db.from("crm_broadcasts").select("*").eq("id", id).maybeSingle();
  let b = data as BroadcastRow | null;
  if (!b || b.status !== "sending") return 0;
  if (!b.queued_at && problems(b).length) {
    await db.from("crm_broadcasts").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "sending");
    return 0;
  }
  if (!b.queued_at) {
    await queue(db, b);
    b = { ...b, queued_at: new Date().toISOString() };
  }
  const gap = 1000 / Math.max(1, Math.min(50, Number(process.env.BROADCAST_PER_SECOND) || 10));
  let allowance = who.house ? await warmupRemaining(db, b.master_plan_id) : null;
  let sent = 0;
  let last = 0;
  while (Date.now() < deadline) {
    const { data: st } = await db.from("crm_broadcasts").select("status").eq("id", id).maybeSingle();
    if (st?.status !== "sending") return sent; // canceled mid-way
    const { data: batch } = await db
      .from("crm_broadcast_sends")
      .select("id, email, contact_id, seq_contacts(first_name, unsubscribed_at)")
      .eq("broadcast_id", id)
      .eq("status", "queued")
      .limit(50);
    const rows = (batch ?? []) as unknown as { id: string; email: string; contact_id: string; seq_contacts: { first_name: string | null; unsubscribed_at: string | null } | null }[];
    if (!rows.length) {
      await db.from("crm_broadcasts").update({ status: "sent", finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "sending");
      return sent;
    }
    for (const r of rows) {
      if (Date.now() >= deadline) return sent;
      // Warm-up guard: today's allowance is used up; the rest stays queued for tomorrow's runs.
      if (allowance !== null && allowance <= 0) return sent;
      const { data: claim } = await db.from("crm_broadcast_sends").update({ status: "claimed", claimed_at: new Date().toISOString() }).eq("id", r.id).eq("status", "queued").select("id");
      if (!claim?.length) continue; // another run has it
      if (!r.seq_contacts || r.seq_contacts.unsubscribed_at) {
        await db.from("crm_broadcast_sends").update({ status: "skipped", error: "unsubscribed" }).eq("id", r.id);
        continue;
      }
      const wait = last + gap - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      const mail = renderBroadcast(b, { id: r.contact_id, first_name: r.seq_contacts.first_name }, "", who.house ? undefined : who.footer);
      const res = await sendRendered(who.house ? b : clientFrom(who), r.email, r.contact_id, mail, who.house ? undefined : who.resendKey, isNewsletter(b) ? "newsletter" : undefined).catch((e) => ({ ok: false, error: String(e), status: 0 }) as { ok: boolean; id?: string; error?: string; status?: number });
      if (!res.ok && res.status === 429) {
        // Rate-limited: Resend didn't take it, so it's safe to put back and slow down.
        await db.from("crm_broadcast_sends").update({ status: "queued", claimed_at: null }).eq("id", r.id);
        await sleep(1500);
        continue;
      }
      await db
        .from("crm_broadcast_sends")
        .update(res.ok ? { status: "sent", resend_id: res.id ?? null, sent_at: new Date().toISOString() } : { status: "failed", error: (res.error || "").slice(0, 500) })
        .eq("id", r.id);
      if (res.ok) {
        sent++;
        if (allowance !== null) allowance--;
        await logEvent(b.master_plan_id, r.contact_id, "email", `Broadcast: “${fillSlots(b.subject, b.variables || {})}”`, { broadcast: b.id, name: b.name }, db).catch(() => {});
      }
    }
  }
  return sent;
}

// The cron: every due scheduled broadcast, and any still part-way through.
export async function processDueBroadcasts(deadline: number): Promise<{ broadcasts: number; sent: number }> {
  const db = createServerClient();
  const now = new Date().toISOString();
  const { data } = await db.from("crm_broadcasts").select("id").or(`status.eq.sending,and(status.eq.scheduled,scheduled_at.lte.${now})`).order("scheduled_at").limit(20);
  let sent = 0;
  for (const r of (data ?? []) as { id: string }[]) {
    if (Date.now() >= deadline) break;
    try {
      sent += await processBroadcast(db, r.id, deadline);
    } catch (e) {
      console.error("broadcast:", r.id, e);
    }
  }
  return { broadcasts: (data ?? []).length, sent };
}

export async function sendCounts(db: Db, id: string) {
  const out: Record<string, number> = { queued: 0, claimed: 0, sent: 0, failed: 0, skipped: 0 };
  await Promise.all(
    Object.keys(out).map(async (s) => {
      const { count } = await db.from("crm_broadcast_sends").select("id", { count: "exact", head: true }).eq("broadcast_id", id).eq("status", s);
      out[s] = count ?? 0;
    })
  );
  return out;
}
