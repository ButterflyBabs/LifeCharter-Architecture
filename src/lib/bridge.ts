// The bridge (task 1152 part 2): sales from another course platform come into the Suite while a client moves their
// courses over. Pure parts: reading each platform's message into one shape. Formats differ by platform and change
// over time, so each reader looks in the documented places first and then anywhere for an email address.

export type Platform = "payhip" | "kajabi" | "teachable" | "thinkific" | "zapier";
export const PLATFORMS: { key: Platform; label: string; how: string }[] = [
  { key: "payhip", label: "Payhip", how: "In Payhip: Settings › Developer › Webhooks. Paste your address and tick paid, refunded, subscription created and subscription deleted. Optional: paste your Payhip API key below so the Suite can check each message is really from Payhip." },
  { key: "kajabi", label: "Kajabi", how: "In Kajabi (Growth or Pro plan): open the offer › Automations, or Settings › Webhooks, and add an outbound webhook for Purchase with your address. Repeat for each offer you want to bring over." },
  { key: "teachable", label: "Teachable", how: "In Teachable (Growth plan or higher): Settings › Webhooks › New webhook. Paste your address and choose Sale created, Enrollment created and Sale refunded (if offered)." },
  { key: "thinkific", label: "Thinkific", how: "In Thinkific: Settings › Code & analytics › Webhooks › New webhook. Add your address for Order created and Enrollment created." },
  { key: "zapier", label: "Zapier or Make (any platform)", how: "In Zapier or Make: when a sale happens on your platform, add a Webhooks step that POSTs JSON to your address with: email, first_name, last_name, product, product_id, amount (in dollars), id (the order number) and event (purchase, refund or cancel)." },
];
export const platformLabel = (p: string) => PLATFORMS.find((x) => x.key === p)?.label ?? p;

export interface BridgeEvent {
  kind: "sale" | "enroll" | "refund" | "cancel" | "ignore";
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  products: { key: string; name: string }[];
  amountCents: number;
}

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The first email-looking value anywhere in the message (a last resort). */
export function findEmail(v: unknown, depth = 0): string {
  if (depth > 5) return "";
  if (typeof v === "string") return EMAIL.test(v.trim()) ? v.trim().toLowerCase() : "";
  if (Array.isArray(v)) {
    for (const x of v) {
      const e = findEmail(x, depth + 1);
      if (e) return e;
    }
    return "";
  }
  if (v && typeof v === "object") {
    const ob = v as Obj;
    for (const k of ["email", "member_email", "user_email", "customer_email", "buyer_email"]) if (typeof ob[k] === "string" && EMAIL.test(String(ob[k]).trim())) return String(ob[k]).trim().toLowerCase();
    for (const x of Object.values(ob)) {
      const e = findEmail(x, depth + 1);
      if (e) return e;
    }
  }
  return "";
}

const splitName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return { first: first || "", last: rest.join(" ") };
};
const cents = (v: unknown, dollars = false) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(dollars ? n * 100 : n);
};

export function readEvent(platform: Platform, raw: unknown): BridgeEvent {
  const b = o(raw);
  const none: BridgeEvent = { kind: "ignore", externalId: "", email: "", firstName: "", lastName: "", products: [], amountCents: 0 };

  if (platform === "payhip") {
    const t = s(b.type);
    const kind = t === "paid" ? "sale" : t === "refunded" ? "refund" : t === "subscription.deleted" ? "cancel" : t === "subscription.created" ? "enroll" : "ignore";
    const items = (Array.isArray(b.items) ? b.items : []).map(o);
    const products = items.length ? items.map((i) => ({ key: s(i.product_key) || s(i.product_id) || s(i.product_name), name: s(i.product_name) || s(i.product_key) })) : s(b.product_name) || s(b.product_key) ? [{ key: s(b.product_key) || s(b.product_name), name: s(b.product_name) || s(b.product_key) }] : [];
    const n = splitName(s(b.customer_name) || s(b.name));
    return { kind, externalId: s(b.id) || s(b.subscription_id), email: findEmail(b), firstName: s(b.first_name) || n.first, lastName: s(b.last_name) || n.last, products, amountCents: kind === "refund" ? cents(b.amount_refunded) || cents(b.price) : cents(b.price) };
  }

  if (platform === "kajabi") {
    const p = Object.keys(o(b.payload)).length ? o(b.payload) : b;
    const member = o(p.member ?? p.contact ?? p.customer);
    const offer = o(p.offer);
    const ev = s(b.event || b.type || p.event).toLowerCase();
    const kind = /refund/.test(ev) ? "refund" : /cancel|deactivat|revok/.test(ev) ? "cancel" : "sale";
    const name = s(member.name) || [s(member.first_name), s(member.last_name)].filter(Boolean).join(" ");
    const n = splitName(name);
    const key = s(p.offer_id) || s(offer.id) || s(p.offer_title) || s(offer.title);
    const title = s(p.offer_title) || s(offer.title) || s(offer.name) || key;
    return { kind, externalId: s(p.payment_transaction_id) || s(p.transaction_id) || s(p.id) || s(b.id), email: findEmail(member) || findEmail(p), firstName: s(member.first_name) || n.first, lastName: s(member.last_name) || n.last, products: key ? [{ key, name: title }] : [], amountCents: cents(p.amount_in_cents) || cents(p.amount, true) };
  }

  if (platform === "teachable") {
    const t = s(b.type).toLowerCase();
    const ob = o(b.object);
    const user = o(ob.user);
    const prod = o(ob.product ?? ob.course ?? ob.pricing_plan);
    const kind = /refund/.test(t) ? "refund" : /sale/.test(t) ? "sale" : /enroll/.test(t) ? "enroll" : /cancel|unenroll/.test(t) ? "cancel" : "ignore";
    const n = splitName(s(user.name));
    const key = s(prod.id) || s(prod.name);
    return { kind, externalId: s(ob.id) || s(b.id), email: findEmail(user) || findEmail(ob), firstName: n.first, lastName: n.last, products: key ? [{ key, name: s(prod.name) || key }] : [], amountCents: cents(ob.final_price) || cents(ob.price) };
  }

  if (platform === "thinkific") {
    const resource = s(b.resource).toLowerCase();
    const action = s(b.action).toLowerCase();
    const p = o(b.payload);
    const user = o(p.user);
    const items = (Array.isArray(p.items) ? p.items : []).map(o);
    const course = o(p.course);
    const products = items.length
      ? items.map((i) => ({ key: s(i.product_id) || s(i.product_name), name: s(i.product_name) || s(i.product_id) }))
      : s(p.product_id) || s(p.product_name) || s(course.id)
        ? [{ key: s(p.product_id) || s(course.id) || s(p.product_name), name: s(p.product_name) || s(course.name) || s(p.product_id) }]
        : [];
    const kind = resource === "order" && action === "created" ? "sale" : resource === "enrollment" && action === "created" ? "enroll" : /refund/.test(action) ? "refund" : "ignore";
    return { kind, externalId: s(p.id) || s(b.id), email: findEmail(user) || s(p.user_email).toLowerCase() || findEmail(p), firstName: s(user.first_name), lastName: s(user.last_name), products, amountCents: cents(p.amount_cents) || cents(p.amount_dollars, true) };
  }

  if (platform === "zapier") {
    const ev = s(b.event || b.type || "purchase").toLowerCase();
    const kind = /refund/.test(ev) ? "refund" : /cancel/.test(ev) ? "cancel" : /enrol/.test(ev) ? "enroll" : "sale";
    const key = s(b.product_id) || s(b.product);
    const n = splitName(s(b.name));
    return { kind, externalId: s(b.id) || s(b.order_id) || `${findEmail(b)}:${key}:${s(b.date)}`, email: findEmail(b), firstName: s(b.first_name) || n.first, lastName: s(b.last_name) || n.last, products: key ? [{ key, name: s(b.product) || key }] : [], amountCents: cents(b.amount, true) };
  }
  return none;
}

/** The tag for a product bought on another platform: bought-<product name>. */
export const productTag = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return slug ? `bought-${slug}` : "customer";
};
