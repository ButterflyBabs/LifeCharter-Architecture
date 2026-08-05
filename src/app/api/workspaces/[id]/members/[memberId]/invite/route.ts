import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Service-role auth-admin client (for creating/updating the member's login).
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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
    .select("id, workspace_id, email, name, user_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!m || m.workspace_id !== workspaceId) return null;
  return { supabase, member: m as { id: string; email: string | null; name: string | null; user_id: string | null } };
}

// POST — create (or re-issue) a login for a team member and return a link the
// owner delivers themselves. No email is sent. The link lets the member set a
// password and sign in; it expires in 7 days and is single-use.
export async function POST(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 500 });
  }

  const owned = await ownedMember(params.id, params.memberId);
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { supabase, member } = owned;

  const email = (member.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "member has no email" }, { status: 400 });

  const admin = adminClient();

  // Ensure an auth user exists for this member, reusing one where possible.
  let userId = member.user_id || null;
  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      // Placeholder password; replaced when the member accepts the invite.
      password: crypto.randomBytes(24).toString("base64url"),
      user_metadata: { full_name: member.name || "" },
    });
    if (created.data?.user?.id) {
      userId = created.data.user.id;
    } else if (created.error?.message?.toLowerCase().includes("already been registered")) {
      // Email already has an auth user — find and reuse it.
      const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.data?.users?.find((u) => (u.email || "").toLowerCase() === email);
      userId = existing?.id || null;
    }
    if (!userId) {
      console.error("invite create user:", created.error?.message);
      return NextResponse.json({ error: "could not create the login" }, { status: 500 });
    }
  }

  // Mint a single-use token; store only its hash.
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { error: upErr } = await supabase
    .from("workspace_members")
    .update({ user_id: userId, invite_token_hash: tokenHash, invite_expires_at: expiresAt })
    .eq("id", member.id);
  if (upErr) {
    console.error("invite store token:", upErr.message);
    return NextResponse.json({ error: "could not create the login" }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const url = `${origin}/accept-invite?token=${token}`;

  return NextResponse.json({ url, email, expiresAt });
}
