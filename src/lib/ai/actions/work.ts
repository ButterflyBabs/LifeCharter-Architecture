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
    "Check how outreach is going on the client's Outreach Pipelines: messages logged as sent (first messages and follow-ups, by platform and by day), how many people are in each stage now (for example Replied), who has been waiting for a follow-up, and what moved stage recently. Give from/to (YYYY-MM-DD, local) to look at one batch or window: the people whose messages were logged in that window are the batch. The answer also lists each SENDING SESSION (messages logged within an hour of each other) with its local start and end time, how many were first messages and follow-ups, and where those people are now: that is how separate batches are told apart, even on the same day. Replies are only known from people being moved to a Replied-type stage in the Suite; this cannot read LinkedIn, Instagram, Facebook or WhatsApp.",
  parameters: {
    type: "object",
    properties: {
      pipeline: { type: "string", description: "Part of the pipeline's name. Leave out to cover every outreach pipeline." },
      from: { type: "string", description: "Start day YYYY-MM-DD (local). Default: 14 days ago. Batches can be sent on different days, so when asked about batches leave this out or start well before the first one." },
      to: { type: "string", description: "End day YYYY-MM-DD (local), inclusive. Default: today." },
      platform: { type: "string", description: "LinkedIn, Instagram, Facebook, WhatsApp, Email or Text. Leave out for all." },
    },
  },
  read: async (a, ctx: ActionCtx) => {
    const tz = await resolveUserTimeZone(null);
    const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz });
    const today = dayOf(new Date().toISOString());
    const to = DAY.test(str(a.to, 10)) ? str(a.to, 10) : today;
    const from = DAY.test(str(a.from, 10)) ? str(a.from, 10) : dayOf(new Date(Date.now() - 14 * 86400_000).toISOString());
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

      // Sending sessions: messages logged within an hour of each other belong together (a batch).
      const cardStage = new Map(cards.map((c) => [c.id, stageName.get(c.stage_id) ?? "?"]));
      const ordered = [...sends].sort((x, y) => x.sent_at.localeCompare(y.sent_at));
      const sessions: { start: string; end: string; items: typeof ordered }[] = [];
      for (const m of ordered) {
        const last = sessions[sessions.length - 1];
        if (last && new Date(m.sent_at).getTime() - new Date(last.end).getTime() <= 3600_000) {
          last.end = m.sent_at;
          last.items.push(m);
        } else sessions.push({ start: m.sent_at, end: m.sent_at, items: [m] });
      }
      const hm = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
      const sessionLines = sessions.slice(0, 12).map((x, i) => {
        const n = x.items.filter((m) => m.kind !== "follow_up").length;
        const f = x.items.filter((m) => m.kind === "follow_up").length;
        const people = Array.from(new Set(x.items.map((m) => m.card_id)));
        const where = new Map<string, number>();
        for (const id of people) where.set(cardStage.get(id) ?? "?", (where.get(cardStage.get(id) ?? "?") ?? 0) + 1);
        return `  ${i + 1}. ${dayOf(x.start)} ${hm(x.start)}${x.start === x.end ? "" : ` to ${hm(x.end)}`}: ${n} first messages, ${f} follow-ups, ${people.length} people; now ${Array.from(where).map(([k, v]) => `${k} ${v}`).join(", ")}`;
      });

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
        ...(sessionLines.length ? [`- Sending sessions (an hour or more apart starts a new one):`, ...sessionLines] : []),
        ...(overdue.length ? [`- Waiting for a follow-up (due today or earlier): ${overdue.length}${overdue.length <= 8 ? ` (${overdue.map((c) => c.name).join(", ")})` : ""}.`] : []),
        `- Whole board right now: ${st.map((s) => `${s.name} ${nowStage.get(s.name) ?? 0}`).join(" → ")}.`
      );
    }
    return out.join("\n");
  },
};

type Who = "suite" | "assistant" | "you" | "both";
type StepStatus = "scheduled" | "needs_approval" | "waiting" | "ready" | "done";
/** Pages a next step may link to, so the client can act on it in one click (nothing is guessed). */
export const STEP_PAGES = ["/sequences-manager", "/contacts", "/dm-pipeline", "/tasks", "/reminders", "/projects", "/calendars", "/finance", "/links-directory", "/daily-compass/calendar", "/operations/sops", "/sales/offers", "/sales/pipeline", "/business-plan", "/marketing-plan", "/sales", "/planning/forecast", "/assistant-approvals", "/my-pages"];
export interface ReportData {
  summary: string;
  done: string[];
  found: { label: string; value: string }[];
  next_steps: { text: string; who: Who; when: string; status: StepStatus; waiting_on: string; open: string }[];
}
/** An internal app path only (never an outside address), with an optional query such as ?seq=<campaign id> or ?tab=forms. */
export function safeOpen(p: string): string {
  if (!p.startsWith("/") || p.startsWith("//") || /[\s<>"'\\]/.test(p)) return "";
  const first = "/" + (p.slice(1).split(/[/?#]/)[0] || "");
  return STEP_PAGES.some((x) => x === first || x.startsWith(first + "/")) ? p.slice(0, 160) : "";
}
const WHO: Who[] = ["suite", "assistant", "you", "both"];
const STATUS: StepStatus[] = ["scheduled", "needs_approval", "waiting", "ready", "done"];

/** Shape whatever the model sent into a safe, bounded report. */
export function cleanReport(a: Record<string, unknown>): ReportData {
  // A single line of text is accepted as a one-item list, so a slightly different shape from the model is not lost.
  const list = (v: unknown, n: number, len: number) => {
    const arr = typeof v === "string" ? [v] : Array.isArray(v) ? v : [];
    return arr.filter((x) => typeof x === "string" && x.trim()).slice(0, n).map((x) => (x as string).trim().slice(0, len));
  };
  const found = (Array.isArray(a.found) ? a.found : []).slice(0, 6).map((f) => {
    const o = (f ?? {}) as Record<string, unknown>;
    return { label: str(o.label, 40), value: str(o.value, 80) };
  }).filter((f) => f.label && f.value);
  const steps = (Array.isArray(a.next_steps) ? a.next_steps : []).slice(0, 8).map((st) => {
    const o = (st ?? {}) as Record<string, unknown>;
    const who = WHO.includes(o.who as Who) ? (o.who as Who) : "you";
    const status = STATUS.includes(o.status as StepStatus) ? (o.status as StepStatus) : who === "you" ? "waiting" : "scheduled";
    const open = str(o.open, 160);
    return { text: str(o.text, 200), who, when: str(o.when, 60), status, waiting_on: str(o.waiting_on, 200), open: safeOpen(open) };
  }).filter((x) => x.text);
  return { summary: str(a.summary, 400) || str(a.report, 400), done: list(a.done, 8, 200), found, next_steps: steps };
}

const WHO_LABEL: Record<Who, string> = { suite: "Suite", assistant: "Assistant", you: "You", both: "You and assistant" };

/** A plain-text version, kept on the task or reminder note so the daily emails and old views still read well. */
function reportText(r: ReportData, fallback: string): string {
  if (!r.done.length && !r.found.length && !r.next_steps.length) return fallback;
  const lines: string[] = [];
  if (r.summary) lines.push(r.summary);
  if (r.done.length) lines.push(`Done: ${r.done.join("; ")}.`);
  if (r.found.length) lines.push(`Found: ${r.found.map((f) => `${f.label} ${f.value}`).join("; ")}.`);
  if (r.next_steps.length) lines.push(`Next: ${r.next_steps.map((n) => `[${WHO_LABEL[n.who]}] ${n.text}${n.when ? ` (${n.when})` : ""}${n.waiting_on ? `, waiting for: ${n.waiting_on}` : ""}`).join("; ")}.`);
  return lines.join("\n").slice(0, 1800);
}

export const saveWorkReport: ActionTool = {
  name: "save_work_report",
  kind: "write",
  apiPath: "/api/tasks",
  description:
    "Save the report on a task or a reminder in a structured form, so the client sees a clean card on that item: what was done, the key numbers found, and the next steps with WHO does each (suite = runs by itself, assistant = you prepared it for approval, you = the client, both) and its status (scheduled, needs_approval, waiting, done). The client approves first. Call it once, after you have worked on the item and prepared any follow-up cards, and keep your chat reply to two or three sentences because the report card holds the detail.",
  parameters: {
    type: "object",
    properties: {
      item: { type: "string", enum: ["task", "reminder"] },
      find_title: { type: "string", description: "Part of the task's or reminder's title." },
      summary: { type: "string", description: "One or two plain sentences: where this stands." },
      done: { type: "array", items: { type: "string" }, description: "What you actually did or checked, one short line each (max 6)." },
      found: {
        type: "array",
        description: "The key numbers or facts, 2 to 4: for example {label: 'Emails sent', value: '18 of 18'}.",
        items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] },
      },
      next_steps: {
        type: "array",
        description:
          "Every next step, one row each, with NO guessing. who: suite (the Suite does it by itself, for example a scheduled email), assistant (you can do it for them when they ask, or you prepared a card that waits for their Approve), you (only the client can), both. status: scheduled (the Suite will do it at the date in when), needs_approval (a card you prepared waits for their Approve), ready (the assistant can do it as soon as they press the button), waiting (blocked until something specific happens) or done. waiting_on is REQUIRED for status waiting: say exactly WHAT is being waited on and BY WHOM, for example 'Waiting for the Suite to send note 2 on Oct 20 at 8:00 AM' or 'Waiting for you to choose the batch 3 start date'. open (STRONGLY EXPECTED for every step the client must read, edit, approve or do): the exact app page, ideally to the very item, for example /sequences-manager?seq=<campaign id> (check_campaigns gives each campaign's link), /sequences-manager?tab=broadcasts, /contacts?tab=forms, /operations/sops, /links-directory, /dm-pipeline, /tasks, /reminders, /projects, /sales/offers, /business-plan, /marketing-plan, /sales, /planning/forecast.",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            who: { type: "string", enum: ["suite", "assistant", "you", "both"] },
            when: { type: "string" },
            status: { type: "string", enum: ["scheduled", "needs_approval", "waiting", "ready", "done"] },
            waiting_on: { type: "string" },
            open: { type: "string" },
          },
          required: ["text", "who", "status"],
        },
      },
      report: { type: "string", description: "Only if you cannot fill the fields above: the whole report as plain text, under 1,500 characters." },
      mode: { type: "string", enum: ["replace_last", "add"], description: "replace_last (default) swaps the previous report on this item for this one; add keeps the earlier ones." },
    },
    required: ["item", "find_title"],
  },
  plan: async (a, ctx) => {
    const r = cleanReport(a);
    if (!r.summary && !r.done.length && !r.found.length && !r.next_steps.length) return { error: "What should the report say?" };
    const vague = r.next_steps.find((n) => n.status === "waiting" && n.waiting_on.length < 8);
    if (vague) return { error: `The next step "${vague.text}" is marked waiting but does not say what is being waited on and by whom. Add waiting_on with the exact thing and the person or system, then save again.` };
    const q = clean(a.find_title);
    const isTask = a.item === "task";
    const { data } = isTask
      ? await ctx.db.from("tasks").select("id, title").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("updated_at", { ascending: false }).limit(5)
      : await ctx.db.from("reminders").select("id, title").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("remind_at", { ascending: false }).limit(5);
    const rows = (data ?? []) as { id: string | number; title: string }[];
    if (!rows.length) return { error: `I couldn't find a ${isTask ? "task" : "reminder"} with that name.` };
    if (rows.length > 1 && !rows.some((x) => x.title.toLowerCase() === q.toLowerCase())) return { error: `More than one matches: ${rows.slice(0, 4).map((x) => `"${x.title}"`).join(", ")}. Which one?` };
    const name = rows.find((x) => x.title.toLowerCase() === q.toLowerCase())?.title ?? rows[0].title;
    // Keep the card short: one sentence, then ONLY what needs the client, each with a button that opens it.
    const mine = r.next_steps.filter((n) => (n.who === "you" || n.who === "both") && n.status !== "done");
    const lines = [
      ...(r.summary ? [r.summary.length > 160 ? r.summary.slice(0, 157) + "…" : r.summary] : []),
      ...mine.slice(0, 3).map((n) => `For you: ${n.text.length > 120 ? n.text.slice(0, 117) + "…" : n.text}`),
      ...(mine.length > 3 ? [`…and ${mine.length - 3} more on the report`] : []),
    ];
    const links = mine.filter((n) => n.open).slice(0, 3).map((n) => ({ label: `Open: ${n.text.length > 36 ? n.text.slice(0, 33) + "…" : n.text}`, href: n.open }));
    return { preview: { title: `Save this report on the ${isTask ? "task" : "reminder"} "${name}"`, lines: lines.length ? lines : [str(a.report, 160)], links } };
  },
  run: async (a, ctx) => {
    const r = cleanReport(a);
    const fallback = str(a.report, 1500);
    const q = clean(a.find_title);
    const isTask = a.item === "task";
    const tz = await resolveUserTimeZone(null);
    const stamp = new Date().toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const block = `\n\n— Assistant report, ${stamp}:\n${reportText(r, fallback)}`;
    // The newest report replaces the last one the assistant saved (everything before it stays), unless asked to add.
    const swap = (before: string) => {
      const i = a.mode === "add" ? -1 : before.lastIndexOf("\n\n— Assistant report,");
      return i >= 0 ? before.slice(0, i) : before;
    };
    const related = (Array.isArray(a.related_action_ids) ? a.related_action_ids : []).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 10);
    const saveRow = async (key: string, title: string) => {
      await ctx.db.from("assistant_reports").insert({
        master_plan_id: ctx.planId,
        item_type: isTask ? "task" : "reminder",
        item_key: key,
        item_title: title.slice(0, 200),
        report: { summary: r.summary || fallback.slice(0, 400), done: r.done, found: r.found, next_steps: r.next_steps },
        related_action_ids: related,
      });
    };
    if (isTask) {
      const { data } = await ctx.db.from("tasks").select("id, title, description").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("updated_at", { ascending: false }).limit(5);
      const rows = (data ?? []) as { id: number; title: string; description: string | null }[];
      const t = rows.find((x) => x.title.toLowerCase() === q.toLowerCase()) ?? (rows.length === 1 ? rows[0] : null);
      if (!t) throw new Error("I couldn't pick one task.");
      const before = t.description ?? "";
      const next = (swap(before) + block).slice(-MAX_TEXT);
      const { error } = await ctx.db.from("tasks").update({ description: next, updated_at: new Date().toISOString() }).eq("id", t.id).eq("master_plan_id", ctx.planId);
      if (error) throw new Error("That didn't save.");
      await saveRow(String(t.id), t.title);
      return { summary: `Saved the report on the task "${t.title}".`, undo: { item: "task", id: t.id, before } };
    }
    const { data } = await ctx.db.from("reminders").select("id, title, notes").eq("master_plan_id", ctx.planId).ilike("title", `%${q}%`).order("remind_at", { ascending: false }).limit(5);
    const rows = (data ?? []) as { id: string; title: string; notes: string | null }[];
    const rm = rows.find((x) => x.title.toLowerCase() === q.toLowerCase()) ?? (rows.length === 1 ? rows[0] : null);
    if (!rm) throw new Error("I couldn't pick one reminder.");
    const before = rm.notes ?? "";
    const next = (swap(before) + block).slice(-MAX_TEXT);
    const { error } = await ctx.db.from("reminders").update({ notes: next, updated_at: new Date().toISOString() }).eq("id", rm.id).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("That didn't save.");
    await saveRow(rm.id, rm.title);
    return { summary: `Saved the report on the reminder "${rm.title}".`, undo: { item: "reminder", id: rm.id, before } };
  },
  undo: async (u, ctx) => {
    if (u.item === "task") {
      await ctx.db.from("tasks").update({ description: (u.before as string) || null }).eq("id", u.id as number).eq("master_plan_id", ctx.planId);
      const { data: last } = await ctx.db.from("assistant_reports").select("id").eq("master_plan_id", ctx.planId).eq("item_type", "task").eq("item_key", String(u.id)).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (last?.id) await ctx.db.from("assistant_reports").delete().eq("id", last.id as string).eq("master_plan_id", ctx.planId);
      return "Took the report off the task.";
    }
    await ctx.db.from("reminders").update({ notes: (u.before as string) || null }).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    const { data: lastR } = await ctx.db.from("assistant_reports").select("id").eq("master_plan_id", ctx.planId).eq("item_type", "reminder").eq("item_key", String(u.id)).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (lastR?.id) await ctx.db.from("assistant_reports").delete().eq("id", lastR.id as string).eq("master_plan_id", ctx.planId);
    return "Took the report off the reminder.";
  },
};

export const WORK_TOOLS: ActionTool[] = [getTask, getReminder, checkOutreach, saveWorkReport];
