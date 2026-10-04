import type { ActionTool } from "./types";
import { dueFromBody } from "@/lib/taskDueInput";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const PRIORITIES = ["critical", "high", "medium", "low", "optional"];
const ENERGIES = ["low", "medium", "high"];
const STATUSES = ["today", "backlog", "in_progress", "waiting", "done"];
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const MAX_TASKS = 100;

export const createTask: ActionTool = {
  name: "create_task",
  kind: "write",
  apiPath: "/api/tasks",
  description: "Create a task for the client. The client approves first. Set priority and effort level when they say how important or how heavy it is.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "string", enum: PRIORITIES },
      effort: { type: "string", enum: ENERGIES, description: "How much energy it takes: low, medium or high." },
      due_date: { type: "string", description: "YYYY-MM-DD" },
      status: { type: "string", enum: ["today", "backlog"], description: "today puts it on today's list; backlog otherwise." },
    },
    required: ["title"],
  },
  plan: async (args) => {
    const title = str(args.title, 200);
    if (!title) return { error: "What should the task say?" };
    const due = str(args.due_date, 10);
    if (due && !isDay(due)) return { error: "I need the due date as a real date." };
    return {
      preview: {
        title: `Create the task "${title}"`,
        lines: [
          ...(str(args.priority, 20) ? [`Priority: ${str(args.priority, 20)}`] : []),
          ...(str(args.effort, 20) ? [`Effort: ${str(args.effort, 20)}`] : []),
          ...(due ? [`Due: ${due}`] : []),
          `On: ${args.status === "today" ? "today's list" : "your backlog"}`,
        ],
      },
    };
  },
  run: async (args, ctx) => {
    const due = await dueFromBody({ dueDate: str(args.due_date, 10) || undefined });
    const row: Record<string, unknown> = {
      master_plan_id: ctx.planId,
      title: str(args.title, 200),
      description: str(args.description, 4000) || null,
      status: args.status === "today" ? "today" : "backlog",
      priority: PRIORITIES.includes(String(args.priority)) ? args.priority : "medium",
      energy: ENERGIES.includes(String(args.effort)) ? args.effort : "medium",
      followup: {},
    };
    if (due && due !== "invalid") Object.assign(row, due);
    const { data, error } = await ctx.db.from("tasks").insert(row).select("id").single();
    if (error || !data) throw new Error("The task didn't save.");
    return { summary: `Created the task "${row.title}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("tasks").delete().eq("id", u.id as number).eq("master_plan_id", ctx.planId);
    return "Deleted the task.";
  },
};

interface TaskRow { id: number; title: string; status: string; priority: string | null; energy: string | null; due_date: string | null }

async function matching(args: Record<string, unknown>, ctx: Parameters<NonNullable<ActionTool["plan"]>>[1]): Promise<TaskRow[]> {
  const contains = str(args.title_contains, 100).replace(/[%,()]/g, "");
  const status = str(args.current_status, 20);
  let q = ctx.db.from("tasks").select("id, title, status, priority, energy, due_date").eq("master_plan_id", ctx.planId).neq("status", "done").limit(MAX_TASKS + 1);
  if (contains) q = q.ilike("title", `%${contains}%`);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  if (PRIORITIES.includes(str(args.current_priority, 20))) q = q.eq("priority", str(args.current_priority, 20));
  const { data } = await q;
  return ((data ?? []) as TaskRow[]).slice(0, MAX_TASKS);
}

const CHANGE_PROPS = {
  title_contains: { type: "string", description: "Tasks whose title contains this text." },
  current_status: { type: "string", enum: STATUSES, description: "Only tasks currently in this status." },
  current_priority: { type: "string", enum: PRIORITIES, description: "Only tasks currently at this priority." },
  new_status: { type: "string", enum: STATUSES },
  new_priority: { type: "string", enum: PRIORITIES },
  new_effort: { type: "string", enum: ENERGIES },
  new_due_date: { type: "string", description: "YYYY-MM-DD" },
};

export const updateTasks: ActionTool = {
  name: "update_tasks",
  kind: "write",
  apiPath: "/api/tasks",
  description: "Change existing tasks: move them to today or the backlog, mark done, set priority, effort or due date. Pick the tasks by part of the title and/or their current status or priority. The client approves first.",
  parameters: { type: "object", properties: CHANGE_PROPS },
  plan: async (args, ctx) => {
    const set = changes(args);
    if (!Object.keys(set).length) return { error: "What should change on those tasks?" };
    if (!str(args.title_contains, 100) && !str(args.current_status, 20) && !str(args.current_priority, 20)) return { error: "Which tasks? Give part of the title, or their current status or priority." };
    const rows = await matching(args, ctx);
    if (!rows.length) return { error: "No open tasks match that." };
    return {
      preview: {
        title: `Update ${rows.length} task${rows.length === 1 ? "" : "s"}: ${describe(set)}`,
        lines: [...rows.slice(0, 8).map((r) => `"${r.title.slice(0, 70)}"`), ...(rows.length > 8 ? [`…and ${rows.length - 8} more`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const set = changes(args);
    const rows = await matching(args, ctx);
    const before: Record<string, Record<string, unknown>> = {};
    let n = 0;
    for (const r of rows) {
      const patch: Record<string, unknown> = { ...set, updated_at: new Date().toISOString() };
      if (set.status === "done") patch.completed_at = new Date().toISOString();
      if (set.due_date !== undefined) Object.assign(patch, (await dueFromBody({ dueDate: set.due_date as string })) || {});
      const { error } = await ctx.db.from("tasks").update(patch).eq("id", r.id).eq("master_plan_id", ctx.planId);
      if (!error) {
        n++;
        before[r.id] = { status: r.status, priority: r.priority, energy: r.energy, due_date: r.due_date };
      }
    }
    return { summary: `Updated ${n} task${n === 1 ? "" : "s"}: ${describe(set)}.`, result: { count: n }, undo: { before } };
  },
  undo: async (u, ctx) => {
    const before = (u.before as Record<string, Record<string, unknown>>) ?? {};
    let n = 0;
    for (const [id, prev] of Object.entries(before)) {
      const { error } = await ctx.db.from("tasks").update({ ...prev, completed_at: null, updated_at: new Date().toISOString() }).eq("id", Number(id)).eq("master_plan_id", ctx.planId);
      if (!error) n++;
    }
    return `Restored ${n} task${n === 1 ? "" : "s"}.`;
  },
};

function changes(args: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  if (STATUSES.includes(str(args.new_status, 20))) set.status = str(args.new_status, 20);
  if (PRIORITIES.includes(str(args.new_priority, 20))) set.priority = str(args.new_priority, 20);
  if (ENERGIES.includes(str(args.new_effort, 20))) set.energy = str(args.new_effort, 20);
  if (isDay(str(args.new_due_date, 10))) set.due_date = str(args.new_due_date, 10);
  return set;
}
const describe = (set: Record<string, unknown>) =>
  [set.status && `move to ${String(set.status).replace("_", " ")}`, set.priority && `priority ${set.priority}`, set.energy && `effort ${set.energy}`, set.due_date && `due ${set.due_date}`].filter(Boolean).join(", ");

export const TASK_TOOLS: ActionTool[] = [createTask, updateTasks];
