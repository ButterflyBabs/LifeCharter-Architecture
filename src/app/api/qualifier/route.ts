import { NextResponse } from "next/server";

import { aiClient } from "@/lib/ai/client";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount, type CrmAccount } from "../crm/guard";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { buildAssistantKnowledge } from "@/lib/ai/assistantContext";
import { logEvent } from "@/lib/crm";
import { normProfileUrl } from "@/lib/dmCardDuplicate";
import { CARD_PLATFORMS, ensureBoards, boardStages, createCard, moveCard, removeCardFromPipeline, dateIn } from "@/lib/dmPipeline";
import { DEFAULT_LEVELS, ICP_COLUMNS, QUALIFIER_OPEN_TO_ALL, audiencePrompt, cleanFit, cleanPriority, icpRow, PRIORITIES, profilePrompt, shapeIcp, stageKeyFor, type Icp } from "@/lib/qualifier";

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
//   qualify { icpId, profileText, platform?, name?, profileUrl?, warm?, context?, extraText?, cardId?, qualId? }   (one AI request; saved; badge on the card)
//     context = what the person knows that is not on the profile (a referral, a stated need); extraText = more profile pages;
//     qualId = score the same person again from the saved profile text, in place (profileText then optional)
//   override { qualId, priority }                       (the person's own call: no AI request; the card's badge follows)
//   add-to-pipeline { ids: [qualification], boardId, stageId?, platform? }   (stageId = start in that stage instead of the one the priority picks;
//                                                                              someone already on that pipeline is MOVED to the stageId step, and left alone when none is chosen)
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
const normUrl = normProfileUrl;
const normName = (v: string | null | undefined) => (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const normEmail = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
async function pipelineIndex(db: Db, planId: string) {
  // Every card, page by page: the database returns at most 1,000 rows per request.
  const cards: { id?: string; stage_id?: string; board_id: string; name: string; email: string | null; profile_url: string | null }[] = [];
  for (let from = 0; from < 40000; from += 1000) {
    const { data } = await db.from("dm_cards").select("id, stage_id, board_id, name, email, profile_url").eq("master_plan_id", planId).order("id").range(from, from + 999);
    cards.push(...((data ?? []) as typeof cards));
    if ((data ?? []).length < 1000) break;
  }
  const { data: boards } = await db.from("pipeline_boards").select("id, name").eq("master_plan_id", planId);
  type C = { id?: string; stage_id?: string; board_id: string; name: string; email: string | null; profile_url: string | null };
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
  // Their card on one pipeline (the first, if somehow there are two), so it can be moved to another step.
  const cardOn = (p: Person, boardId: string): C | null => {
    const url = normUrl(p.url);
    const hits = [
      ...(byUrl.get(url) ?? []),
      ...(byEmail.get(normEmail(p.email)) ?? []),
      ...(byName.get(normName(p.name)) ?? []).filter((c) => !url || !normUrl(c.profile_url) || normUrl(c.profile_url) === url),
    ];
    return hits.find((c) => c.board_id === boardId && c.id) ?? null;
  };
  return { boardsOf, cardOn, add, names: (ids: string[]) => ids.map((id) => ({ id, name: boardName.get(id) ?? "a pipeline" })) };
}

async function loadIcp(db: Db, planId: string, id: string): Promise<Icp | null> {
  if (!id) return null;
  const { data } = await db.from("icp_profiles").select(ICP_COLUMNS).eq("id", id).eq("master_plan_id", planId).maybeSingle();
  return data ? shapeIcp(data) : null;
}

async function askJson(key: string, system: string, user: string, maxTokens: number, model = MODEL): Promise<Record<string, unknown> | null> {
  const openai = aiClient(key);
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

  // Find anyone: every scored person, every pipeline card and every contact, scored or not, 25 to a screen.
  const findQ = u.searchParams.get("find");
  if (findQ !== null) {
    const q = findQ.trim().replace(/[%,()*\\]/g, "").slice(0, 80);
    const offset = Math.max(0, Math.min(50000, parseInt(u.searchParams.get("offset") || "0", 10) || 0));
    const CAP = 1000;
    // A date range lists everyone who was scored in it (every run, newest first), straight from the database so nothing is cut off.
    const fromAt = Date.parse(u.searchParams.get("from") || "");
    const toAt = Date.parse(u.searchParams.get("to") || "");
    if (Number.isFinite(fromAt) || Number.isFinite(toAt)) {
      let rq = db.from("icp_qualifications").select(`${QUAL_COLUMNS}, source_text`, { count: "exact" }).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).order("id").range(offset, offset + 24);
      if (Number.isFinite(fromAt)) rq = rq.gte("created_at", new Date(fromAt).toISOString());
      if (Number.isFinite(toAt)) rq = rq.lt("created_at", new Date(toAt).toISOString());
      if (q) rq = rq.or(`name.ilike.%${q}%,email.ilike.%${q}%,profile_url.ilike.%${q}%`);
      const { data: ran, count } = await rq;
      const audIds = Array.from(new Set((ran ?? []).map((r) => r.audience_id as string | null).filter((x): x is string => !!x)));
      const { data: auds } = audIds.length ? await db.from("icp_audiences").select("id, name").eq("master_plan_id", a.planId).in("id", audIds) : { data: [] as { id: string; name: string }[] };
      const audName = new Map((auds ?? []).map((x) => [x.id as string, x.name as string]));
      const idx2 = await pipelineIndex(db, a.planId);
      const out = (ran ?? []).map((r) => ({
        key: r.id as string, name: r.name as string, email: (r.email as string | null) ?? "", profile_url: (r.profile_url as string | null) ?? "", platform: (r.platform as string | null) ?? null,
        qualId: r.id as string, priority: r.priority as string, fit: r.fit as string, contactId: null, stop: false, facts: str(r.source_text, 1200),
        scored_at: r.created_at as string, icp_name: (r.icp_name as string | null) ?? "", list_name: r.audience_id ? audName.get(r.audience_id as string) ?? "" : "One profile",
        on_boards: idx2.names(idx2.boardsOf({ name: r.name as string, url: r.profile_url as string | null, email: r.email as string | null })),
      }));
      const total = count ?? out.length;
      return NextResponse.json({ rows: out, total, hasMore: offset + 25 < total, capped: false });
    }
    const [first, ...rest] = q.split(/\s+/);
    const last = rest.join(" ");
    const both = last ? `,and(first_name.ilike.%${first}%,last_name.ilike.%${last}%)` : "";
    let qq = db.from("icp_qualifications").select(`${QUAL_COLUMNS}, source_text`).eq("master_plan_id", a.planId).eq("kind", "profile").order("created_at", { ascending: false }).limit(CAP);
    let aq = db.from("icp_qualifications").select(`${QUAL_COLUMNS}, source_text`).eq("master_plan_id", a.planId).eq("kind", "audience").order("created_at", { ascending: false }).limit(CAP);
    let cq = db.from("dm_cards").select("id, name, email, profile_url, platform, contact_id, qual_priority, qual_fit").eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(CAP);
    let kq = db.from("seq_contacts").select("id, email, first_name, last_name, company, tags, unsubscribed_at").eq("master_plan_id", a.planId).order("last_activity_at", { ascending: false, nullsFirst: false }).limit(CAP);
    if (q) {
      const like = `name.ilike.%${q}%,email.ilike.%${q}%,profile_url.ilike.%${q}%`;
      qq = qq.or(like); aq = aq.or(like); cq = cq.or(like);
      kq = kq.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%${both}`);
    }
    const [{ data: quals1 }, { data: quals2 }, { data: cards }, { data: contacts }] = await Promise.all([qq, aq, cq, kq]);
    type Found = { key: string; name: string; email: string; profile_url: string; platform: string | null; qualId: string | null; priority: string | null; fit: string | null; contactId: string | null; stop: boolean; facts: string; scored_at: string | null; icp_name: string; audId: string | null };
    const byKey = new Map<string, Found>();
    const keyOf = (p: Person) => normEmail(p.email) || normUrl(p.url) || normName(p.name);
    const put = (p: Person, extra: Partial<Found>) => {
      const k = keyOf(p);
      if (!k) return;
      const cur = byKey.get(k) ?? { key: k, name: (p.name ?? "").trim(), email: (p.email ?? "").trim(), profile_url: (p.url ?? "").trim(), platform: null, qualId: null, priority: null, fit: null, contactId: null, stop: false, facts: "", scored_at: null, icp_name: "", audId: null };
      // The first source to fill a field keeps it, so a saved score is never replaced by a card's copy of it.
      // A person scored more than once shows their latest score.
      if (extra.qualId && extra.scored_at && (!cur.scored_at || extra.scored_at > cur.scored_at)) {
        cur.qualId = extra.qualId; cur.scored_at = extra.scored_at; cur.icp_name = extra.icp_name ?? ""; cur.audId = extra.audId ?? null;
        if (extra.priority) cur.priority = extra.priority;
        if (extra.fit) cur.fit = extra.fit;
        if (extra.facts) cur.facts = extra.facts;
      }
      if (!cur.priority && extra.priority) cur.priority = extra.priority;
      if (!cur.fit && extra.fit) cur.fit = extra.fit;
      if (!cur.platform && extra.platform) cur.platform = extra.platform;
      if (!cur.contactId && extra.contactId) cur.contactId = extra.contactId;
      if (extra.stop) cur.stop = true;
      // What is known about them, so they can be scored again against another profile.
      if (!cur.facts && extra.facts) cur.facts = extra.facts;
      if (!cur.name && p.name) cur.name = p.name.trim();
      if (!cur.email && p.email) cur.email = p.email.trim();
      if (!cur.profile_url && p.url) cur.profile_url = p.url.trim();
      byKey.set(k, cur);
    };
    for (const r of [...(quals1 ?? []), ...(quals2 ?? [])] as Record<string, unknown>[]) put({ name: r.name as string, url: r.profile_url as string | null, email: r.email as string | null }, { qualId: r.id as string, priority: r.priority as string, fit: r.fit as string, platform: (r.platform as string | null) ?? null, facts: str(r.source_text, 1200), scored_at: r.created_at as string, icp_name: (r.icp_name as string | null) ?? "", audId: (r.audience_id as string | null) ?? null });
    for (const r of (cards ?? []) as Record<string, unknown>[]) put({ name: r.name as string, url: r.profile_url as string | null, email: r.email as string | null }, { priority: (r.qual_priority as string | null) ?? null, fit: (r.qual_fit as string | null) ?? null, platform: (r.platform as string | null) ?? null, contactId: (r.contact_id as string | null) ?? null });
    for (const r of (contacts ?? []) as Record<string, unknown>[]) put({ name: [r.first_name, r.last_name].filter(Boolean).join(" ") || (r.email as string), email: r.email as string }, { contactId: r.id as string, stop: Boolean(r.unsubscribed_at), facts: [r.company ? `Company: ${r.company}` : "", Array.isArray(r.tags) && r.tags.length ? `Tags: ${(r.tags as string[]).slice(0, 12).join(", ")}` : ""].filter(Boolean).join("\n") });
    const all = Array.from(byKey.values()).sort((x, y) => x.name.toLowerCase().localeCompare(y.name.toLowerCase()));
    const PAGE = 25;
    const page = all.slice(offset, offset + PAGE);
    const idx = await pipelineIndex(db, a.planId);
    const pageAud = Array.from(new Set(page.map((r) => r.audId).filter((x): x is string => !!x)));
    const { data: pageAuds } = pageAud.length ? await db.from("icp_audiences").select("id, name").eq("master_plan_id", a.planId).in("id", pageAud) : { data: [] as { id: string; name: string }[] };
    const pageAudName = new Map((pageAuds ?? []).map((x) => [x.id as string, x.name as string]));
    const rows = page.map(({ audId, ...r }) => ({ ...r, list_name: r.qualId ? (audId ? pageAudName.get(audId) ?? "" : "One profile") : "", on_boards: idx.names(idx.boardsOf({ name: r.name, url: r.profile_url, email: r.email })) }));
    return NextResponse.json({ rows, total: all.length, hasMore: offset + PAGE < all.length, capped: [quals1, quals2, cards, contacts].some((x) => (x ?? []).length >= CAP) });
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
    stages: Object.fromEntries(await Promise.all(boards.map(async (b) => [b.id, (await boardStages(db, a.planId, b.id)).map((x) => ({ id: x.id, name: x.name }))] as const))),
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
    // People found by search who have no score yet: they go on the pipeline without one.
    const people = (Array.isArray(b.people) ? b.people : []).slice(0, 200).map((x: Record<string, unknown>) => ({ name: str(x?.name, 160), email: str(x?.email, 200), url: str(x?.url, 500), platform: str(x?.platform, 10), contactId: str(x?.contactId, 40) })).filter((x: { name: string }) => x.name);
    if (!ids.length && !people.length) return NextResponse.json({ error: "Choose at least one person." }, { status: 400 });
    const boards = await ensureBoards(db, a.planId, "outreach");
    const board = boards.find((x) => x.id === b.boardId);
    if (!board) return NextResponse.json({ error: "Choose a pipeline." }, { status: 400 });
    const stages = await boardStages(db, a.planId, board.id);
    if (!stages.length) return NextResponse.json({ error: "Add a stage to that pipeline first." }, { status: 400 });
    const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
    const { data: quals } = ids.length ? await db.from("icp_qualifications").select("id, name, platform, profile_url, email, link_code, fit, level, priority, card_id, result, icp_id").eq("master_plan_id", a.planId).in("id", ids) : { data: [] as Record<string, unknown>[] };
    // Anyone who asked to stop is never put on a pipeline.
    const contactIds = people.map((x: { contactId: string }) => x.contactId).filter(Boolean);
    const { data: stopped } = contactIds.length ? await db.from("seq_contacts").select("id").eq("master_plan_id", a.planId).in("id", contactIds).not("unsubscribed_at", "is", null) : { data: [] as { id: string }[] };
    const stopIds = new Set((stopped ?? []).map((x) => x.id as string));
    type Item = { id: string | null; name: unknown; platform: unknown; profile_url: unknown; email: unknown; link_code: unknown; fit: unknown; level: unknown; priority: unknown; result: unknown; icp_id: unknown; contact_id: string | null };
    const items: Item[] = [
      ...(quals ?? []).map((x) => ({ ...(x as Record<string, unknown>), contact_id: null }) as Item),
      ...people.filter((x: { contactId: string }) => !x.contactId || !stopIds.has(x.contactId)).map((x: { name: string; platform: string; url: string; email: string; contactId: string }) => ({ id: null, name: x.name, platform: x.platform, profile_url: x.url, email: x.email, link_code: null, fit: null, level: null, priority: null, result: null, icp_id: null, contact_id: x.contactId || null }) as Item),
    ];
    const icpIds = Array.from(new Set((quals ?? []).map((q) => q.icp_id as string | null).filter((x): x is string => !!x)));
    const { data: icpRows } = icpIds.length ? await db.from("icp_profiles").select("id, purpose").eq("master_plan_id", a.planId).in("id", icpIds) : { data: [] as { id: string; purpose: string }[] };
    const purposeOf = new Map((icpRows ?? []).map((r) => [r.id as string, r.purpose as string]));
    // Never twice on the same pipeline; being on another pipeline is allowed.
    const idx = await pipelineIndex(db, a.planId);
    let added = 0;
    let moved = 0;
    const landed: Record<string, number> = {};
    const movedTo: Record<string, number> = {};
    const already: string[] = [];
    const sameStep: string[] = [];
    let failed = 0;
    // A step the person chose on purpose. Someone already on this pipeline moves to it; without one they are left where they are.
    const chosen = stages.find((s) => s.id === str(b.stageId, 40)) ?? null;
    for (const q of items) {
      const url = ((q.profile_url as string) || "").trim();
      const email = normEmail(q.email as string | null);
      if (!q.name) { failed++; continue; }
      if (idx.boardsOf({ name: q.name as string, url, email }).includes(board.id)) {
        const mine = chosen ? idx.cardOn({ name: q.name as string, url, email }, board.id) : null;
        if (!chosen || !mine?.id) { already.push(q.name as string); continue; }
        if (mine.stage_id === chosen.id) { sameStep.push(q.name as string); continue; }
        const saved = await moveCard(db, a.planId, mine.id, chosen, board.name, tz);
        if (!saved) { failed++; continue; }
        // Their score goes with the card, and this score now belongs to it.
        if (q.id) {
          await db.from("dm_cards").update({ qual_priority: q.priority, qual_fit: q.fit, qual_level: q.level, qual_id: q.id }).eq("id", mine.id).eq("master_plan_id", a.planId);
          await db.from("icp_qualifications").update({ card_id: mine.id }).eq("id", q.id).eq("master_plan_id", a.planId);
        }
        idx.add({ id: mine.id, stage_id: chosen.id, board_id: board.id, name: q.name as string, email: email || null, profile_url: url || null });
        moved++;
        movedTo[chosen.name] = (movedTo[chosen.name] ?? 0) + 1;
        continue;
      }
      // "Add anyway" on a Skip result is a person's own call to reach out, so it starts in To reach out.
      const key = b.force === true || !q.id ? "to_reach" : stageKeyFor(q.priority as string, purposeOf.get(q.icp_id as string));
      // A stage the person picked wins over the one the priority would choose.
      const stage = stages.find((s) => s.id === str(b.stageId, 40)) ?? stages.find((s) => s.key === key) ?? stages.find((s) => s.kind === "open") ?? stages[0];
      const platform = PLATFORM_IDS.includes(q.platform as string) ? (q.platform as string) : PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : null;
      const why = str((q.result as { fitReason?: string; reason?: string })?.fitReason, 300) || str((q.result as { reason?: string })?.reason, 300);
      const notes = q.id ? `[${dateIn(tz, 0)}] Qualifier: ${q.priority} priority · Fit ${q.fit}${q.level ? ` · ${q.level}` : ""}${why ? `\n${why}` : ""}` : `[${dateIn(tz, 0)}] Added from Audience Qualifier search (not scored)`;
      const r = await createCard(db, a.planId, board, stage, tz, { name: q.name as string, profileUrl: url || null, email: email || null, platform, notes, contactId: q.contact_id });
      if ("error" in r || !r.card) { failed++; continue; }
      const patch: Record<string, unknown> = q.id ? { qual_priority: q.priority, qual_fit: q.fit, qual_level: q.level, qual_id: q.id } : {};
      // A personal registration link that came with the list stays with the person.
      if (q.link_code) {
        const { data: taken } = await db.from("dm_cards").select("id").eq("link_code", q.link_code).maybeSingle();
        if (!taken) patch.link_code = q.link_code;
      }
      if (Object.keys(patch).length) await db.from("dm_cards").update(patch).eq("id", r.card.id).eq("master_plan_id", a.planId);
      if (q.id) await db.from("icp_qualifications").update({ card_id: r.card.id }).eq("id", q.id).eq("master_plan_id", a.planId);
      idx.add({ board_id: board.id, name: q.name as string, email: email || null, profile_url: url || null });
      added++;
      landed[stage.name] = (landed[stage.name] ?? 0) + 1;
    }
    return NextResponse.json({ added, moved, movedTo, stopped: stopIds.size, sameStep: sameStep.slice(0, 12), skipped: already.length, already: already.slice(0, 12), failed, board: board.name, landed });
  }

  // Take someone off one pipeline from the Qualifier. They stay in Contacts and keep their scores.
  if (b.action === "remove-from-pipeline") {
    const boards = await ensureBoards(db, a.planId, "outreach");
    const board = boards.find((x) => x.id === b.boardId);
    if (!board) return NextResponse.json({ error: "Choose a pipeline." }, { status: 400 });
    const idx = await pipelineIndex(db, a.planId);
    const person = { name: str(b.name, 160), url: str(b.url, 500), email: str(b.email, 200) };
    const mine = idx.cardOn(person, board.id);
    if (!mine?.id) return NextResponse.json({ error: `${person.name || "They"} aren't on ${board.name}.` }, { status: 404 });
    const ok = await removeCardFromPipeline(db, a.planId, mine.id);
    return ok ? NextResponse.json({ ok: true, board: board.name }) : NextResponse.json({ error: "Couldn't remove them." }, { status: 500 });
  }

  // Which people on a list are already on a pipeline (asked before scoring, so no score is spent on them).
  if (b.action === "list-check") {
    const idx = await pipelineIndex(db, a.planId);
    const people = (Array.isArray(b.people) ? b.people : []).slice(0, 2000) as Person[];
    const on = people.map((p) => idx.names(idx.boardsOf({ name: str(p.name, 120), url: str(p.url, 500), email: str(p.email, 200) })).map((x) => x.name));
    return NextResponse.json({ on });
  }

  // The person's own call on a score: no AI request. The card (if any) takes the new priority and keeps a note of it.
  if (b.action === "override") {
    const priority = PRIORITIES.find((p) => p === str(b.priority, 10).toUpperCase());
    if (!priority) return NextResponse.json({ error: "Choose High, Medium, Low or Skip." }, { status: 400 });
    const { data: q } = await db.from("icp_qualifications").select(QUAL_COLUMNS).eq("id", str(b.qualId, 40)).eq("master_plan_id", a.planId).maybeSingle();
    if (!q) return NextResponse.json({ error: "That score wasn't found." }, { status: 404 });
    const was = (q.priority as string) || "";
    const result = { ...((q.result as Record<string, unknown>) ?? {}), override: { from: was, to: priority, at: new Date().toISOString() } };
    const { data: saved, error } = await db.from("icp_qualifications").update({ priority, result }).eq("id", q.id).eq("master_plan_id", a.planId).select(QUAL_COLUMNS).single();
    if (error || !saved) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
    let cardOut: Record<string, unknown> | null = null;
    if (q.card_id) {
      const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
      const { data: card } = await db.from("dm_cards").select("id, notes, contact_id").eq("id", q.card_id as string).eq("master_plan_id", a.planId).maybeSingle();
      if (card) {
        const line = `[${dateIn(tz, 0)}] Priority set by you: ${priority}${was && was !== priority ? ` (the score said ${was})` : ""}`;
        const notes = `${(card.notes as string) ?? ""}\n\n${line}`.trim().slice(-2000);
        const { data: c } = await db.from("dm_cards").update({ qual_priority: priority, notes, updated_at: new Date().toISOString() }).eq("id", card.id as string).eq("master_plan_id", a.planId).select("*").single();
        cardOut = c ?? null;
        if (card.contact_id) await logEvent(a.planId, card.contact_id as string, "manual", line.replace(/^\[[^\]]*\] /, ""), { dm_card: card.id, qualification: q.id }, db as never).catch(() => {});
      }
    }
    return NextResponse.json({ qualification: saved, card: cardOut });
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
    let offerName = "";
    if (str(b.offerId, 40)) {
      const { data: o } = await db.from("sales_offers").select("name, transformation, ideal_client, not_for, deliverables").eq("id", str(b.offerId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      if (o) offerName = (o.name as string) || "";
      if (o) offer = `THE OFFER THIS PROFILE IS FOR\nName: ${o.name}\nTransformation: ${o.transformation ?? ""}\nIdeal client: ${o.ideal_client ?? ""}\nNot for: ${o.not_for ?? ""}\nIncludes: ${((o.deliverables as string[] | null) ?? []).join("; ")}`;
    }
    if (!about && !offer) return NextResponse.json({ error: "There isn't enough in your plans or offers yet to draft from. Fill it in by hand." }, { status: 400 });
    const sys =
      `You help one small-business owner write their Ideal Client Profile for prospect qualification. Use ONLY what is below about their business; where it doesn't say, leave that field empty rather than inventing. Write in first person, plain and specific. When a specific offer is given, the signature offer is exactly that offer and the profile describes who that offer is for, not the owner's other offers.\n` +
      `Return STRICT JSON: {"whoServe":"","helpDo":"","signatureOffer":"","coreProblem":"","alreadyHas":"one per line, up to 5","missing":"one per line, up to 5","redFlags":"one per line, up to 5"}.`;
    try {
      const out = await askJson(key, sys, `${offer}\n\nWHAT IS KNOWN ABOUT THIS BUSINESS\n${about.slice(0, 14000)}`, 900);
      if (!out) return NextResponse.json({ error: "Couldn't draft that. Try again." }, { status: 502 });
      const f = (k: string) => str(out[k], 2000);
      return NextResponse.json({ draft: { whoServe: f("whoServe"), helpDo: f("helpDo"), signatureOffer: offerName || f("signatureOffer"), coreProblem: f("coreProblem"), alreadyHas: f("alreadyHas"), missing: f("missing"), redFlags: f("redFlags") } });
    } catch (e) {
      console.error("qualifier icp-draft:", e);
      return NextResponse.json({ error: "Couldn't reach the AI just now. Try again." }, { status: 502 });
    }
  }

  if (b.action === "qualify") {
    // Scoring the same person again starts from the profile text saved last time, so nothing has to be pasted twice.
    let prior: { id: string; name: string; platform: string | null; profile_url: string | null; source_text: string | null; card_id: string | null; icp_id: string | null } | null = null;
    if (str(b.qualId, 40)) {
      const { data } = await db.from("icp_qualifications").select("id, name, platform, profile_url, source_text, card_id, icp_id").eq("id", str(b.qualId, 40)).eq("master_plan_id", a.planId).eq("kind", "profile").maybeSingle();
      prior = data ?? null;
      if (!prior) return NextResponse.json({ error: "That score wasn't found." }, { status: 404 });
    }
    const icp = await loadIcp(db, a.planId, str(b.icpId, 40) || prior?.icp_id || "");
    if (!icp) return NextResponse.json({ error: "Choose an Ideal Client Profile first." }, { status: 400 });
    const context = str(b.context, 1500);
    // More pages of the same profile (About, Experience, a second page of posts) are added to what is already there.
    const text = [str(b.profileText, 24000) || prior?.source_text || "", str(b.extraText, 12000)].filter(Boolean).join("\n\n").slice(0, 36000);
    if (text.length < 80) return NextResponse.json({ error: "Paste more of their profile: headline, About, and a few recent posts give the best read." }, { status: 400 });
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : PLATFORM_IDS.includes(prior?.platform ?? "") ? (prior!.platform as string) : null;
    let card: { id: string; name: string; contact_id: string | null; board_id: string; notes: string | null; platform: string | null; profile_url: string | null } | null = null;
    if (str(b.cardId, 40) || prior?.card_id) {
      const { data } = await db.from("dm_cards").select("id, name, contact_id, board_id, notes, platform, profile_url").eq("id", str(b.cardId, 40) || (prior!.card_id as string)).eq("master_plan_id", a.planId).maybeSingle();
      card = data ?? null;
      if (!card) return NextResponse.json({ error: "That card wasn't found." }, { status: 404 });
    }
    let out: Record<string, unknown> | null;
    try {
      out = await askJson(key, profilePrompt(icp, platform ?? card?.platform ?? null, { warm: str(b.warm, 400), context, voice: instructions.slice(0, 600) }), `${card?.name || prior?.name || str(b.name, 120) ? `Name on my list: ${card?.name || prior?.name || str(b.name, 120)}\n` : ""}PROFILE TEXT:\n${text}`, 1500, PROFILE_MODEL);
    } catch (e) {
      console.error("qualifier qualify:", e);
      return NextResponse.json({ error: "Couldn't reach the AI just now. Try again." }, { status: 502 });
    }
    if (!out || !out.fit) return NextResponse.json({ error: "Couldn't score that. Try again." }, { status: 502 });
    const fit = cleanFit(out.fit);
    const priority = fit === "NO" ? "SKIP" : cleanPriority(out.priority);
    const level = str(out.level, 60);
    const dmAngle = fit === "NO" ? "" : str(out.dmAngle, 1500).replace(/\s*—\s*/g, ", ");
    const name = card?.name || prior?.name || str(b.name, 120) || str(out.name, 120) || "Unnamed prospect";
    const row = {
      icp_id: icp.id,
      icp_name: icp.name,
      card_id: card?.id ?? null,
      name,
      platform: platform ?? card?.platform ?? null,
      profile_url: str(b.profileUrl, 500) || card?.profile_url || prior?.profile_url || null,
      source_text: text,
      fit,
      level,
      priority,
      dm_angle: dmAngle,
      // What the person told the scorer is kept with the score, so it is clear what the read was based on.
      result: { ...out, fit, priority, dmAngle, ...(context ? { context } : {}) },
    };
    // Scoring again replaces the old score; a new person gets a new row.
    const { data: saved, error } = prior
      ? await db.from("icp_qualifications").update(row).eq("id", prior.id).eq("master_plan_id", a.planId).select(QUAL_COLUMNS).single()
      : await db.from("icp_qualifications").insert({ ...row, master_plan_id: a.planId, kind: "profile" }).select(QUAL_COLUMNS).single();
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
        result: { reason: str(sc.reason, 400) + (icp.purpose === "partner" && str(sc.check, 240) ? ` Check: ${str(sc.check, 240)}` : ""), likelyLevel: str(sc.likelyLevel, 60), facts: r.facts },
      };
    });
    const { data: saved, error } = await db.from("icp_qualifications").insert(insert).select(QUAL_COLUMNS);
    if (error) return NextResponse.json({ error: "Scored, but couldn't save those rows." }, { status: 500 });
    return NextResponse.json({ rows: saved ?? [] });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
