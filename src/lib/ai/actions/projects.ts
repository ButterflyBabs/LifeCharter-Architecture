import type { ActionTool, ActionCtx } from "./types";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { createProject, insertProjectTasks, isDay, clean } from "@/lib/projects/server";
import { TEMPLATES, templateByKey, addDays } from "@/lib/projects/templates";

const MAX_TASKS = 30;
const usd = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

async function findProject(ctx: ActionCtx, ref: string) {
  const r = clean(ref, 160);
  if (!r) return null;
  const { data } = await ctx.db.from("projects").select("id, name, status").eq("master_plan_id", ctx.planId).order("created_at", { ascending: false });
  const rows = (data || []) as { id: string; name: string; status: string }[];
  const low = r.toLowerCase();
  return rows.find((p) => p.id === r) || rows.find((p) => p.name.toLowerCase() === low) || rows.find((p) => p.name.toLowerCase().includes(low)) || null;
}

export const listProjects: ActionTool = {
  name: "list_projects",
  kind: "read",
  apiPath: "/api/projects",
  description: "List the client's projects with status, dates and how many tasks are done. Call this before changing or adding to a project, so you use the right one.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("projects").select("id, name, status, start_date, due_date").eq("master_plan_id", ctx.planId).order("created_at", { ascending: false });
    const projects = (data || []) as { id: string; name: string; status: string; start_date: string | null; due_date: string | null }[];
    if (!projects.length) return "The client has no projects yet. Templates available: " + TEMPLATES.map((t) => `${t.key} (${t.name})`).join("; ") + ".";
    const { data: tasks } = await ctx.db.from("tasks").select("project_id, status").eq("master_plan_id", ctx.planId).not("project_id", "is", null);
    const count = new Map<string, { t: number; d: number }>();
    for (const t of (tasks || []) as { project_id: string; status: string }[]) {
      const c = count.get(t.project_id) ?? { t: 0, d: 0 };
      c.t++;
      if (t.status === "done") c.d++;
      count.set(t.project_id, c);
    }
    return projects.map((p) => `- ${p.name} | ${p.status} | ${p.start_date ?? "?"} to ${p.due_date ?? "?"} | ${count.get(p.id)?.d ?? 0} of ${count.get(p.id)?.t ?? 0} tasks done`).join("\n") + "\nTemplates: " + TEMPLATES.map((t) => `${t.key} (${t.name})`).join("; ") + ".";
  },
};

export const createProjectTool: ActionTool = {
  name: "create_project",
  kind: "write",
  apiPath: "/api/projects",
  description:
    "Create a project for the client, blank or from a template, with its tasks dated for them. Templates: 'masterclass' (a first or one-off live workshop or webinar; anchor_date = the MasterClass day), 'masterclass-cycle' (a MasterClass that repeats: four weeks from the reset after the last session to the end of follow-up; anchor_date = the MasterClass day), 'monthly-event' (a workshop, incubator or open evening held every month: reset, three weeks of filling the room, the event, three weeks of follow-up; anchor_date = the event day) and 'challenge21' (the 21-Day Challenge / Command Shift; anchor_date = Day 1). A template needs anchor_date (YYYY-MM-DD); ask for the date if you don't have it. For a blank project you can pass due_date. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      template: { type: "string", enum: ["masterclass", "masterclass-cycle", "monthly-event", "challenge21", "blank"] },
      anchor_date: { type: "string", description: "YYYY-MM-DD: the event day, or Day 1 of the challenge. Required for a template." },
      goal: { type: "string" },
      due_date: { type: "string", description: "YYYY-MM-DD, for a blank project." },
    },
    required: ["name"],
  },
  plan: async (args) => {
    const name = clean(args.name, 160);
    if (!name) return { error: "What should the project be called?" };
    const tpl = args.template && args.template !== "blank" ? templateByKey(String(args.template)) : null;
    if (args.template && args.template !== "blank" && !tpl) return { error: "I only have the MasterClass, repeating MasterClass, Monthly event and 21-Day Challenge templates, or a blank project." };
    const anchor = clean(args.anchor_date, 10);
    if (tpl && !isDay(anchor)) return { error: `What date should I plan around? (${tpl.anchorLabel}, as YYYY-MM-DD.)` };
    const lines: string[] = [];
    if (tpl) {
      const days = tpl.tasks.flatMap((t) => [t.day, t.day + (t.span ?? 1) - 1]);
      lines.push(`From the ${tpl.name} template: ${tpl.tasks.length} tasks and ${tpl.milestones.length} milestones, dated around ${usd(anchor)} (${usd(addDays(anchor, Math.min(...days)))} to ${usd(addDays(anchor, Math.max(...days)))}).`);
      for (const t of tpl.tasks.slice(0, 6)) lines.push(`• ${usd(addDays(anchor, t.day))}: ${t.title}`);
      if (tpl.tasks.length > 6) lines.push(`…and ${tpl.tasks.length - 6} more.`);
    } else {
      lines.push("A blank project. You add the tasks.");
      if (isDay(clean(args.due_date, 10))) lines.push(`Due ${usd(clean(args.due_date, 10))}.`);
    }
    return { preview: { title: `Create the project "${name}"`, lines } };
  },
  run: async (args, ctx) => {
    const tz = await resolveUserTimeZone(null);
    const tpl = args.template && args.template !== "blank" ? String(args.template) : null;
    const res = await createProject(ctx.db, ctx.planId, { name: clean(args.name, 160), goal: clean(args.goal, 1500), templateKey: tpl, anchorDay: clean(args.anchor_date, 10), dueDay: clean(args.due_date, 10) || null }, tz);
    return { summary: `Created the project "${clean(args.name, 160)}"${res.taskIds.length ? ` with ${res.taskIds.length} tasks` : ""}. Open it under Projects.`, result: { projectId: res.id }, undo: { projectId: res.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("tasks").delete().eq("master_plan_id", ctx.planId).eq("project_id", u.projectId as string);
    await ctx.db.from("projects").delete().eq("master_plan_id", ctx.planId).eq("id", u.projectId as string);
    return "Removed the project and its tasks.";
  },
};

export const addProjectTasks: ActionTool = {
  name: "add_project_tasks",
  kind: "write",
  apiPath: "/api/projects",
  description: `Add tasks to an existing project (use list_projects first). Up to ${MAX_TASKS} tasks, each with a title and optionally a due_date (YYYY-MM-DD), priority (low, medium, high, critical) and notes. The client approves first.`,
  parameters: {
    type: "object",
    properties: {
      project: { type: "string", description: "The project's name." },
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, due_date: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "critical"] }, notes: { type: "string" } },
          required: ["title"],
        },
      },
    },
    required: ["project", "tasks"],
  },
  plan: async (args, ctx) => {
    const p = await findProject(ctx, String(args.project || ""));
    if (!p) return { error: "I couldn't find that project. Check the name under Projects." };
    const tasks = (Array.isArray(args.tasks) ? args.tasks : []).filter((t): t is Record<string, unknown> => !!t && typeof t === "object" && !!clean((t as Record<string, unknown>).title, 200)).slice(0, MAX_TASKS);
    if (!tasks.length) return { error: "Which tasks should I add?" };
    return {
      preview: {
        title: `Add ${tasks.length} task${tasks.length === 1 ? "" : "s"} to "${p.name}"`,
        lines: tasks.map((t) => `• ${clean(t.title, 200)}${isDay(clean(t.due_date, 10)) ? ` (due ${usd(clean(t.due_date, 10))})` : ""}${t.priority ? ` [${t.priority}]` : ""}`),
      },
    };
  },
  run: async (args, ctx) => {
    const p = await findProject(ctx, String(args.project || ""));
    if (!p) throw new Error("That project no longer exists.");
    const tz = await resolveUserTimeZone(null);
    const items = (Array.isArray(args.tasks) ? args.tasks : []).slice(0, MAX_TASKS).map((t: Record<string, unknown>) => ({ title: clean(t.title, 200), description: clean(t.notes, 4000), priority: clean(t.priority, 12), dueDay: isDay(clean(t.due_date, 10)) ? clean(t.due_date, 10) : null }));
    const ids = await insertProjectTasks(ctx.db, ctx.planId, p.id, items, tz);
    if (!ids.length) throw new Error("There were no tasks to add.");
    return { summary: `Added ${ids.length} task${ids.length === 1 ? "" : "s"} to "${p.name}".`, undo: { ids } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("tasks").delete().eq("master_plan_id", ctx.planId).in("id", u.ids as number[]);
    return "Removed those tasks.";
  },
};

export const PROJECT_TOOLS: ActionTool[] = [listProjects, createProjectTool, addProjectTasks];
