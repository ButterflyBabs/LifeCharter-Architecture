import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { affiliateReport, reportCsv } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

// GET ?affiliateId=&month=YYYY-MM[&format=csv] → one of this account's affiliates, one month.
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const u = new URL(request.url);
  const db = createServerClient();
  const { data: f } = await db.from("affiliates").select("id").eq("id", u.searchParams.get("affiliateId") || "").eq("master_plan_id", a.planId).maybeSingle();
  if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const r = await affiliateReport(db, f.id as string, u.searchParams.get("month") || "");
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (u.searchParams.get("format") === "csv") {
    return new Response(reportCsv(r), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="affiliate-${r.affiliate.code}-${r.month}.csv"`, "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ report: r });
}
