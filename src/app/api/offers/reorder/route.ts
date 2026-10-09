import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// PUT { ids: string[] }: the offers in the order the client wants them. Only this account's offers are touched,
// and the positions the listed offers already held are handed back out in the new order, so an offer that
// isn't in the list (another business's) never moves.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? Array.from(new Set(body.ids.filter((v: unknown): v is string => typeof v === "string"))) : [];
  if (ids.length === 0 || ids.length > 200) return NextResponse.json({ error: "Nothing to reorder." }, { status: 400 });

  const { data } = await a.supabase.from("sales_offers").select("id, sort_order").eq("master_plan_id", a.masterPlanId).in("id", ids);
  const rows = (data ?? []) as { id: string; sort_order: number | null }[];
  const known = new Set(rows.map((r) => r.id));
  const order = ids.filter((id) => known.has(id));
  const slots = rows.map((r) => r.sort_order ?? 0).sort((x, y) => x - y);
  // If several offers share a position (or none was set), fall back to simple 0..n numbering.
  const distinct = new Set(slots).size === slots.length;
  const positions = distinct ? slots : order.map((_, i) => i);

  const results = await Promise.all(
    order.map((id, i) => a.supabase.from("sales_offers").update({ sort_order: positions[i] }).eq("id", id).eq("master_plan_id", a.masterPlanId)),
  );
  if (results.some((r) => r.error)) return NextResponse.json({ error: "Couldn't save the new order." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
