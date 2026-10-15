import { createServerClient } from "@/lib/supabase/server";

// Accounts that must never receive the client-care emails or raise a "quiet client" task: the team (workspace
// members of the house account, e.g. Sumbal and Marcello) and the test personas, which are always named Eloise.
export async function internalEmails(db: ReturnType<typeof createServerClient>, housePlan: string): Promise<Set<string>> {
  const { data: ws } = await db.from("workspaces").select("id").eq("master_plan_id", housePlan);
  const ids = (ws ?? []).map((w) => w.id as string);
  if (!ids.length) return new Set();
  const { data } = await db.from("workspace_members").select("email").in("workspace_id", ids);
  return new Set(((data ?? []) as { email: string | null }[]).map((m) => (m.email || "").toLowerCase()).filter(Boolean));
}

export function isInternalClient(c: { name: string | null; email: string | null }, team: Set<string>): boolean {
  const email = (c.email || "").toLowerCase();
  return team.has(email) || /eloise/i.test(c.name || "") || /eloise/i.test(email);
}
