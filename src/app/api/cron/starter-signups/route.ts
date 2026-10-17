import { NextResponse } from "next/server";
import { processPendingSignups } from "@/lib/starterSignup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every two minutes: opens the Command Suite account for self-serve Starter buyers who have signed the Year-1 Operating
// Agreement (and emails them how to sign in), retries agreements that failed to send, and nudges people who haven't signed
// at about 1 day and 3 days. No account exists until the client signs.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await processPendingSignups());
}
export const GET = run;
export const POST = run;
