import type { SupabaseClient } from "@supabase/supabase-js";
import { createCard, moveCard, retagContact, shapeStage, slugTag, type Board, type DmStage } from "@/lib/dmPipeline";
import { logEvent } from "@/lib/crm";
import { nowParts } from "@/lib/finance/period";

// Call to Close consultants (Mide first). A consultant has their OWN pipeline board in the house account's Outreach
// Pipelines (pipeline_boards.owner_email = their sign-in email) and sees nothing else. A prospect is only a CARD until
// they book a discovery call; the booking is what creates the CRM contact. Tags follow the consultant's name:
//   c2c-<name>-<mon>-<year>        the month the card was added
//   c2c-<name>-discovery           a discovery call is booked
//   c2c-<name>-followup            a follow-up call
//   c2c-<name>-<tier>-<yyyy-mm-dd> closed: the program tier enrolled and the day

type Db = SupabaseClient;

export const C2C_TIERS = ["starter", "growth", "vip"] as const;
export type C2cTier = (typeof C2C_TIERS)[number];
export const TIER_LABEL: Record<C2cTier, string> = { starter: "Starter", growth: "Growth", vip: "VIP" };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const BOARD_PREFIX = /^call to close:\s*/i;

/** "Call to Close: Mide" -> "mide" */
export const consultantKey = (boardName: string) => slugTag(boardName.replace(BOARD_PREFIX, "")) || "consultant";
export const leadTag = (key: string, tz = "America/Denver", now: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find((x) => x.type === "year")?.value ?? String(now.getUTCFullYear());
  const month = Number(parts.find((x) => x.type === "month")?.value ?? now.getUTCMonth() + 1);
  return `c2c-${key}-${MONTHS[month - 1]}-${year}`;
};
export const discoveryTag = (key: string) => `c2c-${key}-discovery`;
export const followupTag = (key: string) => `c2c-${key}-followup`;
export const closeTag = (key: string, tier: C2cTier, ymd: string) => `c2c-${key}-${tier}-${ymd}`;

/** The boards that belong to one consultant (matched by sign-in email). */
export async function consultantBoards(db: Db, planId: string, email: string): Promise<(Board & { name: string })[]> {
  const { data } = await db.from("pipeline_boards").select("id, name, tag, sort_order").eq("master_plan_id", planId).ilike("owner_email", email.trim()).order("sort_order");
  return ((data ?? []) as { id: string; name: string; tag: string | null; sort_order: number }[]).map((b) => ({ id: b.id, name: b.name, tag: b.tag, sortOrder: b.sort_order }));
}

const STAGE_SEL = "id, board_id, key, name, tag, follow_up_days, kind, sort_order";
export async function c2cStages(db: Db, planId: string, boardId: string): Promise<DmStage[]> {
  const { data } = await db.from("dm_stages").select(STAGE_SEL).eq("master_plan_id", planId).eq("board_id", boardId).order("sort_order");
  return ((data ?? []) as Record<string, unknown>[]).map(shapeStage);
}
const stageByKey = (stages: DmStage[], key: string) => stages.find((s) => s.key === key) ?? null;

export const CARD_COLS =
  "id, board_id, stage_id, contact_id, name, business_name, email, phone, linkedin, facebook, instagram, lead_tag, discovery_at, discovery_booking_id, discovery_outcome, followup_at, closed_tier, closed_on, card_tags, notes, sort_order, updated_at, created_at";

export interface C2cCard {
  id: string;
  stageId: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  leadTag: string;
  discoveryAt: string | null;
  outcome: "attended" | "no_show" | null;
  followupAt: string | null;
  closedTier: string;
  closedOn: string | null;
  tags: string[];
  inCrm: boolean;
  notes: string;
  updatedAt: string;
}
const s = (v: unknown) => (typeof v === "string" ? v : "");
export function shapeCard(r: Record<string, unknown>): C2cCard {
  return {
    id: r.id as string,
    stageId: r.stage_id as string,
    name: s(r.name),
    businessName: s(r.business_name),
    email: s(r.email),
    phone: s(r.phone),
    linkedin: s(r.linkedin),
    facebook: s(r.facebook),
    instagram: s(r.instagram),
    leadTag: s(r.lead_tag),
    discoveryAt: (r.discovery_at as string | null) ?? null,
    outcome: r.discovery_outcome === "attended" || r.discovery_outcome === "no_show" ? r.discovery_outcome : null,
    followupAt: (r.followup_at as string | null) ?? null,
    closedTier: s(r.closed_tier),
    closedOn: (r.closed_on as string | null) ?? null,
    tags: ((r.card_tags as string[] | null) ?? []).filter(Boolean),
    inCrm: Boolean(r.contact_id),
    notes: s(r.notes),
    updatedAt: s(r.updated_at),
  };
}

const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const union = (...lists: (string[] | null | undefined)[]) => Array.from(new Set(lists.flatMap((l) => l ?? []).filter(Boolean)));

/** The fields a consultant may edit on a card, cleaned. Anything else in the body is ignored. */
export function cardFields(b: Record<string, unknown>): { patch: Record<string, unknown>; error?: string } {
  const patch: Record<string, unknown> = {};
  if (typeof b.name === "string") {
    const n = clean(b.name, 160);
    if (!n) return { patch, error: "A card needs a name." };
    patch.name = n;
  }
  if (typeof b.businessName === "string") patch.business_name = clean(b.businessName, 160) || null;
  if (typeof b.email === "string") {
    const e = clean(b.email, 200).toLowerCase();
    if (e && !EMAIL.test(e)) return { patch, error: "That email address doesn't look right." };
    patch.email = e || null;
  }
  if (typeof b.phone === "string") patch.phone = clean(b.phone, 40) || null;
  for (const [k, col] of [["linkedin", "linkedin"], ["facebook", "facebook"], ["instagram", "instagram"]] as const) {
    if (typeof b[k] === "string") patch[col] = clean(b[k], 300) || null;
  }
  if (typeof b.notes === "string") patch.notes = b.notes.trim().slice(0, 20000) || null;
  if (b.followupAt === null || b.followupAt === "") patch.followup_at = null;
  else if (typeof b.followupAt === "string") {
    const t = Date.parse(b.followupAt);
    if (!Number.isFinite(t)) return { patch, error: "Enter a valid follow-up date and time." };
    patch.followup_at = new Date(t).toISOString();
  }
  return { patch };
}

/** A new prospect, added by the consultant: a card only. No CRM contact is made until they book a call. */
export async function addProspect(db: Db, planId: string, board: Board, tz: string, input: Record<string, unknown>): Promise<{ card: C2cCard } | { error: string }> {
  const { patch, error } = cardFields(input);
  if (error) return { error };
  if (!patch.name) return { error: "Add their name." };
  const stages = await c2cStages(db, planId, board.id);
  const first = stageByKey(stages, "c2c_new") ?? stages[0];
  if (!first) return { error: "This pipeline has no stages yet." };
  const key = consultantKey(board.name);
  const tag = leadTag(key, tz);
  const made = await createCard(db, planId, board, first, tz, { name: String(patch.name), email: (patch.email as string | null) ?? null, platform: null, notes: (patch.notes as string | null) ?? null });
  if ("error" in made && made.error) return { error: made.error };
  const id = (made as { card: { id: string } }).card.id;
  const { data } = await db.from("dm_cards").update({ ...patch, lead_tag: tag, card_tags: [tag] }).eq("id", id).eq("master_plan_id", planId).select(CARD_COLS).single();
  return { card: shapeCard(data as Record<string, unknown>) };
}

/** Move a card by hand. Closing goes through closeCard (it needs the program tier). */
export async function moveProspect(db: Db, planId: string, board: Board, cardId: string, stageId: string, tz: string): Promise<C2cCard | null> {
  const stages = await c2cStages(db, planId, board.id);
  const stage = stages.find((x) => x.id === stageId);
  if (!stage || stage.key === "c2c_closed") return null;
  const saved = await moveCard(db, planId, cardId, stage, board.name, tz);
  if (!saved) return null;
  const key = consultantKey(board.name);
  // A follow-up call: the tag goes on the card (and on the contact, once there is one).
  if (stage.key === "c2c_followup") {
    await db.from("dm_cards").update({ card_tags: union(saved.card_tags as string[], [followupTag(key)]) }).eq("id", cardId).eq("master_plan_id", planId);
  }
  const { data } = await db.from("dm_cards").select(CARD_COLS).eq("id", cardId).single();
  return shapeCard(data as Record<string, unknown>);
}

/** Closed: the tier they enrolled in and the day. Tags the contact (when there is one) c2c-<name>-<tier>-<date>. */
export async function closeProspect(db: Db, planId: string, board: Board, cardId: string, tier: string, tz: string): Promise<C2cCard | { error: string }> {
  if (!(C2C_TIERS as readonly string[]).includes(tier)) return { error: "Choose Starter, Growth or VIP." };
  const stages = await c2cStages(db, planId, board.id);
  const stage = stageByKey(stages, "c2c_closed");
  if (!stage) return { error: "This pipeline has no Closed stage." };
  const { data: card } = await db.from("dm_cards").select("id, board_id, contact_id, card_tags").eq("id", cardId).eq("master_plan_id", planId).eq("board_id", board.id).maybeSingle();
  if (!card) return { error: "That card isn't on your pipeline." };
  const p = nowParts(tz);
  const ymd = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const tag = closeTag(consultantKey(board.name), tier as C2cTier, ymd);
  await moveCard(db, planId, cardId, stage, board.name, tz);
  await db.from("dm_cards").update({ closed_tier: tier, closed_on: ymd, card_tags: union(card.card_tags as string[], [tag]), updated_at: new Date().toISOString() }).eq("id", cardId).eq("master_plan_id", planId);
  await retagContact(db, planId, (card.contact_id as string | null) ?? null, [tag], []);
  if (card.contact_id) await logEvent(planId, card.contact_id as string, "manual", `${board.name}: closed, enrolled in ${TIER_LABEL[tier as C2cTier]}`, { dm_card: cardId }, db as never).catch(() => {});
  const { data } = await db.from("dm_cards").select(CARD_COLS).eq("id", cardId).single();
  return shapeCard(data as Record<string, unknown>);
}

// ── The booking hooks ────────────────────────────────────────────────────────

/** A discovery call was booked on a consultant's calendar: find or make their card, fill it in, link the CRM contact. */
export async function c2cOnBooking(
  db: Db,
  planId: string,
  i: { hostEmail: string; contactId: string | null; bookingId: string; name: string; email: string; phone: string | null; business: string | null; startISO: string; tz: string }
): Promise<void> {
  const boards = await consultantBoards(db, planId, i.hostEmail);
  const board = boards[0];
  if (!board) return;
  const stages = await c2cStages(db, planId, board.id);
  const booked = stageByKey(stages, "c2c_booked");
  if (!booked) return;
  const key = consultantKey(board.name);
  const email = i.email.trim().toLowerCase();
  const { data: found } = await db.from("dm_cards").select(`${CARD_COLS}, stage_id`).eq("master_plan_id", planId).eq("board_id", board.id).or(`email.eq.${email}${i.contactId ? `,contact_id.eq.${i.contactId}` : ""}`).limit(1);
  let card = ((found ?? []) as unknown as Record<string, unknown>[])[0] ?? null;
  const tag = (card?.lead_tag as string | null) || leadTag(key, i.tz);
  if (!card) {
    const made = await createCard(db, planId, board, booked, i.tz, { name: i.name, email, platform: null, contactId: i.contactId });
    if ("error" in made && made.error) return;
    card = (made as { card: Record<string, unknown> }).card;
  } else {
    const closed = stages.find((x) => x.id === card!.stage_id)?.kind === "closed";
    if (!closed && card.stage_id !== booked.id) await moveCard(db, planId, card.id as string, booked, board.name, i.tz);
  }
  await db
    .from("dm_cards")
    .update({
      contact_id: i.contactId ?? (card.contact_id as string | null) ?? null,
      name: (card.name as string) || i.name,
      email,
      ...(i.phone ? { phone: i.phone } : {}),
      ...(i.business ? { business_name: i.business } : {}),
      lead_tag: tag,
      discovery_at: i.startISO,
      discovery_booking_id: i.bookingId,
      discovery_outcome: null,
      card_tags: union(card.card_tags as string[], [tag, discoveryTag(key)]),
      updated_at: new Date().toISOString(),
    })
    .eq("id", card.id as string)
    .eq("master_plan_id", planId);
  // The contact now exists, so the tags that were only on the card go on it too.
  await retagContact(db, planId, i.contactId, [tag, discoveryTag(key)], []);
}

/** Zoom or the host marked a booked call attended or missed: the card follows (unless it has moved on to follow-up or closed). */
export async function c2cOnOutcome(db: Db, planId: string, bookingId: string, outcome: "attended" | "no_show", tz = "America/Denver"): Promise<void> {
  const { data: card } = await db.from("dm_cards").select("id, board_id, stage_id").eq("master_plan_id", planId).eq("discovery_booking_id", bookingId).maybeSingle();
  if (!card) return;
  const { data: board } = await db.from("pipeline_boards").select("id, name, tag, sort_order").eq("id", card.board_id).maybeSingle();
  if (!board) return;
  const stages = await c2cStages(db, planId, card.board_id as string);
  const cur = stages.find((x) => x.id === card.stage_id);
  await db.from("dm_cards").update({ discovery_outcome: outcome, updated_at: new Date().toISOString() }).eq("id", card.id as string);
  if (cur && ["c2c_followup", "c2c_closed", "c2c_not_now"].includes(cur.key ?? "")) return;
  const target = stageByKey(stages, outcome === "attended" ? "c2c_attended" : "c2c_no_show");
  if (target && target.id !== card.stage_id) await moveCard(db, planId, card.id as string, target, board.name as string, tz);
}
