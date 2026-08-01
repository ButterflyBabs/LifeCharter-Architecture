import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

function healthFor(score: number): "healthy" | "attention" | "at_risk" {
  if (score < 60) return "at_risk";
  if (score < 80) return "attention";
  return "healthy";
}

// Coach override: manually set a segment's 12 dimension scores. Restricted to
// super admins — clients cannot override their own AI-derived scores.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "coach override is restricted to super admins" }, { status: 403 });
  }
  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));
  const segmentId = body?.segmentId;
  const dimensions = Array.isArray(body?.dimensions) ? body.dimensions : [];
  if (!segmentId || dimensions.length === 0) {
    return NextResponse.json({ error: "segmentId and dimensions required" }, { status: 400 });
  }

  await Promise.all(
    (dimensions as Array<{ key: string; score: number }>).map(async (d) => {
      const score = Math.max(0, Math.min(100, Math.round(Number(d.score))));
      if (!d.key || Number.isNaN(score)) return;
      const health = healthFor(score);
      // Mark as a coach override so the AI sync won't overwrite it.
      const { data: updated } = await supabase
        .from("segment_dimensions")
        .update({ score, health, updated_by: "coach", updated_at: new Date().toISOString() })
        .eq("segment_id", segmentId)
        .eq("dimension_key", d.key)
        .select("id");
      if (!updated || updated.length === 0) {
        await supabase
          .from("segment_dimensions")
          .insert({ segment_id: segmentId, dimension_key: d.key, score, health, updated_by: "coach" });
      }
    })
  );

  // Return the freshly-written state so the client can apply it directly
  // (no separate reconcile read that could race the writes).
  const { data: fresh } = await supabase
    .from("segment_dimensions")
    .select("dimension_key, score, health")
    .eq("segment_id", segmentId);

  return NextResponse.json(
    { ok: true, dimensions: fresh ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
