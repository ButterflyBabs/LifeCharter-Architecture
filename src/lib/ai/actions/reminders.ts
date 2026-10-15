import type { ActionTool } from "./types";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { zonedToUtcISO } from "@/lib/tz";
import { whenWords } from "@/lib/reminders";

// Reminders for the client's assistant: "remind me tomorrow at 9 to renew the LinkedIn trial". Reminders are one-off
// things typed in (not tasks). Writes sit behind Approve and have Undo.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

async function whenOf(a: Record<string, unknown>): Promise<{ iso: string; tz: string } | { error: string }> {
  const tz = await resolveUserTimeZone(null);
  if (typeof a.in_minutes === "number" && a.in_minutes > 0 && a.in_minutes < 60 * 24 * 365) {
    return { iso: new Date(Date.now() + Math.round(a.in_minutes) * 60_000).toISOString(), tz };
  }
  const date = str(a.date, 10);
  const time = str(a.time, 5) || "09:00";
  if (!DAY.test(date)) return { error: "I need the date (YYYY-MM-DD), or how many minutes from now." };
  if (!TIME.test(time)) return { error: "The time needs to be like 09:30 (24-hour)." };
  return { iso: zonedToUtcISO(date, time, tz), tz };
}

export const listReminders: ActionTool = {
  name: "list_reminders",
  kind: "read",
  apiPath: "/api/reminders",
  description: "List the client's open reminders (the one-off things they asked to be reminded of), soonest first, with when each is due and the start of each note. For the whole note of one reminder use get_reminder.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const tz = await resolveUserTimeZone(null);
    const { data } = await ctx.db.from("reminders").select("title, notes, remind_at").eq("master_plan_id", ctx.planId).eq("status", "open").order("remind_at").limit(40);
    const rows = (data ?? []) as { title: string; notes: string | null; remind_at: string }[];
    if (!rows.length) return "The client has no open reminders.";
    return rows.map((r) => `${r.title} | ${whenWords(r.remind_at, Date.now(), tz)}${r.notes ? ` | ${r.notes.slice(0, 240)}${r.notes.length > 240 ? " (…use get_reminder for the whole note)" : ""}` : ""}`).join("\n");
  },
};

export const createReminder: ActionTool = {
  name: "create_reminder",
  kind: "write",
  apiPath: "/api/reminders",
  description:
    "Add a one-off reminder for the client: what to remember and when to be reminded (it then shows on their Reminders page, Executive Home, Daily Compass and bell, and is emailed when due). Give either in_minutes (from now) or a local date (YYYY-MM-DD) and time (HH:MM, 24-hour, in their own time zone). If they only say a day, use 09:00. Use this for one-off things like a trial that renews, not for work to do (that is a task). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "What to remember, as the client would say it." },
      notes: { type: "string" },
      date: { type: "string", description: "Local date YYYY-MM-DD." },
      time: { type: "string", description: "Local time HH:MM, 24-hour." },
      in_minutes: { type: "number", description: "Minutes from now, instead of date and time." },
    },
    required: ["title"],
  },
  plan: async (a) => {
    const title = str(a.title, 200);
    if (!title) return { error: "What should the reminder say?" };
    const w = await whenOf(a);
    if ("error" in w) return { error: w.error };
    if (new Date(w.iso).getTime() < Date.now() - 60_000) return { error: "That time has already passed. When should I set it for?" };
    return { preview: { title: `Add the reminder "${title}"`, lines: [`When: ${whenWords(w.iso, Date.now(), w.tz)}`, ...(str(a.notes, 1000) ? [`Notes: ${str(a.notes, 1000).slice(0, 120)}`] : [])] } };
  },
  run: async (a, ctx) => {
    const w = await whenOf(a);
    if ("error" in w) throw new Error(w.error);
    const { data, error } = await ctx.db
      .from("reminders")
      .insert({ master_plan_id: ctx.planId, title: str(a.title, 200), notes: str(a.notes, 1000) || null, remind_at: w.iso })
      .select("id, title")
      .single();
    if (error || !data) throw new Error("The reminder didn't save.");
    return { summary: `Added the reminder "${data.title}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("reminders").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the reminder.";
  },
};

export const completeReminder: ActionTool = {
  name: "complete_reminder",
  kind: "write",
  apiPath: "/api/reminders",
  description: "Mark one open reminder done, or snooze it to a later time, picking it by part of its text. The client approves first. When you mark a reminder done, also prepare or offer a follow-up in the same reply (create_task for the next piece of work, create_reminder for a time to check again): read it first with get_reminder so the follow-up fits what it was.",
  parameters: {
    type: "object",
    properties: {
      find_title: { type: "string" },
      action: { type: "string", enum: ["done", "snooze"] },
      snooze_minutes: { type: "number", description: "For snooze: minutes from now." },
    },
    required: ["find_title", "action"],
  },
  plan: async (a, ctx) => {
    const clean = str(a.find_title, 200).replace(/[%,()]/g, "");
    const { data } = await ctx.db.from("reminders").select("id, title").eq("master_plan_id", ctx.planId).eq("status", "open").ilike("title", `%${clean}%`).limit(5);
    const rows = (data ?? []) as { id: string; title: string }[];
    if (!rows.length) return { error: "I couldn't find an open reminder with that name." };
    if (rows.length > 1) return { error: `More than one matches: ${rows.map((r) => `"${r.title}"`).join(", ")}. Which one?` };
    if (a.action === "snooze" && !(typeof a.snooze_minutes === "number" && a.snooze_minutes > 0)) return { error: "How long should I snooze it for?" };
    return { preview: { title: a.action === "snooze" ? `Snooze "${rows[0].title}"` : `Mark "${rows[0].title}" done`, lines: a.action === "snooze" ? [`Remind again in ${Math.round(Number(a.snooze_minutes))} minutes`] : [] } };
  },
  run: async (a, ctx) => {
    const clean = str(a.find_title, 200).replace(/[%,()]/g, "");
    const { data } = await ctx.db.from("reminders").select("id, title, remind_at, status").eq("master_plan_id", ctx.planId).eq("status", "open").ilike("title", `%${clean}%`).limit(2);
    const r = (data ?? [])[0] as { id: string; title: string; remind_at: string; status: string } | undefined;
    if (!r || (data ?? []).length > 1) throw new Error("I couldn't pick one reminder.");
    const patch: Record<string, unknown> =
      a.action === "snooze"
        ? { remind_at: new Date(Date.now() + Math.round(Number(a.snooze_minutes)) * 60_000).toISOString(), notified_at: null, updated_at: new Date().toISOString() }
        : { status: "done", done_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await ctx.db.from("reminders").update(patch).eq("id", r.id).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("That didn't save.");
    return { summary: a.action === "snooze" ? `Snoozed "${r.title}".` : `Marked "${r.title}" done.`, undo: { id: r.id, remind_at: r.remind_at } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("reminders").update({ status: "open", done_at: null, remind_at: u.remind_at as string, notified_at: null }).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Put the reminder back as it was.";
  },
};

export const REMINDER_TOOLS: ActionTool[] = [listReminders, createReminder, completeReminder];
