import type { ActionCtx, ActionTool } from "./types";
import { KINDS, kindLabel, percent, type ProgramKind } from "@/lib/courses";
import { AWAY_COLUMNS, awayDates, awayNote, type Away } from "@/lib/awayMode";
import { TEMPLATES, cleanContent, rate, slugify, starterContent, templateInfo, validSlug, type Template } from "@/lib/landingPages";
import { yearReview } from "@/lib/yearReview";
import { payeeKey, threshold1099 } from "@/lib/finance/receipts";
import { formatMoney } from "@/lib/currency";

// The assistant's tools for the October 18 releases: Courses & Memberships, Out of office, Landing Pages, Year in
// Review and 1099 contractor totals. Writes always wait for the client's Approve; reads run straight away.

const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const MAX_LESSONS = 30;
type LessonIn = { title: string; module: string; body: string; open_after_days: number | null };

function lessonsOf(raw: unknown): LessonIn[] {
  return (Array.isArray(raw) ? raw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => {
      const d = Math.floor(Number(x.open_after_days));
      return { title: clean(x.title, 200), module: clean(x.module, 120), body: clean(x.body, 4000), open_after_days: Number.isFinite(d) && d >= 1 && d <= 3650 ? d : null };
    })
    .filter((l) => l.title)
    .slice(0, MAX_LESSONS);
}

async function findCourse(ctx: ActionCtx, ref: unknown) {
  const r = clean(ref, 160).toLowerCase();
  if (!r) return null;
  const { data } = await ctx.db.from("programs").select("id, name, kind, status").eq("master_plan_id", ctx.planId).neq("status", "archived").order("created_at", { ascending: false });
  const rows = (data || []) as { id: string; name: string; kind: ProgramKind; status: string }[];
  return rows.find((p) => p.id === r) || rows.find((p) => p.name.toLowerCase() === r) || rows.find((p) => p.name.toLowerCase().includes(r)) || null;
}

const lessonLines = (ls: LessonIn[], kind: ProgramKind) =>
  ls.slice(0, 8).map((l) => `${l.module ? `${l.module}: ` : ""}${l.title}${kind !== "cohort" && l.open_after_days ? ` (opens day ${l.open_after_days})` : ""}`).concat(ls.length > 8 ? [`…and ${ls.length - 8} more.`] : []);

export const listCourses: ActionTool = {
  name: "list_courses",
  kind: "read",
  apiPath: "/api/programs",
  description: "List the client's courses, memberships and group programs (Courses & Memberships) with members, lessons and progress: average percent complete, who finished, and who is behind (joined over two weeks ago and under a quarter done, first names only). Use it for 'how is my course going', 'who's behind', and before adding lessons.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data: progs } = await ctx.db.from("programs").select("id, name, kind, status").eq("master_plan_id", ctx.planId).neq("status", "archived").order("created_at", { ascending: false });
    const list = (progs || []) as { id: string; name: string; kind: ProgramKind }[];
    if (!list.length) return "The client has no courses, memberships or group programs yet. Types: " + KINDS.map((k) => k.label).join(", ") + ".";
    const ids = list.map((p) => p.id);
    const [{ data: members }, { data: lessons }] = await Promise.all([
      ctx.db.from("program_members").select("program_id, contact_id, joined_at").in("program_id", ids).eq("status", "active"),
      ctx.db.from("program_lessons").select("id, program_id").in("program_id", ids),
    ]);
    const ls = (lessons || []) as { id: string; program_id: string }[];
    const ms = (members || []) as { program_id: string; contact_id: string; joined_at: string }[];
    const lessonIds = ls.map((l) => l.id);
    const { data: done } = lessonIds.length ? await ctx.db.from("program_lesson_done").select("lesson_id, contact_id").in("lesson_id", lessonIds) : { data: [] };
    const contactIds = Array.from(new Set(ms.map((m) => m.contact_id)));
    const { data: people } = contactIds.length ? await ctx.db.from("seq_contacts").select("id, first_name").in("id", contactIds) : { data: [] };
    const first = new Map(((people || []) as { id: string; first_name: string | null }[]).map((p) => [p.id, p.first_name || "Someone"]));
    const lessonProgram = new Map(ls.map((l) => [l.id, l.program_id]));
    const doneBy = new Map<string, number>();
    for (const d of (done || []) as { lesson_id: string; contact_id: string }[]) {
      const k = `${lessonProgram.get(d.lesson_id)}:${d.contact_id}`;
      doneBy.set(k, (doneBy.get(k) ?? 0) + 1);
    }
    const twoWeeks = Date.now() - 14 * 86_400_000;
    return list
      .map((p) => {
        const total = ls.filter((l) => l.program_id === p.id).length;
        const pm = ms.filter((m) => m.program_id === p.id);
        const pct = pm.map((m) => percent(doneBy.get(`${p.id}:${m.contact_id}`) ?? 0, total));
        const avg = pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : 0;
        const finished = pm.filter((m, i) => total && pct[i] === 100).map((m) => first.get(m.contact_id));
        const behind = pm.filter((m, i) => Date.parse(m.joined_at) < twoWeeks && pct[i] < 25).map((m) => first.get(m.contact_id));
        return `- ${p.name} (${kindLabel(p.kind)}): ${pm.length} members, ${total} lessons, average ${avg}% done${finished.length ? `; finished: ${finished.slice(0, 10).join(", ")}` : ""}${behind.length ? `; behind: ${behind.slice(0, 10).join(", ")}` : ""}`;
      })
      .join("\n");
  },
};

export const createCourse: ActionTool = {
  name: "create_course",
  kind: "write",
  apiPath: "/api/programs",
  description:
    "Start a new course, membership or group program in Courses & Memberships with its modules and lessons drafted. kind: course (self-paced; each lesson can open open_after_days after a person joins), membership (ongoing library), or cohort (a group program with dates). Write each lesson's title and a short starter text in the client's voice; group lessons with a module name; never invent facts. It adds no members and sends no email. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      kind: { type: "string", enum: ["course", "membership", "cohort"] },
      description: { type: "string", description: "What members see at the top." },
      access_days: { type: "number", description: "Course only: days of access after joining (leave out for lifetime)." },
      completion_message: { type: "string", description: "Shown when they finish every lesson (course or membership)." },
      lessons: {
        type: "array",
        items: { type: "object", properties: { title: { type: "string" }, module: { type: "string" }, body: { type: "string" }, open_after_days: { type: "number" } }, required: ["title"] },
      },
    },
    required: ["name", "kind"],
  },
  plan: async (args) => {
    const name = clean(args.name, 160);
    if (!name) return { error: "What should it be called?" };
    const kind = (["course", "membership", "cohort"].includes(String(args.kind)) ? args.kind : "course") as ProgramKind;
    const ls = lessonsOf(args.lessons);
    const access = Math.floor(Number(args.access_days));
    return {
      preview: {
        title: `Start the ${kindLabel(kind).toLowerCase()} "${name}"`,
        lines: [
          ...(clean(args.description, 300) ? [clean(args.description, 300)] : []),
          `${ls.length} lesson${ls.length === 1 ? "" : "s"}${ls.length ? ":" : " (add them later)"}`,
          ...lessonLines(ls, kind),
          ...(kind === "course" && access > 0 ? [`Access lasts ${access} days after joining.`] : []),
          "No members are added and nothing is emailed. Add members or connect the offer it's sold as when you're ready.",
        ],
        links: [{ label: "Open Courses & Memberships", href: "/programs" }],
      },
    };
  },
  run: async (args, ctx) => {
    const kind = (["course", "membership", "cohort"].includes(String(args.kind)) ? args.kind : "course") as ProgramKind;
    const access = Math.floor(Number(args.access_days));
    const { data, error } = await ctx.db
      .from("programs")
      .insert({ master_plan_id: ctx.planId, name: clean(args.name, 160), kind, feed_on: kind === "cohort", description: clean(args.description, 4000) || null, access_days: kind === "course" && access >= 1 && access <= 3650 ? access : null, completion_message: clean(args.completion_message, 2000) || null })
      .select("id")
      .single();
    if (error || !data) throw new Error("Couldn't create it.");
    const ls = lessonsOf(args.lessons);
    if (ls.length) await ctx.db.from("program_lessons").insert(ls.map((l, i) => ({ program_id: data.id, title: l.title, module: l.module || null, body: l.body || null, open_after_days: kind === "cohort" ? null : l.open_after_days, position: i })));
    return { summary: `Started "${clean(args.name, 160)}" with ${ls.length} lessons. Open it in Courses & Memberships to add videos and files.`, result: { programId: data.id }, undo: { programId: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("programs").delete().eq("master_plan_id", ctx.planId).eq("id", u.programId as string);
    return "Removed it and its lessons.";
  },
};

export const addCourseLessons: ActionTool = {
  name: "add_course_lessons",
  kind: "write",
  apiPath: "/api/programs",
  description: "Add lessons to one of the client's existing courses, memberships or group programs (pick it by part of its name; call list_courses first). Each lesson: title, optional module, short starter text in their voice, and for a course or membership open_after_days. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      course: { type: "string", description: "Part of its name." },
      lessons: { type: "array", items: { type: "object", properties: { title: { type: "string" }, module: { type: "string" }, body: { type: "string" }, open_after_days: { type: "number" } }, required: ["title"] } },
    },
    required: ["course", "lessons"],
  },
  plan: async (args, ctx) => {
    const p = await findCourse(ctx, args.course);
    if (!p) return { error: "I couldn't find that course. Which one do you mean?" };
    const ls = lessonsOf(args.lessons);
    if (!ls.length) return { error: "Which lessons should I add?" };
    return { preview: { title: `Add ${ls.length} lesson${ls.length === 1 ? "" : "s"} to "${p.name}"`, lines: lessonLines(ls, p.kind), links: [{ label: `Open ${p.name}`, href: `/programs?id=${p.id}` }] } };
  },
  run: async (args, ctx) => {
    const p = await findCourse(ctx, args.course);
    if (!p) throw new Error("That course is gone.");
    const ls = lessonsOf(args.lessons);
    const { count } = await ctx.db.from("program_lessons").select("id", { count: "exact", head: true }).eq("program_id", p.id);
    const { data } = await ctx.db
      .from("program_lessons")
      .insert(ls.map((l, i) => ({ program_id: p.id, title: l.title, module: l.module || null, body: l.body || null, open_after_days: p.kind === "cohort" ? null : l.open_after_days, position: (count ?? 0) + i })))
      .select("id");
    return { summary: `Added ${ls.length} lessons to "${p.name}".`, undo: { ids: ((data || []) as { id: string }[]).map((x) => x.id), programId: p.id } };
  },
  undo: async (u, ctx) => {
    const { data: p } = await ctx.db.from("programs").select("id").eq("id", u.programId as string).eq("master_plan_id", ctx.planId).maybeSingle();
    if (p) await ctx.db.from("program_lessons").delete().eq("program_id", p.id).in("id", (u.ids as string[]) || []);
    return "Removed those lessons.";
  },
};

export const setAway: ActionTool = {
  name: "set_away_dates",
  kind: "write",
  apiPath: "/api/away",
  description: "Set or clear the client's out-of-office dates (Settings > Out of office). starts_on and ends_on as YYYY-MM-DD; message is the note clients see (leave out for the plain default); block_bookings closes their booking pages on those days; auto_reply answers client portal messages once per trip; pause_nudges stops their own reminder emails. clear: true turns it off. Bookings already made are not touched. Their Gmail or Outlook needs its own vacation responder. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      starts_on: { type: "string" },
      ends_on: { type: "string" },
      message: { type: "string" },
      block_bookings: { type: "boolean" },
      auto_reply: { type: "boolean" },
      pause_nudges: { type: "boolean" },
      clear: { type: "boolean" },
    },
  },
  plan: async (args) => {
    if (args.clear === true) return { preview: { title: "Turn off your out-of-office", lines: ["Booking pages reopen, portal auto-replies stop and your reminder emails start again."], links: [{ label: "Open Out of office", href: "/settings?tab=away" }] } };
    const s = clean(args.starts_on, 10);
    const e = clean(args.ends_on, 10);
    if (!isDay(s) || !isDay(e)) return { error: "What are the first and last days you're away?" };
    if (e < s) return { error: "The last day is before the first day. Which dates did you mean?" };
    if (e < new Date().toISOString().slice(0, 10)) return { error: "Those dates are already over." };
    const a = { starts_on: s, ends_on: e, message: clean(args.message, 1000) || null };
    return {
      preview: {
        title: `Away ${awayDates(a)}`,
        lines: [
          `Clients see: "${awayNote(a)}"`,
          args.block_bookings === false ? "Booking pages stay open." : "Booking pages close on those days.",
          args.auto_reply === false ? "No automatic portal reply." : "Portal messages get your note back once.",
          args.pause_nudges === false ? "Your reminder emails keep coming." : "Your own reminder emails pause.",
          "Bookings already made are not touched. Set your Gmail or Outlook vacation reply separately.",
        ],
        links: [{ label: "Open Out of office", href: "/settings?tab=away" }],
      },
    };
  },
  run: async (args, ctx) => {
    const { data: prev } = await ctx.db.from("away_mode").select(AWAY_COLUMNS).eq("master_plan_id", ctx.planId).maybeSingle();
    if (args.clear === true) {
      await ctx.db.from("away_mode").delete().eq("master_plan_id", ctx.planId);
      return { summary: "Your out-of-office is off.", undo: { prev } };
    }
    await ctx.db.from("away_mode").upsert(
      { master_plan_id: ctx.planId, starts_on: clean(args.starts_on, 10), ends_on: clean(args.ends_on, 10), message: clean(args.message, 1000) || null, block_bookings: args.block_bookings !== false, auto_reply: args.auto_reply !== false, pause_nudges: args.pause_nudges !== false, updated_at: new Date().toISOString() },
      { onConflict: "master_plan_id" }
    );
    return { summary: `You're set as away ${awayDates({ starts_on: clean(args.starts_on, 10), ends_on: clean(args.ends_on, 10) })}.`, undo: { prev } };
  },
  undo: async (u, ctx) => {
    const prev = u.prev as Away | null;
    if (prev) await ctx.db.from("away_mode").upsert({ ...prev, master_plan_id: ctx.planId, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
    else await ctx.db.from("away_mode").delete().eq("master_plan_id", ctx.planId);
    return "Put your out-of-office back as it was.";
  },
};

export const checkLandingPages: ActionTool = {
  name: "check_landing_pages",
  kind: "read",
  apiPath: "/api/landing-pages",
  description: "List the client's landing pages with status (draft, live, archived), web address, and visits, conversions and conversion rate for the last 30 days and all time. Use for 'how are my pages doing' and before drafting a new one.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("landing_pages").select("id, name, template, slug, status").eq("master_plan_id", ctx.planId).order("updated_at", { ascending: false });
    const pages = (data || []) as { id: string; name: string; template: Template; slug: string; status: string }[];
    if (!pages.length) return "No landing pages yet. Templates: " + TEMPLATES.map((t) => `${t.key} (${t.label})`).join("; ") + ".";
    const { data: hits } = await ctx.db.from("landing_page_hits").select("page_id, kind, created_at").in("page_id", pages.map((p) => p.id)).limit(20000);
    const since = Date.now() - 30 * 86_400_000;
    return pages
      .map((p) => {
        const h = ((hits || []) as { page_id: string; kind: string; created_at: string }[]).filter((x) => x.page_id === p.id);
        const v = h.filter((x) => x.kind === "view").length;
        const c = h.filter((x) => x.kind === "conversion").length;
        const v30 = h.filter((x) => x.kind === "view" && Date.parse(x.created_at) >= since).length;
        const c30 = h.filter((x) => x.kind === "conversion" && Date.parse(x.created_at) >= since).length;
        const conv = templateInfo(p.template).conversion;
        return `- ${p.name} (${templateInfo(p.template).label}, ${p.status === "published" ? "live" : p.status}) lccommandsuite.com/go/${p.slug}: last 30 days ${v30} visits, ${c30} ${conv}, ${rate(v30, c30)}%; all time ${v} visits, ${c} ${conv}, ${rate(v, c)}%`;
      })
      .join("\n");
  },
};

export const createLandingPage: ActionTool = {
  name: "create_landing_page",
  kind: "write",
  apiPath: "/api/landing-pages",
  description:
    "Draft a landing page in Landing Pages, saved as a DRAFT only (the client reviews and presses Publish themselves; you never publish). template: optin (uses one of their forms), webinar (one of their Events), sales (one of their offers), booking (one of their booking pages); link names that thing by part of its name. Write the words in their voice from what you know: headline, subheadline, body (paragraphs separated by blank lines), bullets_title, bullets, cta (button words), about. Never invent results, numbers, testimonials, prices or guarantees. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      template: { type: "string", enum: ["optin", "webinar", "sales", "booking"] },
      name: { type: "string", description: "For the client only." },
      link: { type: "string", description: "Part of the name of the form, event, offer or booking page it uses." },
      eyebrow: { type: "string" },
      headline: { type: "string" },
      subheadline: { type: "string" },
      body: { type: "string" },
      bullets_title: { type: "string" },
      bullets: { type: "array", items: { type: "string" } },
      cta: { type: "string" },
      about: { type: "string" },
    },
    required: ["template", "headline"],
  },
  plan: async (args, ctx) => {
    const t = (TEMPLATES.some((x) => x.key === args.template) ? args.template : null) as Template | null;
    if (!t) return { error: "Which kind of page: opt-in, webinar, sales or book a call?" };
    const linked = await linkFor(ctx, t, args.link);
    return {
      preview: {
        title: `Draft a ${templateInfo(t).label.toLowerCase()} landing page`,
        lines: [
          `Headline: ${clean(args.headline, 160)}`,
          ...(clean(args.subheadline, 300) ? [clean(args.subheadline, 300)] : []),
          ...(Array.isArray(args.bullets) ? (args.bullets as unknown[]).slice(0, 6).map((b) => clean(b, 200)) : []),
          linked ? `Uses: ${linked.name}` : `Not linked yet: choose ${templateInfo(t).uses} in the editor before publishing.`,
          "Saved as a draft. You check it and press Publish yourself.",
        ],
        links: [{ label: "Open Landing Pages", href: "/landing-pages" }],
      },
    };
  },
  run: async (args, ctx) => {
    const t = args.template as Template;
    const linked = await linkFor(ctx, t, args.link);
    const name = clean(args.name, 100) || clean(args.headline, 100) || templateInfo(t).label;
    let slug = slugify(name) || "page";
    for (let i = 2; !validSlug(slug) || (await ctx.db.from("landing_pages").select("id").eq("slug", slug).maybeSingle()).data; i++) slug = `${slugify(name).slice(0, 50) || "page"}-${i}`;
    const content = cleanContent(
      { ...starterContent(t), eyebrow: args.eyebrow, headline: args.headline, subheadline: args.subheadline, body: args.body, bulletsTitle: args.bullets_title, bullets: args.bullets, cta: args.cta, about: args.about },
      t
    );
    const { data, error } = await ctx.db
      .from("landing_pages")
      .insert({ master_plan_id: ctx.planId, template: t, name, slug, status: "draft", content, look: {}, form_id: t === "optin" ? linked?.id ?? null : null, event_id: t === "webinar" ? linked?.id ?? null : null, offer_id: t === "sales" ? linked?.id ?? null : null, calendar_id: t === "booking" ? linked?.id ?? null : null })
      .select("id")
      .single();
    if (error || !data) throw new Error("Couldn't save the page.");
    return { summary: `Saved the landing page "${name}" as a draft. Open Landing Pages to check it, add an image and press Publish.`, result: { pageId: data.id }, undo: { pageId: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("landing_pages").delete().eq("master_plan_id", ctx.planId).eq("id", u.pageId as string).neq("status", "published");
    return "Removed the draft page.";
  },
};

async function linkFor(ctx: ActionCtx, t: Template, ref: unknown): Promise<{ id: string; name: string } | null> {
  const r = clean(ref, 120).toLowerCase();
  if (!r) return null;
  const q =
    t === "optin" ? ctx.db.from("crm_forms").select("id, name").eq("master_plan_id", ctx.planId)
    : t === "webinar" ? ctx.db.from("events").select("id, name:title").eq("master_plan_id", ctx.planId)
    : t === "sales" ? ctx.db.from("sales_offers").select("id, name").eq("master_plan_id", ctx.planId)
    : ctx.db.from("booking_calendars").select("id, name").eq("master_plan_id", ctx.planId);
  const { data } = await q;
  const rows = (data || []) as unknown as { id: string; name: string }[];
  return rows.find((x) => x.name.toLowerCase() === r) || rows.find((x) => x.name.toLowerCase().includes(r)) || null;
}

export const yearSoFar: ActionTool = {
  name: "year_so_far",
  kind: "read",
  apiPath: "/api/year-review",
  description: "The client's Year in Review numbers for a year (default this year): income, expenses, net, best month, new customers and contacts, sessions and hours, events and sign-ups, program members, tasks finished, goals reached and business score change. Use for 'how's my year going' and year-end reflection.",
  parameters: { type: "object", properties: { year: { type: "number" } } },
  read: async (args, ctx) => {
    const now = new Date().getUTCFullYear();
    const y = Number(args.year);
    const year = Number.isInteger(y) && y >= 2020 && y <= now ? y : now;
    const r = await yearReview(ctx.db, ctx.planId, year, { money: true });
    const m = r.money;
    const usd = (n: number, c: string = m?.currency ?? "usd") => formatMoney(Math.round(n), c, { home: m?.currency, cents: false });
    return [
      `Year ${r.year}${year === now ? " so far" : ""}.`,
      m ? `Income ${usd(m.income)}, expenses ${usd(m.expenses)}, net ${usd(m.net)}${m.bestMonth ? `, best month ${m.bestMonth.month} (${usd(m.bestMonth.income)})` : ""}.` : "",
      m?.other ? `Kept separate in ${m.other.currency.toUpperCase()} (not included above): income ${usd(m.other.income, m.other.currency)}, expenses ${usd(m.other.expenses, m.other.currency)}, net ${usd(m.other.net, m.other.currency)}.` : "",
      `New customers ${r.people.newCustomers} (${r.people.newContacts} new contacts). Sessions held ${r.sessions.completed} (${r.sessions.hours} hours). Events ${r.events.held} with ${r.events.registrations} sign-ups. Program members ${r.programs.members}. Tasks finished ${r.tasksDone}. Goals reached ${r.goalsDone}.`,
      r.score ? `Business score ${r.score.from} to ${r.score.to}.` : "",
      `Testimonials ${r.testimonials.count}. The full page with a share link is at /year-in-review.`,
    ].filter(Boolean).join(" ");
  },
};

export const check1099: ActionTool = {
  name: "check_1099",
  kind: "read",
  apiPath: "/api/finance/contractors",
  description: "The client's 1099 contractor picture for a year (default this year) from their expenses' Paid to: everyone paid with totals, who they've marked as a contractor, who likely needs a 1099-NEC (reporting amount $600 for payments through 2025, $2,000 from 2026), missing W-9s, and expenses with no Paid to. A guide, not tax advice; suggest their accountant for decisions. The marks are made on /finance/1099.",
  parameters: { type: "object", properties: { year: { type: "number" } } },
  read: async (args, ctx) => {
    const now = new Date().getUTCFullYear();
    const y = Number(args.year);
    const year = Number.isInteger(y) && y >= 2020 && y <= now ? y : now;
    const [{ data: rows }, { data: payees }] = await Promise.all([
      // 1099 amounts are US dollars: only USD expenses count toward the reporting amount.
      ctx.db.from("finance_entries").select("vendor, amount").eq("master_plan_id", ctx.planId).eq("type", "expense").eq("currency", "usd").gte("occurred_on", `${year}-01-01`).lt("occurred_on", `${year + 1}-01-01`).limit(20000),
      ctx.db.from("finance_payees").select("vendor_key, name, contractor, w9_on_file, paid_by_card").eq("master_plan_id", ctx.planId),
    ]);
    const marks = new Map(((payees || []) as { vendor_key: string; contractor: boolean; w9_on_file: boolean; paid_by_card: boolean }[]).map((p) => [p.vendor_key, p]));
    const totals = new Map<string, { name: string; total: number }>();
    let unnamed = 0;
    for (const r of (rows || []) as { vendor: string | null; amount: number }[]) {
      const n = (r.vendor || "").trim();
      if (!n) {
        unnamed += Number(r.amount) || 0;
        continue;
      }
      const k = payeeKey(n);
      const t = totals.get(k) ?? { name: n, total: 0 };
      t.total += Number(r.amount) || 0;
      totals.set(k, t);
    }
    const th = threshold1099(year).amount;
    const usd = (n: number) => formatMoney(Math.round(n), "usd", { cents: false });
    const all = Array.from(totals.entries()).map(([k, t]) => ({ ...t, m: marks.get(k) }));
    const need = all.filter((x) => x.m?.contractor && !x.m.paid_by_card && x.total >= th);
    const near = all.filter((x) => x.m?.contractor && !x.m.paid_by_card && x.total < th && x.total >= th * 0.75);
    const unmarkedBig = all.filter((x) => !x.m && x.total >= th);
    return [
      `${year}: reporting amount ${usd(th)}.`,
      need.length ? `Likely need a 1099-NEC: ${need.map((x) => `${x.name} ${usd(x.total)}${x.m?.w9_on_file ? "" : " (no W-9 yet)"}`).join("; ")}.` : "No marked contractor is at the reporting amount yet.",
      near.length ? `Close to it: ${near.map((x) => `${x.name} ${usd(x.total)}`).join("; ")}.` : "",
      unmarkedBig.length ? `Paid ${usd(th)} or more but not marked yet (contractor or not?): ${unmarkedBig.slice(0, 8).map((x) => `${x.name} ${usd(x.total)}`).join("; ")}.` : "",
      unnamed ? `${usd(unnamed)} of expenses have no Paid to name, so they can't be counted.` : "",
      "Marks and the download are at /finance/1099. This is a guide for their accountant, not tax advice.",
    ].filter(Boolean).join(" ");
  },
};

export const COURSE_TOOLS: ActionTool[] = [listCourses, createCourse, addCourseLessons, setAway, checkLandingPages, createLandingPage, yearSoFar, check1099];
