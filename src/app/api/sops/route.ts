import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { logActivity, q } from "@/lib/activity";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

// Playbook & SOP library.
//   GET                          → this client's SOPs
//   POST { action: "draft", title, notes?, pillarKey? } → the assistant drafts one (not saved)
//   POST { ...sop }              → create    PATCH { id, ...sop } → edit    DELETE { id }
// SOPs in use feed the Systems score live (see liveOperationalMetrics).

const PILLARS = new Set(OPERATIONS_PILLARS.map((p) => p.key));
const SELECT = "id, title, pillar_key, purpose, steps, owner, tools, status, last_reviewed, updated_at";

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.title === "string") out.title = body.title.trim().slice(0, 160);
  if (body.pillarKey !== undefined) out.pillar_key = typeof body.pillarKey === "string" && PILLARS.has(body.pillarKey) ? body.pillarKey : null;
  if (typeof body.purpose === "string") out.purpose = body.purpose.trim().slice(0, 1000) || null;
  if (Array.isArray(body.steps)) out.steps = body.steps.map((x) => String(x ?? "").trim().slice(0, 600)).filter(Boolean).slice(0, 40);
  if (typeof body.owner === "string") out.owner = body.owner.trim().slice(0, 120) || null;
  if (typeof body.tools === "string") out.tools = body.tools.trim().slice(0, 300) || null;
  if (body.status === "draft" || body.status === "active") out.status = body.status;
  if (typeof body.lastReviewed === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.lastReviewed)) out.last_reviewed = body.lastReviewed;
  return out;
}

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ sops: [] });
  const { data } = await createServerClient().from("sops").select(SELECT).eq("master_plan_id", masterPlanId).order("updated_at", { ascending: false });
  return NextResponse.json({ sops: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  if (body.action === "draft") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    if (!title) return NextResponse.json({ error: "Name the process first." }, { status: 400 });
    const a = await planningAssistant();
    if (!a?.key) return NextResponse.json({ needsKey: true });
    const overCap = await memberAiGate();
    if (overCap) return overCap;
    const pillar = OPERATIONS_PILLARS.find((p) => p.key === body.pillarKey)?.name;
    const sys = planningSystem(
      a,
      "writing a standard operating procedure (SOP) for their business.",
      'Return STRICT JSON: {"purpose":"one or two sentences: why this process exists and what \\"done\\" looks like","steps":["5-12 clear, numbered-in-order steps, each one action a team member could follow"],"owner":"the role that owns it","tools":"tools used, comma separated"}. ' +
        "Fit it to their business (their offers, tools and team as known). Where you don't know a detail, use a [bracketed placeholder]."
    );
    const out = await runJson(a, sys, `PROCESS: ${title}${pillar ? `\nAREA: ${pillar}` : ""}${typeof body.notes === "string" && body.notes.trim() ? `\nTHEIR NOTES: ${body.notes.trim().slice(0, 1500)}` : ""}`, 900);
    if (!out) return NextResponse.json({ error: "Couldn't draft it just now." }, { status: 502 });
    return NextResponse.json({
      draft: {
        purpose: String(out.purpose || "").slice(0, 1000),
        steps: (Array.isArray(out.steps) ? out.steps : []).map((s) => String(s).slice(0, 600)).slice(0, 20),
        owner: String(out.owner || "").slice(0, 120),
        tools: String(out.tools || "").slice(0, 300),
      },
    });
  }

  const row = clean(body);
  if (!row.title) return NextResponse.json({ error: "Give the SOP a title." }, { status: 400 });
  const { data, error } = await createServerClient().from("sops").insert({ ...row, master_plan_id: masterPlanId }).select(SELECT).single();
  if (error) {
    console.error("POST /api/sops:", error.message);
    return NextResponse.json({ error: "Couldn't save the SOP." }, { status: 500 });
  }
  await logActivity({ masterPlanId, action: "created", entityType: "sop", entityId: (data as { id?: string })?.id, summary: `Added SOP ${q(row.title)}` });
  return NextResponse.json({ sop: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  if (!masterPlanId || typeof body.id !== "string") return NextResponse.json({ error: "Missing SOP." }, { status: 400 });
  const row = clean(body);
  const { data, error } = await createServerClient()
    .from("sops")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("master_plan_id", masterPlanId)
    .select(SELECT)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save the SOP." }, { status: 500 });
  const saved = data as { id?: string; title?: string };
  await logActivity({ masterPlanId, action: "updated", entityType: "sop", entityId: saved.id, summary: `Updated SOP ${q(saved.title)}` });
  return NextResponse.json({ sop: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  if (!masterPlanId || typeof body.id !== "string") return NextResponse.json({ error: "Missing SOP." }, { status: 400 });
  const { data: gone } = await createServerClient().from("sops").delete().eq("id", body.id).eq("master_plan_id", masterPlanId).select("id, title");
  if (gone?.[0]) await logActivity({ masterPlanId, action: "deleted", entityType: "sop", entityId: body.id, summary: `Deleted SOP ${q(gone[0].title)}` });
  return NextResponse.json({ ok: true });
}
