import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// Babs's daily "What I need from you today" email (she asked for it 2026-10-05): at 9:00am Mountain,
// every open task that needs HER (not assigned to a team member or guest, and not marked
// owner_action = false), in three lists: overdue, due today, and the next three days, each with its
// project. Nothing is sent on a day with nothing to show. vercel.json runs this at 15:00 and 16:00
// UTC; only the run that lands on 9am Mountain sends, so daylight saving needs no change.
// Turn it off: app_settings key "owner_daily_tasks" → {"on":false}. Same CRON_SECRET convention.

const TZ = "America/Denver";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const MAX_OVERDUE = 20;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const nice = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

interface Row {
  id: number;
  title: string;
  priority: string | null;
  due_at: string | null;
  due_date: string | null;
  due_has_time: boolean | null;
  project_id: string | null;
}
interface Item {
  title: string;
  day: string;
  time: string | null;
  project: string | null;
  href: string;
  urgent: boolean;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour !== 9) return NextResponse.json({ skipped: "not 9am Mountain" });
  const today = dayInTz(now.toISOString(), TZ);

  const db = createServerClient();
  const { data: settings } = await db.from("app_settings").select("key, value").in("key", ["owner_daily_tasks", "owner_daily_tasks:last_sent"]);
  const setting = new Map(((settings ?? []) as { key: string; value: string }[]).map((s) => [s.key, s.value]));
  if (/"on"\s*:\s*false/.test(setting.get("owner_daily_tasks") || "")) return NextResponse.json({ skipped: "turned off" });
  if (setting.get("owner_daily_tasks:last_sent") === today) return NextResponse.json({ skipped: "already sent today" });

  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ skipped: "no owner account" });
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  const { data: prof } = plan?.user_id ? await db.from("profiles").select("email, full_name").eq("id", plan.user_id).maybeSingle() : { data: null };
  if (!prof?.email) return NextResponse.json({ skipped: "no owner email" });

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    db
      .from("tasks")
      .select("id, title, priority, due_at, due_date, due_has_time, project_id")
      .eq("master_plan_id", planId)
      .neq("status", "done")
      .is("completed_at", null)
      .eq("owner_action", true)
      .is("assignee_member_id", null)
      .is("assignee_guest_id", null)
      .limit(2000),
    db.from("projects").select("id, name").eq("master_plan_id", planId),
  ]);
  const projectName = new Map(((projects ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]));
  const horizon = addDays(today, 3);
  const items: Item[] = [];
  for (const t of (tasks ?? []) as Row[]) {
    // Newer tasks carry due_at (an instant); older ones only due_date (the day, stored at midnight UTC).
    const day = t.due_at ? dayInTz(t.due_at, TZ) : t.due_date ? t.due_date.slice(0, 10) : null;
    if (!day || day > horizon) continue;
    items.push({
      title: t.title,
      day,
      time: t.due_at && t.due_has_time ? new Date(t.due_at).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }) : null,
      project: t.project_id ? projectName.get(t.project_id) ?? null : null,
      href: t.project_id ? `${APP_URL}/projects/${t.project_id}` : `${APP_URL}/tasks`,
      urgent: t.priority === "critical",
    });
  }
  if (!items.length) return NextResponse.json({ sent: 0, note: "nothing due" });
  const order = (a: Item, b: Item) => a.day.localeCompare(b.day) || Number(b.urgent) - Number(a.urgent) || (a.project || "~").localeCompare(b.project || "~") || a.title.localeCompare(b.title);
  const overdue = items.filter((i) => i.day < today).sort(order);
  const dueToday = items.filter((i) => i.day === today).sort(order);
  const soon = items.filter((i) => i.day > today).sort(order);

  const line = (i: Item, showDay: boolean) =>
    `<li style="margin:0 0 9px"><a href="${esc(i.href)}" style="color:#1a2b4a;font-weight:600;text-decoration:none">${esc(i.title)}</a>${i.urgent ? ' <span style="color:#b3392b;font-size:12px;font-weight:700">URGENT</span>' : ""}<br><span style="color:#7a8a99;font-size:12.5px">${[showDay ? nice(i.day) : null, i.time, i.project || "Tasks"].filter(Boolean).map((x) => esc(String(x))).join(" · ")}</span></li>`;
  const section = (title: string, list: Item[], showDay: boolean, cap = 0) => {
    if (!list.length) return "";
    const shown = cap && list.length > cap ? list.slice(-cap) : list; // the most recent overdue ones
    const more = list.length - shown.length;
    return `<h2 style="font-size:15px;color:#2E7C83;margin:22px 0 10px;text-transform:uppercase;letter-spacing:1px">${esc(title)} (${list.length})</h2><ul style="padding-left:18px;margin:0">${shown.map((i) => line(i, showDay)).join("")}</ul>${more > 0 ? `<p style="color:#7a8a99;font-size:12.5px;margin:6px 0 0">and ${more} older. <a href="${APP_URL}/tasks" style="color:#2E7C83">See them all</a></p>` : ""}`;
  };
  const first = (prof.full_name || "").trim().split(/\s+/)[0] || "";
  const html = `<div style="font-family:Arial,sans-serif;font-size:14.5px;line-height:1.45;max-width:600px;color:#1a2b4a">
<h1 style="font-size:20px;margin:0 0 4px">What I need from you today</h1>
<p style="color:#7a8a99;margin:0">${esc(nice(today))}${first ? ` · Good morning, ${esc(first)}` : ""}</p>
${section("Due today", dueToday, false)}${section("Overdue", overdue, true, MAX_OVERDUE)}${section("Coming in the next three days", soon, true)}
<p style="margin:24px 0 0"><a href="${APP_URL}/projects" style="display:inline-block;background:#1a2b4a;color:#fff;font-weight:bold;padding:10px 18px;border-radius:999px;text-decoration:none">Open Projects</a></p>
<p style="color:#7a8a99;font-size:12px;margin:18px 0 0">Only tasks that need you are listed. Tasks assigned to your team, and ones being built for you, are left out.</p></div>`;
  const subject = `What I need from you today: ${dueToday.length} due${overdue.length ? `, ${overdue.length} overdue` : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: prof.email, subject, html }),
  });
  if (!res.ok) {
    console.error("owner-daily-tasks send:", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "send failed" }, { status: 502 });
  }
  await db.from("app_settings").upsert({ key: "owner_daily_tasks:last_sent", value: today, updated_at: now.toISOString() }, { onConflict: "key" });
  return NextResponse.json({ sent: 1, dueToday: dueToday.length, overdue: overdue.length, soon: soon.length });
}

export const GET = run;
export const POST = run;
