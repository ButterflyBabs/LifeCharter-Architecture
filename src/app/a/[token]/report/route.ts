import { createServerClient } from "@/lib/supabase/server";
import { affiliateReport, reportCsv } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

// An affiliate's monthly report as a spreadsheet, from their private dashboard link.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{20,64}$/i.test(params.token)) return new Response("Not found", { status: 404 });
  const db = createServerClient();
  const { data: f } = await db.from("affiliates").select("id").eq("portal_token", params.token).maybeSingle();
  if (!f) return new Response("Not found", { status: 404 });
  const r = await affiliateReport(db, f.id as string, new URL(request.url).searchParams.get("month") || "");
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(reportCsv(r), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="affiliate-report-${r.month}.csv"`, "Cache-Control": "no-store" } });
}
