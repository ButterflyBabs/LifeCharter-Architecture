import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { EMAIL_RE, logEvent, upsertContact } from "@/lib/crm";
import { housePlanId } from "@/lib/housePlan";
import { renderStep } from "@/lib/sequences/render";
import { sendRendered } from "@/lib/sequences/engine";

// Free planner giveaway (amilynnecarroll.com/planners). Anyone can claim ONE
// planner per email address: the Suite makes them a single-use 100%-off Payhip
// code for the planner they chose and emails it. Asking again with the same
// email re-sends the same code (at most every 10 minutes) instead of a new one.

type Db = ReturnType<typeof createServerClient>;

export const GIVEAWAY_PLANNERS: Record<string, { title: string; payhip: string; brand: string }> = {
  life: { title: "LifeCharter Life Planner 2027", payhip: "jHdTl", brand: "LifeCharter" },
  business: { title: "Command Suite Business Planner 2027", payhip: "l6yLY", brand: "LifeCharter Command Suite" },
  whole: { title: "LifeCharter Whole Life Planner 2027", payhip: "yVbM5", brand: "The LifeCharter Collective" },
  "everyday-soft": { title: "Open Possibilities Everyday Planner 2027 · Soft Neutral", payhip: "DOC31", brand: "Open Possibilities" },
  "everyday-bright": { title: "Open Possibilities Everyday Planner 2027 · Bright & Cheerful", payhip: "xtPEf", brand: "Open Possibilities" },
  "everyday-coastal": { title: "Open Possibilities Everyday Planner 2027 · Calm Coastal", payhip: "RhsbB", brand: "Open Possibilities" },
};

const SENDER = { from_name: "AmiLynne Carroll", from_email: "hello@lifecharter.life", reply_to: "support@amilynnecarroll.com" };
const RESEND_GAP_MS = 10 * 60_000;

const newCode = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/l
  return "GIFT-" + Array.from(randomBytes(8), (b) => abc[b % abc.length]).join("");
};

async function createPayhipCoupon(code: string, productKey: string, email: string) {
  const key = process.env.PAYHIP_API_KEY;
  if (!key) throw new Error("PAYHIP_API_KEY not set");
  const res = await fetch("https://payhip.com/api/v2/coupons", {
    method: "POST",
    headers: { "payhip-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ code, coupon_type: "single", product_key: productKey, percent_off: 100, usage_limit: 1, notes: `Free planner giveaway: ${email}` }),
  });
  if (!res.ok) throw new Error(`Payhip ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function sendCode(contact: { id: string; first_name: string | null }, email: string, plannerKey: string, code: string) {
  const p = GIVEAWAY_PLANNERS[plannerKey];
  const url = `https://payhip.com/b/${p.payhip}`;
  const mail = renderStep({
    brand: p.brand,
    subject: `Your free ${p.title}`,
    preview: `Your personal code: ${code}`,
    body: `{{greeting}}

Your free copy of the **${p.title}** is ready. Here is your personal code. It makes the planner free and works once:

## ${code}

1. Open your planner: ${url}
2. Click **Buy now**.
3. Enter your code in the coupon box and finish checkout. Your total will be $0.00, and Payhip emails you the download straight away.

You get all four editions (dated 2027 or undated, Monday or Sunday start) plus the matching sticker pack. Open the PDF in GoodNotes, Notability or any PDF app, and start with the Getting Started page.`,
    buttonLabel: "Get my free planner",
    buttonUrl: url,
    contact,
  });
  return sendRendered(SENDER, email, contact.id, mail);
}

export type ClaimResult = { ok: true; message: string } | { ok: false; error: string; status: number };

export async function claimFreePlanner(raw: Record<string, unknown>, pageUrl: string | null, db: Db = createServerClient()): Promise<ClaimResult> {
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim().slice(0, 200) : "");
  const email = str("email").toLowerCase();
  const plannerKey = str("planner");
  const name = str("name");
  if (!name) return { ok: false, error: "Please add your first name.", status: 400 };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address.", status: 400 };
  if (!GIVEAWAY_PLANNERS[plannerKey]) return { ok: false, error: "Please choose a planner.", status: 400 };

  const planId = await housePlanId(db);
  if (!planId) return { ok: false, error: "Something went wrong. Please try again in a minute.", status: 500 };
  const [first, ...rest] = name.split(/\s+/);
  const contact = await upsertContact(
    { masterPlanId: planId, email, firstName: first, lastName: rest.join(" ") || null, timezone: str("_tz") || null, source: "form:free-planner", tags: ["free-planner"] },
    db
  );
  if (!contact) return { ok: false, error: "Please enter a valid email address.", status: 400 };
  const person = { id: contact.id, first_name: first };

  // One planner per email: the unique (plan, email) row is the lock.
  const { data: claim, error: insErr } = await db
    .from("planner_giveaway_claims")
    .insert({ master_plan_id: planId, contact_id: contact.id, email, planner: plannerKey })
    .select("id")
    .maybeSingle();

  if (!claim) {
    if (insErr && insErr.code !== "23505") {
      console.error("giveaway claim:", insErr);
      return { ok: false, error: "Something went wrong. Please try again in a minute.", status: 500 };
    }
    const { data: prior } = await db.from("planner_giveaway_claims").select("id, planner, coupon_code, last_sent_at").eq("master_plan_id", planId).eq("email", email).maybeSingle();
    const title = prior ? GIVEAWAY_PLANNERS[prior.planner as string]?.title ?? "free planner" : "free planner";
    if (prior?.coupon_code && (!prior.last_sent_at || Date.now() - new Date(prior.last_sent_at as string).getTime() > RESEND_GAP_MS)) {
      const sent = await sendCode(person, email, prior.planner as string, prior.coupon_code as string);
      if (sent.ok) await db.from("planner_giveaway_claims").update({ last_sent_at: new Date().toISOString() }).eq("id", prior.id);
    }
    return { ok: true, message: `This email has already claimed its free planner (the ${title}). We've sent your code again, so check your inbox.` };
  }

  const code = newCode();
  try {
    await createPayhipCoupon(code, GIVEAWAY_PLANNERS[plannerKey].payhip, email);
  } catch (e) {
    console.error("giveaway coupon:", e);
    await db.from("planner_giveaway_claims").delete().eq("id", claim.id); // let them try again
    return { ok: false, error: "We couldn't create your code just now. Please try again in a few minutes.", status: 502 };
  }
  const sent = await sendCode(person, email, plannerKey, code);
  await db.from("planner_giveaway_claims").update({ coupon_code: code, last_sent_at: sent.ok ? new Date().toISOString() : null }).eq("id", claim.id);
  if (!sent.ok) console.error("giveaway email:", sent.error);

  const title = GIVEAWAY_PLANNERS[plannerKey].title;
  await upsertContact({ masterPlanId: planId, email, tags: [`free-planner-${plannerKey}`], source: "form:free-planner" }, db);
  await logEvent(planId, contact.id, "form", `Claimed free planner: ${title}`, { planner: plannerKey, code, page: pageUrl, emailed: sent.ok }, db);
  return { ok: true, message: `Your free ${title} is on its way. Check your inbox for your personal code (and your spam folder, just in case).` };
}
