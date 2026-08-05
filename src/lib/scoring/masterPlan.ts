import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { authEnabled, sessionUser, isOwnerEmail } from "@/lib/authz";

// The seeded demo workspace. When the lc_demo cookie is set, every data route
// resolves to this plan so the whole app shows sample data for sales/training.
export const DEMO_PLAN_NAME = "Demo — Brand Alchemy Studio";

async function demoMasterPlanId(): Promise<string | null> {
  try {
    const store = cookies();
    if (store.get("lc_demo")?.value !== "1") return null;
  } catch {
    return null; // cookies() unavailable outside a request scope
  }
  const supabase = createServerClient();
  const { data } = await supabase
    .from("client_master_plans")
    .select("id")
    .eq("client_name", DEMO_PLAN_NAME)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

/**
 * Single-user helper: fetch the one active client master plan, creating it if
 * none exists. Used when auth is OFF — keyed on a stable client_name rather than
 * an authenticated user id.
 */
const PRIMARY_NAME = "Primary";

export async function getOrCreatePrimaryMasterPlan(): Promise<string | null> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("client_master_plans")
    .select("id")
    .eq("client_name", PRIMARY_NAME)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("client_master_plans")
    .insert({ client_name: PRIMARY_NAME, status: "active" })
    .select("id")
    .single();

  if (error) {
    console.error("getOrCreatePrimaryMasterPlan:", error.message);
    return null;
  }
  return created.id as string;
}

/**
 * The seam for per-client data. This is what every data route should call.
 *
 * - Auth OFF  → the single shared 'Primary' plan (today's behavior, unchanged).
 * - Auth ON   → the signed-in user's OWN master plan:
 *     1. their existing plan (by user_id), else
 *     2. if they're the owner, claim the unclaimed 'Primary' plan so all the
 *        data built during single-user mode carries over to their account, else
 *     3. a fresh plan for this client.
 *
 * Returns null when auth is on but nobody is signed in (middleware should have
 * blocked the request already; this is defense in depth).
 */
export async function resolveMasterPlanId(): Promise<string | null> {
  // Demo mode overrides everything — the whole app shows the seeded demo data.
  const demo = await demoMasterPlanId();
  if (demo) return demo;

  if (!authEnabled()) return getOrCreatePrimaryMasterPlan();

  const user = await sessionUser();
  if (!user) return null;

  const supabase = createServerClient();

  // A master plan's user_id references profiles(id), so the profile row must
  // exist before we can claim/create a plan for this user. Ensure it (there's
  // no signup trigger creating it).
  await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

  // 1. Their own plan.
  const { data: mine } = await supabase
    .from("client_master_plans")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (mine?.id) return mine.id as string;

  // 2. Owner claims the existing unclaimed 'Primary' plan (carries its data).
  if (isOwnerEmail(user.email)) {
    const { data: primary } = await supabase
      .from("client_master_plans")
      .select("id")
      .is("user_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (primary?.id) {
      const { error: claimErr } = await supabase
        .from("client_master_plans")
        .update({ user_id: user.id, client_email: user.email })
        .eq("id", primary.id);
      if (claimErr) console.error("resolveMasterPlanId claim:", claimErr.message);
      return primary.id as string;
    }
  }

  // 2.5 Team member: scope them to the OWNER's master plan (they work inside the
  // owner's data, limited later by their role). A member has no plan of their own.
  {
    const email = (user.email ?? "").toLowerCase();
    if (email) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id, status")
        .ilike("email", email)
        .in("status", ["active", "pending"])
        .maybeSingle();
      if (member?.workspace_id) {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("master_plan_id")
          .eq("id", member.workspace_id)
          .maybeSingle();
        if (ws?.master_plan_id) return ws.master_plan_id as string;
      }
    }
  }

  // 3. A fresh plan for this client.
  const { data: created, error } = await supabase
    .from("client_master_plans")
    .insert({
      client_name: user.email ?? "Client",
      client_email: user.email,
      user_id: user.id,
      status: "active",
    })
    .select("id")
    .single();
  if (error) {
    console.error("resolveMasterPlanId create:", error.message);
    return null;
  }
  return created.id as string;
}
