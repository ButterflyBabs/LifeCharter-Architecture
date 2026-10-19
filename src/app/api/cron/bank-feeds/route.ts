import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncAll } from "@/lib/bankFeeds";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily (task 1150): Stripe refreshes each linked account on its own; this pulls what is new into every client's review list.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await syncAll(createServerClient()));
}
export const GET = run;
export const POST = run;
