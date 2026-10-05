import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { dueFromBody } from "@/lib/taskDueInput";
import { dayInTz } from "@/lib/tz";
import { planMembers } from "@/lib/taskAssignees";
import { addDays, templateByKey } from "./templates";

type Db = ReturnType<typeof createServerClient>;

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "done"] as const;
export const TASK_STATUSES = ["backlog", "today", "in_progress", "waiting", "done"] as const;
export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export const TASK_COLS = "id, title, description, status, priority, due_at, start_date, assignee_member_id, assignee_guest_id, shared, project_id, completed_at, board_position, created_at";

export interface TaskOut {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDay: string | null;
  dueDay: string | null;
  assigneeMemberId: string | null;
  assigneeGuestId: string | null;
  shared: boolean;
  position: number;
}

export function shapeTask(r: Record<string, unknown>, tz: string): TaskOut {
  return {
    id: Number(r.id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    status: String(r.status ?? "backlog"),
    priority: String(r.priority ?? "medium"),
    startDay: (r.start_date as string | null) ?? null,
    dueDay: r.due_at ? dayInTz(r.due_at as string, tz) : null,
    assigneeMemberId: (r.assignee_member_id as string | null) ?? null,
    assigneeGuestId: (r.assignee_guest_id as string | null) ?? null,
    shared: Boolean(r.shared),
    position: Number(r.board_position ?? 0),
  };
}

export async function loadProject(db: Db, planId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("projects").select("*").eq("master_plan_id", planId).eq("id", id).maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

// Turn a client's edit into the columns to store (or an error message). Used by the project board, the list and the assistant.
export async function taskPatch(planId: string, body: Record<string, unknown>, tz: string): Promise<{ update: Record<string, unknown>; error?: string; newMember?: string }> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") {
    const t = clean(body.title, 200);
    if (!t) return { update, error: "A task needs a title." };
    update.title = t;
  }
  if (typeof body.description === "string") update.description = clean(body.description, 4000) || null;
  if (typeof body.status === "string") {
    if (!(TASK_STATUSES as readonly string[]).includes(body.status)) return { update, error: "Unknown status." };
    update.status = body.status;
    update.completed_at = body.status === "done" ? new Date().toISOString() : null;
  }
  if (typeof body.priority === "string" && (PRIORITIES as readonly string[]).includes(body.priority)) update.priority = body.priority;
  if (body.startDay === null || body.startDay === "") update.start_date = null;
  else if (body.startDay !== undefined) {
    if (!isDay(body.startDay)) return { update, error: "Enter a valid start date." };
    update.start_date = body.startDay;
  }
  if (body.dueDay === null || body.dueDay === "") Object.assign(update, { due_at: null, due_has_time: false, reminded_at: null });
  else if (body.dueDay !== undefined) {
    const due = await dueFromBody({ dueDay: body.dueDay, tz });
    if (due === "invalid" || !due) return { update, error: "Enter a valid due date." };
    Object.assign(update, due);
  }
  if (typeof body.shared === "boolean") update.shared = body.shared;
  let newMember: string | undefined;
  if ("assigneeMemberId" in body) {
    const m = body.assigneeMemberId;
    if (m === null || m === "") update.assignee_member_id = null;
    else if (typeof m === "string") {
      const found = (await planMembers(planId)).find((x) => x.id === m);
      if (!found) return { update, error: "That person isn't on this account's team." };
      update.assignee_member_id = found.id;
      newMember = found.id;
    }
  }
  if ("assigneeGuestId" in body) {
    const g = body.assigneeGuestId;
    if (g === null || g === "") update.assignee_guest_id = null;
    else if (typeof g === "string") update.assignee_guest_id = g;
  }
  if (typeof body.position === "number" && Number.isFinite(body.position)) update.board_position = Math.round(body.position);
  return { update, newMember };
}

export interface NewTask {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  startDay?: string | null;
  dueDay?: string | null;
  shared?: boolean;
}

// Insert tasks into a project; returns their ids.
export async function insertProjectTasks(db: Db, planId: string, projectId: string, items: NewTask[], tz: string): Promise<number[]> {
  const rows: Record<string, unknown>[] = [];
  let pos = 0;
  for (const it of items) {
    const title = clean(it.title, 200);
    if (!title) continue;
    const row: Record<string, unknown> = {
      master_plan_id: planId,
      project_id: projectId,
      title,
      description: clean(it.description, 4000) || null,
      status: (TASK_STATUSES as readonly string[]).includes(it.status ?? "") ? it.status : "backlog",
      priority: (PRIORITIES as readonly string[]).includes(it.priority ?? "") ? it.priority : "medium",
      start_date: isDay(it.startDay) ? it.startDay : null,
      shared: Boolean(it.shared),
      board_position: pos++,
    };
    if (isDay(it.dueDay)) {
      const due = await dueFromBody({ dueDay: it.dueDay, tz });
      if (due && due !== "invalid") Object.assign(row, due);
    }
    rows.push(row);
  }
  if (!rows.length) return [];
  const { data, error } = await db.from("tasks").insert(rows).select("id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: number }[]).map((r) => r.id);
}

// Create a project (blank or from a template) with its tasks and milestones.
export async function createProject(
  db: Db,
  planId: string,
  input: { name: string; goal?: string; templateKey?: string | null; anchorDay?: string | null; startDay?: string | null; dueDay?: string | null; status?: string; ownerMemberId?: string | null },
  tz: string
): Promise<{ id: string; taskIds: number[] }> {
  const tpl = templateByKey(input.templateKey);
  const anchor = isDay(input.anchorDay) ? input.anchorDay : null;
  let startDay = isDay(input.startDay) ? input.startDay : null;
  let dueDay = isDay(input.dueDay) ? input.dueDay : null;
  if (tpl && anchor) {
    const days = [...tpl.tasks.map((t) => t.day), ...tpl.tasks.map((t) => t.day + (t.span ?? 1) - 1), ...tpl.milestones.map((m) => m.day)];
    startDay = startDay ?? addDays(anchor, Math.min(...days));
    dueDay = dueDay ?? addDays(anchor, Math.max(...days));
  }
  const palette = ["#2E7C83", "#c9a227", "#7b6b8d", "#c9855e", "#4a9b9b", "#8fb58a"];
  const { count } = await db.from("projects").select("id", { count: "exact", head: true }).eq("master_plan_id", planId);
  const { data: proj, error } = await db
    .from("projects")
    .insert({
      master_plan_id: planId,
      name: clean(input.name, 160) || tpl?.name || "New project",
      goal: clean(input.goal, 1500) || tpl?.goal || null,
      status: (PROJECT_STATUSES as readonly string[]).includes(input.status ?? "") ? input.status : "active",
      owner_member_id: input.ownerMemberId ?? null,
      start_date: startDay,
      due_date: dueDay,
      color: palette[(count ?? 0) % palette.length],
      template_key: tpl?.key ?? null,
    })
    .select("id")
    .single();
  if (error || !proj) throw new Error(error?.message || "Couldn't create the project.");
  const id = proj.id as string;
  let taskIds: number[] = [];
  if (tpl && anchor) {
    taskIds = await insertProjectTasks(
      db,
      planId,
      id,
      tpl.tasks.map((t) => ({ title: t.title, description: t.description, priority: t.priority ?? "medium", startDay: addDays(anchor, t.day), dueDay: addDays(anchor, t.day + (t.span ?? 1) - 1) })),
      tz
    );
    await db.from("project_milestones").insert(tpl.milestones.map((m, i) => ({ project_id: id, master_plan_id: planId, title: m.title, due_date: addDays(anchor, m.day), sort_order: i })));
  }
  return { id, taskIds };
}

export const newGuestToken = () => randomBytes(24).toString("base64url");
export { clean, isDay };
