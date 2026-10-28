// Offers & Packages: shared labels and shaping (page, API, Executive Home).
import { formatMoney as formatMoneyIn, isCurrency, toCurrency, type Currency } from "@/lib/currency";

export const OFFER_FORMATS = [
  { id: "one_to_one", label: "1:1" },
  { id: "group", label: "Group" },
  { id: "course", label: "Course / program" },
  { id: "done_for_you", label: "Done for you" },
  { id: "retainer", label: "Retainer" },
  { id: "product", label: "Product / package" },
  { id: "hybrid", label: "Hybrid" },
  { id: "other", label: "Other" },
] as const;
export const OFFER_BILLING = [
  { id: "one_time", label: "One-time" },
  { id: "monthly", label: "Monthly" },
  { id: "payment_plan", label: "Payment plan" },
] as const;
export const OFFER_STATUSES = [
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "retired", label: "Retired" },
] as const;

export type Offer = {
  id: string;
  businessId: number | null;
  name: string;
  format: string;
  price: number | null;
  /** The currency the price is in (task 1520); never added to offers in the other currency. */
  currency: Currency;
  billing: string;
  paymentCount: number | null;
  deliverables: string[];
  transformation: string;
  idealClient: string;
  notFor: string;
  guarantee: string;
  duration: string;
  capacity: number | null;
  link: string;
  status: string;
  sortOrder: number;
};

export const OFFER_COLUMNS =
  "id, business_id, name, format, price, currency, billing, payment_count, deliverables, transformation, ideal_client, not_for, guarantee, duration, capacity, link, status, sort_order";

export function shapeOffer(r: Record<string, unknown>): Offer {
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  return {
    id: r.id as string,
    businessId: (r.business_id as number | null) ?? null,
    name: (r.name as string) || "",
    format: (r.format as string) || "one_to_one",
    price: num(r.price),
    currency: toCurrency(r.currency),
    billing: (r.billing as string) || "one_time",
    paymentCount: num(r.payment_count),
    deliverables: ((r.deliverables as string[] | null) ?? []).filter(Boolean),
    transformation: (r.transformation as string) || "",
    idealClient: (r.ideal_client as string) || "",
    notFor: (r.not_for as string) || "",
    guarantee: (r.guarantee as string) || "",
    duration: (r.duration as string) || "",
    capacity: num(r.capacity),
    link: (r.link as string) || "",
    status: (r.status as string) || "active",
    sortOrder: Number(r.sort_order ?? 0),
  };
}

// Validates a client-sent offer into database columns. Returns an error message or the row.
// currency is only written when posted (a new offer gets the account's home currency from the route).
export function offerRow(b: Record<string, unknown>): { error: string } | { row: Record<string, unknown> } {
  const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const numOrNull = (v: unknown, min: number, max: number) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
  };
  const name = str(b.name, 160);
  if (!name) return { error: "Give the offer a name." };
  const format = OFFER_FORMATS.some((f) => f.id === b.format) ? b.format : "one_to_one";
  const billing = OFFER_BILLING.some((f) => f.id === b.billing) ? b.billing : "one_time";
  const status = OFFER_STATUSES.some((f) => f.id === b.status) ? b.status : "active";
  const price = numOrNull(b.price, 0, 100_000_000);
  if (price === undefined) return { error: "Price must be a number." };
  const paymentCount = numOrNull(b.paymentCount, 1, 60);
  if (paymentCount === undefined) return { error: "Number of payments must be between 1 and 60." };
  const capacity = numOrNull(b.capacity, 0, 1_000_000);
  if (capacity === undefined) return { error: "Spots available must be a number." };
  const businessId = numOrNull(b.businessId, 1, Number.MAX_SAFE_INTEGER);
  const deliverables = Array.isArray(b.deliverables) ? b.deliverables.map((d) => str(d, 300)).filter(Boolean).slice(0, 40) : [];
  const link = str(b.link, 500);
  if (b.currency !== undefined && b.currency !== null && b.currency !== "" && !isCurrency(b.currency)) return { error: "Currency must be USD or CAD." };
  return {
    row: {
      ...(isCurrency(b.currency) ? { currency: toCurrency(b.currency) } : {}),
      name,
      format,
      billing,
      status,
      price,
      payment_count: billing === "payment_plan" ? paymentCount : null,
      capacity,
      business_id: businessId ?? null,
      deliverables,
      transformation: str(b.transformation),
      ideal_client: str(b.idealClient),
      not_for: str(b.notFor),
      guarantee: str(b.guarantee, 600),
      duration: str(b.duration, 160),
      link: link && !/^https?:\/\//i.test(link) ? `https://${link}` : link,
      updated_at: new Date().toISOString(),
    },
  };
}

// Whole dollars by default; cents: true shows cents only when there are some. Wraps the shared formatter (task 1520).
export function formatMoney(n: number | null | undefined, opts: { cents?: boolean; currency?: Currency | string; home?: Currency } = {}) {
  return formatMoneyIn(n, opts.currency ?? "usd", { home: opts.home, cents: opts.cents ? undefined : false });
}

export function offerPriceLabel(o: Pick<Offer, "price" | "billing" | "paymentCount"> & { currency?: Currency | string }, home?: Currency) {
  if (o.price === null) return "No price yet";
  const m = (n: number, cents?: boolean) => formatMoney(n, { cents, currency: o.currency ?? "usd", home });
  if (o.billing === "monthly") return `${m(o.price)}/month`;
  if (o.billing === "payment_plan" && o.paymentCount) return `${m(o.price)} (${o.paymentCount} payments of ${m(o.price / o.paymentCount, true)})`;
  return m(o.price);
}
