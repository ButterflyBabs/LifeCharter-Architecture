import type { ActionTool } from "./types";
import { OFFER_BILLING, OFFER_FORMATS, OFFER_STATUSES, offerPriceLabel, offerRow, shapeOffer, OFFER_COLUMNS } from "@/lib/sales/offers";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const ids = <T extends readonly { id: string }[]>(a: T) => a.map((x) => x.id);

const OFFER_PROPS = {
  name: { type: "string" },
  price: { type: "number", description: "US dollars" },
  billing: { type: "string", enum: ids(OFFER_BILLING), description: "one_time, monthly or payment_plan" },
  payment_count: { type: "number", description: "Number of payments when billing is payment_plan." },
  format: { type: "string", enum: ids(OFFER_FORMATS) },
  status: { type: "string", enum: ids(OFFER_STATUSES) },
  included: { type: "array", items: { type: "string" }, description: "What is included, one item per entry." },
  transformation: { type: "string" },
  ideal_client: { type: "string" },
  duration: { type: "string" },
  link: { type: "string", description: "Sales page or checkout link." },
};

function toBody(args: Record<string, unknown>) {
  return {
    name: args.name,
    price: args.price,
    billing: args.billing,
    paymentCount: args.payment_count,
    format: args.format,
    status: args.status,
    deliverables: args.included,
    transformation: args.transformation,
    idealClient: args.ideal_client,
    duration: args.duration,
    link: args.link,
  } as Record<string, unknown>;
}

export const listOffers: ActionTool = {
  name: "list_offers",
  kind: "read",
  apiPath: "/api/offers",
  description: "List the client's offers and packages with price, billing, format and status.",
  parameters: { type: "object", properties: {} },
  read: async (_args, ctx) => {
    const { data } = await ctx.db.from("sales_offers").select(OFFER_COLUMNS).eq("master_plan_id", ctx.planId).order("sort_order").limit(100);
    const rows = ((data ?? []) as Record<string, unknown>[]).map(shapeOffer);
    if (!rows.length) return "The client has no offers yet.";
    return rows.map((o) => `${o.name} | ${offerPriceLabel(o)} | ${o.format} | ${o.status}`).join("\n");
  },
};

export const createOffer: ActionTool = {
  name: "create_offer",
  kind: "write",
  apiPath: "/api/offers",
  description: "Add an offer or package (name, price, how it is paid, what is included). The client approves first.",
  parameters: { type: "object", properties: OFFER_PROPS, required: ["name"] },
  plan: async (args, ctx) => {
    const v = offerRow(toBody(args));
    if ("error" in v) return { error: v.error };
    const { count } = await ctx.db.from("sales_offers").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.planId);
    if ((count ?? 0) >= 200) return { error: "That's the most offers one account can hold." };
    const r = v.row as Record<string, unknown>;
    return {
      preview: {
        title: `Add the offer "${r.name}"`,
        lines: [
          r.price === null ? "No price yet" : `Price: ${offerPriceLabel({ price: r.price as number, billing: r.billing as string, paymentCount: (r.payment_count as number | null) ?? null })}`,
          `Format: ${r.format}`,
          `Status: ${r.status}`,
          ...((r.deliverables as string[]).slice(0, 5).map((d) => `Includes: ${d}`)),
        ],
      },
    };
  },
  run: async (args, ctx) => {
    const v = offerRow(toBody(args));
    if ("error" in v) throw new Error(v.error);
    const { count } = await ctx.db.from("sales_offers").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.planId);
    const { data, error } = await ctx.db.from("sales_offers").insert({ ...v.row, master_plan_id: ctx.planId, sort_order: count ?? 0 }).select("id, name").single();
    if (error || !data) throw new Error("The offer didn't save.");
    return { summary: `Added the offer "${data.name}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("sales_offers").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the offer.";
  },
};

async function findOne(name: string, ctx: Parameters<NonNullable<ActionTool["plan"]>>[1]) {
  const clean = name.replace(/[%,()]/g, "");
  const { data } = await ctx.db.from("sales_offers").select("*").eq("master_plan_id", ctx.planId).ilike("name", `%${clean}%`).limit(5);
  return (data ?? []) as Record<string, unknown>[];
}

export const updateOffer: ActionTool = {
  name: "update_offer",
  kind: "write",
  apiPath: "/api/offers",
  description: "Change one existing offer: price, billing, status (active, draft or retired), what is included, link and so on. Pick it by part of its name. The client approves first.",
  parameters: { type: "object", properties: { find_name: { type: "string", description: "Part of the offer's current name." }, ...OFFER_PROPS }, required: ["find_name"] },
  plan: async (args, ctx) => {
    const found = await findOne(str(args.find_name, 160), ctx);
    if (!found.length) return { error: "I couldn't find an offer with that name." };
    if (found.length > 1) return { error: `More than one offer matches: ${found.map((f) => `"${f.name}"`).join(", ")}. Which one?` };
    const cur = found[0];
    const lines: string[] = [];
    const body = toBody(args);
    if (body.price !== undefined) lines.push(`Price: ${cur.price ?? "none"} → ${body.price}`);
    if (body.billing) lines.push(`Billing: ${cur.billing} → ${body.billing}`);
    if (body.status) lines.push(`Status: ${cur.status} → ${body.status}`);
    if (body.name && body.name !== cur.name) lines.push(`Name: ${cur.name} → ${body.name}`);
    if (body.deliverables) lines.push(`Includes: ${(body.deliverables as string[]).slice(0, 4).join("; ")}`);
    if (body.link) lines.push(`Link: ${body.link}`);
    if (!lines.length && (body.format || body.transformation || body.idealClient || body.duration || body.paymentCount)) lines.push("Other details updated");
    if (!lines.length) return { error: "What should change on that offer?" };
    return { preview: { title: `Update the offer "${cur.name}"`, lines } };
  },
  run: async (args, ctx) => {
    const found = await findOne(str(args.find_name, 160), ctx);
    if (found.length !== 1) throw new Error("I couldn't pin down which offer to change.");
    const cur = found[0];
    const b = toBody(args);
    const merged = {
      name: b.name ?? cur.name,
      price: b.price !== undefined ? b.price : cur.price,
      billing: b.billing ?? cur.billing,
      paymentCount: b.paymentCount ?? cur.payment_count,
      format: b.format ?? cur.format,
      status: b.status ?? cur.status,
      capacity: cur.capacity,
      businessId: cur.business_id,
      deliverables: b.deliverables ?? cur.deliverables,
      transformation: b.transformation ?? cur.transformation,
      idealClient: b.idealClient ?? cur.ideal_client,
      notFor: cur.not_for,
      guarantee: cur.guarantee,
      duration: b.duration ?? cur.duration,
      link: b.link ?? cur.link,
    } as Record<string, unknown>;
    const v = offerRow(merged);
    if ("error" in v) throw new Error(v.error);
    const before: Record<string, unknown> = { ...cur };
    const { error } = await ctx.db.from("sales_offers").update(v.row).eq("id", cur.id as string).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("The change didn't save.");
    return { summary: `Updated the offer "${merged.name}".`, undo: { id: cur.id, before } };
  },
  undo: async (u, ctx) => {
    const before = (u.before ?? {}) as Record<string, unknown>;
    const { id: _id, master_plan_id: _m, created_at: _c, ...rest } = before;
    void _id; void _m; void _c;
    await ctx.db.from("sales_offers").update(rest).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Put the offer back as it was.";
  },
};

export const OFFER_TOOLS: ActionTool[] = [listOffers, createOffer, updateOffer];
