import { NextResponse } from "next/server";
import { runColdEmail } from "@/lib/coldEmailRun";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every 10 minutes: read replies and bounces in the sending mailboxes, then send what is due inside the send window.
// Does nothing unless the app setting cold_email_on is true AND the account's own switch is on. CRON_SECRET like the other jobs;
// the path is listed in PUBLIC_APIS in the middleware.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runColdEmail());
}
