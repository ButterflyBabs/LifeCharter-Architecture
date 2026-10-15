import { createServerClient } from "@/lib/supabase/server";
import { sessionUser, ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { normEmail } from "@/lib/teamHuddle";

export interface HuddleAccess {
  email: string;
  owner: boolean;
  canEdit: boolean;
  planId: string;
}

/**
 * Who is asking? Babs (the Alignment Architect) can do everything. Anyone else needs a row in
 * team_huddle_access (added by Babs by email); can_edit decides whether they may change the agenda.
 * Returns null when the person has no access, so the page and API answer "not found".
 */
export async function huddleAccess(): Promise<HuddleAccess | null> {
  const user = await sessionUser();
  const email = normEmail(user?.email);
  if (!email) return null;
  const db = createServerClient();
  const planId = await housePlanId(db);
  if (!planId) return null;
  if (email === ALIGNMENT_ARCHITECT_EMAIL) return { email, owner: true, canEdit: true, planId };
  const { data } = await db.from("team_huddle_access").select("email, can_edit").eq("email", email).eq("master_plan_id", planId).maybeSingle();
  if (!data) return null;
  return { email, owner: false, canEdit: data.can_edit === true, planId };
}
