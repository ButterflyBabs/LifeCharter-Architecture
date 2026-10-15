import { createServerClient } from "@/lib/supabase/server";
import { sessionUser, resolveActor, authEnabled } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { cleanAgenda, HUDDLE_MAX_MINUTES, normEmail, type AgendaSection } from "@/lib/teamHuddle";

type Db = ReturnType<typeof createServerClient>;

export interface HuddleAccess {
  email: string;
  planId: string;
  /** Runs the account: shares the page, deletes calls, uses the transcript and AI, settings, sends email, makes tasks. */
  manage: boolean;
  /** May change the agenda, to-dos, notes and recording link. */
  canEdit: boolean;
  /** The Alignment Architect looking at someone else's account (read only). */
  viewAs: boolean;
  /** The account owner's first name, so a to-do for them lands on their own list. */
  ownerName: string;
}

export interface HuddleSettings {
  title: string;
  max_minutes: number;
  weekday: number | null;
  start_time: string;
  template: AgendaSection[] | null;
}
export const DEFAULT_SETTINGS: HuddleSettings = { title: "Weekly Team Huddle", max_minutes: HUDDLE_MAX_MINUTES, weekday: null, start_time: "08:00", template: null };

/**
 * Who is asking, and for which account's huddles?
 *  - The account owner (and Babs on her own account): manage + edit.
 *  - An invited team member of that account: admin manages, editor edits, viewer reads (a Sales-role member only
 *    through the email list below).
 *  - Anyone Babs or a client added by email on the page's own list: read, or edit when can_edit.
 * `shared` is for the no-menu /huddle link: people on someone's list land on THAT account even when they own one too.
 * Returns null when the person has no access, so the page and API answer "not found".
 */
export async function huddleAccess(opts: { shared?: boolean } = {}): Promise<HuddleAccess | null> {
  const db = createServerClient();

  if (!authEnabled()) {
    const planId = await resolveMasterPlanId();
    return planId ? { email: "", planId, manage: true, canEdit: true, viewAs: false, ownerName: "" } : null;
  }

  const user = await sessionUser();
  const email = normEmail(user?.email);
  if (!user || !email) return null;

  const fromList = async (): Promise<HuddleAccess | null> => {
    const { data } = await db.from("team_huddle_access").select("master_plan_id, can_edit").eq("email", email).limit(1).maybeSingle();
    if (!data?.master_plan_id) return null;
    return { email, planId: data.master_plan_id as string, manage: false, canEdit: data.can_edit === true, viewAs: false, ownerName: "" };
  };

  if (opts.shared) {
    const listed = await fromList();
    if (listed) return listed;
  }

  const planId = await resolveMasterPlanId();
  if (!planId) return null;
  const { data: plan } = await db.from("client_master_plans").select("user_id, client_name").eq("id", planId).maybeSingle();
  const ownerName = firstName(plan?.client_name as string | undefined);

  // Their own account.
  if (plan?.user_id && plan.user_id === user.id) return { email, planId, manage: true, canEdit: true, viewAs: false, ownerName };

  // The Alignment Architect viewing a client's account: read only (writes are refused for the whole session anyway).
  if (email === ALIGNMENT_ARCHITECT_EMAIL) return { email, planId, manage: false, canEdit: false, viewAs: true, ownerName };

  // An invited team member of this account.
  const actor = await resolveActor();
  if (actor.kind === "member" && actor.role && actor.role !== "sales") {
    const role = actor.role;
    return { email, planId, manage: role === "admin", canEdit: role === "admin" || role === "editor", viewAs: false, ownerName };
  }

  // Someone added by email (any account) when they came in through the normal page.
  const listed = await fromList();
  return listed && listed.planId === planId ? { ...listed, ownerName } : null;
}

function firstName(full: string | undefined | null): string {
  const f = (full || "").trim().split(/\s+/)[0] || "";
  return /@/.test(f) ? "" : f.slice(0, 30);
}

export async function loadSettings(db: Db, planId: string): Promise<HuddleSettings> {
  const { data } = await db.from("team_huddle_settings").select("title, max_minutes, weekday, start_time, template").eq("master_plan_id", planId).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const tpl = Array.isArray(data.template) ? cleanAgenda(data.template) : [];
  return {
    title: (data.title as string) || DEFAULT_SETTINGS.title,
    max_minutes: Math.max(5, Math.min(120, Number(data.max_minutes) || HUDDLE_MAX_MINUTES)),
    weekday: typeof data.weekday === "number" ? data.weekday : null,
    start_time: (data.start_time as string) || "08:00",
    template: tpl.length ? tpl : null,
  };
}

/** Names offered as "Owner" on an item: the account owner, the invited team and anyone added by email. */
export async function huddleNames(db: Db, planId: string, ownerName: string): Promise<string[]> {
  const names = new Set<string>();
  if (ownerName) names.add(ownerName);
  const { data: plan } = await db.from("client_master_plans").select("client_name").eq("id", planId).maybeSingle();
  const pn = firstName(plan?.client_name as string | undefined);
  if (pn) names.add(pn);
  const { data: spaces } = await db.from("workspaces").select("id").eq("master_plan_id", planId);
  const ids = (spaces ?? []).map((w) => w.id as string);
  if (ids.length) {
    const { data: members } = await db.from("workspace_members").select("name, email, status").in("workspace_id", ids).in("status", ["active", "pending"]);
    for (const m of members ?? []) {
      const n = firstName(m.name as string) || firstName(String(m.email || "").split("@")[0]);
      if (n) names.add(n);
    }
  }
  const { data: list } = await db.from("team_huddle_access").select("name").eq("master_plan_id", planId);
  for (const r of list ?? []) {
    const n = firstName(r.name as string);
    if (n) names.add(n);
  }
  names.add("Everyone");
  return Array.from(names).slice(0, 30);
}

