import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { SMS_OPEN_TO_ALL } from "@/lib/smsFlag";
import { prettyPhone, segmentsOf, toE164 } from "@/lib/sms";
import { sendSms, smsAccount, smsCap, smsUsed } from "@/lib/smsServer";

export const dynamic = "force-dynamic";

// Texts with one contact (task 1151, part 2: two-way).
//   GET ?contact=<id>           -> the conversation, whether you can text them (and why not), this month's use
//   POST { contactId, body }    -> send a text from the account's number
// You can text someone who ticked "text me reminders" when they booked, or who texted your number first, and never
// anyone who replied STOP. Every text counts toward the plan's monthly allowance.
async function gate() {
  const a = await crmAccount();
  if ("denied" in a) return a;
  if (!SMS_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  return a;
}

type Db = ReturnType<typeof createServerClient>;
async function standing(db: Db, planId: string, contactId: string) {
  const [{ data: c }, acct, cap, used] = await Promise.all([
    db.from("seq_contacts").select("id, first_name, phone, sms_consent_at, sms_opted_out_at").eq("id", contactId).eq("master_plan_id", planId).maybeSingle(),
    smsAccount(db, planId),
    smsCap(db, planId),
    smsUsed(db, planId),
  ]);
  if (!c) return null;
  const phone = toE164(c.phone as string | null);
  let textedIn = false;
  if (phone) {
    const { count } = await db.from("sms_messages").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("direction", "in").eq("from_number", phone);
    textedIn = (count ?? 0) > 0;
  }
  const why =
    !acct || acct.status !== "approved" ? "Texting starts once your texting number is approved (Settings › Text messages)."
    : !phone ? "Add a US or Canadian mobile number to this contact first."
    : c.sms_opted_out_at ? "They replied STOP, so they don't get texts. If they text START to your number, you can text them again."
    : !c.sms_consent_at && !textedIn ? "You can text people who ticked “text me reminders” when they booked, or who texted your number first."
    : used >= cap ? `This month's ${cap.toLocaleString()} texts are used. Texting starts again on the 1st.`
    : null;
  return { c, phone, acct, cap, used, why };
}

export async function GET(request: Request) {
  const a = await gate();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const contactId = new URL(request.url).searchParams.get("contact") || "";
  if (!/^[0-9a-f-]{36}$/i.test(contactId)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = await standing(db, a.planId, contactId);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ors = [`contact_id.eq.${contactId}`];
  if (s.phone) ors.push(`to_number.eq.${s.phone}`, `from_number.eq.${s.phone}`);
  const { data: msgs } = await db.from("sms_messages").select("id, direction, kind, body, status, error, created_at").eq("master_plan_id", a.planId).or(ors.join(",")).order("created_at", { ascending: true }).limit(200);
  return NextResponse.json(
    {
      approved: s.acct?.status === "approved",
      number: prettyPhone(s.acct?.phone_number),
      phone: s.phone ? prettyPhone(s.phone) : null,
      canText: !s.why,
      why: s.why,
      cap: s.cap,
      used: s.used,
      messages: msgs ?? [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const a = await gate();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as { contactId?: string; body?: string };
  const contactId = String(b.contactId || "");
  const body = String(b.body || "").trim();
  if (!body) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  if (body.length > 640) return NextResponse.json({ error: "Keep texts under 640 characters." }, { status: 400 });
  if (segmentsOf(body) > 4) return NextResponse.json({ error: "That's a long text. Please shorten it." }, { status: 400 });
  const s = /^[0-9a-f-]{36}$/i.test(contactId) ? await standing(db, a.planId, contactId) : null;
  if (!s) return NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
  if (s.why) return NextResponse.json({ error: s.why }, { status: 400 });
  const r = await sendSms(db, a.planId, { to: s.phone!, body, kind: "manual", contactId });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
