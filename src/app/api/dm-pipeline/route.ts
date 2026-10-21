import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { crossOriginBlocked } from "@/lib/security";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { parseList } from "@/lib/dmListParse";
import { CARD_PLATFORMS, ensureBoards, boardStages, createBoard, moveCard, createCard, dateIn, platformTag, retagContact, slugTag, shapeStage, movesForward, markDoNotContact, type Board } from "@/lib/dmPipeline";
import { mapPeople, parseCsv } from "@/lib/dmEmailList";
import { zonedToUtcISO } from "@/lib/tz";
import { isZoomConfigured, masterclassMeetingId, meetingSchedule } from "@/lib/zoom";

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
//   dm-limit { platform, limit }                          (the daily DM limit shown on the pipeline page; default 25 per platform)
//   dm-sent { cardId, scriptId, scriptTitle, stageId? }   (logs the DM on the card and timeline, stamps last contacted, moves the card)

const DEFAULT_DM_LIMIT = 25;
// How many DMs went out on each platform in the last 24 hours, against the client's daily limit for it.
async function dmUsage(db: ReturnType<typeof createServerClient>, planId: string) {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const [{ data: sends }, { data: lims }] = await Promise.all([
    db.from("dm_sends").select("platform, sent_at, kind").eq("master_plan_id", planId).gte("sent_at", since).order("sent_at").limit(5000),
    db.from("dm_platform_limits").select("platform, daily_limit").eq("master_plan_id", planId),
  ]);
  // sent = NEW first-time DMs in the last 24 hours (these count against the daily limit); followUps = follow-up DMs.
  const out: Record<string, { sent: number; limit: number; opensAt: string | null; followUps: number }> = {};
  for (const p of CARD_PLATFORMS) {
    const all = ((sends ?? []) as { platform: string | null; sent_at: string; kind: string | null }[]).filter((x) => x.platform === p.id);
    const mine = all.filter((x) => x.kind !== "follow_up");
    const followUps = all.length - mine.length;
    const lim = (lims ?? []).find((l) => l.platform === p.id)?.daily_limit as number | undefined;
    const limit = typeof lim === "number" ? lim : DEFAULT_DM_LIMIT;
    // When the count is at the limit, the slot that frees up first is the oldest send still inside the 24 hours.
    const opensAt = mine.length >= limit && limit > 0 ? new Date(new Date(mine[mine.length - limit].sent_at).getTime() + 24 * 3600_000).toISOString() : null;
    out[p.id] = { sent: mine.length, limit, opensAt, followUps };
  }
  return out;
}
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
      .select("id, board_id, stage_id, contact_id, name, handle, profile_url, email, platform, script_id, script_title, link_code, notes, qual_priority, qual_fit, qual_level, last_contacted_at, follow_up_on, deal_id, sort_order, stage_changed_at, created_at")
      .eq("master_plan_id", a.planId)
      .eq("board_id", board.id)
      .order("sort_order")
      .order("created_at")
      .limit(2000),
  ]);
  // The MasterClass boards offer the next session that is still more than a day away, for the dates in their DM scripts.
  let nextSession: string | null = null;
  if (/masterclass/i.test(`${board.name} ${board.tag ?? ""}`) && isZoomConfigured()) {
    const sch = await meetingSchedule(masterclassMeetingId()).catch(() => null);
    nextSession = sch?.occurrences.find((o) => new Date(o.start).getTime() > Date.now() + 24 * 3600_000)?.start ?? null;
  }
  // How many DMs each card has had, so the board can show "2 DMs sent" and the window can say New or Follow-up.
  const counts = new Map<string, number>();
  const cardIds = ((cards ?? []) as { id: string }[]).map((c) => c.id);
  if (cardIds.length) {
    const { data: sentRows } = await db.from("dm_sends").select("card_id").eq("master_plan_id", a.planId).eq("board_id", board.id).limit(10000);
    for (const r of (sentRows ?? []) as { card_id: string }[]) counts.set(r.card_id, (counts.get(r.card_id) ?? 0) + 1);
  }
  const withCounts = ((cards ?? []) as { id: string }[]).map((c) => ({ ...c, dm_count: counts.get(c.id) ?? 0 }));
  return NextResponse.json({ boards, board, stages, cards: withCounts, today: dateIn(tz, 0), nextSession, dmUsage: await dmUsage(db, a.planId) });
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
    const board = await createBoard(db, a.planId, name, tag, purpose === "affiliate" ? "affiliate" : b.template === "simple" ? "simple" : b.template === "coldemail" ? "coldemail" : "dm", purpose);
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

  // Paste a list: one person per line (name, then optionally a profile link and a line about them). They land in the
  // pipeline's first stage on the chosen platform. People already on the board (same profile link, or same name on the
  // same platform) are skipped. At most 100 a paste.
  if (b.action === "bulk-add") {
    const board = boardOf(b.boardId) ?? boards[0];
    if (!board) return NextResponse.json({ error: "Create a pipeline first." }, { status: 400 });
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
    const { rows, skipped } = parseList(str(b.text, 60000), 100);
    if (!rows.length) return NextResponse.json({ error: "Paste at least one name, one person per line." }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    const stage = stages.find((s) => s.key === "to_reach") ?? stages[0];
    if (!stage) return NextResponse.json({ error: "Add a stage to this pipeline first." }, { status: 400 });
    const { data: existing } = await db.from("dm_cards").select("name, profile_url, platform").eq("board_id", board.id).limit(10000);
    const norm = (u: string | null | undefined) => (u ?? "").toLowerCase().replace(/^https?:\/\/(www\.|m\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    const seenUrl = new Set<string>();
    const seenName = new Set<string>();
    for (const c of (existing ?? []) as { name: string | null; profile_url: string | null; platform: string | null }[]) {
      if (c.profile_url) seenUrl.add(norm(c.profile_url));
      seenName.add(`${(c.name ?? "").toLowerCase()}|${c.platform ?? ""}`);
    }
    let added = 0;
    const duplicates: string[] = [];
    for (const r of rows) {
      const u = r.profileUrl ? norm(r.profileUrl) : "";
      const nk = `${r.name.toLowerCase()}|${platform ?? ""}`;
      if ((u && seenUrl.has(u)) || seenName.has(nk)) {
        duplicates.push(r.name);
        continue;
      }
      const made = await createCard(db, a.planId, board, stage, tz, { name: r.name, profileUrl: r.profileUrl, platform, notes: r.notes });
      if ("error" in made) continue;
      added++;
      if (u) seenUrl.add(u);
      seenName.add(nk);
    }
    return NextResponse.json({ added, duplicates, skipped, stage: stage.name, boardId: board.id });
  }

  // Upload a spreadsheet (.csv) of people with their email addresses: one card each in the pipeline's first stage, with a personal
  // MasterClass link. Nobody becomes a marketing contact from an upload; a person already in Contacts is linked, and anyone marked
  // Do Not Contact or unsubscribed is left out. At most 2,000 a file.
  if (b.action === "bulk-add-people") {
    const board = boardOf(b.boardId) ?? boards[0];
    if (!board) return NextResponse.json({ error: "Create a pipeline first." }, { status: 400 });
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : "Email";
    const { rows, invalid, unreadable } = mapPeople(parseCsv(typeof b.csv === "string" ? b.csv.slice(0, 4_000_000) : ""), 2000);
    if (unreadable || !rows.length) return NextResponse.json({ error: "No people found. The first row should name the columns, for example First name, Last name, Email.", invalid }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    const stage = stages.find((s) => s.key === "to_reach") ?? stages[0];
    if (!stage) return NextResponse.json({ error: "Add a stage to this pipeline first." }, { status: 400 });
    const norm = (u: string | null | undefined) => (u ?? "").toLowerCase().replace(/^https?:\/\/(www\.|m\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    const { data: existing } = await db.from("dm_cards").select("email, profile_url").eq("board_id", board.id).limit(20000);
    const haveEmail = new Set<string>();
    const haveUrl = new Set<string>();
    for (const c of (existing ?? []) as { email: string | null; profile_url: string | null }[]) {
      if (c.email) haveEmail.add(c.email.toLowerCase());
      if (c.profile_url) haveUrl.add(norm(c.profile_url));
    }
    const contactBy = new Map<string, { id: string; stop: boolean }>();
    const emails = rows.map((r) => r.email).filter(Boolean) as string[];
    for (let i = 0; i < emails.length; i += 200) {
      const { data: cs } = await db.from("seq_contacts").select("id, email, tags, unsubscribed_at").eq("master_plan_id", a.planId).in("email", emails.slice(i, i + 200));
      for (const c of (cs ?? []) as { id: string; email: string; tags: string[] | null; unsubscribed_at: string | null }[]) contactBy.set(c.email.toLowerCase(), { id: c.id, stop: Boolean(c.unsubscribed_at) || (c.tags ?? []).includes("do-not-contact") });
    }
    const now = new Date().toISOString();
    const code = () => Array.from({ length: 7 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
    let duplicates = 0;
    let stopped = 0;
    const toAdd: Record<string, unknown>[] = [];
    const linked: string[] = [];
    for (const r of rows) {
      const u = r.profileUrl ? norm(r.profileUrl) : "";
      if ((r.email && haveEmail.has(r.email)) || (u && haveUrl.has(u))) {
        duplicates++;
        continue;
      }
      const known = r.email ? contactBy.get(r.email) : undefined;
      if (known?.stop) {
        stopped++;
        continue;
      }
      if (r.email) haveEmail.add(r.email);
      if (u) haveUrl.add(u);
      if (known) linked.push(known.id);
      toAdd.push({ master_plan_id: a.planId, board_id: board.id, stage_id: stage.id, contact_id: known?.id ?? null, name: r.name, email: r.email, profile_url: r.profileUrl, platform, notes: r.notes, link_code: code(), stage_changed_at: now });
    }
    let added = 0;
    for (let i = 0; i < toAdd.length; i += 200) {
      let chunk = toAdd.slice(i, i + 200);
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await db.from("dm_cards").insert(chunk);
        if (!error) {
          added += chunk.length;
          break;
        }
        chunk = chunk.map((c) => ({ ...c, link_code: code() }));
      }
    }
    for (const id of Array.from(new Set(linked))) await retagContact(db, a.planId, id, [board.tag, stage.tag, platformTag(platform)], []);
    return NextResponse.json({ added, duplicates, stopped, invalid: invalid.slice(0, 20), invalidCount: invalid.length, stage: stage.name, boardId: board.id });
  }

  // Update from the cold-email tool: paste (or upload) the addresses that were emailed, replied, asked to stop or bounced. Their cards
  // move on every pipeline they are on, forward only; anyone who asked to stop (or bounced) is marked Do Not Contact.
  if (b.action === "email-status") {
    const status = str(b.status, 12);
    const TARGET: Record<string, string> = { emailed1: "sent", emailed2: "followed_up", replied: "conversation", stop: "not_now", bounced: "not_now" };
    if (!TARGET[status]) return NextResponse.json({ error: "Choose what happened to these addresses." }, { status: 400 });
    const found = (str(b.text, 400000).toLowerCase().match(/[^\s,;:"'<>()[\]]+@[^\s,;:"'<>()[\]]+\.[a-z]{2,}/g) ?? []).filter((e) => EMAIL_RE.test(e));
    const list = Array.from(new Set(found)).slice(0, 5000);
    if (!list.length) return NextResponse.json({ error: "No email addresses found. Paste them one per line, or a column from your spreadsheet." }, { status: 400 });
    const stagesByBoard = new Map<string, Awaited<ReturnType<typeof boardStages>>>();
    for (const bd of boards) stagesByBoard.set(bd.id, await boardStages(db, a.planId, bd.id));
    const stageById = new Map<string, { key: string | null; kind: string }>();
    stagesByBoard.forEach((ss) => ss.forEach((st) => stageById.set(st.id, { key: st.key, kind: st.kind })));
    let moved = 0;
    let notFound = 0;
    let alreadyFurther = 0;
    const stopNames = new Map<string, string | null>();
    for (let i = 0; i < list.length; i += 200) {
      const part = list.slice(i, i + 200);
      const { data: cards } = await db.from("dm_cards").select("id, board_id, stage_id, name, email").eq("master_plan_id", a.planId).in("email", part).in("board_id", boards.map((x) => x.id));
      const hit = new Set<string>();
      for (const c of (cards ?? []) as { id: string; board_id: string; stage_id: string; name: string; email: string }[]) {
        hit.add(c.email.toLowerCase());
        const cur = stageById.get(c.stage_id);
        const target = (stagesByBoard.get(c.board_id) ?? []).find((s) => s.key === TARGET[status]);
        if (!target || !cur) continue;
        const isStop = status === "stop" || status === "bounced";
        if (isStop ? cur.kind === "closed" : !movesForward(cur.key, cur.kind, TARGET[status])) {
          alreadyFurther++;
          continue;
        }
        const bd = boards.find((x) => x.id === c.board_id);
        if (await moveCard(db, a.planId, c.id, target, bd?.name ?? "Pipeline", tz)) moved++;
        if (isStop) stopNames.set(c.email.toLowerCase(), c.name);
      }
      list.slice(i, i + 200).forEach((e) => {
        if (!hit.has(e)) {
          notFound++;
          if (status === "stop" || status === "bounced") stopNames.set(e, null);
        }
      });
    }
    // Asked to stop: Do Not Contact even if they were never on a card.
    if (status === "stop") for (const [email, name] of Array.from(stopNames.entries())) await markDoNotContact(db, a.planId, email, name);
    return NextResponse.json({ moved, notFound, alreadyFurther, total: list.length });
  }

  if (b.action === "dm-limit") {
    const pl = str(b.platform, 8);
    if (!PLATFORM_IDS.includes(pl)) return NextResponse.json({ error: "Unknown platform." }, { status: 400 });
    const limit = Math.max(0, Math.min(1000, Math.round(Number(b.limit) || 0)));
    await db.from("dm_platform_limits").upsert({ master_plan_id: a.planId, platform: pl, daily_limit: limit }, { onConflict: "master_plan_id,platform" });
    return NextResponse.json({ dmUsage: await dmUsage(db, a.planId) });
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

  if (b.action === "dm-sent") {
    const sid = str(b.scriptId, 60);
    const title = str(b.scriptTitle, 200);
    const stages = await boardStages(db, a.planId, board.id);
    const target = b.stageId ? stages.find((s) => s.id === b.stageId) : null;
    if (target && target.id !== card.stage_id) await moveCard(db, a.planId, card.id as string, target, board.name, tz);
    const { data: cur } = await db.from("dm_cards").select("notes, contact_id, last_contacted_at").eq("id", card.id).eq("master_plan_id", a.planId).maybeSingle();
    // New (first message to this person) or follow-up (they have been messaged before, even before DMs were logged).
    const { count: priorSends } = await db.from("dm_sends").select("id", { count: "exact", head: true }).eq("master_plan_id", a.planId).eq("card_id", card.id);
    const prior = (priorSends ?? 0) > 0 ? (priorSends as number) : cur?.last_contacted_at ? 1 : 0;
    const dmKind = prior > 0 ? "follow_up" : "new";
    const line = `[${dateIn(tz, 0)}] Sent${card.platform ? ` on ${card.platform}` : ""}${dmKind === "follow_up" ? ` (follow-up ${prior})` : " (new)"}: ${title || "a DM"}`;
    const notes = `${(cur?.notes as string | null) ?? ""}\n\n${line}`.trim().slice(-2000);
    const now = new Date().toISOString();
    const { data: saved, error } = await db
      .from("dm_cards")
      .update({ script_id: sid || null, script_title: title || null, last_contacted_at: now, notes, updated_at: now })
      .eq("id", card.id)
      .eq("master_plan_id", a.planId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    await db.from("dm_sends").insert({ master_plan_id: a.planId, card_id: card.id, board_id: board.id, platform: (card.platform as string | null) ?? null, script_title: title || null, kind: dmKind, followup_n: prior }).then(({ error: e }) => { if (e) console.error("dm-sent log:", e.message); });
    // Every DM sent counts on Sales Activities (this week's tally and goal) and, through it, toward the business health score.
    const day = dateIn(tz, 0);
    const act = `Outreach Pipelines · ${board.name} · card ${card.id}`;
    const actTitle = `${(title || "DM").replace(/^MasterClass DM · /, "").slice(0, 180)}${dmKind === "follow_up" ? " (follow-up)" : ""}`;
    const { data: dupe } = await db.from("sales_activities").select("id").eq("master_plan_id", a.planId).eq("type", "dm").eq("occurred_on", day).eq("title", actTitle).eq("notes", act).limit(1);
    if (!dupe?.length) {
      await db.from("sales_activities").insert({ master_plan_id: a.planId, type: "dm", contact_name: (saved.name as string) ?? "", contact_company: "", title: actTitle, priority: "warm", status: "completed", outcome: "", estimated_value: 0, occurred_on: day, notes: act }).then(({ error: e }) => { if (e) console.error("dm-sent activity:", e.message); });
    }
    if (card.contact_id) await logEvent(a.planId, card.contact_id as string, "manual", `${board.name}: ${line.replace(/^\[[^\]]*\] /, "")}`, { dm_card: card.id }, db as never).catch(() => {});
    return NextResponse.json({ card: saved, dmUsage: await dmUsage(db, a.planId) });
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
    if (b.scriptId !== undefined) {
      // Which DM was sent: a script's id and title (or cleared).
      const sid = str(b.scriptId, 60);
      patch.script_id = sid || null;
      patch.script_title = sid ? str(b.scriptTitle, 200) || null : null;
    }
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
