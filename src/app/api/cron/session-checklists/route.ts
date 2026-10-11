import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { rollSessions } from "@/lib/sessionChecklists";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily (7am Mountain): the morning after a MasterClass or Incubator session, the next session's checklist is
// added to the task list. Secured by CRON_SECRET like the other jobs; listed in PUBLIC_APIS in the middleware.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ skipped: "no house account" });
  const r = await rollSessions(db, house);
  return NextResponse.json({ ok: true, ...r });
}
