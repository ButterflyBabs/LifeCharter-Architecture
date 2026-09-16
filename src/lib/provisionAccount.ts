import { createClient as createServiceClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Only ever used server-side (webhook,
// checkout-confirm route), never exposed to the browser.
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Idempotent: safe to call twice for the same email (e.g. once from the
 * browser success-page confirm, once from the async Stripe webhook —
 * whichever lands first wins, the other just updates the plan).
 *
 * Mirrors the account-creation sequence already used by demo-setup
 * (workspace -> auth user -> profile -> client_master_plan), swapped from
 * demo data to the real paying customer's details.
 */
export async function provisionAccountForEmail(
  email: string,
  planId: string,
  fullName?: string | null
): Promise<{ userId: string; workspaceId: string | null; isNewAccount: boolean }> {
  const supabase = serviceClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, workspace_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    const update: Record<string, unknown> = {
      current_plan_id: planId,
      subscription_status: "pending_implementation",
    };
    // Don't blank out a name that's already on file with an empty resubmit.
    if (fullName?.trim()) update.full_name = fullName.trim();
    await supabase.from("profiles").update(update).eq("id", existingProfile.id);
    return { userId: existingProfile.id, workspaceId: existingProfile.workspace_id, isNewAccount: false };
  }

  const workspaceSlug = "ws-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  const displayName = fullName?.trim() || normalizedEmail.split("@")[0];

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: `${displayName}'s Workspace`, slug: workspaceSlug, is_default: true })
    .select("id")
    .single();

  if (wsError || !workspace) {
    throw new Error(`Failed to create workspace: ${wsError?.message}`);
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  });

  if (authError || !authUser?.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }
  const userId = authUser.user.id;

  // Back-fill the workspace's owner now that the user exists.
  await supabase.from("workspaces").update({ owner_id: userId }).eq("id", workspace.id);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: normalizedEmail,
    full_name: displayName,
    current_plan_id: planId,
    subscription_status: "pending_implementation",
  });

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  const { error: planError } = await supabase.from("client_master_plans").insert({
    workspace_id: workspace.id,
    user_id: userId,
    client_name: displayName,
    client_email: normalizedEmail,
    status: "active",
  });

  if (planError) {
    // Non-fatal: the account and workspace exist either way, and this
    // table's own trigger/UI code re-creates a plan on first real use.
    console.error("client_master_plans creation failed (non-fatal):", planError.message);
  }

  return { userId, workspaceId: workspace.id, isNewAccount: true };
}
