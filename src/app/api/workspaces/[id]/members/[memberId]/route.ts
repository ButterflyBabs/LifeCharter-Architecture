import { NextResponse } from "next/server";
import { cleanFeatureMap, PRESETS } from "@/lib/teamRoles";
import { createServerClient } from "@/lib/supabase/server";
import { isSuperAdmin, resolveActor } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { usageMonth } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "editor", "viewer", "sales"] as const;
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
  permissions?: { preset?: string | null; features?: unknown } | null;
  ai_monthly_cap?: number | null;
};

function serialize(m: MemberRow, aiUsed = 0) {
  return {
    id: m.id,
    name: m.name || "",
    email: m.email || "",
    role: (ROLES.includes((m.role || "") as Role) ? m.role : "editor") as Role,
    status: (m.status as string) || "active",
    avatar: m.avatar_url || null,
    joinedAt: m.joined_at || null,
    // Per-feature access (null = the role's defaults).
    access: m.permissions?.features ? { preset: m.permissions.preset ?? null, features: cleanFeatureMap(m.permissions.features) } : null,
    // Monthly AI cap on the owner's key (null = no cap) and this month's use.
    aiMonthlyCap: m.ai_monthly_cap ?? null,
    aiUsedThisMonth: aiUsed,
  };
}

const COLS = "id, workspace_id, name, email, role, status, avatar_url, joined_at, permissions, ai_monthly_cap";

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
  if (typeof body.role === "string" && ROLES.includes(body.role as Role)) {
    // Sales opens the owner's own sales page and contacts, so only the owner (super admin) may grant it.
    if (body.role === "sales" && !(await isSuperAdmin())) {
      return NextResponse.json({ error: "The Sales role isn't available for this account. Choose Admin, Editor or Viewer." }, { status: 400 });
    }
    update.role = body.role;
  }
  if (typeof body.avatar === "string" || body.avatar === null) update.avatar_url = body.avatar || null;
  if (typeof body.status === "string") update.status = body.status;
  // Per-feature access: { preset, features } to narrow the member, or null for the role's defaults.
  if (body.access === null) update.permissions = {};
  else if (body.access && typeof body.access === "object") {
    const features = cleanFeatureMap(body.access.features);
    if (!features) return NextResponse.json({ error: "Choose what they can reach." }, { status: 400 });
    const preset = PRESETS.some((p) => p.key === body.access.preset) ? body.access.preset : "custom";
    update.permissions = { preset, features };
  }

  // Monthly AI cap on the owner's key: a whole number of requests, or null for no cap.
  // Only the account owner decides how their key is spent (not an admin).
  if ("aiMonthlyCap" in body) {
    if ((await resolveActor()).kind === "member") {
      return NextResponse.json({ error: "Only the account owner can set AI limits." }, { status: 403 });
    }
    const raw = body.aiMonthlyCap;
    if (raw === null || raw === "") update.ai_monthly_cap = null;
    else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 100000) return NextResponse.json({ error: "Enter a monthly limit between 0 and 100,000, or leave it blank for no limit." }, { status: 400 });
      update.ai_monthly_cap = Math.floor(n);
    }
  }

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
  const { data: u } = await supabase.from("ai_member_usage").select("count").eq("member_id", params.memberId).eq("month", usageMonth()).maybeSingle();
  return NextResponse.json({ member: serialize(data as MemberRow, Number(u?.count) || 0) });
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
