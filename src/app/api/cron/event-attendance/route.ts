import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { runEventAttendance } from "@/lib/eventAttendance";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 20 minutes during a live workshop: reads who was in each finished Zoom session and moves registrations and outreach
// cards (Attended, then No-show). Does nothing outside a workshop's days. ?dry=1 (owner, signed in) shows what it would do
// and writes nothing.
export async function GET(request: Request) {
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  if (dry) {
    if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  } else {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, dry, results: await runEventAttendance(createServerClient(), { dry }) });
}
