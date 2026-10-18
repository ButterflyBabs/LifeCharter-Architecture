import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { SMS_OPEN_TO_ALL } from "@/lib/smsFlag";
import { businessGaps, cleanBusiness, consentText, DEFAULT_1H, DEFAULT_24H, fillReminder, prettyPhone, toE164 } from "@/lib/sms";
import { registerNumber, sampleReminder, sendSms, smsAccount, smsCap, smsUsed, twilioReady } from "@/lib/smsServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Settings › Text messages (task 1151).
//   GET                                        -> status, number, this month's use and cap, settings, recent texts
//   POST { action: "business", business }      -> save the business details (for the number's approval)
//   POST { action: "register", business }      -> get a number and send it for Twilio's approval
//   POST { action: "settings", remindersOn, reminder24h, reminder1h, template24h, template1h }
//   POST { action: "test", to }                -> a test reminder to the owner's own mobile (once approved)
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function gate() {
  const a = await crmAccount();
  if ("denied" in a) return a;
  if (!SMS_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "Texting isn't open on your account yet." }, { status: 404 }) };
  return a;
}

export async function GET() {
  const a = await gate();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [acct, cap, used, { data: recent }] = await Promise.all([
    smsAccount(db, a.planId),
    smsCap(db, a.planId),
    smsUsed(db, a.planId),
    db.from("sms_messages").select("id, direction, kind, to_number, from_number, body, status, error, created_at, contact_id").eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(50),
  ]);
  const biz = cleanBusiness(acct?.business ?? {});
  const name = biz.dba || biz.legalName || "Your business";
  return NextResponse.json(
    {
      ready: twilioReady(),
      account: acct ? { ...acct, phonePretty: prettyPhone(acct.phone_number) } : null,
      business: biz,
      gaps: businessGaps(biz),
      cap,
      used,
      defaults: { template24h: DEFAULT_24H, template1h: DEFAULT_1H },
      consent: consentText(name),
      preview24h: fillReminder(acct?.template_24h || DEFAULT_24H, { first: "Eloise", business: name, event: "Discovery Call", time: "Tuesday 10:00 AM", date: "October 20" }),
      preview1h: fillReminder(acct?.template_1h || DEFAULT_1H, { first: "Eloise", business: name, event: "Discovery Call", time: "10:00 AM", date: "October 20" }),
      recent: ((recent ?? []) as { to_number: string; from_number: string }[]).map((m) => ({ ...m, to: prettyPhone(m.to_number), from: prettyPhone(m.from_number) })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const a = await gate();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action || "");
  const now = new Date().toISOString();

  if (action === "business" || action === "register") {
    const biz = cleanBusiness(b.business);
    const acct = await smsAccount(db, a.planId);
    if (!acct) await db.from("sms_accounts").insert({ master_plan_id: a.planId, business: biz });
    else if (acct.status !== "pending" && acct.status !== "in_review") await db.from("sms_accounts").update({ business: biz, updated_at: now }).eq("master_plan_id", a.planId);
    if (action === "business") return NextResponse.json({ ok: true });
    const gaps = businessGaps(biz);
    if (gaps.length) return NextResponse.json({ error: `Please add: ${gaps.join(", ")}.` }, { status: 400 });
    const r = await registerNumber(db, a.planId, biz, sampleReminder(biz.dba || biz.legalName));
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }
  if (action === "settings") {
    const t24 = str(b.template24h, 300);
    const t1 = str(b.template1h, 300);
    const acct = await smsAccount(db, a.planId);
    const row = {
      reminders_on: b.remindersOn !== false,
      reminder_24h: b.reminder24h !== false,
      reminder_1h: b.reminder1h !== false,
      template_24h: t24 && t24 !== DEFAULT_24H ? t24 : null,
      template_1h: t1 && t1 !== DEFAULT_1H ? t1 : null,
      updated_at: now,
    };
    if (!acct) await db.from("sms_accounts").insert({ master_plan_id: a.planId, ...row });
    else await db.from("sms_accounts").update(row).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }
  if (action === "test") {
    const to = toE164(str(b.to, 30));
    if (!to) return NextResponse.json({ error: "Enter your own US mobile number." }, { status: 400 });
    const acct = await smsAccount(db, a.planId);
    const biz = cleanBusiness(acct?.business ?? {});
    const body = fillReminder(acct?.template_24h || DEFAULT_24H, { first: "", business: biz.dba || biz.legalName || "Your business", event: "test appointment", time: "tomorrow 10:00 AM", date: "" });
    const r = await sendSms(db, a.planId, { to, body: `TEST · ${body}`, kind: "system" });
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
