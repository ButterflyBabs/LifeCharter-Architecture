import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { sessionUser } from "@/lib/authz";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { logEvent, upsertContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

// Sends the Year-1 Operating Agreement for signature from /sales-reference (Babs, 2026-10-16).
// It uses the BoldSign template "LCCS Year-1 Operating Agreement": role 1 is the Client (signs first), role 2 is
// the Company (AmiLynne countersigns). BoldSign emails the client; the send is logged on their contact card.
// Needs BOLDSIGN_API_KEY on Vercel (the key Babs creates in BoldSign under API > API Key). Until it is set, GET says
// so and POST refuses with a plain message. The template id and the region base address can be changed with
// BOLDSIGN_TEMPLATE_ID and BOLDSIGN_API_BASE.
const TEMPLATE_ID = process.env.BOLDSIGN_TEMPLATE_ID || "aacf6304-86ae-4585-9ead-47823a4e0aa5";
const API_BASE = (process.env.BOLDSIGN_API_BASE || "https://api.boldsign.com").replace(/\/$/, "");
const COMPANY_NAME = "AmiLynne Carroll";
const COMPANY_EMAIL = process.env.BOLDSIGN_COMPANY_SIGNER_EMAIL || "amilynne@amilynnecarroll.com";

// Field ids in the BoldSign template (BoldSign numbers them in the order they were placed). Everything we know about the
// client is filled in before it is sent, so all they have to do is read and sign. (BoldSign refused a read-only flag on
// some of these field types, so the values are filled in but not locked.)
const TIER_FIELD: Record<string, string> = { Starter: "CheckBox1", Growth: "CheckBox2", VIP: "CheckBox3" };
const PAYMENT_FIELD: Record<string, string> = { full: "CheckBox4", split: "CheckBox5", annual: "CheckBox6" };

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.BOLDSIGN_API_KEY) });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const key = process.env.BOLDSIGN_API_KEY;
  if (!key) return NextResponse.json({ error: "Sending from this page isn't switched on yet (the BoldSign key hasn't been added). Ask Babs, or send it from BoldSign for now." }, { status: 503 });

  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(b.name, 120);
  const email = str(b.email, 200).toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter the client's name and a valid email." }, { status: 400 });
  if (email === COMPANY_EMAIL.toLowerCase()) return NextResponse.json({ error: "That is the company signer's email. Enter the client's." }, { status: 400 });

  const businessName = str(b.businessName, 160);
  const phone = str(b.phone, 40);
  const tier = typeof b.tier === "string" && TIER_FIELD[b.tier] ? b.tier : "";
  const payment = typeof b.payment === "string" && PAYMENT_FIELD[b.payment] ? b.payment : "";
  const prefill: { id: string; value: string }[] = [
    { id: "Name1", value: name },
    { id: "Email1", value: email },
    { id: "Name2", value: name },
    ...(businessName ? [{ id: "TextBox1", value: businessName }] : []),
    ...(phone ? [{ id: "TextBox2", value: phone }] : []),
    ...(tier ? [{ id: TIER_FIELD[tier], value: "on" }] : []),
    ...(payment ? [{ id: PAYMENT_FIELD[payment], value: "on" }] : []),
  ];

  const db = createServerClient();
  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ error: "Owner account not found." }, { status: 500 });

  // One agreement per client within a day: stops a double click from sending (and billing) it twice.
  let contactId = str(b.contactId, 60);
  if (!contactId) {
    const [first, ...rest] = name.split(/\s+/);
    const made = await upsertContact({ masterPlanId: planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "sales-call" }, db);
    contactId = made?.id ?? "";
  }
  if (contactId) {
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { data: recent } = await db.from("crm_events").select("id").eq("master_plan_id", planId).eq("contact_id", contactId).eq("title", "Year-1 Operating Agreement sent for signature").gte("created_at", since).limit(1);
    if (recent?.length) return NextResponse.json({ error: "The agreement was already sent to this client in the last 24 hours. Check BoldSign before sending it again." }, { status: 409 });
  }

  const res = await fetch(`${API_BASE}/v1/template/send?templateId=${encodeURIComponent(TEMPLATE_ID)}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      title: "LifeCharter Command Suite Year-1 Operating Agreement",
      message: `Hi ${name.split(/\s+/)[0]}, welcome to LifeCharter Command Suite! Please review and sign your Year-1 Operating Agreement. It takes about two minutes. If you have any questions, reply to this email or write to support@lccommandsuite.com. Head up - Wings out. Babs`,
      roles: [
        { roleIndex: 1, signerName: name, signerEmail: email, signerType: "Signer", existingFormFields: prefill },
        { roleIndex: 2, signerName: COMPANY_NAME, signerEmail: COMPANY_EMAIL, signerType: "Signer" },
      ],
    }),
  }).catch(() => null);
  const out = (await res?.json().catch(() => ({}))) as { documentId?: string; error?: string; Errors?: unknown } | undefined;
  if (!res || !res.ok || !out?.documentId) {
    console.error("BoldSign send failed:", res?.status, JSON.stringify(out ?? {}).slice(0, 400));
    return NextResponse.json({ error: res?.status === 401 || res?.status === 403 ? "BoldSign refused the key. Ask Babs to check it." : "BoldSign couldn't send it. Check BoldSign, or try again in a minute." }, { status: 502 });
  }

  if (contactId) {
    const user = await sessionUser().catch(() => null);
    await logEvent(planId, contactId, "note", "Year-1 Operating Agreement sent for signature", { documentId: out.documentId, to: email, by: user?.email ?? null, via: "BoldSign", tier: tier || null, payment: payment || null }, db);
    const { data: c } = await db.from("seq_contacts").select("tags").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
    const tags = new Set(((c?.tags as string[]) ?? []).map((t) => t.toLowerCase()));
    tags.add("agreement-sent");
    await db.from("seq_contacts").update({ tags: Array.from(tags), updated_at: new Date().toISOString() }).eq("id", contactId).eq("master_plan_id", planId);
  }
  return NextResponse.json({ ok: true, documentId: out.documentId });
}
