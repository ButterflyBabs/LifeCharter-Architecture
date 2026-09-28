import { NextResponse } from "next/server";
import { processDueBroadcasts } from "@/lib/broadcasts/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 5 minutes: starts any scheduled broadcast whose time has come and keeps
// sending any still part-way through. Same CRON_SECRET convention as the other crons.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const out = await processDueBroadcasts(Date.now() + 240_000);
  return NextResponse.json(out);
}

export const GET = run;
export const POST = run;
