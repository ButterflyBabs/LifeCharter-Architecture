import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { getBlueprint, baselineCompleteness } from "@/lib/plans/blueprints";

export const dynamic = "force-dynamic";

interface Saved {
  section_key: string;
  content: string | null;
  answers: Record<string, unknown> | null;
  status: string | null;
  source: string | null;
  updated_at: string | null;
}

// GET ?type= — the blueprint merged with this client's saved section content.
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") || "";
  const bp = getBlueprint(type);
  if (!bp) return NextResponse.json({ error: "unknown plan type" }, { status: 400 });

  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const savedMap = new Map<string, Saved>();
  let latestUpdate: string | null = null;
  if (masterPlanId) {
    const { data } = await supabase
      .from("plan_sections")
      .select("section_key, content, answers, status, source, updated_at")
      .eq("master_plan_id", masterPlanId)
      .eq("plan_type", type);
    for (const r of (data || []) as Saved[]) {
      savedMap.set(r.section_key, r);
      if (r.updated_at && (!latestUpdate || r.updated_at > latestUpdate)) latestUpdate = r.updated_at;
    }
  }

  const filled = new Set<string>();
  const sections = bp.sections.map((s) => {
    const saved = savedMap.get(s.key);
    const content = (saved?.content || "").trim();
    if (content) filled.add(s.key);
    return {
      key: s.key,
      title: s.title,
      description: s.description,
      baseline: s.baseline,
      guiding: s.guiding,
      content: saved?.content || "",
      answers: saved?.answers || {},
      status: saved?.status || "empty",
      source: saved?.source || "client",
    };
  });

  const total = bp.sections.length;
  const filledCount = filled.size;

  return NextResponse.json({
    blueprint: { kind: bp.kind, label: bp.label, tagline: bp.tagline },
    sections,
    baselineCompleteness: baselineCompleteness(type, filled),
    overallCompleteness: total ? Math.round((filledCount / total) * 100) : 0,
    filledCount,
    total,
    latestUpdate,
  });
}

// PATCH — save a section's content / answers / status.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const type = typeof body.type === "string" ? body.type : "";
  const sectionKey = typeof body.sectionKey === "string" ? body.sectionKey : "";
  const bp = getBlueprint(type);
  if (!bp || !bp.sections.some((s) => s.key === sectionKey)) {
    return NextResponse.json({ error: "unknown section" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.content === "string") update.content = body.content;
  if (body.answers && typeof body.answers === "object") update.answers = body.answers;
  if (["empty", "drafted", "edited", "done"].includes(body.status)) update.status = body.status;
  if (body.source === "ai" || body.source === "client") update.source = body.source;

  const { data: existing } = await supabase
    .from("plan_sections")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .eq("plan_type", type)
    .eq("section_key", sectionKey)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("plan_sections").update(update).eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("plan_sections")
      .insert({ master_plan_id: masterPlanId, plan_type: type, section_key: sectionKey, ...update });
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
