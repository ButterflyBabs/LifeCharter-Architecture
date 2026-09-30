import type { SupabaseClient } from "@supabase/supabase-js";
import { zonedToUtcISO } from "@/lib/tz";
import { nowParts } from "@/lib/finance/period";
import { ensureStages } from "@/lib/sales/pipeline";
import { logEvent } from "@/lib/crm";

// Outreach pipelines: each account can have many boards (the DM pipeline is one).
// A board has its own stages, a short tag given to everyone on it, and a tag per
// stage that follows the contact from stage to stage (the old stage's tag comes off,
// the new one goes on), so their contact record always shows where they are.
// A stage's follow_up_days sets the card's follow-up date when it lands there, and
// that follow-up is a real task (replaced on every move). A "booked" stage adds a
// Sales Pipeline deal. Separate from the Sales Pipeline.

export const CARD_PLATFORMS = [
  { id: "IG", label: "Instagram" },
  { id: "FB", label: "Facebook" },
  { id: "LI", label: "LinkedIn" },
  { id: "Email", label: "Email" },
  { id: "TXT", label: "Text" },
] as const;
export const platformLabel = (id: string | null) => CARD_PLATFORMS.find((p) => p.id === id)?.label ?? "";

// Stage templates for a new board.
const DM_TEMPLATE: { key: string; name: string; slug: string; followUpDays: number | null; kind: "open" | "booked" | "closed" }[] = [
  { key: "to_reach", name: "To reach out", slug: "reach-out", followUpDays: null, kind: "open" },
  { key: "sent", name: "DM sent", slug: "sent", followUpDays: 3, kind: "open" },
  { key: "followed_up", name: "Followed up (no reply yet)", slug: "followed-up", followUpDays: 5, kind: "open" },
  { key: "conversation", name: "In conversation", slug: "conversation", followUpDays: 1, kind: "open" },
  { key: "invited", name: "Invited", slug: "invited", followUpDays: 2, kind: "open" },
  { key: "booked", name: "Booked", slug: "booked", followUpDays: null, kind: "booked" },
  { key: "nurture", name: "Nurture", slug: "nurture", followUpDays: 30, kind: "open" },
  { key: "not_now", name: "Not now", slug: "not-now", followUpDays: null, kind: "closed" },
];
const SIMPLE_TEMPLATE: typeof DM_TEMPLATE = [
  { key: "new", name: "New", slug: "new", followUpDays: 2, kind: "open" },
  { key: "in_progress", name: "In progress", slug: "in-progress", followUpDays: 7, kind: "open" },
  { key: "done", name: "Done", slug: "done", followUpDays: null, kind: "closed" },
];
export const TEMPLATES = { dm: DM_TEMPLATE, simple: SIMPLE_TEMPLATE };

export const slugTag = (s: string, n = 40) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n).replace(/-$/, "");

export type Board = { id: string; name: string; tag: string | null; sortOrder: number };
export type DmStage = { id: string; boardId: string; key: string | null; name: string; tag: string | null; followUpDays: number | null; kind: "open" | "booked" | "closed"; sortOrder: number };

type Db = SupabaseClient;

const STAGE_SEL = "id, board_id, key, name, tag, follow_up_days, kind, sort_order";
export const shapeStage = (r: Record<string, unknown>): DmStage => ({
  id: r.id as string,
  boardId: r.board_id as string,
  key: (r.key as string) ?? null,
  name: r.name as string,
  tag: (r.tag as string) ?? null,
  followUpDays: (r.follow_up_days as number | null) ?? null,
  kind: (r.kind as DmStage["kind"]) ?? "open",
  sortOrder: (r.sort_order as number) ?? 0,
});

export async function createBoard(db: Db, planId: string, name: string, tag: string | null, template: keyof typeof TEMPLATES): Promise<Board | null> {
  const { data: last } = await db.from("pipeline_boards").select("sort_order").eq("master_plan_id", planId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data: board } = await db
    .from("pipeline_boards")
    .insert({ master_plan_id: planId, name, tag, sort_order: ((last?.sort_order as number) ?? -1) + 1 })
    .select("id, name, tag, sort_order")
    .single();
  if (!board) return null;
  const rows = TEMPLATES[template].map((s, i) => ({
    master_plan_id: planId,
    board_id: board.id,
    key: s.key,
    name: s.name,
    tag: tag ? `${tag}-${s.slug}` : null,
    follow_up_days: s.followUpDays,
    kind: s.kind,
    sort_order: i,
  }));
  await db.from("dm_stages").insert(rows);
  return { id: board.id as string, name: board.name as string, tag: (board.tag as string) ?? null, sortOrder: board.sort_order as number };
}

// The account's boards; a first DM board is made the first time.
export async function ensureBoards(db: Db, planId: string): Promise<Board[]> {
  const { data } = await db.from("pipeline_boards").select("id, name, tag, sort_order").eq("master_plan_id", planId).order("sort_order").order("created_at");
  if (data && data.length) return data.map((b) => ({ id: b.id as string, name: b.name as string, tag: (b.tag as string) ?? null, sortOrder: b.sort_order as number }));
  const b = await createBoard(db, planId, "DM Pipeline", "dm", "dm");
  return b ? [b] : [];
}

export async function boardStages(db: Db, planId: string, boardId: string): Promise<DmStage[]> {
  const { data } = await db.from("dm_stages").select(STAGE_SEL).eq("master_plan_id", planId).eq("board_id", boardId).order("sort_order");
  return (data ?? []).map(shapeStage);
}

// Today's date in the account's zone, plus `days`.
export function dateIn(tz: string, days: number): string {
  const { year, month, day } = nowParts(tz);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

type Card = { id: string; board_id: string; stage_id: string; name: string; platform: string | null; contact_id: string | null; follow_up_task_id: number | null; email: string | null; handle: string | null; deal_id: string | null; script_title: string | null };

// Puts `add` tags on the contact and takes `remove` tags off (tag history records both).
export async function retagContact(db: Db, planId: string, contactId: string | null, add: (string | null)[], remove: (string | null)[]) {
  if (!contactId) return;
  const adds = add.filter(Boolean) as string[];
  const removes = (remove.filter(Boolean) as string[]).filter((t) => !adds.includes(t));
  if (!adds.length && !removes.length) return;
  const { data: c } = await db.from("seq_contacts").select("tags").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (!c) return;
  const cur = (c.tags as string[]) ?? [];
  const next = Array.from(new Set([...cur.filter((t) => !removes.includes(t)), ...adds]));
  if (next.length === cur.length && next.every((t) => cur.includes(t))) return;
  await db.from("seq_contacts").update({ tags: next, tag_source: "pipeline", updated_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", planId);
}

// Replaces the card's follow-up task: the old one is removed if still open, and a new
// one is added when the stage has a follow-up.
async function setFollowUp(db: Db, planId: string, card: Card, stage: DmStage, boardName: string, tz: string): Promise<{ follow_up_on: string | null; follow_up_task_id: number | null }> {
  if (card.follow_up_task_id) {
    await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", planId).neq("status", "done");
  }
  if (stage.followUpDays == null) return { follow_up_on: null, follow_up_task_id: null };
  const day = dateIn(tz, stage.followUpDays);
  const who = card.handle ? `${card.name} (${card.handle})` : card.name;
  const on = platformLabel(card.platform);
  const { data: task } = await db
    .from("tasks")
    .insert({
      master_plan_id: planId,
      title: `Follow up with ${who}${on ? ` on ${on}` : ""}`.slice(0, 250),
      description: `${boardName} · ${stage.name}${card.script_title ? ` · last script: ${card.script_title}` : ""}`,
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
async function bookDeal(db: Db, planId: string, card: Card, boardName: string): Promise<string | null> {
  if (card.deal_id) return card.deal_id;
  const stages = await ensureStages(db, planId);
  const target = stages.find((s) => s.kind === "open" && /discovery|booked|call/i.test(s.name)) ?? stages.find((s) => s.kind === "open");
  if (!target) return null;
  const on = platformLabel(card.platform);
  const { data } = await db
    .from("pipeline_deals")
    .insert({
      master_plan_id: planId,
      stage_id: target.id,
      contact_name: card.name,
      email: card.email,
      source: on ? `${boardName} (${on})` : boardName,
      origin: "dm_pipeline",
      stage_changed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  return (data?.id as string) ?? null;
}

const CARD_SEL = "id, board_id, stage_id, name, platform, contact_id, follow_up_task_id, email, handle, deal_id, script_title";

// Moves a card into a stage of its board: new follow-up task, stage tags swapped on the
// contact, Booked -> deal, and a line on the contact's timeline.
export async function moveCard(db: Db, planId: string, cardId: string, stage: DmStage, boardName: string, tz: string, sortOrder?: number) {
  const { data: card } = await db.from("dm_cards").select(CARD_SEL).eq("id", cardId).eq("master_plan_id", planId).maybeSingle();
  if (!card || card.board_id !== stage.boardId) return null;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };
  if (typeof sortOrder === "number") patch.sort_order = sortOrder;
  if (card.stage_id !== stage.id) {
    const { data: from } = await db.from("dm_stages").select("tag").eq("id", card.stage_id).maybeSingle();
    Object.assign(patch, await setFollowUp(db, planId, card as Card, stage, boardName, tz), { stage_id: stage.id, stage_changed_at: now });
    if (stage.key === "sent" || stage.key === "followed_up") patch.last_contacted_at = now;
    if (stage.kind === "booked") patch.deal_id = await bookDeal(db, planId, card as Card, boardName);
    await retagContact(db, planId, card.contact_id as string | null, [stage.tag], [(from?.tag as string) ?? null]);
    if (card.contact_id) {
      await logEvent(planId, card.contact_id as string, "manual", `${boardName}: moved to ${stage.name}`, { dm_card: card.id }, db as never).catch(() => {});
    }
  }
  const { data: saved } = await db.from("dm_cards").update(patch).eq("id", cardId).eq("master_plan_id", planId).select("*").single();
  return saved;
}

// New card in a stage (with its follow-up and tags), optionally linked to a contact.
export async function createCard(
  db: Db,
  planId: string,
  board: Board,
  stage: DmStage,
  tz: string,
  input: { name: string; handle?: string | null; profileUrl?: string | null; email?: string | null; platform: string | null; contactId?: string | null; scriptId?: string | null; scriptTitle?: string | null; notes?: string | null }
) {
  const now = new Date().toISOString();
  const { data: card, error } = await db
    .from("dm_cards")
    .insert({
      master_plan_id: planId,
      board_id: board.id,
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
  const follow = await setFollowUp(db, planId, card as Card, stage, board.name, tz);
  const extra: Record<string, unknown> = { ...follow };
  if (stage.kind === "booked") extra.deal_id = await bookDeal(db, planId, card as Card, board.name);
  const { data: saved } = await db.from("dm_cards").update(extra).eq("id", card.id).select("*").single();
  await retagContact(db, planId, input.contactId ?? null, [board.tag, stage.tag], []);
  if (input.contactId) {
    await logEvent(planId, input.contactId, "manual", `${board.name}: added to ${stage.name}${input.scriptTitle ? ` · script: ${input.scriptTitle}` : ""}`, { dm_card: card.id }, db as never).catch(() => {});
  }
  return { card: saved ?? card };
}
