import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { salesAccount } from "@/lib/sales/account";
import { ACTIVITY_TYPE_IDS, OUTCOME_IDS } from "@/lib/salesActivities";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// A deal's touches: calls, follow-ups and meetings from Daily Compass (sales_activities) linked
// to it. GET also returns recent unlinked touches that can be attached.
const COLS = "id, type, title, contact_name, outcome, status, occurred_on, notes";
type Row = { id: string; type: string; title: string | null; contact_name: string | null; outcome: string | null; status: string | null; occurred_on: string | null; notes: string | null };
const shape = (r: Row) => ({ id: r.id, type: r.type, title: r.title || "", contactName: r.contact_name || "", outcome: r.outcome || "", status: r.status || "open", occurredOn: r.occurred_on, notes: r.notes || "" });

async function ownDeal(a: NonNullable<Awaited<ReturnType<typeof salesAccount>>>, id: string) {
  const { data } = await a.supabase.from("pipeline_deals").select("id, contact_name, company").eq("id", id).eq("master_plan_id", a.masterPlanId).maybeSingle();
  return data as { id: string; contact_name: string; company: string | null } | null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const a = await salesAccount();
  if (!a) return NextResponse.json({ linked: [], recent: [] });
  const deal = await ownDeal(a, params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  const since = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
  const [{ data: linked }, { data: recent }] = await Promise.all([
    a.supabase.from("sales_activities").select(COLS).eq("master_plan_id", a.masterPlanId).eq("deal_id", deal.id).order("occurred_on", { ascending: false }).limit(100),
    a.supabase.from("sales_activities").select(COLS).eq("master_plan_id", a.masterPlanId).is("deal_id", null).gte("occurred_on", since).order("occurred_on", { ascending: false }).limit(60),
  ]);
  return NextResponse.json({ linked: ((linked ?? []) as Row[]).map(shape), recent: ((recent ?? []) as Row[]).map(shape) });
}

// POST { activityId } attaches an existing touch; POST { type, title, outcome, notes } logs a new one.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const deal = await ownDeal(a, params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.activityId === "string") {
    const { error } = await a.supabase.from("sales_activities").update({ deal_id: deal.id }).eq("id", body.activityId).eq("master_plan_id", a.masterPlanId);
    if (error) return NextResponse.json({ error: "Couldn't attach it." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const tz = await resolveUserTimeZone(null);
  const { data, error } = await a.supabase
    .from("sales_activities")
    .insert({
      master_plan_id: a.masterPlanId,
      deal_id: deal.id,
      type: ACTIVITY_TYPE_IDS.includes(body.type) ? body.type : "call",
      contact_name: deal.contact_name,
      contact_company: deal.company || "",
      title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : "",
      priority: "warm",
      status: "completed",
      outcome: OUTCOME_IDS.includes(body.outcome) ? body.outcome : "",
      estimated_value: 0,
      occurred_on: dayInTz(new Date(), tz),
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 5000) : "",
    })
    .select(COLS)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't log it." }, { status: 500 });
  return NextResponse.json({ activity: shape(data as Row) });
}

// DELETE ?activityId= detaches a touch from the deal (the touch itself stays).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const activityId = new URL(request.url).searchParams.get("activityId");
  if (!activityId) return NextResponse.json({ error: "Missing activity." }, { status: 400 });
  await a.supabase.from("sales_activities").update({ deal_id: null }).eq("id", activityId).eq("deal_id", params.id).eq("master_plan_id", a.masterPlanId);
  return NextResponse.json({ ok: true });
}
