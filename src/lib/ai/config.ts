import { authEnabled, hasOwnAccount, isOwnerEmail, prefersTeamAccount, sessionUser, superAdminEmails } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_ASSISTANT_NAME } from "@/lib/ai/defaults";
import { switcherAllowed } from "@/lib/accountSwitcher";
import { rememberKey } from "@/lib/ai/meter";

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
    // Someone who switched into a team account (lc_acct) runs AI on that account's owner, not their own.
    const inTeam = !isOwner && prefersTeamAccount() && switcherAllowed(user.email);
    const { data: own } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (own?.id && !inTeam) return { profileId: own.id as string, canEdit: true, isOwner };

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
    // Asked for the team account but not (any longer) a member: fall back to their own account.
    if (own?.id) return { profileId: own.id as string, canEdit: true, isOwner };
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
  const key = ((data as string | null) || "").trim();
  rememberKey(key, profileId); // so the usage of this key is metered against this account
  return key;
}

// The house owner's profile, for a signed-in member of the house team workspace who owns no account of their own.
// The house workspace has no owner row: its plan belongs to the super admin (the same test houseFeatureLevel uses).
// Anyone else (a client, a member of a client's workspace, someone with their own account) gets null.
async function houseTeamProfileFor(): Promise<{ id: string; name: string; instructions: string; notes: string } | null> {
  try {
    const user = await sessionUser();
    if (!user?.email || isOwnerEmail(user.email)) return null;
    if (await hasOwnAccount(user.id)) return null;
    const db = createServerClient();
    const { data: m } = await db.from("workspace_members").select("workspace_id").ilike("email", user.email).eq("status", "active").maybeSingle();
    if (!m?.workspace_id) return null;
    const { data: ws } = await db.from("workspaces").select("master_plan_id").eq("id", m.workspace_id).maybeSingle();
    if (!ws?.master_plan_id) return null;
    const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", ws.master_plan_id).maybeSingle();
    const ownerEmail = ((plan?.client_email as string | undefined) || "").toLowerCase();
    if (!ownerEmail || !superAdminEmails().includes(ownerEmail)) return null;
    const { data: p } = await db.from("profiles").select("id, assistant_name, assistant_instructions, assistant_notes").ilike("email", ownerEmail).maybeSingle();
    if (!p?.id) return null;
    return {
      id: p.id as string,
      name: ((p.assistant_name as string) || "").trim(),
      instructions: ((p.assistant_instructions as string) || "").trim(),
      notes: ((p.assistant_notes as string) || "").trim(),
    };
  } catch {
    return null;
  }
}

export async function resolveAiConfig(): Promise<{ name: string; key: string; instructions: string; notes: string }> {
  const envKey = process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  try {
    const account = await resolveAiAccount();
    let name = DEFAULT_ASSISTANT_NAME;
    let instructions = "";
    let notes = "";
    if (account.profileId) {
      const { data } = await createServerClient()
        .from("profiles")
        .select("assistant_name, assistant_instructions, assistant_notes")
        .eq("id", account.profileId)
        .maybeSingle();
      name = ((data?.assistant_name as string) || "").trim() || name;
      instructions = ((data?.assistant_instructions as string) || "").trim();
      notes = ((data?.assistant_notes as string) || "").trim();
    }
    const own = await readAccountKey(account.profileId);
    if (!own && account.isOwner) rememberKey(envKey, account.profileId);
    if (!own && !account.isOwner) {
      // A member of the house team (Sumbal, Morgan) has a login profile that owns nothing, so it has no key. They work
      // in the house account, so the house owner's AI is the one that runs (counted against their monthly cap).
      const house = await houseTeamProfileFor();
      if (house) {
        const houseKey = await readAccountKey(house.id);
        if (houseKey) return { name: house.name || name, key: houseKey, instructions: house.instructions, notes: house.notes };
      }
    }
    return { name, key: own || (account.isOwner ? envKey : ""), instructions, notes };
  } catch (e) {
    console.error("resolveAiConfig:", e);
    return { name: DEFAULT_ASSISTANT_NAME, key: "", instructions: "", notes: "" };
  }
}

export async function resolveOpenAiKey(): Promise<string> {
  return (await resolveAiConfig()).key;
}
