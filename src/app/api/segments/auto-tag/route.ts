import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { collectUntagged, countUntagged, loadSegments } from "@/lib/segments/autoTag";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

// GET — how much of this client's activity isn't tied to a segment yet.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ segments: 0, untagged: null });
  const [segs, untagged] = await Promise.all([loadSegments(planId), countUntagged(planId)]);
  return NextResponse.json({ segments: segs.length, untagged });
}

// POST — the client's own assistant PROPOSES a segment for each untagged item
// (their income and expenses, tasks, plan goals and sales activity), judging from
// the wording and what it knows of how their business is organized. Nothing is
// saved: the client reviews every suggestion and applies the ones they agree with.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;

  const [segments, items] = await Promise.all([loadSegments(a.planId), collectUntagged(a.planId)]);
  if (segments.length === 0) return NextResponse.json({ error: "Add at least one segment first, so there's something to tie activity to." }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ proposals: [], segments, assistant: a.name });

  const system = planningSystem(
    a,
    "helping this client tie their existing activity to the right business segment.",
    "For each numbered item, choose the segment it clearly belongs to — judging from its wording (offer, program or product names, client or company names, categories) and from what you know about how their business is organized. " +
      "If an item is general overhead, spans several segments, or you are not reasonably sure, leave it unassigned (null) rather than guessing. Never invent a segment. " +
      'Return STRICT JSON: {"assignments":[{"ref":"L1","segmentId":<segment id number or null>,"confidence":"high|medium|low","why":"a few words"}]} with one entry per item.'
  );
  const user =
    `SEGMENTS:\n${segments.map((s) => `- id ${s.id}: ${s.business ? `${s.business} › ` : ""}${s.name}${s.description ? ` — ${s.description}` : ""}`).join("\n")}\n\n` +
    `ITEMS:\n${items.map((i) => `${i.ref} [${i.kind}] ${i.label}${i.detail ? ` | ${i.detail}` : ""}`).join("\n")}`;
  const out = await runJson(a, system, user, 4000, 0.2);
  if (!out) return NextResponse.json({ error: "Couldn't suggest tags — try again." }, { status: 502 });

  const valid = new Set(segments.map((s) => s.id));
  const byRef = new Map(items.map((i) => [i.ref, i]));
  const seen = new Set<string>();
  const proposals = (Array.isArray(out.assignments) ? out.assignments : [])
    .map((x) => {
      const r = x as Record<string, unknown>;
      const item = byRef.get(String(r.ref ?? ""));
      if (!item || seen.has(item.ref)) return null;
      seen.add(item.ref);
      const sid = Number(r.segmentId);
      return {
        ref: item.ref, kind: item.kind, label: item.label, detail: item.detail, ids: item.ids,
        segmentId: Number.isFinite(sid) && valid.has(sid) ? sid : null,
        confidence: ["high", "medium", "low"].includes(String(r.confidence)) ? String(r.confidence) : "low",
        why: String(r.why ?? "").trim().slice(0, 120),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  // Items the model skipped are simply left out (untagged).
  return NextResponse.json({ proposals, segments, assistant: a.name, considered: items.length });
}
