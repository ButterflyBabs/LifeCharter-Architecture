import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { housePlanId } from "@/lib/housePlan";
import { isValidTz } from "@/lib/sequences/engine";

export const dynamic = "force-dynamic";

// "My calendar" for a team member who is a booking host in the house account (Marcello, in the LCCS Sales
// view): their upcoming booked calls, whether a calendar is connected, and their own weekly hours and time
// zone. A person only ever sees and changes THEIR OWN host record (matched by their sign-in email), never
// anyone else's, and nothing here can reach the account's other data. /api/sales is already limited to the
// owner and the owner's own team by the middleware.
//   GET  → { host, connections, connectUrl, bookings }
//   POST { action: "hours", timezone, weekly }

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function cleanWeekly(v: unknown): Record<string, [string, string][]> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, [string, string][]> = {};
  for (const d of DAYS) {
    const ranges = (v as Record<string, unknown>)[d];
    if (!Array.isArray(ranges)) continue;
    const ok = ranges.filter((r): r is [string, string] => Array.isArray(r) && typeof r[0] === "string" && typeof r[1] === "string" && TIME.test(r[0]) && TIME.test(r[1]) && r[0] < r[1]).slice(0, 6);
    if (ok.length) out[d] = ok;
  }
  return out;
}

async function myHost() {
  const user = await sessionUser();
  if (!user?.email) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) } as const;
  const db = createServerClient();
  const plan = await housePlanId(db);
  if (!plan) return { error: NextResponse.json({ error: "No house account." }, { status: 500 }) } as const;
  const { data: host } = await db
    .from("booking_hosts")
    .select("id, name, email, timezone, weekly, connect_key, active")
    .eq("master_plan_id", plan)
    .ilike("email", user.email)
    .maybeSingle();
  if (!host) return { error: NextResponse.json({ host: null }) } as const;
  return { db, plan, host } as const;
}

export async function GET(request: Request) {
  const r = await myHost();
  if ("error" in r) return r.error;
  const { db, plan, host } = r;
  const since = new Date(Date.now() - 2 * 3600_000).toISOString();
  const [{ data: conns }, { data: rows }] = await Promise.all([
    db.from("booking_connections").select("id, provider, email, check_busy, add_events").eq("host_id", host.id).order("created_at"),
    db
      .from("bookings")
      .select("id, start_at, end_at, invitee_name, invitee_email, status, meeting_url, booking_calendars(name)")
      .eq("master_plan_id", plan)
      .eq("host_id", host.id)
      .gte("start_at", since)
      .neq("status", "canceled")
      .order("start_at")
      .limit(60),
  ]);
  const origin = new URL(request.url).origin;
  const bookings = ((rows ?? []) as unknown as { id: string; start_at: string; end_at: string; invitee_name: string | null; invitee_email: string | null; status: string; meeting_url: string | null; booking_calendars: { name: string } | null }[]).map((b) => ({
    id: b.id,
    startAt: b.start_at,
    endAt: b.end_at,
    name: b.invitee_name,
    email: b.invitee_email,
    status: b.status,
    meetingUrl: b.meeting_url,
    calendar: b.booking_calendars?.name ?? null,
  }));
  return NextResponse.json(
    {
      host: { name: host.name, timezone: host.timezone, weekly: host.weekly ?? {}, active: host.active },
      connections: conns ?? [],
      connectUrl: `${origin}/book/connect/${host.id}?k=${host.connect_key}`,
      bookings,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const r = await myHost();
  if ("error" in r) return r.error;
  const { db, plan, host } = r;
  const b = (await request.json().catch(() => ({}))) as { action?: string; timezone?: unknown; weekly?: unknown };
  if (b.action !== "hours") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.timezone === "string" && isValidTz(b.timezone)) patch.timezone = b.timezone;
  const weekly = cleanWeekly(b.weekly);
  if (weekly) patch.weekly = weekly;
  if (Object.keys(patch).length === 1) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const { error } = await db.from("booking_hosts").update(patch).eq("id", host.id).eq("master_plan_id", plan);
  if (error) return NextResponse.json({ error: "Couldn't save your hours." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
