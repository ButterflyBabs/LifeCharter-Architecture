import { NextResponse } from "next/server";
import { joinCommandSuiteCommunity } from "@/lib/community/commandSuiteMember";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sendTeamInvite } from "@/lib/email/teamInvite";
import { senderProfile } from "@/lib/email/accountSender";

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
    .select("id, master_plan_id, name")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws || ws.master_plan_id !== masterPlanId) return null;
  const { data: m } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, email, name, user_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (!m || m.workspace_id !== workspaceId) return null;
  return {
    supabase,
    masterPlanId: masterPlanId as string,
    workspaceName: (ws.name as string) || "their team",
    member: m as { id: string; email: string | null; name: string | null; user_id: string | null; role: string | null },
  };
}

// POST — create (or re-issue) a login for a team member, email them the invitation, and
// return the link too (so it can still be copied by hand). New logins get a set-password
// link (single-use, 7 days); someone who already has a LifeCharter login (Collective,
// Command Shift, LifeCharter Program) is told to sign in with their usual password instead.
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
  const { supabase, member, masterPlanId, workspaceName } = owned;

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
      // Email already has a login (one login everywhere) — find and reuse it.
      const { data: existingId } = await admin.rpc("auth_user_id_by_email", { p_email: email });
      userId = (existingId as string) || null;
    }
    if (!userId) {
      console.error("invite create user:", created.error?.message);
      return NextResponse.json({ error: "could not create the login" }, { status: 500 });
    }
  }

  // Team members join the Command Suite community space too (group coaching lives there).
  await joinCommandSuiteCommunity(admin, userId, member.name);

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

  // Someone who has signed in before already has a password; don't make them replace it.
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const hasLogin = Boolean(authUser?.user?.last_sign_in_at);
  const { data: plan } = await supabase.from("client_master_plans").select("client_name, client_email").eq("id", masterPlanId).maybeSingle();
  const inviterName = (plan?.client_name as string) && plan?.client_name !== "Primary" ? (plan!.client_name as string) : "AmiLynne Carroll";
  // Replies go to whoever added them: the client's own reply-to (or their account email); on the house
  // account, the owner's own address.
  const profile = await senderProfile(masterPlanId, supabase).catch(() => null);
  const ownerReply = profile && !profile.house ? profile.replyTo : (plan?.client_email as string) || "";
  const emailed = await sendTeamInvite({
    to: email,
    name: member.name,
    inviterName,
    workspaceName,
    role: member.role || "editor",
    link: hasLogin ? `${origin}/login` : url,
    hasLogin,
    base: origin,
    replyTo: ownerReply || null,
  });

  return NextResponse.json({ url, email, expiresAt, emailed, hasLogin });
}
