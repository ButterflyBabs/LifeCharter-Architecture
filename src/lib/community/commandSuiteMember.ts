import type { SupabaseClient } from "@supabase/supabase-js";

// Every Command Suite client (and every member of a client's team) belongs to the Collective's
// private "LifeCharter Command Suite" space, where group coaching and its Events live
// (Babs, 2026-09-28). Called with a service-role client when an account is provisioned or a
// team member is invited. Idempotent, and never throws: community access must not break a
// checkout or an invite.
export const COMMAND_SUITE_SPACE_SLUG = "command-suite";

export async function joinCommandSuiteCommunity(supabase: SupabaseClient, userId: string, name?: string | null): Promise<boolean> {
  try {
    // Collective profile + the default spaces everyone gets.
    const { error: ensureErr } = await supabase.rpc("cm_ensure_member", { p_user: userId, p_name: name || "" });
    if (ensureErr) throw ensureErr;
    const { data: space } = await supabase.from("cm_spaces").select("id").eq("slug", COMMAND_SUITE_SPACE_SLUG).eq("archived", false).maybeSingle();
    if (!space) return false;
    const { error } = await supabase
      .from("cm_space_members")
      .upsert({ space_id: space.id, user_id: userId, joined_via: "admin" }, { onConflict: "space_id,user_id", ignoreDuplicates: true });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("joinCommandSuiteCommunity:", (e as Error).message);
    return false;
  }
}
