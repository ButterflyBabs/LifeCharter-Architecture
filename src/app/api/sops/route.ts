import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { OPERATIONS_PILLARS } from "@/lib/operations";
import { logActivity, q } from "@/lib/activity";
import { memberAiGate } from "@/lib/ai/memberCap";
import { sessionUser } from "@/lib/authz";
import { ensureSopTemplatesSeeded } from "@/lib/sopTemplates";
import { housePlanId } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// Playbook & SOP library.
//   GET                          → this client's SOPs
//   POST { action: "draft", title, notes?, pillarKey? } → the assistant drafts one (not saved)
//   POST { ...sop }              → create    PATCH { id, ...sop } → edit (status draft | active | archived); { id, approve: true | false } signs it off    DELETE { id }
// SOPs in use (status active) feed the Systems score live; archived ones are kept but do not count.

const PILLARS = new Set(OPERATIONS_PILLARS.map((p) => p.key));
const SELECT = "id, title, pillar_key, purpose, steps, owner, tools, status, last_reviewed, updated_at, approved_at, approved_by, checks, checks_at";

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.title === "string") out.title = body.title.trim().slice(0, 160);
  if (body.pillarKey !== undefined) out.pillar_key = typeof body.pillarKey === "string" && PILLARS.has(body.pillarKey) ? body.pillarKey : null;
  if (typeof body.purpose === "string") out.purpose = body.purpose.trim().slice(0, 1000) || null;
  if (Array.isArray(body.steps)) out.steps = body.steps.map((x) => String(x ?? "").trim().slice(0, 600)).filter(Boolean).slice(0, 60);
  if (typeof body.owner === "string") out.owner = body.owner.trim().slice(0, 120) || null;
  if (typeof body.tools === "string") out.tools = body.tools.trim().slice(0, 300) || null;
  // Ticked steps while someone runs the process (step positions); not part of what the SOP says.
  if (Array.isArray(body.checks)) {
    out.checks = Array.from(new Set(body.checks.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0 && n < 100))).sort((a: number, b: number) => a - b);
    out.checks_at = new Date().toISOString();
  }
  if (body.status === "draft" || body.status === "active" || body.status === "archived") out.status = body.status;
  if (typeof body.lastReviewed === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.lastReviewed)) out.last_reviewed = body.lastReviewed;
  return out;
}

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ sops: [] });
  // Every client account is given the 50-template library as editable drafts the first time the library opens.
  try {
    const who = await sessionUser();
    const db0 = createServerClient();
    await ensureSopTemplatesSeeded(db0 as never, masterPlanId, who?.id ?? null, await housePlanId(db0));
  } catch (e) {
    console.error("sop templates seed:", e);
  }
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
      'Return STRICT JSON: {"purpose":"one or two sentences: why this process exists and what \\"done\\" looks like","steps":["5-14 clear steps in order, each one action a team member could follow"],"owner":"the role that owns it","tools":"tools used, comma separated"}. ' +
        "Begin each step with one short action sentence, then any detail. When there are more than 8 steps, group them under section headers, each written as its own array item that starts with '## ' (for example '## Before the call'). " +
        "Fit it to their business (their offers, tools and team as known). Where you don't know a detail, use a [bracketed placeholder]."
    );
    const out = await runJson(a, sys, `PROCESS: ${title}${pillar ? `\nAREA: ${pillar}` : ""}${typeof body.notes === "string" && body.notes.trim() ? `\nTHEIR NOTES: ${body.notes.trim().slice(0, 1500)}` : ""}`, 900);
    if (!out) return NextResponse.json({ error: "Couldn't draft it just now." }, { status: 502 });
    return NextResponse.json({
      draft: {
        purpose: String(out.purpose || "").slice(0, 1000),
        steps: (Array.isArray(out.steps) ? out.steps : []).map((s) => String(s).slice(0, 600)).slice(0, 30),
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
  const row = clean(body) as Record<string, unknown>;
  // Approve on a card: the account holder signs the SOP off. It becomes In use and counts as reviewed today.
  // Approve false withdraws the approval and sends it back to draft.
  const now = new Date().toISOString();
  if (body.approve === true) {
    const who = await sessionUser().catch(() => null);
    Object.assign(row, { status: "active", last_reviewed: now.slice(0, 10), approved_at: now, approved_by: who?.email ?? null });
  } else if (body.approve === false) {
    Object.assign(row, { status: "draft", approved_at: null, approved_by: null });
  }
  // Only a change to what the SOP says counts as an edit (so "Mark reviewed today", Archive and a save with
  // nothing changed leave an approval standing).
  const db = createServerClient();
  const { data: cur } = await db.from("sops").select("title, pillar_key, purpose, steps, owner, tools").eq("id", body.id).eq("master_plan_id", masterPlanId).maybeSingle();
  const CONTENT = ["title", "pillar_key", "purpose", "steps", "owner", "tools"] as const;
  const edited = !cur || CONTENT.some((k) => k in row && JSON.stringify(row[k] ?? null) !== JSON.stringify((cur as Record<string, unknown>)[k] ?? null));
  if (cur && "steps" in row && JSON.stringify(row.steps ?? null) !== JSON.stringify((cur as Record<string, unknown>).steps ?? null) && !("checks" in row)) {
    row.checks = [];
    row.checks_at = null;
  }
  const { data, error } = await db
    .from("sops")
    .update({ ...row, ...(edited || body.approve !== undefined ? { updated_at: now } : {}) })
    .eq("id", body.id)
    .eq("master_plan_id", masterPlanId)
    .select(SELECT)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save the SOP." }, { status: 500 });
  const saved = data as { id?: string; title?: string };
  await logActivity({ masterPlanId, action: body.approve === true ? "approved" : "updated", entityType: "sop", entityId: saved.id, summary: `${body.approve === true ? "Approved" : "Updated"} SOP ${q(saved.title)}` });
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
