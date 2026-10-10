import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { addMonths, clientNoticeEmail, longDate } from "@/lib/preFounderTrial";

export const dynamic = "force-dynamic";

// Daily. Pre-Founders get six free months of VIP, then $497 a month. At month 5 Babs gets an alert (and the
// client gets "your free months are almost up" with a card link, once the link is set); on the end date
// Babs gets a last alert. Off until app_settings pre_founder_trial_emails_on = true. Each notice sends once.
const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const BABS = "amilynne@amilynnecarroll.com";

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, reply_to: "support@lccommandsuite.com", subject, html }),
  });
  if (!res.ok) console.error("pre-founder-trials email:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: set } = await db.from("app_settings").select("key, value").in("key", ["pre_founder_trial_emails_on", "pre_founder_payment_link"]);
  const cfg = Object.fromEntries(((set ?? []) as { key: string; value: string }[]).map((r) => [r.key, String(r.value ?? "").trim()]));
  if (cfg.pre_founder_trial_emails_on?.toLowerCase() !== "true") return NextResponse.json({ ok: true, enabled: false });

  const { data: rows } = await db.from("new_client_emails").select("email, name, sent_at").eq("kind", "pre-founder").eq("status", "sent").not("sent_at", "is", null);
  const now = new Date();
  let sent = 0;
  const claim = async (email: string, notice: string) => {
    const { data } = await db.from("pre_founder_trial_notices").upsert({ email, notice }, { onConflict: "email,notice", ignoreDuplicates: true }).select("email");
    return (data ?? []).length > 0;
  };

  for (const r of (rows ?? []) as { email: string; name: string | null; sent_at: string }[]) {
    if (/eloise/i.test(r.email)) continue; // test accounts never trigger billing notices
    const start = new Date(r.sent_at);
    const month5 = addMonths(start, 5);
    const end = addMonths(start, 6);
    const who = r.name || r.email;
    const first = (r.name || "").trim().split(/\s+/)[0] || "";

    if (now >= month5 && (await claim(r.email, "month5_alert"))) {
      const linkNote = cfg.pre_founder_payment_link ? "The client has been emailed their card link." : "No Pre-Founder payment link is set yet, so the client was NOT emailed. Create the $497 a month link in Stripe, then add it in the app setting pre_founder_payment_link.";
      await send(BABS, `Pre-Founder free months end ${longDate(end)}: ${who}`, `<p><b>${who}</b> (${r.email}) joined as a Pre-Founder on ${longDate(start)}. Their six free months end on <b>${longDate(end)}</b>, then $497 a month.</p><p>${linkNote}</p>`);
      sent += 1;
    }
    if (now >= month5 && cfg.pre_founder_payment_link && (await claim(r.email, "month5_client"))) {
      const c = clientNoticeEmail(first, longDate(end), cfg.pre_founder_payment_link);
      if (await send(r.email, c.subject, c.html)) sent += 1;
    }
    if (now >= end && (await claim(r.email, "trial_end_alert"))) {
      await send(BABS, `Pre-Founder free months end today: ${who}`, `<p><b>${who}</b> (${r.email})'s six free months end today. Check that their card is on file at $497 a month, or decide what to do with the account.</p>`);
      sent += 1;
    }
  }
  return NextResponse.json({ ok: true, enabled: true, checked: (rows ?? []).length, sent });
}
