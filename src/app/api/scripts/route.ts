import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity, q } from "@/lib/activity";
import { PLATFORM_IDS } from "@/lib/scriptsSeed";

const platformsOf = (v: unknown) => (Array.isArray(v) ? Array.from(new Set(v.map(String).filter((x) => PLATFORM_IDS.includes(x)))) : null);

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
  platforms: string[] | null;
  status: string | null;
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
    platforms: r.platforms ?? [],
    status: (r.status === "draft" ? "draft" : "approved") as "draft" | "approved",
  };
}

// GET — this client's own saved scripts & templates (the shared starter library
// is browsed separately and copied in with POST).
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ items: [] });

  const sel =
    "id, title, description, item_type, category, channel, content, tags, is_favorite, usage_count, last_used, source, platforms, status";

  // ?status=approved is what the DM screens use, so a draft is never offered for sending.
  const only = new URL(request.url).searchParams.get("status");
  let query = supabase.from("scripts_templates").select(sel).eq("master_plan_id", masterPlanId);
  if (only === "approved" || only === "draft") query = query.eq("status", only);
  const { data } = await query.order("is_favorite", { ascending: false }).order("created_at", { ascending: true });

  const rows = (data || []) as Row[];

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

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 20000) : "";
  if (!title || !content) return NextResponse.json({ error: "Title and content are required." }, { status: 400 });

  const sel =
    "id, title, description, item_type, category, channel, content, tags, is_favorite, usage_count, last_used, source, platforms, status";
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
      source: body.source === "ai" ? "ai" : body.source === "library" ? "library" : "manual",
      platforms: platformsOf(body.platforms) ?? [],
    })
    .select(sel)
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  await logActivity({ masterPlanId, action: "created", entityType: "script", entityId: (data as { id?: string })?.id, summary: `Added ${body.itemType === "template" ? "template" : "script"} ${q(title)}` });
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
  if (!id && body.action !== "approve-all") return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Approve a draft. A "DRAFT · Name" that replaces an approved "Name" updates that one (keeping its stars and use
  // count) and the draft is removed; otherwise the draft itself becomes approved under its plain name.
  if (body.action === "approve" || body.action === "approve-all") {
    if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
    const ids: string[] = body.action === "approve-all" ? [] : [id];
    if (body.action === "approve-all") {
      // Only the drafts the person was looking at (their ids), never every draft in the account.
      const want = Array.isArray(body.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string").slice(0, 100) : [];
      if (want.length) {
        const { data: all } = await supabase.from("scripts_templates").select("id").eq("master_plan_id", masterPlanId).eq("status", "draft").in("id", want);
        for (const r of (all ?? []) as { id: string }[]) ids.push(r.id);
      }
    }
    let approved = 0;
    for (const did of ids) {
      const { data: d } = await supabase.from("scripts_templates").select("id, title, content, channel, platforms, tags, category, item_type").eq("id", did).eq("master_plan_id", masterPlanId).eq("status", "draft").maybeSingle();
      if (!d) continue;
      const base = String(d.title).replace(/^DRAFT\s*·\s*/i, "");
      const { data: orig } = await supabase.from("scripts_templates").select("id").eq("master_plan_id", masterPlanId).eq("title", base).eq("status", "approved").maybeSingle();
      if (orig?.id) {
        await supabase.from("scripts_templates").update({ content: d.content, channel: d.channel, platforms: d.platforms, tags: d.tags, category: d.category, item_type: d.item_type, updated_at: new Date().toISOString() }).eq("id", orig.id);
        await supabase.from("scripts_templates").delete().eq("id", d.id);
      } else {
        await supabase.from("scripts_templates").update({ title: base, status: "approved", description: "", updated_at: new Date().toISOString() }).eq("id", d.id);
      }
      approved++;
    }
    await logActivity({ masterPlanId, action: "updated", entityType: "script", entityId: id || undefined, summary: `Approved ${approved} draft script${approved === 1 ? "" : "s"}` });
    return NextResponse.json({ ok: true, approved });
  }

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
    const plats = platformsOf(body.platforms);
    if (plats) update.platforms = plats;
    if (Array.isArray(body.tags)) update.tags = body.tags.join(", ");
    else if (typeof body.tags === "string") update.tags = body.tags;
  }

  const { data: saved, error } = await supabase
    .from("scripts_templates")
    .update(update)
    .eq("id", id)
    .eq("master_plan_id", masterPlanId)
    .select("id, title");

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  // Using a script or starring it isn't worth a line in the log; edits are.
  const edited = body.action !== "use" && Object.keys(update).some((k) => k !== "updated_at" && k !== "is_favorite");
  if (edited && saved?.[0]) await logActivity({ masterPlanId, action: "updated", entityType: "script", entityId: id, summary: `Updated script ${q(saved[0].title)}` });
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

  const { data: gone, error } = await supabase
    .from("scripts_templates")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId)
    .select("id, title");

  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  if (gone?.[0]) await logActivity({ masterPlanId, action: "deleted", entityType: "script", entityId: id, summary: `Deleted script ${q(gone[0].title)}` });
  return NextResponse.json({ ok: true });
}
