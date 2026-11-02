import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect, resolveActor, sessionUser, viewedMember } from "@/lib/authz";
import { isHousePlan } from "@/lib/housePlan";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { cleanExtras, cleanFeatureMap, featurePageRedirect, memberPageRedirect, restrictedPageRedirect, type AccessExtras, type FeatureMap } from "@/lib/teamRoles";
import { academyOpenFor } from "./flag";
import { trackFor } from "./rules";
import { TRACK_LABELS, type LearnerTrack } from "./types";

// Who is taking the Academy right now, and on which path. Babs previews every path and may open any lesson.
export interface Learner {
  userId: string;
  email: string | null;
  name: string;
  planId: string;
  track: LearnerTrack;
  required: boolean; // team members must finish; clients choose
  preview: boolean;
  viewingAs: boolean; // Babs using "View as team member": she can look, nothing is saved
  canSeePeople: boolean;
  role: string | null;
  features: FeatureMap | null;
  extras: AccessExtras | null;
}

export async function memberOfHouse(workspaceId: string | null): Promise<boolean> {
  if (!workspaceId) return false;
  const db = createServerClient();
  const { data } = await db.from("workspaces").select("master_plan_id").eq("id", workspaceId).maybeSingle();
  return Boolean(data?.master_plan_id) && isHousePlan(data?.master_plan_id as string, db);
}

export async function academyLearner(trackParam?: string | null): Promise<Learner | null> {
  const [user, architect, actor, vm, planId] = await Promise.all([sessionUser(), isAlignmentArchitect(), resolveActor(), viewedMember(), resolveMasterPlanId()]);
  if (!user || !planId) return null;
  const member = actor.kind === "member";
  const houseMember = member && (await memberOfHouse(actor.workspaceId));
  if (!academyOpenFor(user.email, architect && !vm, houseMember)) return null;
  const perms = actor.permissions as unknown as { features?: unknown; extras?: unknown };
  const features = member ? cleanFeatureMap(perms.features) : null;
  const extras = member ? cleanExtras(perms.extras) : null;
  const preview = architect && !member;
  const asked = trackParam && trackParam in TRACK_LABELS ? (trackParam as LearnerTrack) : "client";
  const { data: profile } = await createServerClient().from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  return {
    userId: user.id,
    email: user.email,
    name: (profile?.full_name as string | null)?.trim() || user.email || "Learner",
    planId,
    track: preview ? asked : trackFor({ houseMember, role: actor.role, salesReference: (features?.sales_reference ?? "none") !== "none" }),
    required: houseMember,
    preview,
    viewingAs: Boolean(vm),
    canSeePeople: preview || !member || actor.role === "admin",
    role: actor.role,
    features,
    extras,
  };
}

/** A "try it" link is only offered for a page this person can actually open. */
export function canOpen(l: Learner, href: string): boolean {
  if (l.preview || (!l.role && !l.features && !l.extras)) return true;
  const path = href.split("?")[0];
  return !memberPageRedirect(l.role, path) && !featurePageRedirect(l.features, path, l.extras) && !restrictedPageRedirect(l.features, l.extras, path);
}
