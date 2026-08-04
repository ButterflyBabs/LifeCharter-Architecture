import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { QUICK_WIN_DEFAULTS } from "@/lib/quickWins";

export const dynamic = "force-dynamic";

const PRIORITIES = ["high", "medium", "low"];

interface QuickWinRow {
  id: string;
  title: string;
  detail: string | null;
  emoji: string | null;
  priority: string | null;
  sort_order: number | null;
  source: string | null;
}

// GET — the client's quick wins. Seeds the 10 defaults the first time.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const { data } = await supabase
    .from("quick_wins")
    .select("id, title, detail, emoji, priority, sort_order, source")
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  let rows = (data || []) as QuickWinRow[];

  if (rows.length === 0) {
    const seed = QUICK_WIN_DEFAULTS.map((w, i) => ({
      master_plan_id: masterPlanId,
      title: w.title,
      detail: w.detail,
      emoji: w.emoji,
      priority: w.priority,
      sort_order: i,
      source: "default",
    }));
    const { data: inserted } = await supabase
      .from("quick_wins")
      .insert(seed)
      .select("id, title, detail, emoji, priority, sort_order, source");
    rows = ((inserted || []) as QuickWinRow[]).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }

  return NextResponse.json({
    wins: rows.map((r) => ({
      id: r.id,
      title: r.title,
      detail: r.detail || "",
      emoji: r.emoji || "⚡",
      priority: r.priority || "medium",
      source: r.source || "default",
    })),
  });
}

// POST — create a new quick win (manual or AI-generated payload).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const priority = PRIORITIES.includes(body.priority) ? body.priority : "medium";
  const source = body.source === "ai" ? "ai" : "manual";

  const { data: maxRow } = await supabase
    .from("quick_wins")
    .select("sort_order")
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = ((maxRow?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from("quick_wins")
    .insert({
      master_plan_id: masterPlanId,
      title,
      detail: typeof body.detail === "string" ? body.detail.trim() : "",
      emoji: typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim().slice(0, 4) : "⚡",
      priority,
      sort_order: nextSort,
      source,
    })
    .select("id, title, detail, emoji, priority, source")
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({
    win: {
      id: data.id,
      title: data.title,
      detail: data.detail || "",
      emoji: data.emoji || "⚡",
      priority: data.priority || "medium",
      source: data.source || "manual",
    },
  });
}

// PATCH — edit a quick win's fields.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.detail === "string") update.detail = body.detail.trim();
  if (typeof body.emoji === "string" && body.emoji.trim()) update.emoji = body.emoji.trim().slice(0, 4);
  if (PRIORITIES.includes(body.priority)) update.priority = body.priority;

  const { error } = await supabase
    .from("quick_wins")
    .update(update)
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a quick win (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await supabase
    .from("quick_wins")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);

  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
