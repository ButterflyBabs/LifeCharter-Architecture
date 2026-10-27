import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect, sessionUser, viewedMember } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { housePlanId } from "@/lib/housePlan";
import { seriesFor, BOARD_PREFIX, CARD_COLS, C2C_TIERS, TIER_LABEL, addProspect, importProspects, c2cStages, cardFields, closeProspect, consultantBoards, consultantKey, discoveryTag, followupTag, leadTag, moveProspect, shapeCard } from "@/lib/c2c";
import { setBookingOutcome } from "@/lib/booking/engine";

export const dynamic = "force-dynamic";

// A Call to Close consultant's own pipeline (Mide first). A consultant only ever reaches the board(s) that carry THEIR
// sign-in email (pipeline_boards.owner_email); nothing here reads another board, a contact or any other account data.
// Babs can look at a consultant's view with ?as=<their email>.
//   GET  → { consultant, board, stages, cards, tags, tiers }
//   POST { action: "add" | "update" | "move" | "close" | "outcome", ... }   (no delete: a consultant adds and updates)
const TZ = "America/Denver";

async function mine(request: Request) {
  const user = await sessionUser();
  if (!user?.email) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) } as const;
  let email = user.email;
  const as = new URL(request.url).searchParams.get("as");
  const viewed = await viewedMember();
  if (viewed) email = viewed.email;
  else if (as && (await isAlignmentArchitect())) email = as;
  const db = createServerClient();
  const planId = await housePlanId(db);
  if (!planId) return { error: NextResponse.json({ error: "No house account." }, { status: 500 }) } as const;
  const board = (await consultantBoards(db, planId, email))[0];
  if (!board) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  return { db, planId, board, asEmail: email } as const;
}

export async function GET(request: Request) {
  const r = await mine(request);
  if ("error" in r) return r.error;
  const { db, planId, board, asEmail } = r;
  const [stages, { data: cards }] = await Promise.all([
    c2cStages(db, planId, board.id),
    db.from("dm_cards").select(CARD_COLS).eq("master_plan_id", planId).eq("board_id", board.id).order("sort_order").order("created_at", { ascending: false }).limit(1000),
  ]);
  const key = consultantKey(board.name);
  const series = await seriesFor(db, planId, key, (cards ?? []) as { contact_id?: unknown }[]);
  // Their own affiliate code (every enrollment through their pipeline is credited to it) and their shareable link.
  const { data: aff } = await db.from("affiliates").select("code").eq("master_plan_id", planId).ilike("email", asEmail).eq("status", "active").maybeSingle();
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  return NextResponse.json({
    affiliateCode: (aff?.code as string) ?? null,
    shareLink: aff?.code ? `${app}/r/${aff.code}` : null,
    bookingLink: `${app}/book/discovery-call-${key}`,
    consultant: board.name.replace(BOARD_PREFIX, ""),
    board: { id: board.id, name: board.name },
    stages: stages.map((s) => ({ id: s.id, key: s.key, name: s.name, kind: s.kind })),
    cards: ((cards ?? []) as Record<string, unknown>[]).map((c) => ({ ...shapeCard(c), series: series.get(c.contact_id as string) ?? null })),
    tags: { lead: leadTag(key, TZ), discovery: discoveryTag(key), followup: followupTag(key) },
    tiers: C2C_TIERS.map((t) => ({ id: t, label: TIER_LABEL[t] })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const r = await mine(request);
  if ("error" in r) return r.error;
  const { db, planId, board } = r;
  const b = await request.json().catch(() => ({}));
  const cardId = typeof b.cardId === "string" && /^[0-9a-f-]{36}$/i.test(b.cardId) ? b.cardId : "";
  // Every card action is limited to a card on THIS consultant's board.
  const own = async () => (cardId ? (await db.from("dm_cards").select("id, contact_id, discovery_booking_id").eq("id", cardId).eq("master_plan_id", planId).eq("board_id", board.id).maybeSingle()).data : null);

  switch (b.action) {
    case "add": {
      const res = await addProspect(db, planId, board, TZ, b);
      return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ card: res.card });
    }
    case "import": {
      // Their leads, loaded from a spreadsheet: cards on their own board only. No CRM contact is made until a call is booked.
      const rows = Array.isArray(b.rows) ? (b.rows as Record<string, unknown>[]).slice(0, 500) : [];
      if (!rows.length) return NextResponse.json({ error: "No rows to add." }, { status: 400 });
      const res = await importProspects(db, planId, board, TZ, rows);
      return NextResponse.json(res);
    }
    case "update": {
      const card = await own();
      if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });
      const { patch, error } = cardFields(b);
      if (error) return NextResponse.json({ error }, { status: 400 });
      const { data } = await db.from("dm_cards").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", cardId).eq("board_id", board.id).select(CARD_COLS).single();
      return NextResponse.json({ card: shapeCard(data as Record<string, unknown>) });
    }
    case "move": {
      if (!(await own()) || typeof b.stageId !== "string") return NextResponse.json({ error: "not found" }, { status: 404 });
      const card = await moveProspect(db, planId, board, cardId, b.stageId, TZ);
      return card ? NextResponse.json({ card }) : NextResponse.json({ error: "Couldn't move that card." }, { status: 400 });
    }
    case "close": {
      if (!(await own())) return NextResponse.json({ error: "not found" }, { status: 404 });
      const res = await closeProspect(db, planId, board, cardId, String(b.tier || ""), TZ);
      return "error" in res ? NextResponse.json({ error: res.error }, { status: 400 }) : NextResponse.json({ card: res });
    }
    case "outcome": {
      // Attended or no-show: a booked call updates the booking and the CRM; a card with no booking is just marked.
      const card = await own();
      if (!card || (b.outcome !== "attended" && b.outcome !== "no_show")) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (card.discovery_booking_id) await setBookingOutcome(db, planId, card.discovery_booking_id as string, b.outcome === "attended" ? "completed" : "no_show");
      else await db.from("dm_cards").update({ discovery_outcome: b.outcome, updated_at: new Date().toISOString() }).eq("id", cardId).eq("board_id", board.id);
      const { data } = await db.from("dm_cards").select(CARD_COLS).eq("id", cardId).single();
      return NextResponse.json({ card: shapeCard(data as Record<string, unknown>) });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
