import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { GIVEAWAY_PLANNERS } from "@/lib/plannerGiveaway";

export const dynamic = "force-dynamic";

// Owner-only (Babs): sales, free downloads and giveaway coupon codes for the
// digital planners (amilynnecarroll.com/planners) — her own product, tracked
// only on her Suite account. Paid orders also land in her ledger (Finance)
// as real income, source "payhip"; this page is the planner-specific view of
// that same activity, plus what Finance doesn't show: coupons generated and
// which ones were actually redeemed.

const PLANNER_TITLE: Record<string, string> = {
  ...Object.fromEntries(Object.entries(GIVEAWAY_PLANNERS).map(([k, p]) => [k, p.title])),
};

interface ContactRecordRow {
  id: string;
  contact_id: string;
  title: string;
  amount: number | string | null;
  note: string | null;
  created_at: string;
}
interface ClaimRow {
  id: string;
  contact_id: string | null;
  email: string;
  planner: string;
  coupon_code: string | null;
  created_at: string;
  last_sent_at: string | null;
  redeemed_at: string | null;
}
interface ContactRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  const planId = await housePlanId(db);
  if (!planId) return NextResponse.json({ error: "No account." }, { status: 500 });

  const [{ data: records }, { data: claims }] = await Promise.all([
    db
      .from("contact_records")
      .select("id, contact_id, title, amount, note, created_at")
      .eq("master_plan_id", planId)
      .eq("kind", "purchase")
      .like("note", "Payhip order%")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("planner_giveaway_claims")
      .select("id, contact_id, email, planner, coupon_code, created_at, last_sent_at, redeemed_at")
      .eq("master_plan_id", planId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const recordRows = (records ?? []) as ContactRecordRow[];
  const claimRows = (claims ?? []) as ClaimRow[];
  const contactIds = Array.from(
    new Set([...recordRows.map((r) => r.contact_id), ...claimRows.map((c) => c.contact_id).filter((x): x is string => Boolean(x))])
  );
  const { data: contacts } = contactIds.length
    ? await db.from("seq_contacts").select("id, email, first_name, last_name").in("id", contactIds)
    : { data: [] as ContactRow[] };
  const byContact = new Map((contacts ?? []).map((c) => [c.id, c as ContactRow]));
  const name = (c: ContactRow | undefined) => [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim();

  const sales = recordRows.map((r) => {
    const amount = Number(r.amount ?? 0);
    const c = byContact.get(r.contact_id);
    return {
      id: r.id,
      orderId: (r.note ?? "").replace(/^Payhip order\s*/, ""),
      product: r.title,
      amount,
      free: amount === 0,
      buyerName: name(c),
      buyerEmail: c?.email ?? "",
      createdAt: r.created_at,
    };
  });

  const coupons = claimRows.map((cl) => {
    const c = cl.contact_id ? byContact.get(cl.contact_id) : undefined;
    return {
      id: cl.id,
      planner: cl.planner,
      plannerTitle: PLANNER_TITLE[cl.planner] ?? cl.planner,
      code: cl.coupon_code,
      buyerName: name(c),
      email: cl.email,
      createdAt: cl.created_at,
      lastSentAt: cl.last_sent_at,
      redeemedAt: cl.redeemed_at,
    };
  });

  const paid = sales.filter((s) => !s.free);
  const summary = {
    revenue: Math.round(paid.reduce((sum, s) => sum + s.amount, 0) * 100) / 100,
    paidOrders: paid.length,
    freeDownloads: sales.filter((s) => s.free).length,
    couponsGenerated: coupons.length,
    couponsRedeemed: coupons.filter((c) => c.redeemedAt).length,
  };

  return NextResponse.json({ summary, sales, coupons });
}
