import type { SupabaseClient } from "@supabase/supabase-js";
import { zonedToUtcISO } from "@/lib/tz";
import { nowParts } from "@/lib/finance/period";
import { ensureStages } from "@/lib/sales/pipeline";
import { logEvent } from "@/lib/crm";

// DM Pipeline: prospects messaged on Instagram, Facebook or LinkedIn, moved stage to
// stage. A stage's follow_up_days sets the card's follow-up date when it lands there,
// and that follow-up is a real task (replaced on every move). Booked adds a Sales
// Pipeline deal. Separate from the Sales Pipeline; each account has its own stages.

export const DM_PLATFORMS = [
  { id: "IG", label: "Instagram" },
  { id: "FB", label: "Facebook" },
  { id: "LI", label: "LinkedIn" },
] as const;
export type DmPlatform = (typeof DM_PLATFORMS)[number]["id"];
export const platformLabel = (id: string) => DM_PLATFORMS.find((p) => p.id === id)?.label ?? id;

export const DEFAULT_DM_STAGES: { key: string; name: string; followUpDays: number | null; kind: "open" | "booked" | "closed" }[] = [
  { key: "to_reach", name: "To reach out", followUpDays: null, kind: "open" },
  { key: "sent", name: "DM sent", followUpDays: 3, kind: "open" },
  { key: "followed_up", name: "Followed up (no reply yet)", followUpDays: 5, kind: "open" },
  { key: "conversation", name: "In conversation", followUpDays: 1, kind: "open" },
  { key: "invited", name: "Invited", followUpDays: 2, kind: "open" },
  { key: "booked", name: "Booked", followUpDays: null, kind: "booked" },
  { key: "nurture", name: "Nurture", followUpDays: 30, kind: "open" },
  { key: "not_now", name: "Not now", followUpDays: null, kind: "closed" },
];

export type DmStage = { id: string; key: string | null; name: string; followUpDays: number | null; kind: "open" | "booked" | "closed"; sortOrder: number };

type Db = SupabaseClient;

export async function ensureDmStages(db: Db, planId: string): Promise<DmStage[]> {
  const sel = "id, key, name, follow_up_days, kind, sort_order";
  const shape = (r: Record<string, unknown>): DmStage => ({
    id: r.id as string,
    key: (r.key as string) ?? null,
    name: r.name as string,
    followUpDays: (r.follow_up_days as number | null) ?? null,
    kind: (r.kind as DmStage["kind"]) ?? "open",
    sortOrder: (r.sort_order as number) ?? 0,
  });
  const { data } = await db.from("dm_stages").select(sel).eq("master_plan_id", planId).order("sort_order");
  if (data && data.length) return data.map(shape);
  const rows = DEFAULT_DM_STAGES.map((s, i) => ({ master_plan_id: planId, key: s.key, name: s.name, follow_up_days: s.followUpDays, kind: s.kind, sort_order: i }));
  const { data: made } = await db.from("dm_stages").insert(rows).select(sel);
  return ((made ?? []) as Record<string, unknown>[]).map(shape).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Today's date in the account's zone, plus `days`.
export function dateIn(tz: string, days: number): string {
  const { year, month, day } = nowParts(tz);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

type Card = { id: string; name: string; platform: string; contact_id: string | null; follow_up_task_id: number | null; email: string | null; handle: string | null; deal_id: string | null; script_title: string | null };

// Replaces the card's follow-up task: the old one is removed if still open, and a new
// one is added when the stage has a follow-up.
async function setFollowUp(db: Db, planId: string, card: Card, stage: DmStage, tz: string): Promise<{ follow_up_on: string | null; follow_up_task_id: number | null }> {
  if (card.follow_up_task_id) {
    await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", planId).neq("status", "done");
  }
  if (stage.followUpDays == null) return { follow_up_on: null, follow_up_task_id: null };
  const day = dateIn(tz, stage.followUpDays);
  const who = card.handle ? `${card.name} (${card.handle})` : card.name;
  const { data: task } = await db
    .from("tasks")
    .insert({
      master_plan_id: planId,
      title: `Follow up with ${who} on ${platformLabel(card.platform)}`.slice(0, 250),
      description: `DM Pipeline · ${stage.name}${card.script_title ? ` · last script: ${card.script_title}` : ""}`,
      status: stage.followUpDays === 0 ? "today" : "backlog",
      priority: "medium",
      due_at: zonedToUtcISO(day, "23:59", tz),
      due_has_time: false,
      time_kind: "deadline",
      dimension_sales: true,
    })
    .select("id")
    .single();
  return { follow_up_on: day, follow_up_task_id: (task?.id as number) ?? null };
}

// Booked: add the person to the Sales Pipeline once (first open stage).
async function bookDeal(db: Db, planId: string, card: Card): Promise<string | null> {
  if (card.deal_id) return card.deal_id;
  const stages = await ensureStages(db, planId);
  const target = stages.find((s) => s.kind === "open" && /discovery|booked|call/i.test(s.name)) ?? stages.find((s) => s.kind === "open");
  if (!target) return null;
  const { data } = await db
    .from("pipeline_deals")
    .insert({
      master_plan_id: planId,
      stage_id: target.id,
      contact_name: card.name,
      email: card.email,
      source: `DM (${platformLabel(card.platform)})`,
      origin: "dm_pipeline",
      stage_changed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  return (data?.id as string) ?? null;
}

// Moves a card into a stage: new follow-up task, stage timestamp, Booked -> deal,
// and a line on the contact's timeline.
export async function moveCard(db: Db, planId: string, cardId: string, stage: DmStage, tz: string, sortOrder?: number) {
  const { data: card } = await db
    .from("dm_cards")
    .select("id, name, platform, contact_id, follow_up_task_id, email, handle, deal_id, script_title, stage_id")
    .eq("id", cardId)
    .eq("master_plan_id", planId)
    .maybeSingle();
  if (!card) return null;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };
  if (typeof sortOrder === "number") patch.sort_order = sortOrder;
  if (card.stage_id !== stage.id) {
    Object.assign(patch, await setFollowUp(db, planId, card as Card, stage, tz), { stage_id: stage.id, stage_changed_at: now });
    if (stage.key === "sent" || stage.key === "followed_up") patch.last_contacted_at = now;
    if (stage.kind === "booked") patch.deal_id = await bookDeal(db, planId, card as Card);
    if (card.contact_id) {
      await logEvent(planId, card.contact_id as string, "manual", `DM Pipeline (${platformLabel(card.platform as string)}): moved to ${stage.name}`, { dm_card: card.id }, db as never).catch(() => {});
    }
  }
  const { data: saved } = await db.from("dm_cards").update(patch).eq("id", cardId).eq("master_plan_id", planId).select("*").single();
  return saved;
}

// New card in a stage (with its follow-up), optionally linked to a contact.
export async function createCard(
  db: Db,
  planId: string,
  stage: DmStage,
  tz: string,
  input: { name: string; handle?: string | null; profileUrl?: string | null; email?: string | null; platform: string; contactId?: string | null; scriptId?: string | null; scriptTitle?: string | null; notes?: string | null }
) {
  const now = new Date().toISOString();
  const { data: card, error } = await db
    .from("dm_cards")
    .insert({
      master_plan_id: planId,
      stage_id: stage.id,
      contact_id: input.contactId ?? null,
      name: input.name,
      handle: input.handle ?? null,
      profile_url: input.profileUrl ?? null,
      email: input.email ?? null,
      platform: input.platform,
      script_id: input.scriptId ?? null,
      script_title: input.scriptTitle ?? null,
      notes: input.notes ?? null,
      last_contacted_at: stage.key === "sent" || stage.key === "followed_up" ? now : null,
      stage_changed_at: now,
    })
    .select("*")
    .single();
  if (error || !card) return { error: error?.message ?? "Couldn't add them." };
  const follow = await setFollowUp(db, planId, card as Card, stage, tz);
  const extra: Record<string, unknown> = { ...follow };
  if (stage.kind === "booked") extra.deal_id = await bookDeal(db, planId, card as Card);
  const { data: saved } = await db.from("dm_cards").update(extra).eq("id", card.id).select("*").single();
  if (input.contactId) {
    await logEvent(planId, input.contactId, "manual", `DM Pipeline (${platformLabel(input.platform)}): added to ${stage.name}${input.scriptTitle ? ` · script: ${input.scriptTitle}` : ""}`, { dm_card: card.id }, db as never).catch(() => {});
  }
  return { card: saved ?? card };
}
