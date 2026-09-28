import { NextResponse } from "next/server";
import { sendReminders } from "@/lib/booking/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Every 10 minutes: 24-hour and 1-hour reminders for booked meetings.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ reminders: await sendReminders() });
}
export const GET = run;
export const POST = run;
