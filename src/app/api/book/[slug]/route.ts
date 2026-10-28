import { NextResponse } from "next/server";
import { availableSlots, book, bookingCharge, calendarBySlug, releaseHold } from "@/lib/booking/engine";
import { getConnection } from "@/lib/stripeConnect";
import { bookingCheckout } from "@/lib/suitePayments";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";
import { browserContext, sendMetaEvent } from "@/lib/metaCapi";
import { isHousePlan } from "@/lib/housePlan";
import { consentText, toE164 } from "@/lib/sms";
import { awayAhead, awayDates, awayNote } from "@/lib/awayMode";
import { cookies } from "next/headers";
import { AFF_COOKIE, affiliateByCode, recordReferral } from "@/lib/affiliates";
import { toCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { chargesTax } from "@/lib/salesTaxServer";
import { isTaxPlace } from "@/lib/salesTax";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Public booking page data.
//   GET ?from=ISO&to=ISO → the calendar's public details + open start times
//   POST { start, name, email, phone, timezone, answers, taxPlace? } → books it
// GST/HST (task 1520 follow-up): when the account charges it and the calendar takes payment, calendar.payment.tax is
// true and POST needs taxPlace ("ON".. or "OUTSIDE"); the price shown is before tax and Stripe adds the fixed rate.
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const cal = await calendarBySlug(params.slug);
  if (!cal || !cal.active) return NextResponse.json({ error: "This booking page isn't available." }, { status: 404 });
  const u = new URL(request.url);
  const from = u.searchParams.get("from") || new Date().toISOString();
  const to = u.searchParams.get("to") || new Date(Date.now() + 14 * 86_400_000).toISOString();
  if (Date.parse(to) - Date.parse(from) > 45 * 86_400_000) return NextResponse.json({ error: "Range too long." }, { status: 400 });
  const { data: hosts } = await createServerClient().from("booking_hosts").select("name").eq("master_plan_id", cal.master_plan_id).in("id", cal.host_ids.length ? cal.host_ids : ["00000000-0000-0000-0000-000000000000"]);
  const charge = bookingCharge(cal);
  const [plan, away, sms, taxOn] = await Promise.all([
    availableSlots(cal, from, to),
    awayAhead(createServerClient(), cal.master_plan_id),
    createServerClient().from("sms_accounts").select("status, reminders_on, business").eq("master_plan_id", cal.master_plan_id).maybeSingle(),
    charge ? chargesTax(cal.master_plan_id) : Promise.resolve(false),
  ]);
  const smsBiz = sms.data?.business as { dba?: string; legalName?: string } | undefined;
  const smsOn = sms.data?.status === "approved" && sms.data.reminders_on ? consentText(smsBiz?.dba || smsBiz?.legalName || "us") : null;
  // The house account's pages wear one of its brands; every client account's page stays neutral.
  const brand = cal.master_plan_id === (await housePlanId()) ? ((cal as unknown as { brand?: string }).brand ?? "command_suite") : "neutral";
  return NextResponse.json({
    calendar: {
      brand,
      name: cal.name,
      description: cal.description,
      duration: cal.duration_min,
      location: cal.location,
      requirePhone: Boolean(cal.require_phone),
      maxDaysAhead: cal.max_days_ahead,
      questions: cal.questions,
      hostName: cal.assignment === "single" ? (hosts ?? [])[0]?.name ?? null : null,
      sms: smsOn ? { consent: smsOn } : null,
      payment: charge ? { amount: charge.cents / 100, kind: charge.kind, currency: toCurrency((cal as { currency?: string }).currency), tax: taxOn } : null,
      // The account's home currency decides which currency shows as a plain "$".
      homeCurrency: await homeCurrency(cal.master_plan_id),
    },
    slots: plan.slots.map((s) => s.start),
    away: away?.block_bookings ? { dates: awayDates(away), note: awayNote(away) } : null,
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const cal = await calendarBySlug(params.slug);
  if (!cal || !cal.active) return NextResponse.json({ error: "This booking page isn't available." }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  if (typeof b._hp === "string" && b._hp.trim()) return NextResponse.json({ ok: true });
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  // Paid or deposit booking: the time is held while they pay on the owner's own Stripe account.
  const charge = bookingCharge(cal);
  const connection = charge ? await getConnection(createServerClient(), cal.master_plan_id) : null;
  if (charge && !connection) return NextResponse.json({ error: "This booking page can't take payments right now. Please contact us to book." }, { status: 409 });
  // GST/HST: where the booker is decides the tax; asked before the time is held.
  const taxOn = charge ? await chargesTax(cal.master_plan_id) : false;
  const taxPlace = taxOn && isTaxPlace(b.taxPlace) ? b.taxPlace : null;
  if (taxOn && !taxPlace) return NextResponse.json({ error: "Choose where you are so the right tax is added." }, { status: 400 });
  const r = await book(cal, {
    hold: charge ? { amount: charge.cents / 100 } : null,
    startISO: str(b.start),
    name: str(b.name),
    email: str(b.email),
    phone: str(b.phone) || null,
    timezone: str(b.timezone) || null,
    answers: b.answers && typeof b.answers === "object" ? (b.answers as Record<string, string>) : {},
  });
  // Ticked "text me reminders" (task 1151): remember it on the booking and the contact.
  if (r.ok && b.smsOk === true && toE164(str(b.phone))) {
    const db = createServerClient();
    const { data: acct } = await db.from("sms_accounts").select("status").eq("master_plan_id", cal.master_plan_id).maybeSingle();
    if (acct?.status === "approved") {
      await db.from("bookings").update({ sms_ok: true }).eq("id", r.bookingId);
      const { data: c } = await db.from("seq_contacts").select("id, phone").eq("master_plan_id", cal.master_plan_id).eq("email", str(b.email).trim().toLowerCase()).maybeSingle();
      if (c) await db.from("seq_contacts").update({ sms_consent_at: new Date().toISOString(), ...(c.phone ? {} : { phone: str(b.phone).trim().slice(0, 40) }) }).eq("id", c.id);
    }
  }
  // Came through an affiliate's link: credit the booking to them.
  if (r.ok) {
    const code = str(b._ref) || cookies().get(AFF_COOKIE)?.value || "";
    if (code) {
      const db = createServerClient();
      const aff = await affiliateByCode(db, cal.master_plan_id, code).catch(() => null);
      if (aff) {
        const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", cal.master_plan_id).eq("email", str(b.email).trim().toLowerCase()).maybeSingle();
        if (c) await recordReferral(db, cal.master_plan_id, aff, c.id as string, "booking", `booking:${cal.slug}`).catch((e) => console.error("affiliate booking:", e));
      }
    }
  }
  // Meta Conversions API is Babs's own ad account: only her calendars report to it.
  if (r.ok && (await isHousePlan(cal.master_plan_id))) {
    // Schedule → Meta Conversions API. Reschedules (the manage page) aren't new bookings.
    const [firstName, ...rest] = str(b.name).trim().split(/\s+/);
    await sendMetaEvent({
      eventName: "Schedule",
      eventId: `booking-${r.bookingId}`,
      email: str(b.email),
      phone: str(b.phone) || null,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      contentName: `booking:${cal.slug}`,
      ...browserContext(request),
    });
  }
  if (r.ok && charge && connection) {
    // The booking is charged (and kept) in its calendar's currency (task 1520).
    const currency = toCurrency((cal as { currency?: string }).currency, await homeCurrency(cal.master_plan_id));
    await createServerClient().from("bookings").update({ currency, ...(taxPlace ? { tax_province: taxPlace } : {}) }).eq("id", r.bookingId);
    try {
      const pay = await bookingCheckout(connection, {
        bookingId: r.bookingId, planId: cal.master_plan_id, slug: cal.slug, calName: cal.name, startISO: str(b.start),
        tz: str(b.timezone) || "America/Denver", email: str(b.email).trim().toLowerCase(), token: r.manageToken, cents: charge.cents, deposit: charge.kind === "deposit", currency, taxPlace,
      });
      return NextResponse.json({ ok: true, pay, manage: `/book/manage/${r.manageToken}` });
    } catch (e) {
      console.error("booking checkout:", e instanceof Error ? e.message : e);
      await releaseHold(r.bookingId);
      return NextResponse.json({ error: "Payment couldn't be started. Please try again in a moment." }, { status: 409 });
    }
  }
  return r.ok ? NextResponse.json({ ok: true, manage: `/book/manage/${r.manageToken}` }) : NextResponse.json({ error: r.error }, { status: 409 });
}
