import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { brandFor } from "@/lib/portal";

// Year in review (task 1155): one page of the account's year, from what the Suite already holds.
// The share link shows the same page without money unless the owner turns money on; testimonials only with consent.

type Db = ReturnType<typeof createServerClient>;

export interface YearReview {
  year: number;
  business: { name: string; logo: string | null };
  money: { income: number; expenses: number; net: number; bestMonth: { month: string; income: number } | null; byMonth: { month: string; income: number; expenses: number }[] } | null;
  people: { newContacts: number; newCustomers: number };
  sessions: { completed: number; hours: number };
  events: { held: number; registrations: number };
  programs: { members: number };
  tasksDone: number;
  goalsDone: number;
  score: { from: number; to: number } | null;
  testimonials: { count: number; quotes: { name: string; headline: string | null; content: string }[] };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const round = (n: number) => Math.round(n * 100) / 100;

export function cleanYear(v: unknown): number {
  const now = new Date().getUTCFullYear();
  const y = Number(v);
  return Number.isInteger(y) && y >= 2020 && y <= now ? y : now;
}

export async function yearReview(db: Db, planId: string, year: number, opts: { money: boolean }): Promise<YearReview> {
  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;
  const fromTs = `${from}T00:00:00Z`;
  const toTs = `${to}T00:00:00Z`;
  const head = { count: "exact" as const, head: true };
  const [business, { data: fin }, { count: newContacts }, { count: newCustomers }, { data: bookings }, { data: time }, { data: events }, { count: regs }, { count: members }, { count: tasksDone }, { count: goalsDone }, { data: scores }, { data: tst }] = await Promise.all([
    brandFor(db, planId),
    opts.money ? db.from("finance_entries").select("type, amount, occurred_on").eq("master_plan_id", planId).gte("occurred_on", from).lt("occurred_on", to).limit(20000) : Promise.resolve({ data: null }),
    db.from("seq_contacts").select("id", head).eq("master_plan_id", planId).gte("created_at", fromTs).lt("created_at", toTs),
    db.from("seq_contacts").select("id", head).eq("master_plan_id", planId).gte("created_at", fromTs).lt("created_at", toTs).overlaps("tags", ["customer", "client"]),
    db.from("bookings").select("start_at, end_at").eq("master_plan_id", planId).eq("status", "completed").gte("start_at", fromTs).lt("start_at", toTs).limit(10000),
    db.from("time_entries").select("started_at, ended_at").eq("master_plan_id", planId).gte("started_at", fromTs).lt("started_at", toTs).not("ended_at", "is", null).limit(20000),
    db.from("events").select("id, status").eq("master_plan_id", planId).gte("created_at", fromTs).lt("created_at", toTs).not("title", "ilike", "TEST %"),
    db.from("event_registrations").select("id", head).eq("master_plan_id", planId).gte("created_at", fromTs).lt("created_at", toTs),
    db.from("program_members").select("id", head).eq("master_plan_id", planId).gte("joined_at", fromTs).lt("joined_at", toTs),
    db.from("tasks").select("id", head).eq("master_plan_id", planId).eq("status", "done").gte("completed_at", fromTs).lt("completed_at", toTs),
    db.from("client_plan_goals").select("id", head).eq("plan_id", planId).in("status", ["done", "completed", "achieved", "complete"]).gte("updated_at", fromTs).lt("updated_at", toTs),
    db.from("client_score_snapshots").select("overall, created_at").eq("master_plan_id", planId).gte("created_at", fromTs).lt("created_at", toTs).order("created_at").limit(1000),
    db.from("testimonials").select("client_name, headline, content, status, consent").eq("master_plan_id", planId).in("status", ["approved", "featured"]).gte("created_at", fromTs).lt("created_at", toTs).order("created_at", { ascending: false }).limit(200),
  ]);

  let money: YearReview["money"] = null;
  if (opts.money) {
    const byMonth = MONTHS.map((m) => ({ month: m, income: 0, expenses: 0 }));
    for (const f of (fin ?? []) as { type: string; amount: number; occurred_on: string }[]) {
      const i = Number(f.occurred_on.slice(5, 7)) - 1;
      if (i < 0 || i > 11) continue;
      if (f.type === "income") byMonth[i].income += Number(f.amount) || 0;
      else if (f.type === "expense") byMonth[i].expenses += Number(f.amount) || 0;
    }
    const income = byMonth.reduce((s, m) => s + m.income, 0);
    const expenses = byMonth.reduce((s, m) => s + m.expenses, 0);
    const best = [...byMonth].sort((a, b) => b.income - a.income)[0];
    money = {
      income: round(income),
      expenses: round(expenses),
      net: round(income - expenses),
      bestMonth: best && best.income > 0 ? { month: best.month, income: round(best.income) } : null,
      byMonth: byMonth.map((m) => ({ ...m, income: round(m.income), expenses: round(m.expenses) })),
    };
  }

  const ms = (rows: { a: string | null; b: string | null }[]) => rows.reduce((s, r) => (r.a && r.b ? s + Math.max(0, Date.parse(r.b) - Date.parse(r.a)) : s), 0);
  const bookedMs = ms(((bookings ?? []) as { start_at: string; end_at: string | null }[]).map((b) => ({ a: b.start_at, b: b.end_at })));
  const trackedMs = ms(((time ?? []) as { started_at: string; ended_at: string | null }[]).map((t) => ({ a: t.started_at, b: t.ended_at })));
  const sc = ((scores ?? []) as { overall: number | null }[]).filter((s) => typeof s.overall === "number");
  const t = (tst ?? []) as { client_name: string | null; headline: string | null; content: string | null; status: string; consent: boolean | null }[];
  const quotable = t.filter((x) => x.consent && (x.content || "").trim());
  quotable.sort((a, b) => Number(b.status === "featured") - Number(a.status === "featured"));

  return {
    year,
    business,
    money,
    people: { newContacts: newContacts ?? 0, newCustomers: newCustomers ?? 0 },
    // Hours: tracked time when there is any, else the length of completed sessions.
    sessions: { completed: (bookings ?? []).length, hours: Math.round((trackedMs || bookedMs) / 360_000) / 10 },
    events: { held: ((events ?? []) as { status: string }[]).length, registrations: regs ?? 0 },
    programs: { members: members ?? 0 },
    tasksDone: tasksDone ?? 0,
    goalsDone: goalsDone ?? 0,
    score: sc.length >= 2 ? { from: Math.round(Number(sc[0].overall)), to: Math.round(Number(sc[sc.length - 1].overall)) } : null,
    testimonials: {
      count: t.length,
      quotes: quotable.slice(0, 3).map((x) => ({ name: (x.client_name || "A client").split(" ")[0], headline: x.headline, content: String(x.content).slice(0, 400) })),
    },
  };
}

export const newShareToken = () => randomBytes(18).toString("base64url");

export async function shareFor(db: Db, planId: string, year: number) {
  const { data } = await db.from("year_review_links").select("token, show_money").eq("master_plan_id", planId).eq("year", year).maybeSingle();
  return (data as { token: string; show_money: boolean } | null) ?? null;
}
