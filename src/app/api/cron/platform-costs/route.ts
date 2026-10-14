import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";
import { scanReceipts } from "@/lib/platformCostsServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Monthly (2nd, mid-morning Mountain): looks in the house mailbox for the month's vendor receipts, files what it
// finds as "proposed", and drops one reminder so Babs confirms them on Platform Costs. Nothing counts until she does.
// Same CRON_SECRET convention as the other jobs.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const planId = await housePlanId();
  if (!planId) return NextResponse.json({ skipped: "no house plan" });
  const db = createServerClient();
  const r = await scanReceipts(db, planId);
  const { count } = await db.from("platform_cost_entries").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("status", "proposed");
  if ((count ?? 0) > 0) {
    const title = "Confirm this month's platform costs";
    const { data: open } = await db.from("reminders").select("id").eq("master_plan_id", planId).eq("status", "open").eq("title", title).limit(1);
    if (!open?.length) {
      await db.from("reminders").insert({
        master_plan_id: planId,
        title,
        notes: `${count} bill${count === 1 ? "" : "s"} found in your inbox are waiting. Open Platform Costs (Alignment Architect) and confirm or fix each one: https://lccommandsuite.com/platform-costs`,
        remind_at: new Date().toISOString(),
        status: "open",
      });
    }
  }
  return NextResponse.json({ ok: true, ...r, waiting: count ?? 0 });
}
