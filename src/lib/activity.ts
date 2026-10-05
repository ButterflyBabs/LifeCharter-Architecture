import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

// The account's activity log (cs184): who did what, for the owner's Activity view.
// Call logActivity() AFTER a write has succeeded. It works out who is acting
// (the owner or a team member) and never throws, so it can't break the request.
// Reads are never logged.

export type ActivityArea = "tasks" | "finance" | "pipeline" | "operations" | "planning" | "content" | "scripts" | "sales";

export type EntityType =
  | "task"
  | "project"
  | "expense"
  | "income"
  | "bill"
  | "deal"
  | "sop"
  | "goal"
  | "content_post"
  | "script"
  | "sales_activity";

// Which filter area each entity belongs to on the Activity screen.
export const ENTITY_AREA: Record<EntityType, ActivityArea> = {
  task: "tasks",
  project: "tasks",
  expense: "finance",
  income: "finance",
  bill: "finance",
  deal: "pipeline",
  sop: "operations",
  goal: "planning",
  content_post: "content",
  script: "scripts",
  sales_activity: "sales",
};

export const AREA_LABEL: Record<ActivityArea, string> = {
  tasks: "Tasks",
  finance: "Finance",
  pipeline: "Pipeline",
  operations: "SOPs",
  planning: "Planning & Goals",
  content: "Content",
  scripts: "Scripts",
  sales: "Sales activities",
};

export interface ActivityInput {
  action: string; // created | completed | reopened | reassigned | updated | deleted | paid …
  entityType: EntityType;
  entityId?: string | number | null;
  summary: string; // e.g. `Completed "Send the proposal"`
  masterPlanId?: string | null; // pass it when the route already has it
}

async function actorLabel(kind: string, memberId: string | null, userId: string | null, email: string | null): Promise<string> {
  const db = createServerClient();
  if (kind === "member" && memberId) {
    const { data } = await db.from("workspace_members").select("name").eq("id", memberId).maybeSingle();
    if (data?.name) return String(data.name);
  }
  if (userId) {
    const { data } = await db.from("profiles").select("full_name, display_name").eq("id", userId).maybeSingle();
    const n = ((data?.display_name || data?.full_name || "") as string).trim();
    if (n) return n;
  }
  if (email) return email.split("@")[0];
  return kind === "member" ? "Team member" : "Account owner";
}

export async function logActivity(input: ActivityInput | ActivityInput[]): Promise<void> {
  const items = (Array.isArray(input) ? input : [input]).filter(Boolean);
  if (!items.length) return;
  try {
    const actor = await resolveActor();
    const memberId = actor.kind === "member" ? actor.memberId : null;
    const name = await actorLabel(actor.kind, memberId, actor.userId, actor.email);
    const planId = items[0].masterPlanId || (await resolveMasterPlanId());
    if (!planId) return;
    const rows = items.map((i) => ({
      master_plan_id: i.masterPlanId || planId,
      actor_member_id: memberId,
      actor_name: name.slice(0, 120),
      action: i.action.slice(0, 40),
      entity_type: i.entityType,
      entity_id: i.entityId === null || i.entityId === undefined ? null : String(i.entityId),
      summary: (i.summary || "").slice(0, 300),
    }));
    const { error } = await createServerClient().from("account_activity").insert(rows);
    if (error) console.error("logActivity:", error.message);
  } catch (e) {
    console.error("logActivity:", e);
  }
}

// Quote a record's title for a summary line.
export const q = (s: unknown, max = 80) => {
  const t = String(s ?? "").trim();
  return t ? `“${t.length > max ? t.slice(0, max - 1) + "…" : t}”` : "an item";
};
