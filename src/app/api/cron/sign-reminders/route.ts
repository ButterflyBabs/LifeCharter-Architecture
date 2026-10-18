import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { runSignReminders } from "@/lib/esignServer";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Daily (task 1072): remind signers after 3 days (then every 3 days) and expire documents past their sign-by date.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runSignReminders(createServerClient()));
}
export const GET = run;
export const POST = run;
