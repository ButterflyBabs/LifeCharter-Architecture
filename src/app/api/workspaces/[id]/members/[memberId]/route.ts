import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];

type MemberRow = {
  id: string;
  workspace_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  avatar_url: string | null;
  joined_at: string | null;
};

function serialize(m: MemberRow) {
  return {
    id: m.id,
    name: m.name || "",
    email: m.email || "",
    role: (ROLES.includes((m.role || "") as Role) ? m.role : "editor") as Role,
    status: (m.status as string) || "active",
    avatar: m.avatar_url || null,
    joinedAt: m.joined_at || null,
  };
}

const COLS = "id, workspace_id, name, email, role, status, avatar_url, joined_at";

// Confirms the member belongs to a workspace owned by the current client.
async function ownedMember(workspaceId: string, memberId: string) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, master_plan_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws || ws.master_plan_id !== masterPlanId) return null;
  const { data: m } = await supabase
    .from("workspace_members")
    .select("id, workspace_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!m || m.workspace_id !== workspaceId) return null;
  return supabase;
}

// PATCH — update a member's name, role, avatar, or status.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = await ownedMember(params.id, params.memberId);
  if (!supabase) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name.trim();
  if (typeof body.role === "string" && ROLES.includes(body.role as Role)) update.role = body.role;
  if (typeof body.avatar === "string" || body.avatar === null) update.avatar_url = body.avatar || null;
  if (typeof body.status === "string") update.status = body.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .update(update)
    .eq("id", params.memberId)
    .select(COLS)
    .single();

  if (error) {
    console.error("PATCH member:", error.message);
    return NextResponse.json({ error: "could not save member" }, { status: 500 });
  }
  return NextResponse.json({ member: serialize(data as MemberRow) });
}

// DELETE — remove a member from the workspace.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = await ownedMember(params.id, params.memberId);
  if (!supabase) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", params.memberId);
  if (error) {
    console.error("DELETE member:", error.message);
    return NextResponse.json({ error: "could not remove member" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
