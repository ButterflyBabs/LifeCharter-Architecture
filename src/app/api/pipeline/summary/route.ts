import { NextResponse } from "next/server";
import { pipelineSummary } from "@/lib/sales/pipeline";
import { salesAccount } from "@/lib/sales/account";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// GET: the pipeline and offers numbers for Executive Home and the Daily Compass "Deals to move today" list.
export async function GET() {
  const a = await salesAccount();
  if (!a) return NextResponse.json({ summary: null });
  const tz = await resolveUserTimeZone(null);
  const today = dayInTz(new Date(), tz);
  return NextResponse.json({ summary: await pipelineSummary(a.supabase, a.masterPlanId, today), today });
}
