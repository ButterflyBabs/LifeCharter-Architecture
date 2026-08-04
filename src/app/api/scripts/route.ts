import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { SCRIPTS_SEED } from "@/lib/scriptsSeed";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  title: string;
  description: string | null;
  item_type: string | null;
  category: string | null;
  channel: string | null;
  content: string;
  tags: string | null;
  is_favorite: boolean | null;
  usage_count: number | null;
  last_used: string | null;
  source: string | null;
}

function shape(r: Row) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || "",
    itemType: (r.item_type as "script" | "template") || "script",
    category: r.category || "Sales",
    channel: r.channel || "sales",
    content: r.content,
    tags: (r.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    isFavorite: Boolean(r.is_favorite),
    usageCount: r.usage_count || 0,
    lastUsed: r.last_used,
    source: r.source || "manual",
  };
}

// GET — this client's scripts & templates. Seeds a starter set on first load.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ items: [] });

  const sel =
    "id, title, description, item_type, category, channel, content, tags, is_favorite, usage_count, last_used, source";

  const { data } = await supabase
    .from("scripts_templates")
    .select(sel)
    .eq("master_plan_id", masterPlanId)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: true });

  let rows = (data || []) as Row[];

  if (rows.length === 0) {
    const seed = SCRIPTS_SEED.map((s) => ({
      master_plan_id: masterPlanId,
      title: s.title,
      description: s.description,
      item_type: s.itemType,
      category: s.category,
      channel: s.channel,
      content: s.content,
      tags: s.tags,
      source: "default",
    }));
    const { data: inserted } = await supabase.from("scripts_templates").insert(seed).select(sel);
    rows = (inserted || []) as Row[];
  }

  return NextResponse.json({ items: rows.map(shape) });
}

// POST — create a new script/template (manual or AI-generated payload).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!title || !content) return NextResponse.json({ error: "Title and content are required." }, { status: 400 });

  const sel =
    "id, title, description, item_type, category, channel, content, tags, is_favorite, usage_count, last_used, source";
  const { data, error } = await supabase
    .from("scripts_templates")
    .insert({
      master_plan_id: masterPlanId,
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      item_type: body.itemType === "template" ? "template" : "script",
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "Sales",
      channel: typeof body.channel === "string" && body.channel.trim() ? body.channel.trim() : "sales",
      content,
      tags: Array.isArray(body.tags) ? body.tags.join(", ") : typeof body.tags === "string" ? body.tags : "",
      source: body.source === "ai" ? "ai" : "manual",
    })
    .select(sel)
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ item: shape(data as Row) });
}

// PATCH — edit fields, toggle favorite, or bump usage (action: "use").
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

  if (body.action === "use") {
    // Bump usage count + last used.
    const { data: cur } = await supabase
      .from("scripts_templates")
      .select("usage_count")
      .eq("id", id)
      .eq("master_plan_id", masterPlanId)
      .maybeSingle();
    update.usage_count = ((cur?.usage_count as number | undefined) ?? 0) + 1;
    update.last_used = new Date().toISOString();
  } else {
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (typeof body.content === "string" && body.content.trim()) update.content = body.content.trim();
    if (typeof body.category === "string" && body.category.trim()) update.category = body.category.trim();
    if (typeof body.channel === "string" && body.channel.trim()) update.channel = body.channel.trim();
    if (body.itemType === "script" || body.itemType === "template") update.item_type = body.itemType;
    if (typeof body.isFavorite === "boolean") update.is_favorite = body.isFavorite;
    if (Array.isArray(body.tags)) update.tags = body.tags.join(", ");
    else if (typeof body.tags === "string") update.tags = body.tags;
  }

  const { error } = await supabase
    .from("scripts_templates")
    .update(update)
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a script/template (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await supabase
    .from("scripts_templates")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);

  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
