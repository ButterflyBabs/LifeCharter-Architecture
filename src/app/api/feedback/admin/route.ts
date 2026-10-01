import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Admin only (Babs): every Glitch, Suggestion and Feedback item, across every
// account — Support Desk's Glitches / Suggestions / Feedback tabs.
// ?kind=glitch|suggestion|feedback
export async function GET(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const kind = new URL(request.url).searchParams.get("kind") || "glitch";
  const db = createServerClient();
  const { data: items } = await db
    .from("feedback_items")
    .select("id, kind, master_plan_id, title, description, status, submitter_name, vote_count, support_request_id, created_at")
    .eq("kind", kind)
    .order(kind === "glitch" ? "created_at" : "vote_count", { ascending: false })
    .limit(300);
  const rows = (items ?? []) as Array<Record<string, unknown>>;
  const planIds = Array.from(new Set(rows.map((r) => r.master_plan_id).filter(Boolean))) as string[];
  const { data: plans } = planIds.length ? await db.from("client_master_plans").select("id, client_name").in("id", planIds) : { data: [] };
  const nameByPlan = new Map(((plans ?? []) as { id: string; client_name: string }[]).map((p) => [p.id, p.client_name]));
  return NextResponse.json({
    items: rows.map((r) => ({ ...r, accountName: nameByPlan.get(r.master_plan_id as string) || null })),
  });
}
