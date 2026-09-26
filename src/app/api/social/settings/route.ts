import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { socialContext } from "@/lib/social/server";
import { normalizeGoals, normalizeRules, PLATFORM_MAP, STARTER_GOALS, STARTER_RULES } from "@/lib/social/planner";

export const dynamic = "force-dynamic";

const OFFER_COLUMNS = "id, key, name, link, kind, rules, sort_order";
const EVENT_COLUMNS = "id, offer_key, title, event_date, start_time, timezone, first_mention_on, notes";

// GET — the account's planner settings, offers and events. A new account gets
// empty settings (setupDone: false) and neutral starter rules, never anyone
// else's content.
export async function GET() {
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const { supabase, masterPlanId } = ctx;

  const [{ data: s }, { data: offers }, { data: events }] = await Promise.all([
    supabase.from("social_settings").select("platforms, goals, rules, setup_completed_at").eq("master_plan_id", masterPlanId).maybeSingle(),
    supabase.from("social_offers").select(OFFER_COLUMNS).eq("master_plan_id", masterPlanId).order("sort_order").order("name"),
    supabase.from("social_events").select(EVENT_COLUMNS).eq("master_plan_id", masterPlanId).order("event_date"),
  ]);

  return NextResponse.json({
    setupDone: Boolean(s?.setup_completed_at),
    platforms: (s?.platforms as string[]) || [],
    goals: normalizeGoals(s?.goals),
    rules: s ? normalizeRules(s.rules as never) : STARTER_RULES,
    offers: (offers || []).map((o) => ({
      id: o.id, key: o.key, name: o.name, link: o.link, kind: o.kind, rules: o.rules, sortOrder: o.sort_order,
    })),
    events: (events || []).map((e) => ({
      id: e.id,
      offerKey: e.offer_key,
      title: e.title,
      date: e.event_date,
      startTime: e.start_time ? String(e.start_time).slice(0, 5) : null,
      timezone: e.timezone,
      firstMentionOn: e.first_mention_on,
      notes: e.notes,
    })),
  });
}

// PUT — save any of { platforms, goals, rules, completeSetup }.
// Choosing platforms for the first time fills in starter goals for them.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const { supabase, masterPlanId } = ctx;
  const body = await request.json().catch(() => ({}));

  const { data: existing } = await supabase
    .from("social_settings")
    .select("platforms, goals, rules, setup_completed_at")
    .eq("master_plan_id", masterPlanId)
    .maybeSingle();

  const row: Record<string, unknown> = { master_plan_id: masterPlanId, updated_at: new Date().toISOString() };
  let goals = normalizeGoals(existing?.goals);

  if (Array.isArray(body.platforms)) {
    const platforms = Array.from(new Set(body.platforms.map(String).filter((p: string) => PLATFORM_MAP[p])));
    row.platforms = platforms;
    for (const p of platforms as string[]) if (!goals[p]) goals[p] = structuredClone(STARTER_GOALS[p] || []);
    row.goals = goals;
  }
  if (body.goals && typeof body.goals === "object") {
    goals = normalizeGoals(body.goals);
    row.goals = goals;
  }
  if (body.rules && typeof body.rules === "object") row.rules = normalizeRules(body.rules);
  if (body.completeSetup === true && !existing?.setup_completed_at) row.setup_completed_at = new Date().toISOString();
  if (!existing && !row.rules) row.rules = STARTER_RULES;

  const { error } = await supabase.from("social_settings").upsert(row, { onConflict: "master_plan_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, goals });
}

