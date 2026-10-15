import type { ActionTool, ActionCtx } from "./types";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { whenWords } from "@/lib/reminders";

// "Have the assistant work on this": the assistant can read a task or reminder in FULL, check how outreach is going
// (sends, replies, who is waiting for a follow-up) and save a short report on the task or reminder. Looking things up
// runs straight away; saving a report is a write, so it sits behind the same preview + Approve (with Undo).

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const clean = (v: unknown) => str(v, 200).replace(/[%,()]/g, "");
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TEXT = 6000; // a task description or reminder note, with reports added, stays under this

const when = (iso: string | null, tz: string) => (iso ? whenWords(iso, Date.now(), tz) : "no date");

export const getTask: ActionTool = {
  name: "get_task",
  kind: "read",
  apiPath: "/api/tasks",
  description:
    "Read ONE task in full (its whole description and instructions, status, due date, priority and project), picked by part of its title. Use this whenever the client asks you to work on, check on or report on a task: the task list you were given carries titles only.",
  parameters: { type: "object", properties: { find_title: { type: "string", description: "Part of the task's title." } }, required: ["find_title"] },
  read: async (a, ctx) => {
    const q = clean(a.find_title);
    if (!q) return "Which task? Give me part of its title.";
    const tz = await resolveUserTimeZone(null);
    const { data } = await ctx.db
      .from("tasks")
      .select("id, title, description, status, priority, due_at, due_date, due_has_time, owner_action, project_id, archived_at, completed_at")
      .eq("master_plan_id", ctx.planId)
      .ilike("title", `%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(6);
    const rows = (data ?? []) as { id: number; title: string; description: string | null; status: string; priority: string; due_at: string | null; due_date: string | null; due_has_time: boolean | null; project_id: string | null; archived_at: string | null; completed_at: string | null }[];
    if (!rows.length) return `No task has "${q}" in its title.`;
    if (rows.length > 1) {
      const exact = rows.filter((r) => r.title.toLowerCase() === q.toLowerCase());
      if (exact.length !== 1) return `More than one task matches "${q}": ${rows.map((r) => `"${r.title}" (${r.status})`).join("; ")}. Ask which one.`;
      rows.splice(0, rows.length, exact[0]);
    }
    const t = rows[0];
    let project = "";
    if (t.project_id) {
      const { data: p } = await ctx.db.from("projects").select("name").eq("id", t.project_id).eq("master_plan_id", ctx.planId).maybeSingle();
      project = (p?.name as string) ?? "";
    }
    const due = t.due_at ? when(t.due_at, tz) : t.due_date ? t.due_date.slice(0, 10) : "no due date";
    return [
      `Task: ${t.title}`,
      `Status: ${t.status}${t.archived_at ? " (archived)" : ""} | Priority: ${t.priority} | Due: ${due}${project ? ` | Project: ${project}` : ""}`,
      `Full description:\n${(t.description || "(no description)").slice(0, 4000)}`,
    ].join("\n");
  },
};

export const getReminder: ActionTool = {
  name: "get_reminder",
  kind: "read",
  apiPath: "/api/reminders",
  description:
    "Read ONE reminder in full (its whole note, when it is due, whether it is open or done), picked by part of its title. Use this whenever the client asks you to work on or report on a reminder: the reminder list only shows the start of each note.",
  parameters: { type: "object", properties: { find_title: { type: "string", description: "Part of the reminder's title." } }, required: ["find_title"] },
  read: async (a, ctx) => {
    const q = clean(a.find_title);
    if (!q) return "Which reminder? Give me part of its title.";
    const tz = await resolveUserTimeZone(null);
    const { data } = await ctx.db
      .from("reminders")
      .select("title, notes, remind_at, status, done_at")
      .eq("master_plan_id", ctx.planId)
      .ilike("title", `%${q}%`)
      .order("remind_at", { ascending: false })
      .limit(6);
    const rows = (data ?? []) as { title: string; notes: string | null; remind_at: string; status: string; done_at: string | null }[];
    if (!rows.length) return `No reminder has "${q}" in its title.`;
    if (rows.length > 1) {
      const exact = rows.filter((r) => r.title.toLowerCase() === q.toLowerCase());
      const open = rows.filter((r) => r.status === "open");
      const pick = exact.length === 1 ? exact : open.length === 1 ? open : null;
      if (!pick) return `More than one reminder matches "${q}": ${rows.map((r) => `"${r.title}" (${r.status})`).join("; ")}. Ask which one.`;
      rows.splice(0, rows.length, pick[0]);
    }
    const r = rows[0];
    return [`Reminder: ${r.title}`, `Status: ${r.status} | Due: ${when(r.remind_at, tz)}`, `Full note:\n${(r.notes || "(no note)").slice(0, 4000)}`].join("\n");
  },
};

interface Card { id: string; name: string; stage_id: string; platform: string | null; last_contacted_at: string | null; follow_up_on: string | null; stage_changed_at: string | null; created_at: string }

export const checkOutreach: ActionTool = {
  name: "check_outreach",
  kind: "read",
  apiPath: "/api/dm-pipeline",
  description:
    "Check how outreach is going on the client's Outreach Pipelines: messages logged as sent (first messages and follow-ups, by platform and by day), how many people are in each stage now (for example Replied), who has been waiting for a follow-up, and what moved stage recently. Give from/to (YYYY-MM-DD, local) to look at one batch or window: the people whose messages were logged in that window are the batch. Replies are only known from people being moved to a Replied-type stage in the Suite; this cannot read LinkedIn, Instagram, Facebook or WhatsApp.",
  parameters: {
    type: "object",
    properties: {
      pipeline: { type: "string", description: "Part of the pipeline's name. Leave out to cover every outreach pipeline." },
      from: { type: "string", description: "Start day YYYY-MM-DD (local). Default: 7 days ago." },
      to: { type: "string", description: "End day YYYY-MM-DD (local), inclusive. Default: today." },
      platform: { type: "string", description: "LinkedIn, Instagram, Facebook, WhatsApp, Email or Text. Leave out for all." },
    },
  },
  read: async (a, ctx: ActionCtx) => {
    const tz = await resolveUserTimeZone(null);
    const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
    const today = dayOf(new Date().toISOString());
    const to = DAY.test(str(a.to, 10)) ? str(a.to, 10) : today;
    const from = DAY.test(str(a.from, 10)) ? str(a.from, 10) : dayOf(new Date(Date.now() - 7 * 86400_000).toISOString());
    // A generous UTC window around the local days; each row is then checked against its local day.
    const startIso = new Date(`${from}T00:00:00Z`).getTime() - 14 * 3600_000;
    const endIso = new Date(`${to}T00:00:00Z`).getTime() + 38 * 3600_000;
    const platform = str(a.platform, 30).toLowerCase();

    const { data: bs } = await ctx.db.from("pipeline_boards").select("id, name").eq("master_plan_id", ctx.planId).eq("purpose", "outreach").order("sort_order");
    let boards = (bs ?? []) as { id: string; name: string }[];
    const want = str(a.pipeline, 80).toLowerCase();
    if (want) boards = boards.filter((b) => b.name.toLowerCase().includes(want));
    if (!boards.length) return want ? `No outreach pipeline has "${want}" in its name.` : "The client has no outreach pipelines yet.";

    const out: string[] = [`Window: ${from} to ${to} (${tz}).`];
    for (const b of boards) {
      const { data: stages } = await ctx.db.from("dm_stages").select("id, name, kind, sort_order").eq("master_plan_id", ctx.planId).eq("board_id", b.id).order("sort_order");
      const st = (stages ?? []) as { id: string; name: string; kind: string | null }[];
      const stageName = new Map(st.map((s) => [s.id, s.name]));
      const { data: sendRows } = await ctx.db
        .from("dm_sends")
        .select("card_id, platform, sent_at, kind, followup_n")
        .eq("master_plan_id", ctx.planId)
        .eq("board_id", b.id)
        .gte("sent_at", new Date(startIso).toISOString())
        .lte("sent_at", new Date(endIso).toISOString())
        .limit(5000);
      const sends = ((sendRows ?? []) as { card_id: string; platform: string | null; sent_at: string; kind: string | null }[]).filter((s) => {
        const d = dayOf(s.sent_at);
        return d >= from && d <= to && (!platform || (s.platform || "").toLowerCase() === platform);
      });
      const firsts = sends.filter((s) => s.kind !== "follow_up");
      const follow = sends.filter((s) => s.kind === "follow_up");
      const byDay = new Map<string, number>();
      for (const s of sends) byDay.set(dayOf(s.sent_at), (byDay.get(dayOf(s.sent_at)) ?? 0) + 1);
      const byPlat = new Map<string, number>();
      for (const s of sends) byPlat.set(s.platform || "unknown", (byPlat.get(s.platform || "unknown") ?? 0) + 1);

      // The batch: everyone whose message was logged in the window.
      const ids = Array.from(new Set(sends.map((s) => s.card_id)));
      let cards: Card[] = [];
      if (ids.length) {
        const { data } = await ctx.db
          .from("dm_cards")
          .select("id, name, stage_id, platform, last_contacted_at, follow_up_on, stage_changed_at, created_at")
          .eq("master_plan_id", ctx.planId)
          .eq("board_id", b.id)
          .in("id", ids.slice(0, 1000));
        cards = (data ?? []) as Card[];
      }
      const inStage = new Map<string, number>();
      for (const c of cards) inStage.set(stageName.get(c.stage_id) ?? "?", (inStage.get(stageName.get(c.stage_id) ?? "?") ?? 0) + 1);
      const todayStr = today;
      const overdue = cards.filter((c) => c.follow_up_on && c.follow_up_on <= todayStr);

      // Everyone on the board now, whatever the window.
      const { data: all } = await ctx.db.from("dm_cards").select("stage_id").eq("master_plan_id", ctx.planId).eq("board_id", b.id);
      const nowStage = new Map<string, number>();
      for (const c of all ?? []) nowStage.set(stageName.get(c.stage_id as string) ?? "?", (nowStage.get(stageName.get(c.stage_id as string) ?? "?") ?? 0) + 1);

      out.push(
        `\nPipeline "${b.name}":`,
        `- Messages logged in the window: ${sends.length} (${firsts.length} first messages, ${follow.length} follow-ups) to ${ids.length} people.`,
        ...(byPlat.size ? [`- By platform: ${Array.from(byPlat).map(([p, n]) => `${p} ${n}`).join(", ")}.`] : []),
        ...(byDay.size ? [`- By day: ${Array.from(byDay).sort().map(([d, n]) => `${d} ${n}`).join(", ")}.`] : []),
        ...(ids.length ? [`- Where those ${ids.length} people are now: ${Array.from(inStage).map(([s, n]) => `${s} ${n}`).join(", ")}.`] : []),
        ...(overdue.length ? [`- Waiting for a follow-up (due today or earlier): ${overdue.length}${overdue.length <= 8 ? ` (${overdue.map((c) => c.name).join(", ")})` : ""}.`] : []),
        `- Whole board right now: ${st.map((s) => `${s.name} ${nowStage.get(s.name) ?? 0}`).join(" → ")}.`
      );
    }
    return out.join("\n");
  },
};

export const saveWorkReport: ActionTool = {
  name: "save_work_report",
  kind: "write",
  apiPath: "/api/tasks",
  description:
    "Save a short dated report on a task or a reminder (what you checked, what you found, what you prepared, what is left for the client), added to the end of its description or note so it is there next time. The client approves first. Use after you have worked on an item and written the report in the chat.",
  parameters: {
    type: "object",
    properties: {
      item: { type: "string", enum: ["task", "reminder"] },
      find_title: { type: "string", description: "Part of the task's or reminder's title." },
      report: { type: "string", description: "The report, plain text, under 1,500 characters." },
    },
    required: ["item", "find_title", "report"],
  },
  plan: async (a, ctx) => {
    const report = str(a.report, 1500);
    if (!report) return { error: "What should the report say?" };
    const q = clean(a.find_title);
    const isTask = a.item === "task";
    const { data } = isTask
      ? await ctx.db.from("tasks").select("id, title").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("updated_at", { ascending: false }).limit(5)
      : await ctx.db.from("reminders").select("id, title").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("remind_at", { ascending: false }).limit(5);
    const rows = (data ?? []) as { id: string | number; title: string }[];
    if (!rows.length) return { error: `I couldn't find a ${isTask ? "task" : "reminder"} with that name.` };
    if (rows.length > 1 && !rows.some((r) => r.title.toLowerCase() === q.toLowerCase())) return { error: `More than one matches: ${rows.slice(0, 4).map((r) => `"${r.title}"`).join(", ")}. Which one?` };
    return { preview: { title: `Save this report on the ${isTask ? "task" : "reminder"} "${rows.find((r) => r.title.toLowerCase() === q.toLowerCase())?.title ?? rows[0].title}"`, lines: [report.slice(0, 220) + (report.length > 220 ? "…" : "")] } };
  },
  run: async (a, ctx) => {
    const report = str(a.report, 1500);
    const q = clean(a.find_title);
    const isTask = a.item === "task";
    const tz = await resolveUserTimeZone(null);
    const stamp = new Date().toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const block = `\n\n— Assistant report, ${stamp}:\n${report}`;
    if (isTask) {
      const { data } = await ctx.db.from("tasks").select("id, title, description").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("updated_at", { ascending: false }).limit(5);
      const rows = (data ?? []) as { id: number; title: string; description: string | null }[];
      const t = rows.find((r) => r.title.toLowerCase() === q.toLowerCase()) ?? (rows.length === 1 ? rows[0] : null);
      if (!t) throw new Error("I couldn't pick one task.");
      const before = t.description ?? "";
      const next = (before + block).slice(-MAX_TEXT);
      const { error } = await ctx.db.from("tasks").update({ description: next, updated_at: new Date().toISOString() }).eq("id", t.id).eq("master_plan_id", ctx.planId);
      if (error) throw new Error("That didn't save.");
      return { summary: `Saved the report on the task "${t.title}".`, undo: { item: "task", id: t.id, before } };
    }
    const { data } = await ctx.db.from("reminders").select("id, title, notes").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("remind_at", { ascending: false }).limit(5);
    const rows = (data ?? []) as { id: string; title: string; notes: string | null }[];
    const r = rows.find((x) => x.title.toLowerCase() === q.toLowerCase()) ?? (rows.length === 1 ? rows[0] : null);
    if (!r) throw new Error("I couldn't pick one reminder.");
    const before = r.notes ?? "";
    const next = (before + block).slice(-MAX_TEXT);
    const { error } = await ctx.db.from("reminders").update({ notes: next, updated_at: new Date().toISOString() }).eq("id", r.id).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("That didn't save.");
    return { summary: `Saved the report on the reminder "${r.title}".`, undo: { item: "reminder", id: r.id, before } };
  },
  undo: async (u, ctx) => {
    if (u.item === "task") {
      await ctx.db.from("tasks").update({ description: (u.before as string) || null }).eq("id", u.id as number).eq("master_plan_id", ctx.planId);
      return "Took the report off the task.";
    }
    await ctx.db.from("reminders").update({ notes: (u.before as string) || null }).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Took the report off the reminder.";
  },
};

export const WORK_TOOLS: ActionTool[] = [getTask, getReminder, checkOutreach, saveWorkReport];
