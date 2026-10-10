import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { sendDueWalkthroughs } from "@/lib/clientWalkthrough";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every minute: sends the New Client Setup Walkthrough to clients whose account was created about 3 minutes ago.
// Does nothing until app_settings client_walkthrough_on is "true".
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const house = await ownerMasterPlanId().catch(() => null);
  if (!house) return NextResponse.json({ error: "No house account." }, { status: 500 });
  return NextResponse.json(await sendDueWalkthroughs(createServerClient(), house));
}
export const GET = run;
export const POST = run;
