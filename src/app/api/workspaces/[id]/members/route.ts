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

// Confirms the workspace exists and belongs to the current client.
async function ownedWorkspace(id: string) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data } = await supabase
    .from("workspaces")
    .select("id, master_plan_id")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.master_plan_id !== masterPlanId) return null;
  return supabase;
}

// GET — list a workspace's invited team members (owner is rendered client-side
// from the account profile, so it's not stored here).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await ownedWorkspace(params.id);
  if (!supabase) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("workspace_members")
    .select(COLS)
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET members:", error.message);
    return NextResponse.json({ error: "could not load members" }, { status: 500 });
  }
  return NextResponse.json({ members: ((data || []) as MemberRow[]).map(serialize) });
}

// POST — invite/add a member.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = await ownedWorkspace(params.id);
  if (!supabase) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const email = (typeof body.email === "string" ? body.email.trim() : "").toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const role: Role = ROLES.includes(body.role as Role) ? (body.role as Role) : "editor";
  const name =
    (typeof body.name === "string" && body.name.trim()) || email.split("@")[0];

  const { data, error } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: params.id,
      name,
      email,
      role,
      status: "pending",
    })
    .select(COLS)
    .single();

  if (error) {
    console.error("POST members:", error.message);
    return NextResponse.json({ error: "could not add member" }, { status: 500 });
  }
  return NextResponse.json({ member: serialize(data as MemberRow) });
}
