import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionsBetween } from "@/lib/community/events";

export const dynamic = "force-dynamic";

// The Command Suite coaching calls for the next 7 days (Collective events in the
// LifeCharter Command Suite space), for the "This week's coaching calls" card on
// Executive Home and Daily Compass. Any signed-in Command Suite account.
const SPACE_SLUG = "command-suite";

function isDemoRequest(): boolean {
  try {
    return cookies().get("lc_demo")?.value === "1";
  } catch {
    return false; // cookies() unavailable outside a request scope
  }
}

export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ calls: [] });
  const db = createServerClient();
  const { data: space } = await db.from("cm_spaces").select("id").eq("slug", SPACE_SLUG).maybeSingle();
  if (!space?.id) return NextResponse.json({ calls: [] });
  const isDemo = isDemoRequest();
  // "This week": the rest of the current Mon–Sun week in Mountain time (the calls
  // are scheduled in Mountain). If nothing is left this week, show all of next week.
  // Demo mode skips straight to next week: some of the five weekly calls (e.g. the
  // Anchor, the Dimension Call) don't have an occurrence every single calendar week
  // this early in the rhythm, so "this week" can be sparse. Next week always has all
  // five, so a live sales demo never catches a partial row.
  const now = Date.now();
  const endOfWeek = mountainWeekEnd(new Date(now));
  let sessions = isDemo
    ? []
    : (await sessionsBetween(db, new Date(now - 2 * 3600_000), endOfWeek, space.id as string)).filter((x) => x.end.getTime() > now);
  let week: "this" | "next" = "this";
  if (isDemo || !sessions.length) {
    sessions = await sessionsBetween(db, endOfWeek, new Date(endOfWeek.getTime() + 7 * 86_400_000), space.id as string);
    week = "next";
  }
  const calls = sessions
    .slice(0, 30)
    .map((s) => ({
      id: `${s.event.id}:${s.start.toISOString()}`,
      eventId: s.event.id,
      title: s.event.title,
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      joinUrl: /^https:\/\/([a-z0-9-]+\.)?zoom\.us\//i.test(s.event.join_url || "") ? s.event.join_url : null,
      about: (s.event.description || "").split(/\n/)[0].slice(0, 180),
    }));
  return NextResponse.json({ calls, week });
}

// The instant the current Monday–Sunday week ends (midnight Monday), in Mountain time.
function mountainWeekEnd(now: Date): Date {
  const tz = "America/Denver";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(now).map((p) => [p.type, p.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday as string);
  const daysToMonday = dow === 0 ? 1 : 8 - dow;
  const mondayUtcNoon = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + daysToMonday, 12));
  // Offset of Mountain time on that Monday (MDT -6 or MST -7).
  const off = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(mondayUtcNoon).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "-7";
  const hours = Number(off) || -7;
  return new Date(Date.UTC(mondayUtcNoon.getUTCFullYear(), mondayUtcNoon.getUTCMonth(), mondayUtcNoon.getUTCDate(), -hours));
}
