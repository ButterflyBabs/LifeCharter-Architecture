import { NextResponse } from "next/server";
import { processDue } from "@/lib/sequences/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 15 minutes: sends each live sequence's due emails (day N at the
// sequence's hour in each contact's own time zone). Same CRON_SECRET convention
// as the other crons.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const out = await processDue();
  return NextResponse.json(out);
}

export const GET = run;
export const POST = run;
