import type { ActionCtx, ActionTool } from "./types";
import { eventUrl, replayOpen, slugify, type EventRow } from "@/lib/events";
import { hm, totals, type Entry } from "@/lib/timeTracking";
import { sessionsUsed } from "@/lib/portal";
import { joinProgram } from "@/lib/programs";
import { kindLabel, type ProgramKind } from "@/lib/courses";
import { CC, CLIENT_TAGS, FORMER_TAG, type CareKey } from "@/lib/clientCareAccounts";
import { accountTimezone } from "@/lib/broadcasts/engine";
import { isHousePlan } from "@/lib/housePlan";
import { dayInTz, zonedToUtcISO } from "@/lib/tz";

// The assistant's tools for the client-work features released before October 18 that had none: Events, Time,
// Client Portals, Client Care and adding people to a program. Nothing here sends an email or text: an event stays a
// draft (the client opens sign-ups), a portal link is never emailed by the assistant, and Client Care pieces are
// switched on by the client. Writes wait for the client's Approve; reads run straight away.

const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const link = (v: unknown) => (/^https?:\/\//i.test(clean(v, 1000)) ? clean(v, 1000) : null);
const usd = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const DAY = 86_400_000;
const tzOf = async (ctx: ActionCtx) => accountTimezone(ctx.db, ctx.planId, await isHousePlan(ctx.planId));
const longDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

type Person = { id: string; email: string; first_name: string | null; last_name: string | null };
const nameOf = (c: Person) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

/** One of the client's own contacts by email or name. Several matches = ask which. */
async function findPerson(ctx: ActionCtx, ref: unknown): Promise<Person | { error: string }> {
  const r = clean(ref, 160).replace(/[%,()"]/g, "");
  if (!r) return { error: "Which client do you mean?" };
  let q = ctx.db.from("seq_contacts").select("id, email, first_name, last_name").eq("master_plan_id", ctx.planId).limit(6);
  if (r.includes("@")) q = q.eq("email", r.toLowerCase());
  else {
    const [first, ...rest] = r.split(/\s+/);
    q = rest.length ? q.ilike("first_name", `${first}%`).ilike("last_name", `${rest.join(" ")}%`) : q.or(`first_name.ilike.${r}%,last_name.ilike.${r}%`);
  }
  const { data } = await q;
  const rows = (data || []) as Person[];
  if (!rows.length) return { error: `I couldn't find a contact called "${r}". What's their email?` };
  if (rows.length > 1) return { error: `More than one contact matches "${r}": ${rows.slice(0, 5).map((c) => `${nameOf(c)} <${c.email}>`).join("; ")}. Which one?` };
  return rows[0];
}

async function findEvent(ctx: ActionCtx, ref: unknown) {
  const r = clean(ref, 160).toLowerCase();
  if (!r) return null;
  const { data } = await ctx.db.from("events").select("*").eq("master_plan_id", ctx.planId).order("created_at", { ascending: false });
  const rows = (data || []) as EventRow[];
  return rows.find((e) => e.id === r || e.slug === r) || rows.find((e) => e.title.toLowerCase() === r) || rows.find((e) => e.title.toLowerCase().includes(r)) || null;
}

// ---------- Events ----------

export const listEvents: ActionTool = {
  name: "list_events",
  kind: "read",
  apiPath: "/api/events",
  description: "List the client's Events (live webinars, MasterClasses, workshops and multi-day challenges): status (draft, open for sign-ups, ended), date, sign-ups, attended and missed, and replay status. Give event (part of its title) for one event's detail including who signed up (first names) and challenge day content. Use for 'how many signed up', 'who came', 'did the replay go out'.",
  parameters: { type: "object", properties: { event: { type: "string", description: "Part of one event's title, for its detail." } } },
  read: async (args, ctx) => {
    const tz = await tzOf(ctx);
    const when = (e: EventRow) =>
      e.kind === "live"
        ? e.starts_at ? `${longDay(dayInTz(e.starts_at, e.timezone || tz))} ${new Intl.DateTimeFormat("en-US", { timeZone: e.timezone || tz, hour: "numeric", minute: "2-digit" }).format(new Date(e.starts_at))} (${e.timezone || tz})` : "no date yet"
        : `${e.days ?? 0}-day challenge${e.starts_on ? ` starting ${longDay(e.starts_on)}` : ", each person starts the day after signing up"}`;
    const status = (e: EventRow) => (e.status === "published" ? "open for sign-ups" : e.status);
    const replay = (e: EventRow) => (e.kind !== "live" ? "" : e.replay_sent_at ? `replay sent${e.replay_hours ? replayOpen(e) ? `, open ${e.replay_hours} h` : ", replay now closed" : ""}` : e.replay_url ? "replay link added, not sent yet" : "no replay yet");
    if (clean(args.event, 160)) {
      const e = await findEvent(ctx, args.event);
      if (!e) return "I couldn't find that event. Call list_events with no event to see them all.";
      const [{ data: regs }, { data: days }] = await Promise.all([
        ctx.db.from("event_registrations").select("first_name, attended, last_day_sent, created_at").eq("event_id", e.id).eq("master_plan_id", ctx.planId).order("created_at", { ascending: false }).limit(2000),
        e.kind === "challenge" ? ctx.db.from("event_days").select("day, title").eq("event_id", e.id).order("day") : Promise.resolve({ data: [] }),
      ]);
      const rs = (regs || []) as { first_name: string | null; attended: boolean | null; last_day_sent: number }[];
      const came = rs.filter((r) => r.attended === true);
      const missed = rs.filter((r) => r.attended === false);
      const ds = (days || []) as { day: number; title: string }[];
      return [
        `${e.title} (${e.kind === "live" ? "live event" : "challenge"}, ${status(e)}): ${when(e)}. Sign-up page ${eventUrl(e.slug)}${e.status === "published" ? "" : " (not open yet)"}.`,
        `${rs.length} signed up${e.capacity ? ` of ${e.capacity} places` : ""}${rs.length ? `: ${rs.slice(0, 25).map((r) => r.first_name || "Someone").join(", ")}${rs.length > 25 ? "…" : ""}` : ""}.`,
        e.kind === "live" ? `Attended ${came.length}, missed ${missed.length}, not marked ${rs.length - came.length - missed.length}. ${replay(e)}.` : `Days written: ${ds.length} of ${e.days ?? 0}${ds.length ? ` (${ds.slice(0, 10).map((d) => `${d.day}. ${d.title}`).join("; ")})` : ""}.`,
        e.join_url ? "Join link is set." : e.kind === "live" ? "No join link yet." : "",
        `Open it at /events.`,
      ].filter(Boolean).join(" ");
    }
    const { data: evs } = await ctx.db.from("events").select("*").eq("master_plan_id", ctx.planId).order("created_at", { ascending: false }).limit(40);
    const list = (evs || []) as EventRow[];
    if (!list.length) return "The client has no events yet. They can be a live event (webinar, MasterClass, workshop) or a multi-day challenge; create_event drafts one.";
    const { data: regs } = await ctx.db.from("event_registrations").select("event_id, attended").eq("master_plan_id", ctx.planId).in("event_id", list.map((e) => e.id)).limit(20000);
    const by = new Map<string, { n: number; came: number; missed: number }>();
    for (const r of (regs || []) as { event_id: string; attended: boolean | null }[]) {
      const x = by.get(r.event_id) ?? { n: 0, came: 0, missed: 0 };
      x.n++;
      if (r.attended === true) x.came++;
      if (r.attended === false) x.missed++;
      by.set(r.event_id, x);
    }
    return list
      .map((e) => {
        const x = by.get(e.id) ?? { n: 0, came: 0, missed: 0 };
        return `- ${e.title} (${e.kind === "live" ? "live" : "challenge"}, ${status(e)}): ${when(e)}; ${x.n} signed up${e.kind === "live" && (x.came || x.missed) ? `, ${x.came} attended, ${x.missed} missed` : ""}${e.kind === "live" ? `; ${replay(e)}` : ""}`;
      })
      .join("\n");
  },
};

const dayList = (raw: unknown) =>
  (Array.isArray(raw) ? raw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x, i) => ({ day: i + 1, title: clean(x.title, 200), body: clean(x.body, 8000), action: clean(x.action, 500) }))
    .filter((d) => d.title)
    .slice(0, 60);

function eventDraft(args: Record<string, unknown>) {
  const kind = args.kind === "challenge" ? "challenge" : "live";
  const date = clean(args.date, 10);
  const time = clean(args.time, 5);
  const days = Math.floor(Number(args.days));
  const dur = Math.floor(Number(args.duration_min));
  return {
    kind,
    title: clean(args.title, 160),
    subtitle: clean(args.subtitle, 240),
    description: clean(args.description, 8000),
    date: isDay(date) ? date : "",
    time: isTime(time) ? time : "",
    duration: dur >= 5 && dur <= 600 ? dur : 60,
    joinUrl: link(args.join_url),
    days: kind === "challenge" ? (days >= 1 && days <= 60 ? days : 5) : null,
    startsOn: kind === "challenge" && isDay(clean(args.starts_on, 10)) ? clean(args.starts_on, 10) : null,
    sendHour: Number.isInteger(Number(args.send_hour)) && Number(args.send_hour) >= 0 && Number(args.send_hour) <= 23 ? Number(args.send_hour) : 7,
    dayContent: kind === "challenge" ? dayList(args.challenge_days) : [],
  };
}

export const createEvent: ActionTool = {
  name: "create_event",
  kind: "write",
  apiPath: "/api/events",
  description:
    "Draft a new event in Events. kind live (webinar, MasterClass, workshop: date YYYY-MM-DD and time HH:MM on the client's own clock, duration_min, join_url for Zoom or similar) or challenge (days, optional fixed starts_on, send_hour for the daily email, and challenge_days: one {title, body, action} per day in order, written in the client's voice). It is saved as a DRAFT: you never open it for sign-ups, so nobody can register and no email goes out until the client checks it and presses Open sign-ups on /events. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["live", "challenge"] },
      title: { type: "string" },
      subtitle: { type: "string" },
      description: { type: "string", description: "What the sign-up page says about it." },
      date: { type: "string", description: "Live: YYYY-MM-DD" },
      time: { type: "string", description: "Live: HH:MM, 24-hour, on the client's clock" },
      duration_min: { type: "number" },
      join_url: { type: "string" },
      days: { type: "number", description: "Challenge: how many days" },
      starts_on: { type: "string", description: "Challenge: YYYY-MM-DD if everyone starts together" },
      send_hour: { type: "number", description: "Challenge: hour 0-23 the daily email goes out (default 7)" },
      challenge_days: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, action: { type: "string" } }, required: ["title"] } },
    },
    required: ["kind", "title"],
  },
  plan: async (args) => {
    const d = eventDraft(args);
    if (!d.title) return { error: "What's the event called?" };
    if (d.kind === "live" && clean(args.date, 10) && !d.date) return { error: "Which date is it (for example 2026-11-12)?" };
    if (d.kind === "live" && d.date && d.date < new Date(Date.now() - DAY).toISOString().slice(0, 10)) return { error: "That date has already passed. Which date did you mean?" };
    const lines =
      d.kind === "live"
        ? [
            d.date ? `${longDay(d.date)}${d.time ? ` at ${clock(d.time)}` : ", time not set yet"} (your time zone), ${d.duration} minutes.` : "No date yet: add it before opening sign-ups.",
            d.joinUrl ? `Join link: ${d.joinUrl}` : "No join link yet: paste your Zoom link before it goes out.",
          ]
        : [
            `${d.days} days${d.startsOn ? `, everyone starts ${longDay(d.startsOn)}` : ", each person starts the day after signing up"}; the daily email goes out at ${clock(`${String(d.sendHour).padStart(2, "0")}:00`)}.`,
            d.dayContent.length ? `${d.dayContent.length} day${d.dayContent.length === 1 ? "" : "s"} written:` : "Day content to write later.",
            ...d.dayContent.slice(0, 8).map((x) => `Day ${x.day}: ${x.title}`),
            ...(d.dayContent.length > 8 ? [`…and ${d.dayContent.length - 8} more.`] : []),
          ];
    return {
      preview: {
        title: `Draft the ${d.kind === "live" ? "live event" : "challenge"} "${d.title}"`,
        lines: [
          ...(d.subtitle ? [d.subtitle] : []),
          ...lines,
          "Saved as a draft: nobody can sign up and no email goes out until you check it and press Open sign-ups on Events.",
        ],
        links: [{ label: "Open Events", href: "/events" }],
      },
    };
  },
  run: async (args, ctx) => {
    const d = eventDraft(args);
    const tz = await tzOf(ctx);
    const base = slugify(d.title) || "event";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: taken } = await ctx.db.from("events").select("id").eq("slug", slug).maybeSingle();
      if (!taken) break;
      slug = `${base}-${i}`;
    }
    const { data, error } = await ctx.db
      .from("events")
      .insert({
        master_plan_id: ctx.planId,
        kind: d.kind,
        title: d.title,
        slug,
        subtitle: d.subtitle || null,
        description: d.description || null,
        timezone: tz,
        status: "draft",
        starts_at: d.kind === "live" && d.date ? zonedToUtcISO(d.date, d.time || "12:00", tz) : null,
        duration_min: d.duration,
        join_url: d.joinUrl,
        days: d.days,
        starts_on: d.startsOn,
        send_hour: d.sendHour,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("Couldn't create the event.");
    if (d.dayContent.length) await ctx.db.from("event_days").insert(d.dayContent.map((x) => ({ event_id: data.id, day: x.day, title: x.title, body: x.body || null, action: x.action || null })));
    return { summary: `Drafted "${d.title}". Check it on Events and press Open sign-ups when you're ready.`, result: { eventId: data.id, url: eventUrl(slug) }, undo: { eventId: data.id } };
  },
  undo: async (u, ctx) => {
    const { data: e } = await ctx.db.from("events").select("id, status").eq("id", u.eventId as string).eq("master_plan_id", ctx.planId).maybeSingle();
    if (!e) return "It was already removed.";
    const { count } = await ctx.db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id);
    if (count) return "People have signed up for it, so I left it in place. You can end it on Events.";
    await ctx.db.from("event_days").delete().eq("event_id", e.id);
    await ctx.db.from("events").delete().eq("id", e.id).eq("master_plan_id", ctx.planId);
    return "Removed that draft event.";
  },
};

// ---------- Time ----------

type TimeRow = Entry & { id: string; note: string | null; person_email: string };

/** Monday of the week containing `day` (YYYY-MM-DD). */
export const mondayOf = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
};
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

export const timeSummary: ActionTool = {
  name: "time_summary",
  kind: "read",
  apiPath: "/api/time",
  description: "The client's tracked time from Time: hours this week (or last week, or the last 30 days) against their weekly capacity, billable hours and billable value, and hours by client and by project, plus a running timer. Use for 'how many hours have I worked', 'how much can I bill', 'am I over capacity'.",
  parameters: { type: "object", properties: { period: { type: "string", enum: ["this_week", "last_week", "last_30_days"] } } },
  read: async (args, ctx) => {
    const tz = await tzOf(ctx);
    const today = dayInTz(new Date(), tz);
    const period = ["last_week", "last_30_days"].includes(String(args.period)) ? String(args.period) : "this_week";
    const fromDay = period === "last_30_days" ? addDays(today, -29) : period === "last_week" ? addDays(mondayOf(today), -7) : mondayOf(today);
    const toDay = period === "last_30_days" ? addDays(today, 1) : addDays(fromDay, 7);
    const [{ data: rows }, { data: s }] = await Promise.all([
      ctx.db.from("time_entries").select("id, person_email, contact_id, project_id, note, started_at, ended_at, billable, rate").eq("master_plan_id", ctx.planId).gte("started_at", zonedToUtcISO(fromDay, "00:00", tz)).lt("started_at", zonedToUtcISO(toDay, "00:00", tz)).limit(5000),
      ctx.db.from("time_settings").select("weekly_capacity_hours").eq("master_plan_id", ctx.planId).maybeSingle(),
    ]);
    const es = (rows || []) as TimeRow[];
    const cap = Number(s?.weekly_capacity_hours ?? 30);
    const label = period === "this_week" ? "This week" : period === "last_week" ? "Last week" : "The last 30 days";
    if (!es.length) return `${label}: no time tracked yet. Weekly capacity is ${cap} hours. Time is tracked on /time (start a timer or add time).`;
    const t = totals(es);
    const group = async (key: "contact_id" | "project_id") => {
      const ids = Array.from(new Set(es.map((e) => e[key]).filter(Boolean))) as string[];
      const names = new Map<string, string>();
      if (ids.length && key === "contact_id") for (const c of ((await ctx.db.from("seq_contacts").select("id, email, first_name, last_name").in("id", ids).eq("master_plan_id", ctx.planId)).data || []) as Person[]) names.set(c.id, nameOf(c));
      if (ids.length && key === "project_id") for (const p of ((await ctx.db.from("projects").select("id, name").in("id", ids).eq("master_plan_id", ctx.planId)).data || []) as { id: string; name: string }[]) names.set(p.id, p.name);
      const sums = new Map<string, number>();
      for (const e of es) if (e[key]) sums.set(e[key]!, (sums.get(e[key]!) ?? 0) + totals([e]).min);
      return Array.from(sums.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, m]) => `${names.get(id) ?? "Unknown"} ${hm(m)}`);
    };
    const [byClient, byProject] = await Promise.all([group("contact_id"), group("project_id")]);
    const running = es.find((e) => !e.ended_at);
    const capFor = period === "last_30_days" ? Math.round((cap * 30) / 7) : cap;
    const pct = capFor ? Math.round((t.min / 60 / capFor) * 100) : 0;
    return [
      `${label}: ${hm(t.min)} tracked of ${capFor} hours capacity (${pct}%).`,
      `Billable ${hm(t.billMin)}${t.amount ? `, worth ${usd(t.amount)}` : " (no rate set, so no value)"}.`,
      byClient.length ? `By client: ${byClient.join("; ")}.` : "",
      byProject.length ? `By project: ${byProject.join("; ")}.` : "",
      running ? `A timer is running${running.note ? ` for "${running.note}"` : ""}.` : "",
      "Details on /time.",
    ].filter(Boolean).join(" ");
  },
};

export const addTimeEntry: ActionTool = {
  name: "add_time_entry",
  kind: "write",
  apiPath: "/api/time",
  description: "Add time the client already worked to Time: date YYYY-MM-DD, start_time HH:MM on their clock, minutes (1 to 1440), what it was for (note), optionally the client it was for (name or email) and a project (part of its name), and billable (default yes; their saved rate for that client, else their default rate, is used). It does not start a timer. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string" },
      start_time: { type: "string" },
      minutes: { type: "number" },
      note: { type: "string" },
      client: { type: "string", description: "Contact name or email (optional)" },
      project: { type: "string", description: "Part of a project name (optional)" },
      billable: { type: "boolean" },
    },
    required: ["date", "minutes"],
  },
  plan: async (args, ctx) => {
    const date = clean(args.date, 10);
    const start = clean(args.start_time, 5) || "09:00";
    const minutes = Math.floor(Number(args.minutes));
    if (!isDay(date)) return { error: "Which day was it (YYYY-MM-DD)?" };
    if (!isTime(start)) return { error: "What time did you start?" };
    if (!(minutes > 0 && minutes <= 1440)) return { error: "How long was it (between 1 minute and 24 hours)?" };
    if (date > new Date(Date.now() + DAY).toISOString().slice(0, 10)) return { error: "That day hasn't happened yet. Time is added after the work is done." };
    const lines = [`${longDay(date)}, from ${clock(start)}, ${hm(minutes)}.`];
    if (clean(args.note, 500)) lines.push(`For: ${clean(args.note, 500)}`);
    if (clean(args.client, 160)) {
      const c = await findPerson(ctx, args.client);
      if ("error" in c) return c;
      lines.push(`Client: ${nameOf(c)}`);
    }
    if (clean(args.project, 160)) {
      const p = await findProjectByName(ctx, args.project);
      if (!p) return { error: "I couldn't find that project. Which one do you mean?" };
      lines.push(`Project: ${p.name}`);
    }
    lines.push(args.billable === false ? "Not billable." : "Billable at your saved rate.");
    return { preview: { title: "Add time to Time", lines, links: [{ label: "Open Time", href: "/time" }] } };
  },
  run: async (args, ctx) => {
    const tz = await tzOf(ctx);
    const date = clean(args.date, 10);
    const start = clean(args.start_time, 5) || "09:00";
    const minutes = Math.floor(Number(args.minutes));
    const c = clean(args.client, 160) ? await findPerson(ctx, args.client) : null;
    const contactId = c && !("error" in c) ? c.id : null;
    const p = clean(args.project, 160) ? await findProjectByName(ctx, args.project) : null;
    const { data: s } = await ctx.db.from("time_settings").select("default_rate, client_rates").eq("master_plan_id", ctx.planId).maybeSingle();
    const cr = (s?.client_rates as Record<string, number>) ?? {};
    const rate = contactId && cr[contactId] != null ? Number(cr[contactId]) : s?.default_rate == null ? null : Number(s.default_rate);
    const startISO = zonedToUtcISO(date, start, tz);
    const { data, error } = await ctx.db
      .from("time_entries")
      .insert({ master_plan_id: ctx.planId, person_email: ctx.userEmail || "owner", contact_id: contactId, project_id: p?.id ?? null, note: clean(args.note, 500) || null, started_at: startISO, ended_at: new Date(Date.parse(startISO) + minutes * 60_000).toISOString(), billable: args.billable !== false, rate })
      .select("id")
      .single();
    if (error || !data) throw new Error("The time didn't save.");
    return { summary: `Added ${hm(minutes)} on ${longDay(date)}.`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("time_entries").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed that time entry.";
  },
};

async function findProjectByName(ctx: ActionCtx, ref: unknown) {
  const r = clean(ref, 160).toLowerCase();
  if (!r) return null;
  const { data } = await ctx.db.from("projects").select("id, name").eq("master_plan_id", ctx.planId).limit(300);
  const rows = (data || []) as { id: string; name: string }[];
  return rows.find((p) => p.name.toLowerCase() === r) || rows.find((p) => p.name.toLowerCase().includes(r)) || null;
}

// ---------- Client Portals ----------

export const portalStatus: ActionTool = {
  name: "portal_status",
  kind: "read",
  apiPath: "/api/client-portal",
  description: "Client Portals: with client (name or email), that client's portal: whether it's on, when the link was sent and last opened, packages and sessions left, homework and goals with done or not, and unread messages from them. With no client, every portal with last visit and unread messages. Use for 'how many sessions does Sam have left', 'has she opened her portal', 'any portal messages'.",
  parameters: { type: "object", properties: { client: { type: "string" } } },
  read: async (args, ctx) => {
    const ago = (iso: string | null) => (iso ? `${Math.max(0, Math.round((Date.now() - Date.parse(iso)) / DAY))} days ago` : "never");
    if (!clean(args.client, 160)) {
      const { data: ps } = await ctx.db.from("client_portals").select("contact_id, active, sent_at, last_seen_at").eq("master_plan_id", ctx.planId).limit(500);
      const list = (ps || []) as { contact_id: string; active: boolean; sent_at: string | null; last_seen_at: string | null }[];
      if (!list.length) return "No client portals yet. A portal is made for a client on /client-portals (or when they join a program).";
      const ids = list.map((p) => p.contact_id);
      const [{ data: people }, { data: unread }] = await Promise.all([
        ctx.db.from("seq_contacts").select("id, email, first_name, last_name").in("id", ids).eq("master_plan_id", ctx.planId),
        ctx.db.from("portal_messages").select("contact_id").eq("master_plan_id", ctx.planId).eq("author", "client").is("read_at", null).limit(2000),
      ]);
      const name = new Map(((people || []) as Person[]).map((c) => [c.id, nameOf(c)]));
      const n = new Map<string, number>();
      for (const u of (unread || []) as { contact_id: string }[]) n.set(u.contact_id, (n.get(u.contact_id) ?? 0) + 1);
      return list
        .map((p) => `- ${name.get(p.contact_id) ?? "Someone"}: ${p.active ? "on" : "switched off"}, link ${p.sent_at ? "sent" : "not sent"}, last opened ${ago(p.last_seen_at)}${n.get(p.contact_id) ? `, ${n.get(p.contact_id)} unread message(s)` : ""}`)
        .join("\n");
    }
    const c = await findPerson(ctx, args.client);
    if ("error" in c) return c.error;
    const [{ data: p }, { data: pkgs }, { data: items }, { data: msgs }] = await Promise.all([
      ctx.db.from("client_portals").select("active, sent_at, last_seen_at").eq("contact_id", c.id).eq("master_plan_id", ctx.planId).maybeSingle(),
      ctx.db.from("client_packages").select("id, name, sessions_total, expires_on, status").eq("contact_id", c.id).eq("master_plan_id", ctx.planId).neq("status", "cancelled").order("created_at", { ascending: false }),
      ctx.db.from("portal_items").select("kind, title, status, due_on").eq("contact_id", c.id).eq("master_plan_id", ctx.planId).order("position"),
      ctx.db.from("portal_messages").select("author, body, read_at, created_at").eq("contact_id", c.id).eq("master_plan_id", ctx.planId).order("created_at", { ascending: false }).limit(20),
    ]);
    const pk = (pkgs || []) as { id: string; name: string; sessions_total: number; expires_on: string | null; status: string }[];
    const used = await sessionsUsed(ctx.db, pk.map((x) => x.id));
    const its = (items || []) as { kind: string; title: string; status: string; due_on: string | null }[];
    const hw = its.filter((i) => i.kind === "homework");
    const goals = its.filter((i) => i.kind === "goal");
    const unread = ((msgs || []) as { author: string; body: string; read_at: string | null }[]).filter((m) => m.author === "client" && !m.read_at);
    return [
      p ? `${nameOf(c)}'s portal is ${p.active ? "on" : "switched off"}; link ${p.sent_at ? `sent ${ago(p.sent_at as string)}` : "not sent yet"}; last opened ${ago(p.last_seen_at as string | null)}.` : `${nameOf(c)} has no portal yet (make one on /client-portals).`,
      pk.length ? `Packages: ${pk.map((x) => `${x.name} ${Math.max(0, x.sessions_total - Math.max(0, used.get(x.id) ?? 0))} of ${x.sessions_total} sessions left${x.status !== "active" ? ` (${x.status})` : ""}${x.expires_on ? `, ends ${x.expires_on}` : ""}`).join("; ")}.` : "No session package.",
      hw.length ? `Homework: ${hw.map((i) => `${i.title} (${i.status === "done" ? "done" : i.due_on ? `due ${i.due_on}` : "open"})`).join("; ")}.` : "No homework.",
      goals.length ? `Goals: ${goals.map((i) => `${i.title} (${i.status === "achieved" || i.status === "done" ? "reached" : i.status})`).join("; ")}.` : "",
      unread.length ? `${unread.length} unread message(s) from them, newest: "${unread[0].body.slice(0, 200)}".` : "No unread messages.",
      `Open it at /client-portals?contact=${c.id}.`,
    ].filter(Boolean).join(" ");
  },
};

const ITEM_KINDS = { homework: "homework", goal: "goal" } as const;

export const addPortalItem: ActionTool = {
  name: "add_portal_item",
  kind: "write",
  apiPath: "/api/client-portal",
  description: "Add homework or a goal to one client's portal (Client Portals): client (name or email), kind homework or goal, title (short, verb first for homework), optional detail and due date YYYY-MM-DD and a link. The client sees it next time they open their portal; nothing is emailed. The account owner approves first.",
  parameters: {
    type: "object",
    properties: {
      client: { type: "string" },
      kind: { type: "string", enum: ["homework", "goal"] },
      title: { type: "string" },
      detail: { type: "string" },
      due_on: { type: "string" },
      url: { type: "string" },
    },
    required: ["client", "kind", "title"],
  },
  plan: async (args, ctx) => {
    const kind = ITEM_KINDS[String(args.kind) as keyof typeof ITEM_KINDS];
    const title = clean(args.title, 200);
    if (!kind) return { error: "Is it homework or a goal?" };
    if (!title) return { error: "What should it say?" };
    if (clean(args.url, 1000) && !link(args.url)) return { error: "Links need to start with https://" };
    const c = await findPerson(ctx, args.client);
    if ("error" in c) return c;
    const due = clean(args.due_on, 10);
    return {
      preview: {
        title: `Add ${kind === "goal" ? "a goal" : "homework"} to ${nameOf(c)}'s portal`,
        lines: [title, ...(clean(args.detail, 400) ? [clean(args.detail, 400)] : []), ...(isDay(due) ? [`Due ${longDay(due)}`] : []), ...(link(args.url) ? [`Link: ${link(args.url)}`] : []), "They see it next time they open their portal. Nothing is emailed."],
        links: [{ label: `Open ${nameOf(c)}'s portal`, href: `/client-portals?contact=${c.id}` }],
      },
    };
  },
  run: async (args, ctx) => {
    const kind = ITEM_KINDS[String(args.kind) as keyof typeof ITEM_KINDS];
    const c = await findPerson(ctx, args.client);
    if ("error" in c) throw new Error(c.error);
    const { count } = await ctx.db.from("portal_items").select("id", { count: "exact", head: true }).eq("contact_id", c.id).eq("master_plan_id", ctx.planId).eq("kind", kind);
    const due = clean(args.due_on, 10);
    const { data, error } = await ctx.db
      .from("portal_items")
      .insert({ master_plan_id: ctx.planId, contact_id: c.id, kind, title: clean(args.title, 200), body: clean(args.detail, 4000) || null, url: link(args.url), due_on: isDay(due) ? due : null, position: count ?? 0 })
      .select("id")
      .single();
    if (error || !data) throw new Error("It didn't save.");
    return { summary: `Added it to ${nameOf(c)}'s portal.`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("portal_items").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed it from their portal.";
  },
};

// ---------- Client Care ----------

const CARE_LABEL: Record<CareKey, string> = { thirty: "30-day check-in", pulse: "Quarterly pulse", exit: "Exit survey", quiet: "Quiet-client tasks" };

export const clientCareStatus: ActionTool = {
  name: "client_care_status",
  kind: "read",
  apiPath: "/api/client-care",
  description: "Client Care: which of the four pieces are on (30-day check-in, quarterly pulse, exit survey, quiet-client tasks), how many clients and former clients they have, and which clients have been quiet (no bookings, payments, emails or notes) for 14 days or more. Switching pieces on or off is the client's own choice on /client-care; you only report.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    if (await isHousePlan(ctx.planId)) return "This account's own Client Care runs from its CLIENT CARE campaigns, not the Client Care page.";
    const keys = Object.keys(CC) as CareKey[];
    const [{ data: seqs }, { data: settings }, { data: people }] = await Promise.all([
      ctx.db.from("sequences").select("key, active").eq("master_plan_id", ctx.planId).in("key", keys.map((k) => CC[k].seq)),
      ctx.db.from("client_care_settings").select("quiet_on, booking_slug").eq("master_plan_id", ctx.planId).maybeSingle(),
      ctx.db.from("seq_contacts").select("id, email, first_name, last_name, tags, created_at, last_activity_at").eq("master_plan_id", ctx.planId).overlaps("tags", [...CLIENT_TAGS, FORMER_TAG]).limit(5000),
    ]);
    if (!seqs?.length && !settings) return "Client Care isn't set up in this account yet. They press Set up on /client-care to load the forms and emails (switched off), then switch on the pieces they want.";
    const on = (k: CareKey) => (k === "quiet" ? Boolean(settings?.quiet_on) : Boolean(((seqs || []) as { key: string; active: boolean }[]).find((s) => s.key === CC[k].seq)?.active));
    const rows = (people || []) as (Person & { tags: string[]; created_at: string; last_activity_at: string | null })[];
    const clients = rows.filter((r) => !(r.tags || []).includes(FORMER_TAG));
    const quiet = clients
      .map((r) => ({ r, days: Math.floor((Date.now() - Date.parse(r.last_activity_at || r.created_at)) / DAY) }))
      .filter((x) => x.days >= 14)
      .sort((a, b) => b.days - a.days);
    return [
      `Pieces: ${keys.map((k) => `${CARE_LABEL[k]} ${on(k) ? "ON" : "off"}`).join("; ")}.`,
      `${clients.length} clients, ${rows.length - clients.length} former clients.`,
      quiet.length ? `Quiet 14+ days: ${quiet.slice(0, 12).map((x) => `${nameOf(x.r)} (${x.days} days)`).join("; ")}${quiet.length > 12 ? "…" : ""}.` : "No client has been quiet for 14 days.",
      settings?.booking_slug ? "" : "The third quiet-client note has no booking link yet.",
      "They switch pieces on or off themselves on /client-care.",
    ].filter(Boolean).join(" ");
  },
};

// ---------- Program members ----------

export const addProgramMember: ActionTool = {
  name: "add_program_member",
  kind: "write",
  apiPath: "/api/programs",
  description: "Add one of the client's contacts (name or email) to one of their courses, memberships or group programs (part of its name; call list_courses first). The person gets access in their client portal; a portal is made if they don't have one. This never emails them: after approving, the client presses Send portal link on the program if they want the link emailed. The client approves first.",
  parameters: { type: "object", properties: { client: { type: "string" }, program: { type: "string" } }, required: ["client", "program"] },
  plan: async (args, ctx) => {
    const prog = await findProgram(ctx, args.program);
    if (!prog) return { error: "I couldn't find that course or program. Which one do you mean?" };
    const c = await findPerson(ctx, args.client);
    if ("error" in c) return c;
    const { data: m } = await ctx.db.from("program_members").select("status").eq("program_id", prog.id).eq("contact_id", c.id).maybeSingle();
    if (m?.status === "active") return { error: `${nameOf(c)} is already in "${prog.name}".` };
    return {
      preview: {
        title: `Add ${nameOf(c)} to "${prog.name}"`,
        lines: [
          `${kindLabel(prog.kind)}. ${m ? "They were in it before; this brings them back." : "They get access in their client portal (one is made if they don't have one)."}`,
          "Nothing is emailed. To send them their portal link, press Send portal link on the program after approving.",
        ],
        links: [{ label: `Open ${prog.name}`, href: `/programs?id=${prog.id}` }],
      },
    };
  },
  run: async (args, ctx) => {
    const prog = await findProgram(ctx, args.program);
    const c = await findPerson(ctx, args.client);
    if (!prog || "error" in c) throw new Error("That program or contact is gone.");
    const { data: before } = await ctx.db.from("program_members").select("id").eq("program_id", prog.id).eq("contact_id", c.id).maybeSingle();
    const r = await joinProgram(ctx.db, ctx.planId, prog.id, c.id, "assistant", false);
    if (!r.ok) throw new Error("Couldn't add them.");
    return { summary: `Added ${nameOf(c)} to "${prog.name}". No email was sent.`, undo: { programId: prog.id, contactId: c.id, wasMember: Boolean(before) } };
  },
  undo: async (u, ctx) => {
    const { data: p } = await ctx.db.from("programs").select("id").eq("id", u.programId as string).eq("master_plan_id", ctx.planId).maybeSingle();
    if (!p) return "That program is gone.";
    if (u.wasMember) await ctx.db.from("program_members").update({ status: "removed", ended_at: new Date().toISOString(), end_reason: "undone" }).eq("program_id", p.id).eq("contact_id", u.contactId as string);
    else await ctx.db.from("program_members").delete().eq("program_id", p.id).eq("contact_id", u.contactId as string);
    return "Took them back out of the program.";
  },
};

async function findProgram(ctx: ActionCtx, ref: unknown) {
  const r = clean(ref, 160).toLowerCase();
  if (!r) return null;
  const { data } = await ctx.db.from("programs").select("id, name, kind, status").eq("master_plan_id", ctx.planId).eq("status", "active").order("created_at", { ascending: false });
  const rows = (data || []) as { id: string; name: string; kind: ProgramKind }[];
  return rows.find((p) => p.id === r) || rows.find((p) => p.name.toLowerCase() === r) || rows.find((p) => p.name.toLowerCase().includes(r)) || null;
}

export const CLIENT_WORK_TOOLS: ActionTool[] = [listEvents, createEvent, timeSummary, addTimeEntry, portalStatus, addPortalItem, clientCareStatus, addProgramMember];
