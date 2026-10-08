import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount, type CrmAccount } from "../crm/guard";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { buildAssistantKnowledge } from "@/lib/ai/assistantContext";
import { logEvent } from "@/lib/crm";
import { CARD_PLATFORMS, ensureBoards, boardStages, createCard, dateIn } from "@/lib/dmPipeline";
import { DEFAULT_LEVELS, ICP_COLUMNS, QUALIFIER_OPEN_TO_ALL, audiencePrompt, cleanFit, cleanPriority, icpRow, profilePrompt, shapeIcp, stageKeyFor, type Icp } from "@/lib/qualifier";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Prospect Qualifier and Audience Qualifier (each account sees only its own profiles and scores).
// GET                → Ideal Client Profiles, offers to start one from, outreach boards, recent scores, saved lists
// GET ?card=<id>     → the latest score for one pipeline card
// GET ?audience=<id> → a saved list's rows, best first
// POST
//   icp-save { id?, name, offerId?, whoServe, helpDo, signatureOffer, coreProblem, alreadyHas, missing, redFlags, levels }
//   icp-draft { offerId? }                              (Mariposa drafts the answers from the plans and offers; nothing saved)
//   icp-delete { id }
//   qualify { icpId, profileText, platform?, name?, profileUrl?, warm?, cardId? }   (one AI request; saved; badge on the card)
//   add-to-pipeline { ids: [qualification], boardId, platform? }
//   audience-create { name, icpId, total }
//   audience-score { audienceId, rows: [{ name, url?, code?, facts }] }             (up to 10 rows per request)
//   audience-delete { id } · delete { id }

// A full qualification is a judgement call and writes a DM, so it gets the stronger model (about 1 to 2 cents each);
// drafting a profile and the first pass over a list use the small one.
const MODEL = "gpt-4o-mini";
const PROFILE_MODEL = "gpt-4o";
const PLATFORM_IDS = CARD_PLATFORMS.map((p) => p.id) as string[];
const QUAL_COLUMNS = "id, icp_id, icp_name, kind, audience_id, card_id, name, platform, profile_url, email, fit, level, priority, dm_angle, result, created_at";
const RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, SKIP: 3 };

type Db = ReturnType<typeof createServerClient>;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// Babs only while it is being shaped; QUALIFIER_OPEN_TO_ALL opens it to every account.
async function gate(request?: Request): Promise<CrmAccount | { denied: NextResponse }> {
  const a = await crmAccount(request);
  if ("denied" in a) return a;
  if (!QUALIFIER_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  return a;
}

// Who is already on a pipeline. A person matches a card by profile link, by email, or by exact name (a name
// match is ignored when both have a profile link and the links differ: two people can share a name).
type Person = { name?: string | null; url?: string | null; email?: string | null };
const normUrl = (v: string | null | undefined) => (v ?? "").trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
const normName = (v: string | null | undefined) => (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const normEmail = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
async function pipelineIndex(db: Db, planId: string) {
  const [{ data: cards }, { data: boards }] = await Promise.all([
    db.from("dm_cards").select("board_id, name, email, profile_url").eq("master_plan_id", planId).limit(20000),
    db.from("pipeline_boards").select("id, name").eq("master_plan_id", planId),
  ]);
  type C = { board_id: string; name: string; email: string | null; profile_url: string | null };
  const byUrl = new Map<string, C[]>();
  const byEmail = new Map<string, C[]>();
  const byName = new Map<string, C[]>();
  const put = (m: Map<string, C[]>, k: string, c: C) => { if (k) m.set(k, [...(m.get(k) ?? []), c]); };
  const add = (c: C) => { put(byUrl, normUrl(c.profile_url), c); put(byEmail, normEmail(c.email), c); put(byName, normName(c.name), c); };
  for (const c of (cards ?? []) as C[]) add(c);
  const boardName = new Map((boards ?? []).map((b) => [b.id as string, b.name as string]));
  // The ids of every board this person is already on.
  const boardsOf = (p: Person): string[] => {
    const url = normUrl(p.url);
    const hits = [
      ...(byUrl.get(url) ?? []),
      ...(byEmail.get(normEmail(p.email)) ?? []),
      ...(byName.get(normName(p.name)) ?? []).filter((c) => !url || !normUrl(c.profile_url) || normUrl(c.profile_url) === url),
    ];
    return Array.from(new Set(hits.map((c) => c.board_id)));
  };
  return { boardsOf, add, names: (ids: string[]) => ids.map((id) => ({ id, name: boardName.get(id) ?? "a pipeline" })) };
}

async function loadIcp(db: Db, planId: string, id: string): Promise<Icp | null> {
  if (!id) return null;
  const { data } = await db.from("icp_profiles").select(ICP_COLUMNS).eq("id", id).eq("master_plan_id", planId).maybeSingle();
  return data ? shapeIcp(data) : null;
}

async function askJson(key: string, system: string, user: string, maxTokens: number, model = MODEL): Promise<Record<string, unknown> | null> {
  const openai = new OpenAI({ apiKey: key });
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}");
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const a = await gate();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const u = new URL(request.url);

  const cardId = u.searchParams.get("card");
  if (cardId) {
    const [{ data: q }, { data: icps }] = await Promise.all([
      db.from("icp_qualifications").select(QUAL_COLUMNS).eq("master_plan_id", a.planId).eq("card_id", cardId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("icp_profiles").select("id, name").eq("master_plan_id", a.planId).order("sort_order").order("created_at"),
    ]);
    return NextResponse.json({ qualification: q ?? null, icps: icps ?? [] });
  }

  const audienceId = u.searchParams.get("audience");
  if (audienceId) {
    const { data } = await db.from("icp_qualifications").select(QUAL_COLUMNS).eq("master_plan_id", a.planId).eq("audience_id", audienceId).limit(2000);
    const idx = await pipelineIndex(db, a.planId);
    const rows = (data ?? [])
      .map((r) => ({ ...r, on_boards: idx.names(idx.boardsOf({ name: r.name as string, url: r.profile_url as string | null, email: r.email as string | null })) }))
      .sort((x, y) => (RANK[x.priority as string] ?? 9) - (RANK[y.priority as string] ?? 9));
    return NextResponse.json({ rows });
  }

  const [{ data: icps }, { data: offers }, boards, { data: recent }, { data: audiences }] = await Promise.all([
    db.from("icp_profiles").select(ICP_COLUMNS).eq("master_plan_id", a.planId).order("sort_order").order("created_at"),
    db.from("sales_offers").select("id, name, transformation, ideal_client, not_for, status").eq("master_plan_id", a.planId).neq("status", "retired").order("sort_order"),
    ensureBoards(db, a.planId, "outreach"),
    db.from("icp_qualifications").select(QUAL_COLUMNS).eq("master_plan_id", a.planId).eq("kind", "profile").order("created_at", { ascending: false }).limit(40),
    db.from("icp_audiences").select("id, name, icp_id, total, created_at").eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(50),
  ]);
  return NextResponse.json({
    icps: (icps ?? []).map(shapeIcp),
    offers: (offers ?? []).map((o) => ({ id: o.id, name: o.name, transformation: o.transformation ?? "", idealClient: o.ideal_client ?? "", notFor: o.not_for ?? "" })),
    boards,
    recent: await (async () => {
      if (!recent?.length) return [];
      const idx = await pipelineIndex(db, a.planId);
      return recent.map((r) => ({ ...r, on_boards: idx.names(idx.boardsOf({ name: r.name as string, url: r.profile_url as string | null, email: r.email as string | null })) }));
    })(),
    audiences: audiences ?? [],
    defaultLevels: DEFAULT_LEVELS,
  });
}

export async function POST(request: Request) {
  const a = await gate(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = await request.json().catch(() => ({}));

  // ── Ideal Client Profiles ──
  if (b.action === "icp-save") {
    const v = icpRow(b);
    if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
    let offerId: string | null = null;
    if (str(b.offerId, 40)) {
      const { data: o } = await db.from("sales_offers").select("id").eq("id", str(b.offerId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      offerId = (o?.id as string) ?? null;
    }
    const row = { ...v.row, offer_id: offerId };
    if (str(b.id, 40)) {
      const { data, error } = await db.from("icp_profiles").update(row).eq("id", str(b.id, 40)).eq("master_plan_id", a.planId).select(ICP_COLUMNS).single();
      if (error || !data) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
      return NextResponse.json({ icp: shapeIcp(data) });
    }
    const { count } = await db.from("icp_profiles").select("id", { count: "exact", head: true }).eq("master_plan_id", a.planId);
    if ((count ?? 0) >= 30) return NextResponse.json({ error: "That's the most Ideal Client Profiles one account can hold." }, { status: 400 });
    const { data, error } = await db.from("icp_profiles").insert({ ...row, master_plan_id: a.planId, sort_order: count ?? 0 }).select(ICP_COLUMNS).single();
    if (error || !data) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json({ icp: shapeIcp(data) });
  }
  if (b.action === "icp-delete") {
    await db.from("icp_profiles").delete().eq("id", str(b.id, 40)).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "delete") {
    await db.from("icp_qualifications").delete().eq("id", str(b.id, 40)).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "audience-delete") {
    await db.from("icp_audiences").delete().eq("id", str(b.id, 40)).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "audience-create") {
    const icp = await loadIcp(db, a.planId, str(b.icpId, 40));
    if (!icp) return NextResponse.json({ error: "Choose an Ideal Client Profile first." }, { status: 400 });
    const { data, error } = await db
      .from("icp_audiences")
      .insert({ master_plan_id: a.planId, icp_id: icp.id, name: str(b.name, 120) || "Untitled list", total: Math.max(0, Math.min(2000, Math.round(Number(b.total) || 0))) })
      .select("id, name, icp_id, total, created_at")
      .single();
    if (error || !data) return NextResponse.json({ error: "Couldn't start the list." }, { status: 500 });
    return NextResponse.json({ audience: data });
  }

  // ── Add scored people to an outreach pipeline ──
  if (b.action === "add-to-pipeline") {
    const ids = (Array.isArray(b.ids) ? b.ids : []).map((x: unknown) => str(x, 40)).filter(Boolean).slice(0, 200);
    if (!ids.length) return NextResponse.json({ error: "Choose at least one person." }, { status: 400 });
    const boards = await ensureBoards(db, a.planId, "outreach");
    const board = boards.find((x) => x.id === b.boardId);
    if (!board) return NextResponse.json({ error: "Choose a pipeline." }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    if (!stages.length) return NextResponse.json({ error: "Add a stage to that pipeline first." }, { status: 400 });
    const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
    const { data: quals } = await db.from("icp_qualifications").select("id, name, platform, profile_url, email, link_code, fit, level, priority, card_id, result").eq("master_plan_id", a.planId).in("id", ids);
    // Never twice on the same pipeline; being on another pipeline is allowed.
    const idx = await pipelineIndex(db, a.planId);
    let added = 0;
    const already: string[] = [];
    let failed = 0;
    for (const q of quals ?? []) {
      const url = ((q.profile_url as string) || "").trim();
      const email = normEmail(q.email as string | null);
      if (!q.name) { failed++; continue; }
      if (idx.boardsOf({ name: q.name as string, url, email }).includes(board.id)) { already.push(q.name as string); continue; }
      const key = stageKeyFor(q.priority as string);
      const stage = stages.find((s) => s.key === key) ?? stages.find((s) => s.kind === "open") ?? stages[0];
      const platform = PLATFORM_IDS.includes(q.platform as string) ? (q.platform as string) : PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
      const why = str((q.result as { fitReason?: string; reason?: string })?.fitReason, 300) || str((q.result as { reason?: string })?.reason, 300);
      const notes = `[${dateIn(tz, 0)}] Qualifier: ${q.priority} priority · Fit ${q.fit}${q.level ? ` · ${q.level}` : ""}${why ? `\n${why}` : ""}`;
      const r = await createCard(db, a.planId, board, stage, tz, { name: q.name as string, profileUrl: url || null, email: email || null, platform, notes });
      if ("error" in r || !r.card) { failed++; continue; }
      const patch: Record<string, unknown> = { qual_priority: q.priority, qual_fit: q.fit, qual_level: q.level, qual_id: q.id };
      // A personal registration link that came with the list stays with the person.
      if (q.link_code) {
        const { data: taken } = await db.from("dm_cards").select("id").eq("link_code", q.link_code).maybeSingle();
        if (!taken) patch.link_code = q.link_code;
      }
      await db.from("dm_cards").update(patch).eq("id", r.card.id).eq("master_plan_id", a.planId);
      await db.from("icp_qualifications").update({ card_id: r.card.id }).eq("id", q.id).eq("master_plan_id", a.planId);
      idx.add({ board_id: board.id, name: q.name as string, email: email || null, profile_url: url || null });
      added++;
    }
    return NextResponse.json({ added, skipped: already.length, already: already.slice(0, 12), failed, board: board.name });
  }

  // Which people on a list are already on a pipeline (asked before scoring, so no score is spent on them).
  if (b.action === "list-check") {
    const idx = await pipelineIndex(db, a.planId);
    const people = (Array.isArray(b.people) ? b.people : []).slice(0, 2000) as Person[];
    const on = people.map((p) => idx.names(idx.boardsOf({ name: str(p.name, 120), url: str(p.url, 500), email: str(p.email, 200) })).map((x) => x.name));
    return NextResponse.json({ on });
  }

  // ── Everything below spends an AI request ──
  const { key, instructions } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true, error: "Connect your AI key under AI Assistant first." }, { status: 400 });
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;

  if (b.action === "icp-draft") {
    let about = "";
    try {
      about = (await buildAssistantKnowledge(a.planId, "America/Denver", { mailOwnerId: null })).text;
    } catch {
      /* draft from the offer alone */
    }
    let offer = "";
    if (str(b.offerId, 40)) {
      const { data: o } = await db.from("sales_offers").select("name, transformation, ideal_client, not_for, deliverables").eq("id", str(b.offerId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      if (o) offer = `THE OFFER THIS PROFILE IS FOR\nName: ${o.name}\nTransformation: ${o.transformation ?? ""}\nIdeal client: ${o.ideal_client ?? ""}\nNot for: ${o.not_for ?? ""}\nIncludes: ${((o.deliverables as string[] | null) ?? []).join("; ")}`;
    }
    if (!about && !offer) return NextResponse.json({ error: "There isn't enough in your plans or offers yet to draft from. Fill it in by hand." }, { status: 400 });
    const sys =
      `You help one small-business owner write their Ideal Client Profile for prospect qualification. Use ONLY what is below about their business; where it doesn't say, leave that field empty rather than inventing. Write in first person, plain and specific.\n` +
      `Return STRICT JSON: {"whoServe":"","helpDo":"","signatureOffer":"","coreProblem":"","alreadyHas":"one per line, up to 5","missing":"one per line, up to 5","redFlags":"one per line, up to 5"}.`;
    try {
      const out = await askJson(key, sys, `${offer}\n\nWHAT IS KNOWN ABOUT THIS BUSINESS\n${about.slice(0, 14000)}`, 900);
      if (!out) return NextResponse.json({ error: "Couldn't draft that. Try again." }, { status: 502 });
      const f = (k: string) => str(out[k], 2000);
      return NextResponse.json({ draft: { whoServe: f("whoServe"), helpDo: f("helpDo"), signatureOffer: f("signatureOffer"), coreProblem: f("coreProblem"), alreadyHas: f("alreadyHas"), missing: f("missing"), redFlags: f("redFlags") } });
    } catch (e) {
      console.error("qualifier icp-draft:", e);
      return NextResponse.json({ error: "Couldn't reach the AI just now. Try again." }, { status: 502 });
    }
  }

  if (b.action === "qualify") {
    const icp = await loadIcp(db, a.planId, str(b.icpId, 40));
    if (!icp) return NextResponse.json({ error: "Choose an Ideal Client Profile first." }, { status: 400 });
    const text = str(b.profileText, 24000);
    if (text.length < 80) return NextResponse.json({ error: "Paste more of their profile: headline, About, and a few recent posts give the best read." }, { status: 400 });
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
    let card: { id: string; name: string; contact_id: string | null; board_id: string; notes: string | null; platform: string | null; profile_url: string | null } | null = null;
    if (str(b.cardId, 40)) {
      const { data } = await db.from("dm_cards").select("id, name, contact_id, board_id, notes, platform, profile_url").eq("id", str(b.cardId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      card = data ?? null;
      if (!card) return NextResponse.json({ error: "That card wasn't found." }, { status: 404 });
    }
    let out: Record<string, unknown> | null;
    try {
      out = await askJson(key, profilePrompt(icp, platform ?? card?.platform ?? null, { warm: str(b.warm, 400), voice: instructions.slice(0, 600) }), `${card?.name || str(b.name, 120) ? `Name on my list: ${card?.name || str(b.name, 120)}\n` : ""}PROFILE TEXT:\n${text}`, 1500, PROFILE_MODEL);
    } catch (e) {
      console.error("qualifier qualify:", e);
      return NextResponse.json({ error: "Couldn't reach the AI just now. Try again." }, { status: 502 });
    }
    if (!out || !out.fit) return NextResponse.json({ error: "Couldn't score that. Try again." }, { status: 502 });
    const fit = cleanFit(out.fit);
    const priority = fit === "NO" ? "SKIP" : cleanPriority(out.priority);
    const level = str(out.level, 60);
    const dmAngle = fit === "NO" ? "" : str(out.dmAngle, 1500).replace(/\s*—\s*/g, ", ");
    const name = card?.name || str(b.name, 120) || str(out.name, 120) || "Unnamed prospect";
    const { data: saved, error } = await db
      .from("icp_qualifications")
      .insert({
        master_plan_id: a.planId,
        icp_id: icp.id,
        icp_name: icp.name,
        kind: "profile",
        card_id: card?.id ?? null,
        name,
        platform: platform ?? card?.platform ?? null,
        profile_url: str(b.profileUrl, 500) || card?.profile_url || null,
        source_text: text,
        fit,
        level,
        priority,
        dm_angle: dmAngle,
        result: { ...out, fit, priority, dmAngle },
      })
      .select(QUAL_COLUMNS)
      .single();
    if (error || !saved) return NextResponse.json({ error: "Scored, but couldn't save it. Try again." }, { status: 500 });
    let cardOut: Record<string, unknown> | null = null;
    if (card) {
      const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
      const line = `[${dateIn(tz, 0)}] Qualified (${icp.name}): ${priority} priority · Fit ${fit}${level ? ` · ${level}` : ""}`;
      const notes = `${card.notes ?? ""}\n\n${line}`.trim().slice(-2000);
      const { data: c } = await db.from("dm_cards").update({ qual_priority: priority, qual_fit: fit, qual_level: level, qual_id: saved.id, notes, updated_at: new Date().toISOString() }).eq("id", card.id).eq("master_plan_id", a.planId).select("*").single();
      cardOut = c ?? null;
      if (card.contact_id) await logEvent(a.planId, card.contact_id, "manual", line.replace(/^\[[^\]]*\] /, ""), { dm_card: card.id, qualification: saved.id }, db as never).catch(() => {});
    }
    return NextResponse.json({ qualification: saved, card: cardOut });
  }

  if (b.action === "audience-score") {
    const { data: aud } = await db.from("icp_audiences").select("id, icp_id").eq("id", str(b.audienceId, 40)).eq("master_plan_id", a.planId).maybeSingle();
    if (!aud) return NextResponse.json({ error: "That list wasn't found." }, { status: 404 });
    const icp = await loadIcp(db, a.planId, (aud.icp_id as string) ?? "");
    if (!icp) return NextResponse.json({ error: "The Ideal Client Profile for this list was deleted." }, { status: 400 });
    const rows = (Array.isArray(b.rows) ? b.rows : []).slice(0, 10).map((r: Record<string, unknown>) => ({ name: str(r.name, 120), url: str(r.url, 500), code: str(r.code, 40), email: str(r.email, 200).toLowerCase(), facts: str(r.facts, 1200) })).filter((r: { name: string }) => r.name);
    if (!rows.length) return NextResponse.json({ rows: [] });
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
    let out: Record<string, unknown> | null;
    try {
      out = await askJson(key, audiencePrompt(icp), rows.map((r: { name: string; facts: string }, i: number) => `ROW ${i + 1}\nName: ${r.name}\n${r.facts}`).join("\n\n"), 1400);
    } catch (e) {
      console.error("qualifier audience-score:", e);
      return NextResponse.json({ error: "Couldn't reach the AI just now." }, { status: 502 });
    }
    const scored = Array.isArray(out?.rows) ? (out!.rows as Record<string, unknown>[]) : [];
    const insert = rows.map((r: { name: string; url: string; code: string; email: string; facts: string }, i: number) => {
      const sc = scored.find((x) => Number(x.i) === i + 1) ?? scored[i] ?? {};
      const fit = cleanFit(sc.fit);
      const priority = fit === "NO" ? "SKIP" : cleanPriority(sc.priority);
      return {
        master_plan_id: a.planId,
        icp_id: icp.id,
        icp_name: icp.name,
        kind: "audience",
        audience_id: aud.id,
        name: r.name,
        platform,
        profile_url: r.url || null,
        link_code: r.code || null,
        email: r.email || null,
        source_text: r.facts,
        fit,
        level: str(sc.likelyLevel, 60),
        priority,
        result: { reason: str(sc.reason, 400), likelyLevel: str(sc.likelyLevel, 60), facts: r.facts },
      };
    });
    const { data: saved, error } = await db.from("icp_qualifications").insert(insert).select(QUAL_COLUMNS);
    if (error) return NextResponse.json({ error: "Scored, but couldn't save those rows." }, { status: 500 });
    return NextResponse.json({ rows: saved ?? [] });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
