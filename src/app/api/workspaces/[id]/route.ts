import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

type WorkspaceRow = {
  id: string;
  master_plan_id: string | null;
  name: string | null;
  slug: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  socials: Record<string, string> | null;
  is_default: boolean | null;
  sort_order: number | null;
};

function serialize(w: WorkspaceRow) {
  return {
    id: w.id,
    name: w.name || "My Workspace",
    slug: w.slug || "",
    description: w.description || "",
    website: w.website || "",
    logo: w.logo_url || null,
    isDefault: Boolean(w.is_default),
    sortOrder: w.sort_order ?? 0,
    socials: (w.socials as Record<string, string>) || {},
  };
}

const COLS =
  "id, master_plan_id, name, slug, description, website, logo_url, socials, is_default, sort_order";

// Normalize a URL slug: lowercase, spaces→hyphens, strip anything unsafe.
function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// PATCH — update editable fields on a workspace. Enforces slug uniqueness and
// keeps exactly one default per client.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  // Confirm the workspace belongs to this client before touching it.
  const { data: current } = await supabase
    .from("workspaces")
    .select("id, master_plan_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!current || current.master_plan_id !== masterPlanId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") update.name = body.name.trim() || "My Workspace";
  if (typeof body.slug === "string") update.slug = normalizeSlug(body.slug);
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.website === "string") update.website = body.website.trim();
  if (typeof body.logo === "string" || body.logo === null) update.logo_url = body.logo || null;
  if (body.socials && typeof body.socials === "object") {
    // Drop blank entries so the stored object stays tidy.
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.socials as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) cleaned[k] = v.trim();
    }
    update.socials = cleaned;
  }

  // Setting this workspace as default clears the flag on the client's others.
  const makeDefault = body.isDefault === true;
  if (makeDefault) {
    await supabase
      .from("workspaces")
      .update({ is_default: false })
      .eq("master_plan_id", masterPlanId);
    update.is_default = true;
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update(update)
    .eq("id", params.id)
    .select(COLS)
    .single();

  if (error) {
    // 23505 = unique_violation (the slug is taken).
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "That URL slug is already taken — please choose another." },
        { status: 409 }
      );
    }
    console.error("PATCH /api/workspaces/[id]:", error.message);
    return NextResponse.json({ error: "could not save workspace" }, { status: 500 });
  }

  return NextResponse.json({ workspace: serialize(data as WorkspaceRow) });
}

// DELETE — remove a workspace. Refuses to delete the client's last one, and
// promotes another to default if the deleted one was the default.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const { data: rows } = await supabase
    .from("workspaces")
    .select("id, is_default")
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: true });

  const all = (rows || []) as { id: string; is_default: boolean | null }[];
  const target = all.find((w) => w.id === params.id);
  if (!target) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (all.length <= 1) {
    return NextResponse.json(
      { error: "You must keep at least one workspace." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("workspaces").delete().eq("id", params.id);
  if (error) {
    console.error("DELETE /api/workspaces/[id]:", error.message);
    return NextResponse.json({ error: "could not delete workspace" }, { status: 500 });
  }

  // If we removed the default, promote the first remaining workspace.
  if (target.is_default) {
    const next = all.find((w) => w.id !== params.id);
    if (next) {
      await supabase.from("workspaces").update({ is_default: true }).eq("id", next.id);
    }
  }

  return NextResponse.json({ ok: true });
}
