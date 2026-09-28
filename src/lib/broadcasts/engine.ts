import { createServerClient } from "@/lib/supabase/server";
import { renderStep } from "@/lib/sequences/render";
import { sendRendered } from "@/lib/sequences/engine";
import { logEvent } from "@/lib/crm";
import { fillSlots, slotsIn } from "./shared";

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
  tag_match: "any" | "all";
  skip_prior_template: boolean;
  variables: Record<string, string>;
  status: "draft" | "scheduled" | "sending" | "sent" | "canceled";
  scheduled_at: string | null;
  timezone: string;
  queued_at: string | null;
  recipient_count: number;
}

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

// Everyone this broadcast would reach right now (not unsubscribed).
export async function listRecipients(
  db: Db,
  b: Pick<BroadcastRow, "id" | "master_plan_id" | "tags" | "tag_match" | "skip_prior_template" | "template_key">
): Promise<{ id: string; email: string }[]> {
  if (!b.tags.length) return [];
  const out: { id: string; email: string }[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("seq_contacts").select("id, email").eq("master_plan_id", b.master_plan_id).is("unsubscribed_at", null).order("created_at").range(from, from + 999);
    q = b.tag_match === "all" ? q.contains("tags", b.tags) : q.overlaps("tags", b.tags);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as { id: string; email: string }[]));
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
export function problems(b: Pick<BroadcastRow, "subject" | "body" | "tags" | "preview" | "button_label" | "button_url" | "variables">): string[] {
  const p: string[] = [];
  if (!b.subject.trim()) p.push("Add a subject.");
  if (!b.body.trim()) p.push("Add the email itself.");
  if (!b.tags.length) p.push("Pick at least one tag to send to.");
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

export function renderBroadcast(b: BroadcastRow, contact: { id: string; first_name: string | null }, subjectPrefix = "") {
  const v = b.variables || {};
  return renderStep({
    brand: b.brand,
    subject: subjectPrefix + fillSlots(b.subject, v),
    preview: fillSlots(b.preview || "", v),
    body: fillSlots(b.body, v),
    buttonLabel: b.button_label,
    buttonUrl: b.button_url ? fillSlots(b.button_url, v) : null,
    contact,
  });
}

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
export async function processBroadcast(db: Db, id: string, deadline: number): Promise<number> {
  const now = new Date().toISOString();
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
      const { data: claim } = await db.from("crm_broadcast_sends").update({ status: "claimed", claimed_at: new Date().toISOString() }).eq("id", r.id).eq("status", "queued").select("id");
      if (!claim?.length) continue; // another run has it
      if (!r.seq_contacts || r.seq_contacts.unsubscribed_at) {
        await db.from("crm_broadcast_sends").update({ status: "skipped", error: "unsubscribed" }).eq("id", r.id);
        continue;
      }
      const wait = last + gap - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      const mail = renderBroadcast(b, { id: r.contact_id, first_name: r.seq_contacts.first_name });
      const res = await sendRendered(b, r.email, r.contact_id, mail).catch((e) => ({ ok: false, error: String(e), status: 0 }) as { ok: boolean; id?: string; error?: string; status?: number });
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
