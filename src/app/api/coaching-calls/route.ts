import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionsBetween } from "@/lib/community/events";
import { isAlignmentArchitect } from "@/lib/authz";
import { isZoomConfigured, masterclassMeetingId, meetingSchedule } from "@/lib/zoom";

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
  // "This week" is the rest of the current Mon–Sun week in Mountain time (the calls are
  // scheduled in Mountain); "next week" is the whole following week.
  const now = Date.now();
  const endOfWeek = mountainWeekEnd(new Date(now));
  const shape = (list: Awaited<ReturnType<typeof sessionsBetween>>) =>
    list.slice(0, 30).map((s) => ({
      id: `${s.event.id}:${s.start.toISOString()}`,
      eventId: s.event.id,
      title: s.event.title,
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      joinUrl: /^https:\/\/([a-z0-9-]+\.)?zoom\.us\//i.test(s.event.join_url || "") ? s.event.join_url : null,
      about: (s.event.description || "").split(/\n/)[0].slice(0, 180),
    }));
  const thisWeek = (await sessionsBetween(db, new Date(now - 2 * 3600_000), endOfWeek, space.id as string)).filter((x) => x.end.getTime() > now);
  const nextWeek = await sessionsBetween(db, endOfWeek, new Date(endOfWeek.getTime() + 7 * 86_400_000), space.id as string);
  // Babs's own account only (never a client's): the weekly MasterClass, with the Zoom link she opens as HOST (signed in to Zoom, it starts the class).
  type Item = ReturnType<typeof shape>[number];
  const masterclass = async (from: number, to: number): Promise<Item[]> => {
    if (isDemo || !isZoomConfigured() || !(await isAlignmentArchitect())) return [];
    const id = masterclassMeetingId();
    const sch = await meetingSchedule(id).catch(() => null);
    return (sch?.occurrences ?? [])
      .map((o) => ({ s: new Date(o.start).getTime(), e: new Date(o.start).getTime() + o.duration * 60_000, start: o.start }))
      .filter((o) => o.e > from && o.s < to)
      .map((o) => ({
        id: `masterclass:${o.start}`,
        eventId: "masterclass",
        title: "MasterClass: From Hustle to Command",
        start: new Date(o.s).toISOString(),
        end: new Date(o.e).toISOString(),
        joinUrl: `https://us02web.zoom.us/j/${id}`,
        about: "Your MasterClass. Open the link signed in to Zoom as the host to start it.",
        host: true,
      }));
  };
  const byStart = (a: { start: string }, b: { start: string }) => a.start.localeCompare(b.start);
  // The card opens on this week, or next week when nothing is left this week (and always
  // for the demo, so a live sales demo never catches a partial row); it has a tab for each.
  const [mcThis, mcNext] = await Promise.all([masterclass(now - 2 * 3600_000, endOfWeek.getTime()), masterclass(endOfWeek.getTime(), endOfWeek.getTime() + 7 * 86_400_000)]);
  const tabs = { this: [...shape(thisWeek), ...mcThis].sort(byStart), next: [...shape(nextWeek), ...mcNext].sort(byStart) };
  const week: "this" | "next" = isDemo || !tabs.this.length ? "next" : "this";
  return NextResponse.json({ calls: tabs[week], week, tabs });
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
