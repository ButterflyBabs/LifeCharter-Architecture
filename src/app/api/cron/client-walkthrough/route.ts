import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendDueAssessmentEmails, sendDueWalkthroughs } from "@/lib/clientWalkthrough";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every minute: sends the New Client Setup Walkthrough to clients whose account was created about 3 minutes ago,
// and the "why your assessment answers matter" email to clients whose account is about an hour old.
// Does nothing until app_settings client_walkthrough_on is "true".
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const walkthrough = await sendDueWalkthroughs(db);
  const assessments = await sendDueAssessmentEmails(db);
  return NextResponse.json({ ...walkthrough, assessments });
}
export const GET = run;
export const POST = run;
