import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { gstSummary, provSummaries } from "@/lib/finance/gstServer";
import { gstCsv } from "@/lib/finance/gstReport";
import { anyProvincial, PROVINCIAL_TAXES, type ProvTaxProvince } from "@/lib/salesTax";

export const dynamic = "force-dynamic";

// The GST/HST report (task 1520 follow-up).
//   GET ?start=YYYY-MM-DD           -> the four return lines for the filing period starting that day (else today's),
//                                      tax per province, due dates, US-dollar money left out, CAD sales to check
//   GET ?start=...&format=csv       -> every row in that period for the accountant
//   Provincial (QST, PST, RST): each registration in its own period, named by ?qc= ?bc= ?sk= ?mb= (a period start);
//   GET ...&format=csv&tax=QC       -> that province's rows (with its tax) for the accountant
// Only Canadian-dollar rows are totalled; nothing is converted. Not tax advice.
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const url = new URL(request.url);
  const today = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("today") || "") ? (url.searchParams.get("today") as string) : new Date().toISOString().slice(0, 10);
  const starts: Partial<Record<ProvTaxProvince, string | null>> = {};
  for (const t of PROVINCIAL_TAXES) starts[t.code] = url.searchParams.get(t.code.toLowerCase());
  let s;
  let prov;
  try {
    s = await gstSummary(planId, { start: url.searchParams.get("start"), today });
    prov = anyProvincial(s.settings.provincial) ? await provSummaries(planId, { starts, today, settings: s.settings }) : [];
  } catch (e) {
    console.error("GET /api/finance/gst-hst:", e);
    return NextResponse.json({ error: "Couldn't build the sales tax report." }, { status: 500 });
  }
  const provincial = prov.map(({ section: x }) => ({
    province: x.province,
    kind: x.kind,
    title: x.title,
    rate: x.rate,
    number: x.number,
    frequency: x.frequency,
    period: x.period,
    prev: x.prev,
    next: x.next.start <= today ? x.next : null,
    isCurrent: today >= x.period.start && today <= x.period.end,
    claimable: x.claimable,
    taxableSales: x.ret.taxableSales,
    collected: x.ret.collected,
    claimBack: x.ret.claimable,
    net: x.ret.net,
    refunded: x.ret.refunded,
    usdLeftOut: x.ret.usdLeftOut,
  }));
  const wantTax = (url.searchParams.get("tax") || "").toUpperCase();
  if (url.searchParams.get("format") === "csv" && wantTax && wantTax !== "GST") {
    const hit = prov.find((x) => x.section.province === wantTax);
    if (!hit) return NextResponse.json({ error: "That provincial sales tax is not turned on for this account." }, { status: 400 });
    const p = hit.section.period;
    return new NextResponse(gstCsv(hit.rows, p, { prov: hit.section.kind, only: "prov" }), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${hit.section.kind.toLowerCase()}-${hit.section.province.toLowerCase()}-${p.start}-to-${p.end}.csv"`,
      },
    });
  }
  if (!s.registered || !s.report) {
    if (url.searchParams.get("format") === "csv") return NextResponse.json({ error: "GST/HST is not turned on for this account." }, { status: 400 });
    return NextResponse.json({ registered: false, provincial });
  }
  const p = s.report.period;
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(gstCsv(s.rows, p, provincial.length ? { prov: "QST / PST" } : {}), {
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
    provincial,
  });
}
