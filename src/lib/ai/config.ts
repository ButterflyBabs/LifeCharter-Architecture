import { authEnabled, isOwnerEmail, sessionUser, superAdminEmails } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";

// Every Command Suite account connects its own AI. This resolves whose account
// a request belongs to and returns that account's assistant name + OpenAI key
// (kept encrypted in Supabase Vault, read server-side only).
//
//   • signed in                → their own profile; an invited team member
//                                uses the account (workspace) owner's profile
//   • not signed in, auth off  → the owner (single-user mode)
//
// The house key (OPENAI_API_KEY env) is only ever a fallback for the owner —
// never for anyone else, so no member runs on someone else's key or bill.

export interface AiAccount {
  profileId: string | null; // whose AI settings apply
  canEdit: boolean; // may this person change them? (team members can't)
  isOwner: boolean; // the super admin — may fall back to the house key
}

export async function resolveAiAccount(): Promise<AiAccount> {
  const supabase = createServerClient();
  const user = await sessionUser();

  if (user) {
    const isOwner = isOwnerEmail(user.email);
    const { data: own } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (own?.id) return { profileId: own.id as string, canEdit: true, isOwner };

    // An invited team member works inside someone else's account.
    if (user.email) {
      const { data: m } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .ilike("email", user.email)
        .eq("status", "active")
        .maybeSingle();
      if (m?.workspace_id) {
        const { data: ws } = await supabase.from("workspaces").select("owner_id").eq("id", m.workspace_id).maybeSingle();
        if (ws?.owner_id) return { profileId: ws.owner_id as string, canEdit: false, isOwner: false };
      }
    }
    // Signed in without a Command Suite account (e.g. Collective-only).
    return { profileId: null, canEdit: false, isOwner };
  }

  if (authEnabled()) return { profileId: null, canEdit: false, isOwner: false };

  // Single-user mode: the owner, found by email rather than "first row".
  const emails = superAdminEmails();
  const q = supabase.from("profiles").select("id").order("created_at").limit(1);
  const { data: owner } = emails.length ? await q.in("email", emails).maybeSingle() : await q.maybeSingle();
  return { profileId: (owner?.id as string) ?? null, canEdit: true, isOwner: true };
}

export async function readAccountKey(profileId: string | null): Promise<string> {
  if (!profileId) return "";
  const { data, error } = await createServerClient().rpc("get_account_ai_key", { p_user: profileId });
  if (error) console.error("get_account_ai_key:", error.message);
  return ((data as string | null) || "").trim();
}

export async function resolveAiConfig(): Promise<{ name: string; key: string }> {
  const envKey = process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  try {
    const account = await resolveAiAccount();
    let name = "Mariposa";
    if (account.profileId) {
      const { data } = await createServerClient().from("profiles").select("assistant_name").eq("id", account.profileId).maybeSingle();
      name = ((data?.assistant_name as string) || "").trim() || name;
    }
    const own = await readAccountKey(account.profileId);
    return { name, key: own || (account.isOwner ? envKey : "") };
  } catch (e) {
    console.error("resolveAiConfig:", e);
    return { name: "Mariposa", key: "" };
  }
}

export async function resolveOpenAiKey(): Promise<string> {
  return (await resolveAiConfig()).key;
}
