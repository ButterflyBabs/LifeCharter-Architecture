import { createServerClient } from "@/lib/supabase/server";

/**
 * Single-user helper: fetch the one active client master plan, creating it if
 * none exists. The app currently runs single-user with auth off, so we key on a
 * stable client_name rather than an authenticated user id. When multi-user auth
 * lands, this is the seam to swap for a per-user lookup.
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
