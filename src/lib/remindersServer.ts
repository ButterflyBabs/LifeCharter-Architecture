import { createServerClient } from "@/lib/supabase/server";
import { resolveActor, sessionUser } from "@/lib/authz";
import { cleanExtras } from "@/lib/teamRoles";

// Whose reminders the signed-in person may see. A team member whose access says "only their own" sees just the
// reminders they made (own = their login id). Everyone else sees the account's reminders except the ones made by
// such members (hide = those logins), so a team member's private reminders never land on the owner's list.
export async function reminderViewer(planId: string): Promise<{ own: string | null; hide: string[]; me: string | null }> {
  const [user, actor] = await Promise.all([sessionUser().catch(() => null), resolveActor().catch(() => null)]);
  const me = user?.id ?? null;
  if (actor?.kind === "member" && cleanExtras((actor.permissions as unknown as { extras?: unknown } | null)?.extras)?.ownOnly) {
    return { own: me ?? "none", hide: [], me };
  }
  const db = createServerClient();
  const { data: ws } = await db.from("workspaces").select("id").eq("master_plan_id", planId);
  const ids = (ws ?? []).map((w) => w.id as string);
  if (!ids.length) return { own: null, hide: [], me };
  const { data: mem } = await db.from("workspace_members").select("user_id, permissions").in("workspace_id", ids).not("user_id", "is", null);
  const hide = ((mem ?? []) as { user_id: string; permissions: { extras?: unknown } | null }[])
    .filter((m) => m.user_id !== me && cleanExtras(m.permissions?.extras)?.ownOnly)
    .map((m) => m.user_id);
  return { own: null, hide, me };
}

// Logins of the account's team members whose reminders are their own (kept off the owner's lists and bell).
export async function ownOnlyMemberLogins(planId: string): Promise<string[]> {
  const db = createServerClient();
  const { data: ws } = await db.from("workspaces").select("id").eq("master_plan_id", planId);
  const ids = (ws ?? []).map((w) => w.id as string);
  if (!ids.length) return [];
  const { data: mem } = await db.from("workspace_members").select("user_id, permissions").in("workspace_id", ids).not("user_id", "is", null);
  return ((mem ?? []) as { user_id: string; permissions: { extras?: unknown } | null }[]).filter((m) => cleanExtras(m.permissions?.extras)?.ownOnly).map((m) => m.user_id);
}
