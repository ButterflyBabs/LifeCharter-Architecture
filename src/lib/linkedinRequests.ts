import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureBoards, boardStages, createCard, moveCard, type DmStage } from "@/lib/dmPipeline";

// LinkedIn connection requests, read from the account's own connected Microsoft 365 inbox. LinkedIn emails every
// request ("<Name> wants to connect"); each one found becomes a card on the first outreach pipeline, in "To reach out",
// with their profile link, ready for the owner to accept on LinkedIn and send a first message. Nothing is sent, and
// nothing on LinkedIn is touched. Only mail from LinkedIn's invitation address is read, and only while the account has
// switched this on (client_master_plans.metadata.linkedinRequestsOn).
const GRAPH = "https://graph.microsoft.com/v1.0";
const SENDER = "invitations@linkedin.com";
type Db = SupabaseClient;

interface GraphMsg {
  id: string;
  subject?: string;
  receivedDateTime?: string;
  bodyPreview?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  body?: { content?: string };
}

export function parseInvite(m: GraphMsg): { name: string; profileUrl: string | null; handle: string | null; preview: string } | null {
  const subject = m.subject || "";
  if (!/connect|network|invit/i.test(subject)) return null;
  let name = (m.from?.emailAddress?.name || "").replace(/\s+via LinkedIn$/i, "").trim();
  if (!name || /linkedin/i.test(name)) {
    const s = subject.match(/^(.+?)\s+(?:wants to connect|would like to connect|invited you|sent you an invitation)/i) || subject.match(/(?:invitation from|from)\s+(.+)$/i);
    name = (s?.[1] || "").trim();
  }
  if (!name || name.length > 80) return null;
  const html = m.body?.content || "";
  const slug = html.match(/linkedin\.com\/(?:comm\/)?in\/([A-Za-z0-9%_-]{2,100})/i)?.[1] ?? null;
  return {
    name,
    profileUrl: slug ? `https://www.linkedin.com/in/${slug}` : null,
    handle: slug ? `in/${decodeURIComponent(slug)}` : null,
    preview: (m.bodyPreview || "").replace(/\s+/g, " ").trim().slice(0, 200),
  };
}

// LinkedIn also emails when someone ACCEPTS a request you sent ("<Name> accepted your invitation"). Those are not new
// requests; they move the person's card out of "Connect request sent: waiting" instead.
export function parseAcceptance(m: GraphMsg): { name: string; slug: string | null } | null {
  const subject = m.subject || "";
  const hit = subject.match(/^(.+?)\s+accepted your (?:invitation|connection|request)/i);
  if (!hit) return null;
  const name = hit[1].trim();
  if (!name || name.length > 80) return null;
  const slug = (m.body?.content || "").match(/linkedin\.com\/(?:comm\/)?in\/([A-Za-z0-9%_-]{2,100})/i)?.[1] ?? null;
  return { name, slug: slug ? decodeURIComponent(slug).toLowerCase() : null };
}

type WaitingCard = { id: string; name: string; profile_url: string | null };
const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();

// The one waiting card an acceptance belongs to: by profile link first, else by exact name when only one card has it.
export function matchWaitingCard(cards: WaitingCard[], who: { name: string; slug: string | null }): WaitingCard | null {
  if (who.slug) {
    const bySlug = cards.find((c) => c.profile_url && decodeURIComponent(c.profile_url).toLowerCase().includes(`/in/${who.slug}`));
    if (bySlug) return bySlug;
  }
  const byName = cards.filter((c) => norm(c.name) === norm(who.name));
  return byName.length === 1 ? byName[0] : null;
}

export type Accepted = { name: string; cardId: string; board: string };

export async function syncLinkedInRequests(db: Db, planId: string, token: string, tz = "America/Denver", sinceDays = 14): Promise<{ added: number; seen: number; accepted: Accepted[] }> {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const url =
    `${GRAPH}/me/messages?$filter=${encodeURIComponent(`receivedDateTime ge ${since} and from/emailAddress/address eq '${SENDER}'`)}` +
    `&$orderby=${encodeURIComponent("receivedDateTime desc")}&$top=40&$select=${encodeURIComponent("id,subject,from,receivedDateTime,bodyPreview,body")}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`graph linkedin ${r.status}`);
  const msgs = (((await r.json()) as { value?: GraphMsg[] }).value ?? []) as GraphMsg[];
  if (!msgs.length) return { added: 0, seen: 0, accepted: [] };

  const boards = await ensureBoards(db as never, planId, "outreach");
  const board = boards[0];
  if (!board) return { added: 0, seen: msgs.length, accepted: [] };
  const stages = await boardStages(db as never, planId, board.id);
  const stage = stages.find((s) => s.key === "to_reach") ?? stages[0];
  if (!stage) return { added: 0, seen: msgs.length, accepted: [] };

  const { data: logged } = await db.from("dm_inbound_log").select("external_id").eq("master_plan_id", planId).eq("source", "linkedin").in("external_id", msgs.map((m) => m.id));
  const done = new Set(((logged ?? []) as { external_id: string }[]).map((x) => x.external_id));
  let added = 0;
  const accepted: Accepted[] = [];
  let waiting: Waiting | null = null;
  for (const m of msgs.reverse()) {
    if (done.has(m.id)) continue;
    const a = parseAcceptance(m);
    if (a) {
      if (!waiting) waiting = await loadWaiting(db, planId, boards);
      const hit = await acceptWaiting(db, planId, tz, waiting, a, (m.receivedDateTime || "").slice(0, 10));
      const cardId = hit ? hit.cardId : null;
      if (hit) accepted.push(hit);
      await db.from("dm_inbound_log").upsert({ master_plan_id: planId, source: "linkedin", external_id: m.id, card_id: cardId, person_name: a.name }, { onConflict: "master_plan_id,source,external_id", ignoreDuplicates: true });
      continue;
    }
    const p = parseInvite(m);
    if (!p) {
      await db.from("dm_inbound_log").upsert({ master_plan_id: planId, source: "linkedin", external_id: m.id }, { onConflict: "master_plan_id,source,external_id", ignoreDuplicates: true });
      continue;
    }
    // Already on a pipeline (same profile link): record the email and move on.
    let existing: string | null = null;
    if (p.profileUrl) {
      const { data: have } = await db.from("dm_cards").select("id").eq("master_plan_id", planId).ilike("profile_url", `%${p.profileUrl.split("/in/")[1]}%`).limit(1);
      existing = (have?.[0]?.id as string | undefined) ?? null;
    }
    let cardId = existing;
    if (!existing) {
      const res = await createCard(db as never, planId, board, stage, tz, {
        name: p.name,
        handle: p.handle,
        profileUrl: p.profileUrl,
        platform: "LI",
        notes: `Connection request received on LinkedIn (${(m.receivedDateTime || "").slice(0, 10)}). Accept it on LinkedIn, then send your first message from this card.${p.preview ? `\n${p.preview}` : ""}`,
      });
      if ("card" in res && res.card) {
        cardId = (res.card as { id: string }).id;
        added++;
        const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
        await db.from("dm_cards").update({ follow_up_on: today }).eq("id", cardId);
      }
    }
    await db.from("dm_inbound_log").upsert({ master_plan_id: planId, source: "linkedin", external_id: m.id, card_id: cardId, person_name: p.name }, { onConflict: "master_plan_id,source,external_id", ignoreDuplicates: true });
  }
  return { added, seen: msgs.length, accepted };
}

type Boards = Awaited<ReturnType<typeof ensureBoards>>;
type WaitInfo = { board: Boards[number]; connected: DmStage | undefined };
export type Waiting = { cards: WaitingCard[]; boardOf: Map<string, WaitInfo> };

// Moves the one waiting card this person belongs to into "Connected: send the invite" (as if the owner had pressed the
// button) and notes it. Returns null when there is no single matching card, so nothing is guessed.
export async function acceptWaiting(db: Db, planId: string, tz: string, waiting: Waiting, who: { name: string; slug: string | null }, day: string): Promise<Accepted | null> {
  const card = matchWaitingCard(waiting.cards, who);
  const info = card ? waiting.boardOf.get(card.id) : undefined;
  if (!card || !info?.connected) return null;
  const moved = await moveCard(db as never, planId, card.id, info.connected, info.board.name, tz);
  if (!moved) return null;
  const { data: cur } = await db.from("dm_cards").select("notes").eq("id", card.id).maybeSingle();
  await db.from("dm_cards").update({ notes: [(cur?.notes as string | null) || "", `Accepted your LinkedIn connection request (${day}). Send the invite from this card.`].filter(Boolean).join("\n") }).eq("id", card.id);
  waiting.cards = waiting.cards.filter((c) => c.id !== card.id);
  return { name: card.name, cardId: card.id, board: info.board.name };
}

// Every LinkedIn card still sitting in "Connect request sent: waiting", across the account's outreach boards.
export async function loadWaiting(db: Db, planId: string, boards?: Boards): Promise<Waiting> {
  boards = boards ?? (await ensureBoards(db as never, planId, "outreach"));
  const boardOf = new Map<string, WaitInfo>();
  const stageIds: string[] = [];
  const stageBoard = new Map<string, WaitInfo>();
  for (const b of boards) {
    const st = await boardStages(db as never, planId, b.id);
    const waitingStage = st.find((x) => x.key === "connect_sent");
    if (!waitingStage) continue;
    stageIds.push(waitingStage.id);
    stageBoard.set(waitingStage.id, { board: b, connected: st.find((x) => x.key === "connected") });
  }
  if (!stageIds.length) return { cards: [], boardOf };
  const { data } = await db.from("dm_cards").select("id, name, profile_url, stage_id").eq("master_plan_id", planId).eq("platform", "LI").in("stage_id", stageIds).limit(2000);
  const cards: WaitingCard[] = [];
  for (const c of (data ?? []) as { id: string; name: string; profile_url: string | null; stage_id: string }[]) {
    cards.push({ id: c.id, name: c.name, profile_url: c.profile_url });
    const info = stageBoard.get(c.stage_id);
    if (info) boardOf.set(c.id, info);
  }
  return { cards, boardOf };
}
