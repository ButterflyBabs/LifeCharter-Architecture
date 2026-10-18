import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkVerifications } from "@/lib/smsServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hourly (task 1151): where each texting number waiting for Twilio's toll-free approval stands.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ changed: await checkVerifications(createServerClient()) });
}
export const GET = run;
export const POST = run;
