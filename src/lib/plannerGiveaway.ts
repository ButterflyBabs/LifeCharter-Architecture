import { createHash, randomBytes, timingSafeEqual } from "crypto";
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

// "Free for a limited time": the offer closes at the end of December 31, 2026 (Denver time).
export const GIVEAWAY_ENDS = new Date("2027-01-01T07:00:00Z");
export const giveawayOpen = (now = new Date()) => now < GIVEAWAY_ENDS;

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
    headers: { "payhip-api-key": key }, // Payhip wants form fields, not JSON
    body: new URLSearchParams({ code, coupon_type: "single", product_key: productKey, percent_off: "100", usage_limit: "1", notes: `Free planner giveaway: ${email}` }),
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
  if (!giveawayOpen()) return { ok: false, error: "The free planner offer ended on December 31, 2026. You can still get any planner at https://www.amilynnecarroll.com/planners", status: 410 };
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
    let resent = false;
    if (prior?.coupon_code && (!prior.last_sent_at || Date.now() - new Date(prior.last_sent_at as string).getTime() > RESEND_GAP_MS)) {
      const sent = await sendCode(person, email, prior.planner as string, prior.coupon_code as string);
      if (sent.ok) await db.from("planner_giveaway_claims").update({ last_sent_at: new Date().toISOString() }).eq("id", prior.id);
      resent = sent.ok;
    }
    return {
      ok: true,
      message: `This email has already claimed its free planner (the ${title}). ${resent ? "We've sent your code again, so check your inbox." : "Your code was emailed a few minutes ago, so check your inbox and spam folder."}`,
    };
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

// ── Payhip orders → the Suite ────────────────────────────────────────────────
// Every Payhip order (paid, or $0 with a giveaway code) lands on the buyer's
// contact: tags, a Purchases entry and a timeline note. A free code that gets
// used marks the giveaway claim as redeemed.

const PRODUCT_TAGS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(GIVEAWAY_PLANNERS).map(([k, p]) => [p.payhip, `planner-${k}`])),
  xH5Ov: "planner-trio",
  "8SyEl": "planner-everyday-all",
};

interface PayhipItem { product_key?: string; product_name?: string; used_coupon?: boolean }

function signatureOk(sig: unknown) {
  const key = process.env.PAYHIP_API_KEY;
  if (!key || typeof sig !== "string") return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(createHash("sha256").update(key).digest("hex"));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function recordPayhipEvent(ev: Record<string, unknown>, db: Db = createServerClient()): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!signatureOk(ev.signature)) return { ok: false, error: "Bad signature.", status: 401 };
  const email = typeof ev.email === "string" ? ev.email.trim().toLowerCase() : "";
  const orderId = typeof ev.id === "string" ? ev.id : String(ev.id ?? "");
  if (!EMAIL_RE.test(email) || !orderId) return { ok: false, error: "Missing email or order id.", status: 400 };
  if (ev.type !== "paid" && ev.type !== "refunded") return { ok: true }; // other events: nothing to record
  const planId = await housePlanId(db);
  if (!planId) return { ok: false, error: "No account.", status: 500 };

  const items = (Array.isArray(ev.items) ? ev.items : []) as PayhipItem[];
  const names = items.map((i) => i.product_name || i.product_key || "Payhip product").join(" + ") || "Payhip order";
  const price = typeof ev.price === "number" ? ev.price / 100 : Number(ev.price) / 100 || 0;
  const productTags = items.map((i) => PRODUCT_TAGS[i.product_key ?? ""]).filter(Boolean);
  const contact = await upsertContact(
    { masterPlanId: planId, email, source: "payhip", tags: ["payhip-buyer", ...productTags, ...(ev.type === "refunded" ? ["payhip-refunded"] : [])] },
    db
  );
  if (!contact) return { ok: false, error: "Bad email.", status: 400 };
  const note = `Payhip order ${orderId}`;

  if (ev.type === "refunded") {
    const refunded = Number(ev.amount_refunded) / 100 || price;
    await logEvent(planId, contact.id, "purchase", `Refunded on Payhip: ${names} ($${refunded.toFixed(2)})`, { order: orderId }, db);
    return { ok: true };
  }

  // Payhip retries a webhook until it gets a 200, so an order is only recorded once.
  const { data: seen } = await db.from("contact_records").select("id").eq("master_plan_id", planId).eq("contact_id", contact.id).eq("note", note).limit(1);
  if (seen?.length) return { ok: true };
  await db.from("contact_records").insert({ master_plan_id: planId, contact_id: contact.id, kind: "purchase", title: names.slice(0, 300), amount: price, note });

  const free = price === 0;
  await logEvent(planId, contact.id, "purchase", `${free ? "Downloaded free on Payhip" : `Bought on Payhip ($${price.toFixed(2)})`}: ${names}`, { order: orderId, items: items.map((i) => i.product_key) }, db);

  // A giveaway code was used: mark that claim redeemed.
  if (items.some((i) => i.used_coupon) || free) {
    const keys = items.map((i) => i.product_key);
    const planner = Object.entries(GIVEAWAY_PLANNERS).find(([, p]) => keys.includes(p.payhip))?.[0];
    if (planner) {
      await db.from("planner_giveaway_claims").update({ redeemed_at: new Date().toISOString() }).eq("master_plan_id", planId).eq("email", email).eq("planner", planner).is("redeemed_at", null);
      await upsertContact({ masterPlanId: planId, email, tags: ["free-planner-redeemed"], source: "payhip" }, db);
    }
  }
  return { ok: true };
}
