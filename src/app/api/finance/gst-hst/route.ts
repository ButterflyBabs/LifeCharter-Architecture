import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { gstSummary } from "@/lib/finance/gstServer";
import { gstCsv } from "@/lib/finance/gstReport";

export const dynamic = "force-dynamic";

// The GST/HST report (task 1520 follow-up).
//   GET ?start=YYYY-MM-DD           -> the four return lines for the filing period starting that day (else today's),
//                                      tax per province, due dates, US-dollar money left out, CAD sales to check
//   GET ?start=...&format=csv       -> every row in that period for the accountant
// Only Canadian-dollar rows are totalled; nothing is converted. Not tax advice.
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const url = new URL(request.url);
  const today = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("today") || "") ? (url.searchParams.get("today") as string) : new Date().toISOString().slice(0, 10);
  let s;
  try {
    s = await gstSummary(planId, { start: url.searchParams.get("start"), today });
  } catch (e) {
    console.error("GET /api/finance/gst-hst:", e);
    return NextResponse.json({ error: "Couldn't build the GST/HST report." }, { status: 500 });
  }
  if (!s.registered || !s.report) {
    if (url.searchParams.get("format") === "csv") return NextResponse.json({ error: "GST/HST is not turned on for this account." }, { status: 400 });
    return NextResponse.json({ registered: false });
  }
  const p = s.report.period;
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(gstCsv(s.rows, p), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gst-hst-${p.start}-to-${p.end}.csv"`,
      },
    });
  }
  return NextResponse.json({
    registered: true,
    businessNumber: s.settings.businessNumber,
    province: s.settings.province,
    frequency: s.settings.frequency,
    registeredFrom: s.settings.registeredFrom,
    period: p,
    prev: s.prev,
    next: s.next && s.next.start <= today ? s.next : null,
    isCurrent: today >= p.start && today <= p.end,
    lines: { line101: s.report.ret.line101, line103: s.report.ret.line103, line106: s.report.ret.line106, line109: s.report.ret.line109 },
    byProvince: s.report.ret.byProvince,
    usdLeftOut: s.report.ret.usdLeftOut,
    refunds: s.report.ret.refunds,
    check: s.report.check,
    counts: s.report.counts,
  });
}
