import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity, q } from "@/lib/activity";
import { BILL_CADENCES, loadBills, nextAfter, type BillCadence } from "@/lib/finance/bills";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof body.name === "string") out.name = body.name.trim().slice(0, 120);
  if (body.amount !== undefined) {
    const n = body.amount === null || body.amount === "" ? null : Number(body.amount);
    out.amount = n !== null && isFinite(n) && n >= 0 ? n : null;
  }
  if (typeof body.category === "string") out.category = body.category.trim().slice(0, 80) || null;
  if (typeof body.cadence === "string" && (BILL_CADENCES as string[]).includes(body.cadence)) out.cadence = body.cadence;
  if (typeof body.nextDue === "string" && DATE.test(body.nextDue)) out.next_due = body.nextDue;
  if (body.autopay !== undefined) out.autopay = Boolean(body.autopay);
  if (typeof body.notes === "string") out.notes = body.notes.trim().slice(0, 500) || null;
  return out;
}

// GET — this client's active bills.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ bills: [] });
  return NextResponse.json({ bills: await loadBills(masterPlanId) });
}

// POST — add one bill { name, amount?, category?, cadence, nextDue, autopay?, notes? },
// or several at once { bills: [...] } (used by the quick-add buttons).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const list = (Array.isArray(body.bills) ? body.bills : [body]).slice(0, 50) as Record<string, unknown>[];
  const rows = list.map(clean).filter((r) => r.name && r.next_due);
  if (!rows.length) return NextResponse.json({ error: "Give the bill a name and a due date." }, { status: 400 });
  const { error } = await createServerClient()
    .from("finance_bills")
    .insert(rows.map((r) => ({ cadence: "monthly", ...r, master_plan_id: masterPlanId })));
  if (error) {
    console.error("POST /api/finance/bills:", error.message);
    return NextResponse.json({ error: "Couldn't save that bill." }, { status: 500 });
  }
  await logActivity(rows.map((r) => ({ masterPlanId, action: "created", entityType: "bill" as const, summary: `Added bill ${q(r.name)}` })));
  return NextResponse.json({ ok: true, added: rows.length });
}

// PATCH — { id, ...fields } to edit, or { id, action: "pay", paidOn?, amount? } to
// record the payment as an expense and move the bill to its next due date.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!masterPlanId || !id) return NextResponse.json({ error: "Missing bill." }, { status: 400 });
  const supabase = createServerClient();
  const { data: bill } = await supabase
    .from("finance_bills")
    .select("id, name, amount, category, cadence, next_due")
    .eq("id", id)
    .eq("master_plan_id", masterPlanId)
    .maybeSingle();
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });

  if (body.action === "pay") {
    const paidOn = typeof body.paidOn === "string" && DATE.test(body.paidOn) ? body.paidOn : new Date().toISOString().slice(0, 10);
    const amount = body.amount !== undefined && body.amount !== "" ? Number(body.amount) : Number(bill.amount ?? 0);
    if (isFinite(amount) && amount > 0) {
      await supabase.from("finance_entries").insert({
        master_plan_id: masterPlanId,
        type: "expense",
        amount,
        category: bill.category || "Bills",
        description: bill.name,
        occurred_on: paidOn,
        source: "bill",
      });
    }
    const next = nextAfter(bill.next_due as string, bill.cadence as BillCadence);
    await supabase
      .from("finance_bills")
      .update(next ? { next_due: next, last_paid_on: paidOn, updated_at: new Date().toISOString() } : { active: false, last_paid_on: paidOn, updated_at: new Date().toISOString() })
      .eq("id", id);
    await logActivity({ masterPlanId, action: "paid", entityType: "bill", entityId: id, summary: `Paid bill ${q(bill.name)}${isFinite(amount) && amount > 0 ? ` ($${amount.toFixed(2)})` : ""}` });
    return NextResponse.json({ ok: true, nextDue: next, recorded: isFinite(amount) && amount > 0 });
  }

  const patch = clean(body);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  const { error: upErr } = await supabase.from("finance_bills").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (!upErr) await logActivity({ masterPlanId, action: "updated", entityType: "bill", entityId: id, summary: `Updated bill ${q(patch.name || bill.name)}` });
  return NextResponse.json({ ok: true });
}

// DELETE — { id } stops tracking a bill (past payments stay in the ledger).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!masterPlanId || !id) return NextResponse.json({ error: "Missing bill." }, { status: 400 });
  const { data: gone } = await createServerClient().from("finance_bills").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id).eq("master_plan_id", masterPlanId).select("id, name");
  if (gone?.[0]) await logActivity({ masterPlanId, action: "deleted", entityType: "bill", entityId: id, summary: `Stopped tracking bill ${q(gone[0].name)}` });
  return NextResponse.json({ ok: true });
}
