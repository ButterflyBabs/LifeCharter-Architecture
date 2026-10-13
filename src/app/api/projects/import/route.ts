import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { planMembers } from "@/lib/taskAssignees";
import { createProject, insertProjectTasks, clean, isDay, TASK_STATUSES, PRIORITIES, type NewTask } from "@/lib/projects/server";
import { PROJECT_IMPORT_LIMITS, SOURCE_LABEL, type SourceKey } from "@/lib/projectImport";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Projects > Import a project. The screen reads the export in the browser and sends only the mapped tasks here.
// One new project is created (nothing existing is touched); sections can become milestones; a person named on a
// task is matched to the account's team by name or email, anyone else is kept as a note on the task.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const name = clean(b.name, PROJECT_IMPORT_LIMITS.name);
  if (!name) return NextResponse.json({ error: "Give the project a name." }, { status: 400 });
  const src = (typeof b.source === "string" && b.source in SOURCE_LABEL ? b.source : "sheet") as SourceKey;
  const raw = Array.isArray(b.tasks) ? (b.tasks as Record<string, unknown>[]) : [];
  if (!raw.length) return NextResponse.json({ error: "There are no tasks to import." }, { status: 400 });
  if (raw.length > PROJECT_IMPORT_LIMITS.maxTasks) return NextResponse.json({ error: `That is more than ${PROJECT_IMPORT_LIMITS.maxTasks} tasks. Split the export into smaller projects and import them one at a time.` }, { status: 400 });

  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  const db = createServerClient();
  const members = await planMembers(planId).catch(() => []);
  const byKey = new Map<string, string>();
  for (const m of members) {
    byKey.set(m.name.trim().toLowerCase(), m.id);
    if (m.email) byKey.set(m.email.trim().toLowerCase(), m.id);
  }
  const unmatched = new Set<string>();
  let matched = 0;

  interface Row {
    item: NewTask;
    section: string;
  }
  const rows: Row[] = [];
  for (const t of raw) {
    const title = clean(t.title, PROJECT_IMPORT_LIMITS.title);
    if (!title) continue;
    const status = TASK_STATUSES.includes(t.status as never) ? (t.status as string) : "backlog";
    const priority = PRIORITIES.includes(t.priority as never) ? (t.priority as string) : "medium";
    let description = clean(t.description, PROJECT_IMPORT_LIMITS.description);
    let assigneeMemberId: string | null = null;
    const who = clean(t.assignee, 160);
    if (who) {
      const names = who.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
      const hit = names.map((n) => byKey.get(n.toLowerCase())).find(Boolean) ?? null;
      if (hit) {
        assigneeMemberId = hit;
        matched++;
      } else {
        names.forEach((n) => unmatched.add(n));
        description = [description, `Assigned to ${names.join(", ")} in ${SOURCE_LABEL[src]}`].filter(Boolean).join("\n");
      }
    }
    rows.push({
      item: { title, description, status, priority, startDay: isDay(t.startDay) ? (t.startDay as string) : null, dueDay: isDay(t.dueDay) ? (t.dueDay as string) : null, assigneeMemberId, completedDay: isDay(t.completedDay) ? (t.completedDay as string) : null },
      section: clean(t.section, PROJECT_IMPORT_LIMITS.section),
    });
  }
  if (!rows.length) return NextResponse.json({ error: "None of the rows had a task name." }, { status: 400 });

  const days = (k: "startDay" | "dueDay") => rows.map((r) => r.item[k]).filter((d): d is string => !!d).sort();
  const starts = days("startDay");
  const dues = days("dueDay");
  const allDone = rows.every((r) => r.item.status === "done");
  let created: { id: string } | null = null;
  try {
    created = await createProject(
      db,
      planId,
      { name, goal: clean(b.goal, 1500) || undefined, status: allDone ? "done" : "active", startDay: starts[0] ?? dues[0] ?? null, dueDay: dues[dues.length - 1] ?? null },
      tz
    );
    const id = created.id;
    const taskIds = await insertProjectTasks(db, planId, id, rows.map((r) => r.item), tz);

    // Sections as milestones: dated by the last task due in the section, done when every task in it is.
    let milestones = 0;
    if (b.milestones === true) {
      const sections = Array.from(new Set(rows.map((r) => r.section).filter(Boolean))).slice(0, 20);
      if (sections.length) {
        const ms = sections.map((s, i) => {
          const inSec = rows.filter((r) => r.section === s);
          const due = inSec.map((r) => r.item.dueDay).filter((d): d is string => !!d).sort().pop() ?? null;
          return { project_id: id, master_plan_id: planId, title: s, due_date: due, done: inSec.every((r) => r.item.status === "done"), sort_order: i };
        });
        const { error } = await db.from("project_milestones").insert(ms);
        if (!error) milestones = ms.length;
      }
    }
    await db.from("projects").update({ notes: `Imported from ${SOURCE_LABEL[src]} on ${new Date().toISOString().slice(0, 10)}: ${taskIds.length} task${taskIds.length === 1 ? "" : "s"}.` }).eq("id", id).eq("master_plan_id", planId);
    await logActivity({ masterPlanId: planId, action: "created", entityType: "project", entityId: undefined, summary: `Imported project ${q(name)} from ${SOURCE_LABEL[src]} (${taskIds.length} tasks)` });
    return NextResponse.json({ id, tasks: taskIds.length, milestones, assigned: matched, unmatched: Array.from(unmatched).slice(0, 30) });
  } catch (e) {
    // Don't leave a half-built project behind.
    if (created) await db.from("projects").delete().eq("id", created.id).eq("master_plan_id", planId);
    console.error("POST /api/projects/import:", e);
    return NextResponse.json({ error: "Couldn't import the project. Nothing was lost; try again, or try a smaller file." }, { status: 500 });
  }
}
