import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Shape returned to the client. socials is always an object.
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

// GET — list the current client's workspaces (scoped by master plan). Seeds a
// default workspace the first time so the page always has something to edit.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const { data, error } = await supabase
    .from("workspaces")
    .select(COLS)
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET /api/workspaces:", error.message);
    return NextResponse.json({ error: "could not load workspaces" }, { status: 500 });
  }

  let rows = (data || []) as WorkspaceRow[];

  // First visit: seed a default workspace so the UI has a row to edit.
  if (rows.length === 0) {
    const { data: seeded, error: seedErr } = await supabase
      .from("workspaces")
      .insert({
        master_plan_id: masterPlanId,
        name: "My Workspace",
        is_default: true,
        sort_order: 0,
        socials: {},
      })
      .select(COLS)
      .single();
    if (seedErr) {
      console.error("seed workspace:", seedErr.message);
      return NextResponse.json({ error: "could not create workspace" }, { status: 500 });
    }
    rows = [seeded as WorkspaceRow];
  }

  return NextResponse.json({ workspaces: rows.map(serialize) });
}

// POST — create a new workspace for this client.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const name = (typeof body.name === "string" && body.name.trim()) || "New Workspace";

  // Append after existing workspaces.
  const { data: last } = await supabase
    .from("workspaces")
    .select("sort_order")
    .eq("master_plan_id", masterPlanId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last?.sort_order as number) ?? -1) + 1;

  // Any existing rows? If not, the new one becomes the default.
  const { count } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("master_plan_id", masterPlanId);

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      master_plan_id: masterPlanId,
      name,
      is_default: (count ?? 0) === 0,
      sort_order: sortOrder,
      socials: {},
    })
    .select(COLS)
    .single();

  if (error) {
    console.error("POST /api/workspaces:", error.message);
    return NextResponse.json({ error: "could not create workspace" }, { status: 500 });
  }

  return NextResponse.json({ workspace: serialize(data as WorkspaceRow) });
}
