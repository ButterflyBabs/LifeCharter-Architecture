import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/planScope";
import { createServerClient } from "@/lib/supabase/server";
import { dayInTz } from "@/lib/tz";
import type { TaskOut } from "@/lib/projects/server";

// Embraced;Fully projects and tasks live in their OWN tables (ef_projects, ef_tasks, ef_milestones), never in the
// Suite's projects/tasks. Every route here is Babs only (her email), and nothing here reads or writes a Suite table.
export type Db = ReturnType<typeof createServerClient>;

export async function efGate() {
  if (!(await isAlignmentArchitect())) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  const planId = await housePlanId();
  if (!planId) return { error: NextResponse.json({ error: "No house account found." }, { status: 500 }) } as const;
  return { planId } as const;
}

export const EF_PROJECT_STATUSES = ["planning", "active", "on_hold", "done"] as const;
export const EF_TASK_STATUSES = ["backlog", "today", "in_progress", "waiting", "done"] as const;
export const EF_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const EF_TASK_COLS = "id, num_id, title, notes, status, priority, due_date, start_date, today_on, completed_at, board_position, created_at, project_id";
export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// The board and list components identify a card by a number, so an E:F task goes out as its num_id.
export function shapeEfTask(r: Record<string, unknown>): TaskOut {
  return {
    id: Number(r.num_id),
    title: String(r.title ?? ""),
    description: String(r.notes ?? ""),
    status: String(r.status ?? "backlog"),
    priority: String(r.priority ?? "medium"),
    startDay: (r.start_date as string | null) ?? null,
    dueDay: (r.due_date as string | null) ?? null,
    assigneeMemberId: null,
    assigneeGuestId: null,
    shared: false,
    position: Number(r.board_position ?? 0),
  };
}

export async function loadEfProject(db: Db, planId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("ef_projects").select("*").eq("master_plan_id", planId).eq("id", id).maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

// Turn an edit from the board / list / drawer into the ef_tasks columns to store (or an error message).
export function efTaskPatch(b: Record<string, unknown>, tz: string): { update: Record<string, unknown>; error?: string } {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.title === "string") {
    const t = clean(b.title, 300);
    if (!t) return { update, error: "A task needs a title." };
    update.title = t;
  }
  if (typeof b.description === "string") update.notes = clean(b.description, 20000) || null;
  if (typeof b.status === "string") {
    if (!(EF_TASK_STATUSES as readonly string[]).includes(b.status)) return { update, error: "Unknown status." };
    update.status = b.status;
    update.completed_at = b.status === "done" ? new Date().toISOString() : null;
    update.today_on = b.status === "today" ? dayInTz(new Date().toISOString(), tz) : null;
  }
  if (typeof b.priority === "string" && (EF_PRIORITIES as readonly string[]).includes(b.priority)) update.priority = b.priority;
  for (const [k, col] of [["startDay", "start_date"], ["dueDay", "due_date"]] as const) {
    if (b[k] === null || b[k] === "") update[col] = null;
    else if (b[k] !== undefined) {
      if (!isDay(b[k])) return { update, error: "Enter a valid date." };
      update[col] = b[k];
    }
  }
  if (typeof b.position === "number" && Number.isFinite(b.position)) update.board_position = Math.round(b.position);
  return { update };
}
