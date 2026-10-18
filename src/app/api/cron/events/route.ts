import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { runEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 15 minutes: event reminders (24 h and 1 h), challenge days, replay closing reminders, follow-ups (task 1149).
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runEvents(createServerClient())) });
}
export const GET = run;
export const POST = run;
