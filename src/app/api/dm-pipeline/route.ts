import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { crossOriginBlocked } from "@/lib/security";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { upsertContact, EMAIL_RE } from "@/lib/crm";
import { CARD_PLATFORMS, ensureBoards, boardStages, createBoard, moveCard, createCard, dateIn, platformTag, retagContact, slugTag, shapeStage, type Board } from "@/lib/dmPipeline";
import { zonedToUtcISO } from "@/lib/tz";

export const dynamic = "force-dynamic";

// Outreach pipelines (each account sees only its own boards).
// GET ?board=&tz= → boards, the chosen board, its stages and cards, today (account zone)
// POST (board-level)
//   board-create { name, tag?, template: "dm" | "simple" }
//   board-update { boardId, name?, tag? }            (a new tag renames every stage tag that used the old one)
//   board-delete { boardId }                         (takes its open follow-up tasks with it)
//   stage-add    { boardId, name, followUpDays?, kind?, tag? }
//   stage-update { stageId, name?, followUpDays?, kind?, tag? }
//   stage-move   { stageId, dir: "left" | "right" }
//   stage-delete { stageId }                         (only when no one is in it)
// POST (card-level)
//   add    { boardId, name, handle?, profileUrl?, email?, platform?, contactId?, stageId?, scriptId?, scriptTitle?, notes? }
//   move   { cardId, stageId, sortOrder? }
//   update { cardId, name?, handle?, profileUrl?, email?, platform?, notes?, followUpOn? }
//   delete { cardId }
const PLATFORM_IDS = CARD_PLATFORMS.map((p) => p.id) as string[];
const SOCIAL_COL: Record<string, string> = { IG: "instagram", FB: "facebook", LI: "linkedin" };
const KINDS = ["open", "booked", "closed"];

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const u = new URL(request.url);
  const tz = await resolveUserTimeZone(u.searchParams.get("tz"));
  const boards = await ensureBoards(db, a.planId, u.searchParams.get("purpose") === "affiliate" ? "affiliate" : "outreach");
  const board = boards.find((b) => b.id === u.searchParams.get("board")) ?? boards[0] ?? null;
  if (!board) return NextResponse.json({ boards: [], board: null, stages: [], cards: [], today: dateIn(tz, 0) });
  const [stages, { data: cards }] = await Promise.all([
    boardStages(db, a.planId, board.id),
    db
      .from("dm_cards")
      .select("id, board_id, stage_id, contact_id, name, handle, profile_url, email, platform, script_id, script_title, notes, last_contacted_at, follow_up_on, deal_id, sort_order, stage_changed_at, created_at")
      .eq("master_plan_id", a.planId)
      .eq("board_id", board.id)
      .order("sort_order")
      .order("created_at")
      .limit(2000),
  ]);
  return NextResponse.json({ boards, board, stages, cards: cards ?? [], today: dateIn(tz, 0) });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  // Checked as a read so the public demo can drag its sample cards too: pipeline
  // changes only touch the demo account's own rows (reset hourly) and send nothing.
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const days = (v: unknown) => (v === null || v === "" || v === undefined ? null : Math.max(0, Math.min(365, Math.round(Number(v)))));
  const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
  const purpose = b.purpose === "affiliate" ? "affiliate" : "outreach";
  const boards = await ensureBoards(db, a.planId, purpose);
  const boardOf = (id: unknown): Board | undefined => boards.find((x) => x.id === id);

  // ── Boards ──
  if (b.action === "board-create") {
    const name = str(b.name, 80);
    if (!name) return NextResponse.json({ error: "Name the pipeline." }, { status: 400 });
    const tag = slugTag(str(b.tag, 40) || name.replace(/pipeline/i, ""), 30) || null;
    const board = await createBoard(db, a.planId, name, tag, purpose === "affiliate" ? "affiliate" : b.template === "simple" ? "simple" : "dm", purpose);
    return board ? NextResponse.json({ board }) : NextResponse.json({ error: "Couldn't create it." }, { status: 500 });
  }
  if (b.action === "board-update") {
    const board = boardOf(b.boardId);
    if (!board) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (str(b.name, 80)) patch.name = str(b.name, 80);
    if (b.tag !== undefined) {
      const tag = slugTag(str(b.tag, 40), 30) || null;
      patch.tag = tag;
      // Stage tags that were "<old>-<stage>" follow the new prefix.
      if (board.tag && tag && tag !== board.tag) {
        const stages = await boardStages(db, a.planId, board.id);
        for (const s of stages) if (s.tag?.startsWith(`${board.tag}-`)) await db.from("dm_stages").update({ tag: `${tag}-${s.tag.slice(board.tag.length + 1)}` }).eq("id", s.id);
      }
    }
    await db.from("pipeline_boards").update(patch).eq("id", board.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ boards: await ensureBoards(db, a.planId, purpose), stages: await boardStages(db, a.planId, board.id) });
  }
  if (b.action === "board-delete") {
    const board = boardOf(b.boardId);
    if (!board) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (boards.length <= 1) return NextResponse.json({ error: "Keep at least one pipeline." }, { status: 400 });
    const { data: tasks } = await db.from("dm_cards").select("follow_up_task_id").eq("board_id", board.id).not("follow_up_task_id", "is", null);
    const ids = (tasks ?? []).map((t) => t.follow_up_task_id as number);
    if (ids.length) await db.from("tasks").delete().in("id", ids).eq("master_plan_id", a.planId).neq("status", "done");
    await db.from("pipeline_boards").delete().eq("id", board.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  // ── Stages ──
  if (b.action === "stage-add") {
    const board = boardOf(b.boardId);
    if (!board) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const name = str(b.name, 60);
    if (!name) return NextResponse.json({ error: "Name the stage." }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    const tag = str(b.tag, 60) ? slugTag(str(b.tag, 60), 60) : board.tag ? `${board.tag}-${slugTag(name, 25)}` : null;
    await db.from("dm_stages").insert({
      master_plan_id: a.planId,
      board_id: board.id,
      name,
      tag,
      follow_up_days: days(b.followUpDays),
      kind: KINDS.includes(b.kind) ? b.kind : "open",
      sort_order: stages.length ? Math.max(...stages.map((s) => s.sortOrder)) + 1 : 0,
    });
    return NextResponse.json({ stages: await boardStages(db, a.planId, board.id) });
  }
  if (b.action === "stage-update" || b.action === "stage-move" || b.action === "stage-delete") {
    const { data: row } = await db.from("dm_stages").select("*").eq("id", str(b.stageId, 40)).eq("master_plan_id", a.planId).maybeSingle();
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const stage = shapeStage(row);
    if (b.action === "stage-update") {
      const patch: Record<string, unknown> = {};
      if (str(b.name, 60)) patch.name = str(b.name, 60);
      if (b.followUpDays !== undefined) patch.follow_up_days = days(b.followUpDays);
      if (KINDS.includes(b.kind)) patch.kind = b.kind;
      if (b.tag !== undefined) patch.tag = slugTag(str(b.tag, 60), 60) || null;
      await db.from("dm_stages").update(patch).eq("id", stage.id);
    } else if (b.action === "stage-move") {
      const stages = await boardStages(db, a.planId, stage.boardId);
      const i = stages.findIndex((s) => s.id === stage.id);
      const j = b.dir === "left" ? i - 1 : i + 1;
      if (j >= 0 && j < stages.length) {
        const order = stages.map((s) => s.id);
        [order[i], order[j]] = [order[j], order[i]];
        for (let k = 0; k < order.length; k++) await db.from("dm_stages").update({ sort_order: k }).eq("id", order[k]);
      }
    } else {
      const { count } = await db.from("dm_cards").select("id", { count: "exact", head: true }).eq("stage_id", stage.id);
      if (count) return NextResponse.json({ error: `Move the ${count} ${count === 1 ? "person" : "people"} in “${stage.name}” to another stage first.` }, { status: 400 });
      const { count: left } = await db.from("dm_stages").select("id", { count: "exact", head: true }).eq("board_id", stage.boardId);
      if ((left ?? 0) <= 1) return NextResponse.json({ error: "A pipeline needs at least one stage." }, { status: 400 });
      await db.from("dm_stages").delete().eq("id", stage.id);
    }
    return NextResponse.json({ stages: await boardStages(db, a.planId, stage.boardId) });
  }

  // ── Cards ──
  if (b.action === "add") {
    const board = boardOf(b.boardId) ?? boards[0];
    if (!board) return NextResponse.json({ error: "Create a pipeline first." }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    const name = str(b.name, 120);
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
    if (!name) return NextResponse.json({ error: "Add their name." }, { status: 400 });
    const stage = stages.find((s) => s.id === b.stageId) ?? stages.find((s) => s.key === "sent") ?? stages[0];
    if (!stage) return NextResponse.json({ error: "Add a stage to this pipeline first." }, { status: 400 });
    const email = str(b.email, 200).toLowerCase();
    if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

    // Link to Contacts: the chosen contact, or a new/existing one by email.
    let contactId: string | null = null;
    if (str(b.contactId, 40)) {
      const { data: c } = await db.from("seq_contacts").select("id").eq("id", str(b.contactId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      contactId = (c?.id as string) ?? null;
    } else if (email) {
      const [first, ...rest] = name.split(/\s+/);
      const c = await upsertContact({ masterPlanId: a.planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "pipeline" }, db);
      contactId = c?.id ?? null;
    }
    // Their profile for this platform goes on the contact record, if it's empty there.
    const profile = str(b.profileUrl, 300) || str(b.handle, 120);
    if (contactId && profile && platform && SOCIAL_COL[platform]) {
      const col = SOCIAL_COL[platform];
      await db.from("seq_contacts").update({ [col]: profile }).eq("id", contactId).eq("master_plan_id", a.planId).is(col, null);
    }
    if (contactId) {
      const { data: dup } = await db.from("dm_cards").select("id").eq("board_id", board.id).eq("contact_id", contactId).maybeSingle();
      if (dup) return NextResponse.json({ error: `They're already in ${board.name}.` }, { status: 409 });
    }
    let email2 = email || null;
    if (contactId && !email2) {
      const { data: c } = await db.from("seq_contacts").select("email").eq("id", contactId).maybeSingle();
      email2 = (c?.email as string) ?? null;
    }
    const r = await createCard(db, a.planId, board, stage, tz, {
      name,
      handle: str(b.handle, 120) || null,
      profileUrl: str(b.profileUrl, 500) || null,
      email: email2,
      platform,
      contactId,
      scriptId: str(b.scriptId, 60) || null,
      scriptTitle: str(b.scriptTitle, 200) || null,
      notes: str(b.notes, 2000) || null,
    });
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ card: r.card });
  }

  const { data: card } = await db.from("dm_cards").select("id, board_id, stage_id, contact_id, follow_up_task_id, platform").eq("id", str(b.cardId, 40)).eq("master_plan_id", a.planId).maybeSingle();
  if (!card) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const board = boardOf(card.board_id);
  if (!board) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (b.action === "move") {
    const stages = await boardStages(db, a.planId, board.id);
    const stage = stages.find((s) => s.id === b.stageId);
    if (!stage) return NextResponse.json({ error: "Unknown stage." }, { status: 400 });
    const saved = await moveCard(db, a.planId, card.id as string, stage, board.name, tz, typeof b.sortOrder === "number" ? b.sortOrder : undefined);
    return saved ? NextResponse.json({ card: saved }) : NextResponse.json({ error: "Couldn't move it." }, { status: 500 });
  }

  if (b.action === "update") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (str(b.name, 120)) patch.name = str(b.name, 120);
    if (b.handle !== undefined) patch.handle = str(b.handle, 120) || null;
    if (b.profileUrl !== undefined) patch.profile_url = str(b.profileUrl, 500) || null;
    if (b.email !== undefined) {
      const e = str(b.email, 200).toLowerCase();
      if (e && !EMAIL_RE.test(e)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
      patch.email = e || null;
    }
    if (b.platform !== undefined) {
      patch.platform = PLATFORM_IDS.includes(b.platform) ? b.platform : null;
      // The contact's "from-..." tag follows the card's platform.
      if (patch.platform !== card.platform) await retagContact(db, a.planId, card.contact_id as string | null, [platformTag(patch.platform as string | null)], [platformTag(card.platform as string | null)]);
    }
    if (b.notes !== undefined) patch.notes = str(b.notes, 2000) || null;
    if (b.followUpOn !== undefined) {
      // A new follow-up date moves its task too (or clears both).
      const day = str(b.followUpOn, 10);
      if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: "Pick a valid date." }, { status: 400 });
      patch.follow_up_on = day || null;
      if (card.follow_up_task_id) {
        if (day) await db.from("tasks").update({ due_at: zonedToUtcISO(day, "23:59", tz), due_has_time: false }).eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId);
        else {
          await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId).neq("status", "done");
          patch.follow_up_task_id = null;
        }
      }
    }
    const { data: saved, error } = await db.from("dm_cards").update(patch).eq("id", card.id).eq("master_plan_id", a.planId).select("*").single();
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json({ card: saved });
  }

  if (b.action === "delete") {
    if (card.follow_up_task_id) await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId).neq("status", "done");
    const { data: st } = await db.from("dm_stages").select("tag").eq("id", card.stage_id).maybeSingle();
    await retagContact(db, a.planId, card.contact_id as string | null, [], [(st?.tag as string) ?? null]);
    await db.from("dm_cards").delete().eq("id", card.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
