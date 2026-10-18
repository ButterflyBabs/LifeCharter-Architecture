import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { paymentsAccount } from "@/lib/payments";
import { getConnection } from "@/lib/stripeConnect";
import { INVOICE_COLUMNS, cancelInvoice, createInvoice, invoicePlan } from "@/lib/suitePayments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The Payments page (get paid inside the Suite, step b).
//   GET                                             -> { connected, livemode, payments, invoices, offers }
//   GET ?contact=<id>                               -> the same, for one contact (+ contact)
//   POST { action: "preview", amount, paymentCount, daysUntilDue, email, description } -> { note } | { error }
//   POST { action: "invoice", contactId, description, amount, paymentCount?, daysUntilDue?, offerId? }
//   POST { action: "cancel", id }                    -> void an unpaid invoice / stop a plan
export async function GET(request: Request) {
  const a = await paymentsAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const contactId = new URL(request.url).searchParams.get("contact");
  let pays = db.from("suite_payments").select("id, livemode, kind, amount, currency, refunded, email, name, contact_id, offer_id, invoice_id, description, paid_at").eq("master_plan_id", a.planId).order("paid_at", { ascending: false }).limit(300);
  let invs = db.from("suite_invoices").select(INVOICE_COLUMNS).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(300);
  if (contactId) {
    pays = pays.eq("contact_id", contactId);
    invs = invs.eq("contact_id", contactId);
  }
  const [connection, { data: payments }, { data: invoices }, { data: offers }, contact] = await Promise.all([
    getConnection(db, a.planId),
    pays,
    invs,
    db.from("sales_offers").select("id, name, price").eq("master_plan_id", a.planId).order("sort_order"),
    contactId ? db.from("seq_contacts").select("id, email, first_name, last_name").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle().then((r) => r.data) : Promise.resolve(null),
  ]);
  return NextResponse.json(
    { connected: Boolean(connection), livemode: connection?.livemode ?? null, payments: payments ?? [], invoices: invoices ?? [], offers: offers ?? [], contact },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const a = await paymentsAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();

  if (b.action === "cancel") {
    const ok = await cancelInvoice(db, a.planId, String(b.id || "")).catch((e) => {
      console.error("cancel invoice:", e instanceof Error ? e.message : e);
      return false;
    });
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "That invoice can't be cancelled (it may already be paid)." }, { status: 400 });
  }

  let email = typeof b.email === "string" ? b.email : "";
  let name: string | null = null;
  const contactId = typeof b.contactId === "string" && b.contactId ? b.contactId : null;
  if (contactId) {
    const { data: c } = await db.from("seq_contacts").select("id, email, first_name, last_name").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle();
    if (!c) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
    email = (c.email as string) || "";
    name = [c.first_name, c.last_name].filter(Boolean).join(" ") || null;
  }
  const input = { email, name, description: String(b.description || ""), amount: Number(b.amount), paymentCount: Number(b.paymentCount) || 1, daysUntilDue: Number(b.daysUntilDue) || 7 };
  const plan = invoicePlan(input);
  if (b.action === "preview") return plan.ok ? NextResponse.json({ note: plan.note }) : NextResponse.json({ error: plan.reason }, { status: 400 });
  if (b.action !== "invoice") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (!contactId) return NextResponse.json({ error: "Choose a contact." }, { status: 400 });
  if (!plan.ok) return NextResponse.json({ error: plan.reason }, { status: 400 });

  const connection = await getConnection(db, a.planId);
  if (!connection) return NextResponse.json({ error: "Connect your Stripe account first (Settings › Integrations)." }, { status: 400 });
  let offerId: string | null = null;
  if (typeof b.offerId === "string" && b.offerId) {
    const { data: o } = await db.from("sales_offers").select("id").eq("id", b.offerId).eq("master_plan_id", a.planId).maybeSingle();
    offerId = (o?.id as string) ?? null;
  }
  try {
    const invoice = await createInvoice(db, a.planId, connection, input, { contactId, offerId });
    return NextResponse.json({ ok: true, invoice });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("POST /api/payments invoice:", msg);
    return NextResponse.json({ error: `Stripe didn't create the invoice. ${msg.slice(0, 200)}` }, { status: 400 });
  }
}
