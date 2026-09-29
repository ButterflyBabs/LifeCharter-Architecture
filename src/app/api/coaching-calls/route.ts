import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionsBetween } from "@/lib/community/events";

export const dynamic = "force-dynamic";

// The Command Suite coaching calls for the next 7 days (Collective events in the
// LifeCharter Command Suite space), for the "This week's coaching calls" card on
// Executive Home and Daily Compass. Any signed-in Command Suite account.
const SPACE_SLUG = "command-suite";

export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ calls: [] });
  const db = createServerClient();
  const { data: space } = await db.from("cm_spaces").select("id").eq("slug", SPACE_SLUG).maybeSingle();
  if (!space?.id) return NextResponse.json({ calls: [] });
  const now = Date.now();
  const sessions = await sessionsBetween(db, new Date(now - 2 * 3600_000), new Date(now + 7 * 86_400_000), space.id as string);
  const calls = sessions
    .filter((s) => s.end.getTime() > now)
    .slice(0, 20)
    .map((s) => ({
      id: `${s.event.id}:${s.start.toISOString()}`,
      eventId: s.event.id,
      title: s.event.title,
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      joinUrl: /^https:\/\/([a-z0-9-]+\.)?zoom\.us\//i.test(s.event.join_url || "") ? s.event.join_url : null,
      about: (s.event.description || "").split(/\n/)[0].slice(0, 180),
    }));
  return NextResponse.json({ calls });
}
