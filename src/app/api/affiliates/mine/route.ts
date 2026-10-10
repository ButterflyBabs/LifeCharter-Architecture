import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { affiliateReport, reportCsv } from "@/lib/affiliates";
import { isHousePlan } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// The signed-in person's own partnerships: every account (LifeCharter, for most
// clients) where they're an affiliate under their login email.
// GET [?affiliateId=&month=YYYY-MM[&format=csv]] → partnerships, and the chosen one's month report
export async function GET(request: Request) {
  const user = await sessionUser().catch(() => null);
  const email = (user?.email || "").toLowerCase();
  if (!email) return NextResponse.json({ partnerships: [] });
  const db = createServerClient();
  const { data: affs } = await db.from("affiliates").select("id, master_plan_id, name, code, status, portal_token").ilike("email", email);
  const partnerships = await Promise.all(
    (affs ?? []).map(async (f) => {
      const house = await isHousePlan(f.master_plan_id as string);
      const { data: ws } = house ? { data: null } : await db.from("workspaces").select("name").eq("master_plan_id", f.master_plan_id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      // The tracked link for each product this affiliate can share.
      const { data: ls } = await db.from("affiliate_links").select("id, product, code, status, expires_at").eq("affiliate_id", f.id).order("created_at");
      const links = (ls ?? []).map((l) => ({ id: l.id as string, product: l.product as string, status: l.status as string, expiresAt: (l.expires_at as string | null) ?? null, link: `https://lccommandsuite.com/r/${l.code}` }));
      return { id: f.id, business: house ? "LifeCharter" : (ws?.name as string) || "Partner", code: f.code, status: f.status, link: `https://lccommandsuite.com/r/${f.code}`, links };
    })
  );
  const u = new URL(request.url);
  const chosen = (affs ?? []).find((f) => f.id === u.searchParams.get("affiliateId")) ?? (affs ?? [])[0];
  if (!chosen) return NextResponse.json({ partnerships: [] });
  const r = await affiliateReport(db, chosen.id as string, u.searchParams.get("month") || "");
  if (u.searchParams.get("format") === "csv" && r) {
    return new Response(reportCsv(r), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="affiliate-report-${r.month}.csv"`, "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ partnerships, affiliateId: chosen.id, report: r });
}
