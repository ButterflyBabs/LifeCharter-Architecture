import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { keywordOf, prettyPhone, toE164 } from "@/lib/sms";
import { validTwilioSignature } from "@/lib/smsServer";
import { notifyOwnerOfText } from "@/lib/smsNotify";

export const dynamic = "force-dynamic";

// A text someone sent to an account's number (task 1151). Twilio signs the request. STOP / START are recorded on the
// contact (Twilio itself answers STOP, START and HELP on toll-free numbers); anything else is logged and the owner is
// told by email.
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const twiml = () => new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { headers: { "Content-Type": "text/xml" } });

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return new NextResponse("Bad request", { status: 400 });
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));
  if (!validTwilioSignature(`${APP()}/api/sms/inbound`, params, request.headers.get("x-twilio-signature"))) return new NextResponse("Forbidden", { status: 403 });

  const db = createServerClient();
  const to = toE164(params.To);
  const from = toE164(params.From);
  const body = String(params.Body || "").slice(0, 1600);
  if (!to || !from) return twiml();
  const { data: acct } = await db.from("sms_accounts").select("master_plan_id").eq("phone_number", to).maybeSingle();
  if (!acct) return twiml();
  const planId = acct.master_plan_id as string;

  const { data: people } = await db.from("seq_contacts").select("id, phone, first_name, last_name, email").eq("master_plan_id", planId).not("phone", "is", null).limit(5000);
  const matches = ((people ?? []) as { id: string; phone: string | null; first_name: string | null; last_name: string | null; email: string | null }[]).filter((c) => toE164(c.phone) === from);
  const contact = matches[0] ?? null;

  await db.from("sms_messages").upsert({ master_plan_id: planId, contact_id: contact?.id ?? null, direction: "in", kind: "inbound", to_number: to, from_number: from, body, segments: Number(params.NumSegments || 1) || 1, status: "received", twilio_sid: params.MessageSid || null }, { onConflict: "twilio_sid", ignoreDuplicates: true });

  const kw = keywordOf(body);
  if (kw === "stop" && matches.length) await db.from("seq_contacts").update({ sms_opted_out_at: new Date().toISOString() }).in("id", matches.map((m) => m.id));
  else if (kw === "start" && matches.length) await db.from("seq_contacts").update({ sms_opted_out_at: null }).in("id", matches.map((m) => m.id));
  else if (!kw) {
    const who = contact ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email || prettyPhone(from) : prettyPhone(from);
    await notifyOwnerOfText(db, planId, who, body, contact?.id ?? null).catch(() => null);
  }
  return twiml();
}
