import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { browserContext, sendMetaEvent } from "@/lib/metaCapi";
import { cleanAnswers, computeResult } from "@/lib/healthCheck";
import { healthCheckEmail } from "@/lib/healthCheckEmail";

export const dynamic = "force-dynamic";

// The public Business Health Check (lccommandsuite.com/business-health-check). No sign-in.
//   POST { firstName, email, phone?, businessName?, answers (25 numbers, 0 to 3), _utm, _eid, _page, _hp }
//        scores the answers on the server, saves the person to Babs's Contacts with tags, emails the scores → { ok, emailed }
// The report itself is built in the browser from the same lib, so the page and the email always agree. Nothing here
// touches any client's 12 business dimensions, and the check starts no email series (it only tags the contact).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const TAG_ALL = "business-health-check";

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "Something went wrong. Please reload and try again." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (str(b._hp, 100)) return NextResponse.json({ ok: true }); // a bot filled the hidden field; pretend it worked

  const firstName = str(b.firstName, 80);
  const email = str(b.email, 200).toLowerCase();
  const phone = str(b.phone, 40);
  const businessName = str(b.businessName, 120);
  if (!firstName) return NextResponse.json({ error: "Please add your first name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const answers = cleanAnswers(b.answers);
  if (!answers) return NextResponse.json({ error: "A few questions are still unanswered. Please go back and finish them." }, { status: 400 });

  const result = computeResult(answers);
  const utm: Record<string, string> = {};
  if (b._utm && typeof b._utm === "object") for (const [k, v] of Object.entries(b._utm as Record<string, unknown>)) if (/^(utm_|fbclid)/.test(k) && typeof v === "string") utm[k] = v.slice(0, 120);

  const db = createServerClient();
  let plan: string | null = null;
  let contactId: string | null = null;
  try {
    plan = await ownerMasterPlanId().catch(() => null);
    if (plan) {
      const tags = [TAG_ALL, `bhc-grade-${result.grade.grade.toLowerCase()}`, ...result.gaps.map((g) => `bhc-lowest-${g.key}`)];
      const c = await upsertContact({ masterPlanId: plan, email, firstName, phone: phone || undefined, company: businessName || undefined, source: TAG_ALL, tags }, db);
      contactId = c?.id ?? null;
      if (c) {
        const summary = `Finished the Business Health Check: ${result.overall}% (${result.grade.grade}, ${result.grade.label}). Lowest: ${result.gaps.map((g) => `${g.name} ${g.pct}%`).join(", ")}.${businessName ? ` Business: ${businessName}.` : ""}`;
        await logEvent(plan, c.id, "form", summary, { overall: result.overall, categories: Object.fromEntries(result.categories.map((x) => [x.key, x.pct])), utm }, db).catch(() => {});
      }
    }
  } catch (e) {
    // The report is on the person's screen either way; never fail the request over the CRM.
    console.error("health-check crm:", (e as Error).message);
  }

  // Keep the full result for Babs's Alignment Architect > Audit Results page. A failed save never fails the request:
  // the report is on the person's screen and the contact and activity note above already exist.
  const { data: saved, error: saveErr } = await db
    .from("health_check_runs")
    .insert({ master_plan_id: plan, contact_id: contactId, first_name: firstName, email, phone: phone || null, business_name: businessName || null, answers, result, overall: result.overall, grade: result.grade.grade, attribution: utm })
    .select("id")
    .maybeSingle();
  if (saveErr) console.error("health-check save:", saveErr.message);

  // The scores email. A failed send never fails the request.
  let emailed = false;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const mail = healthCheckEmail({ name: firstName, origin: new URL(request.url).origin, result });
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "AmiLynne Carroll <support@lccommandsuite.com>", to: email, reply_to: "support@lccommandsuite.com", subject: mail.subject, html: mail.html, text: mail.text }),
      });
      emailed = res.ok;
      if (!res.ok) console.error("health-check email:", res.status);
    } catch (e) {
      console.error("health-check email:", (e as Error).message);
    }
  }
  if (saved?.id) await db.from("health_check_runs").update({ email_status: emailed ? "sent" : key ? "failed" : "skipped" }).eq("id", saved.id);

  await sendMetaEvent({
    eventName: "Lead",
    eventId: str(b._eid, 80) || `bhc-${Date.now()}`,
    email,
    firstName,
    contentName: "business-health-check",
    ...browserContext(request, str(b._page, 500) || null),
  }).catch(() => {});
  return NextResponse.json({ ok: true, emailed });
}
