import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { dayInTz } from "@/lib/tz";
import { loadBills, occurrences } from "@/lib/finance/bills";

export const dynamic = "force-dynamic";

// Babs's weekly "bills due this week" email (2026-10-10): Monday 9:00am Mountain, her own bills for the next seven
// days plus anything overdue, with the total. Nothing is sent when there is nothing to show. vercel.json runs this
// at 15:00 and 16:00 UTC on Mondays; only the run that lands on 9am Mountain sends, so daylight saving needs no change.
// Turn it off: app_settings key "owner_weekly_bills" -> {"on":false}. Same CRON_SECRET convention.

const TZ = "America/Denver";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const nice = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now));
  if (hour !== 9) return NextResponse.json({ skipped: "not 9am Mountain" });
  const today = dayInTz(now.toISOString(), TZ);

  const db = createServerClient();
  const { data: settings } = await db.from("app_settings").select("key, value").in("key", ["owner_weekly_bills", "owner_weekly_bills:last_sent"]);
  const setting = new Map(((settings ?? []) as { key: string; value: string }[]).map((s) => [s.key, s.value]));
  if (/"on"\s*:\s*false/.test(setting.get("owner_weekly_bills") || "")) return NextResponse.json({ skipped: "turned off" });
  if (setting.get("owner_weekly_bills:last_sent") === today) return NextResponse.json({ skipped: "already sent today" });

  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ skipped: "no owner account" });
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle();
  const to = (plan?.client_email as string | null) || "";
  if (!to) return NextResponse.json({ skipped: "no owner email" });

  const bills = await loadBills(planId);
  const overdue = bills.filter((b) => b.nextDue < today);
  const week = occurrences(bills, today, addDays(today, 7));
  if (!overdue.length && !week.length) return NextResponse.json({ skipped: "nothing due" });

  const total = week.reduce((s, o) => s + (o.bill.amount || 0), 0);
  const li = (name: string, amount: number | null | undefined, when: string, autopay: boolean) =>
    `<li style="margin:0 0 8px"><strong>${esc(name)}</strong>${amount ? ` ${usd(amount)}` : ""} <span style="color:#7a8a99">· ${esc(when)}${autopay ? " · autopay" : ""}</span></li>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14.5px;line-height:1.5;max-width:600px;color:#1a2b4a">
    <h1 style="font-size:20px;margin:0 0 4px">Bills due this week</h1>
    <p style="color:#7a8a99;margin:0">${esc(nice(today))} to ${esc(nice(addDays(today, 7)))}${week.length ? ` · ${usd(total)} across ${week.length} bill${week.length === 1 ? "" : "s"}` : ""}</p>
    ${overdue.length ? `<h2 style="font-size:15px;color:#b3422f;margin:20px 0 8px">Overdue (${overdue.length})</h2><ul style="padding-left:18px;margin:0">${overdue.map((b) => li(b.name, b.amount, `was due ${nice(b.nextDue)}`, false)).join("")}</ul>` : ""}
    ${week.length ? `<h2 style="font-size:15px;color:#2E7C83;margin:20px 0 8px">Coming up (${week.length})</h2><ul style="padding-left:18px;margin:0">${week.map((o) => li(o.bill.name, o.bill.amount, nice(o.date), o.bill.autopay)).join("")}</ul>` : ""}
    <p style="margin:22px 0 0"><a href="${APP_URL}/finance/bills" style="display:inline-block;background:#1a2b4a;color:#fff;font-weight:bold;padding:10px 18px;border-radius:999px;text-decoration:none">Open Bills &amp; Cash Calendar</a></p>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: `Bills due this week${overdue.length ? ` (${overdue.length} overdue)` : ""}`, html }),
  }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: "email failed" }, { status: 502 });
  await db.from("app_settings").upsert({ key: "owner_weekly_bills:last_sent", value: today }, { onConflict: "key" });
  return NextResponse.json({ ok: true, overdue: overdue.length, dueThisWeek: week.length });
}
export const GET = run;
export const POST = run;
