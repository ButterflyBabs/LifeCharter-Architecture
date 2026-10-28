import { createHash, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { logEvent, upsertContact } from "@/lib/crm";
import { enrolContact } from "@/lib/sequences/engine";
import { joinProgram } from "@/lib/programs";
import { platformLabel, productTag, readEvent, type BridgeEvent, type Platform } from "@/lib/bridge";
import { formatMoney, isCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

// The bridge (task 1152 part 2), the server side: one sale, refund or cancellation from another platform, posted
// into the account exactly once. What happens per product is set on the Bridge page (tags, income, a campaign, a
// Suite course); a product seen for the first time is added there so the owner can set it up.

type Db = ReturnType<typeof createServerClient>;
export interface Connection { id: string; master_plan_id: string; platform: Platform; signing_key: string | null; active: boolean }

/** Payhip signs each message with sha256 of the seller's API key; checked only when the owner saved their key. */
export function signatureOk(c: Connection, body: Record<string, unknown>): boolean {
  if (c.platform !== "payhip" || !c.signing_key) return true;
  const sig = typeof body.signature === "string" ? body.signature : "";
  const want = createHash("sha256").update(c.signing_key).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The sale's currency when the platform says (top level or one level down, e.g. data.currency); else the account's home currency. */
function eventCurrency(raw: Record<string, unknown>, home: Currency): Currency {
  const seen = [raw.currency, ...Object.values(raw).map((v) => (v && typeof v === "object" ? (v as Record<string, unknown>).currency : undefined))];
  const c = seen.find((v) => isCurrency(v));
  return c ? toCurrency(c, home) : home;
}

export async function handleBridge(db: Db, c: Connection, raw: Record<string, unknown>): Promise<string> {
  const ev: BridgeEvent = readEvent(c.platform, raw);
  if (ev.kind === "ignore") return "ignored";
  if (!ev.email) return "no email";
  const planId = c.master_plan_id;
  const externalId = ev.externalId || `${ev.email}:${ev.products.map((p) => p.key).join(",")}:${new Date().toISOString().slice(0, 13)}`;
  const label = platformLabel(c.platform);
  const names = ev.products.map((p) => p.name).join(" + ") || `${label} purchase`;

  // Once per message: platforms retry until they hear back.
  const { error: dup } = await db.from("bridge_events").insert({ master_plan_id: planId, connection_id: c.id, platform: c.platform, kind: ev.kind, external_id: externalId, email: ev.email, product_key: ev.products[0]?.key ?? null, product_name: names.slice(0, 300), amount: ev.amountCents / 100 });
  if (dup) return dup.code === "23505" ? "already handled" : `log failed: ${dup.message}`;
  await db.from("bridge_connections").update({ last_event_at: new Date().toISOString() }).eq("id", c.id);

  // Each product's rules (a product seen for the first time gets a row with the defaults).
  const rules = [] as { product_key: string; product_name: string | null; tags: string[]; record_income: boolean; sequence_key: string | null; program_id: string | null }[];
  for (const p of ev.products) {
    if (!p.key) continue;
    await db.from("bridge_products").upsert({ master_plan_id: planId, platform: c.platform, product_key: p.key.slice(0, 200), product_name: p.name.slice(0, 200) }, { onConflict: "master_plan_id,platform,product_key", ignoreDuplicates: true });
    const { data } = await db.from("bridge_products").select("product_key, product_name, tags, record_income, sequence_key, program_id").eq("master_plan_id", planId).eq("platform", c.platform).eq("product_key", p.key.slice(0, 200)).maybeSingle();
    if (data) rules.push(data as (typeof rules)[number]);
  }

  const tags = ev.kind === "refund"
    ? ev.products.map((p) => `refunded-${productTag(p.name).replace(/^bought-/, "")}`)
    : ev.kind === "cancel"
      ? ev.products.map((p) => `cancelled-${productTag(p.name).replace(/^bought-/, "")}`)
      : ["customer", `from-${c.platform}`, ...ev.products.map((p) => productTag(p.name)), ...rules.flatMap((r) => r.tags ?? [])];
  const contact = await upsertContact({ masterPlanId: planId, email: ev.email, firstName: ev.firstName || null, lastName: ev.lastName || null, source: `bridge:${c.platform}`, tags: Array.from(new Set(tags)) }, db);
  if (!contact) return "bad email";
  await db.from("bridge_events").update({ contact_id: contact.id }).eq("master_plan_id", planId).eq("platform", c.platform).eq("kind", ev.kind).eq("external_id", externalId);
  const home = await homeCurrency(planId, db);
  const currency = eventCurrency(raw, home);
  const money = formatMoney(ev.amountCents / 100, currency, { home, cents: true });
  const ref = `bridge:${c.platform}:${externalId}`;

  if (ev.kind === "refund") {
    await logEvent(planId, contact.id, "purchase", `Refunded on ${label}: ${names}${ev.amountCents ? ` (${money})` : ""}`, { bridge: externalId }, db).catch(() => null);
    // Take the sale back out of income (it was recorded under the order's id).
    await db.from("finance_entries").delete().eq("master_plan_id", planId).eq("source", `bridge:${c.platform}`).eq("external_id", externalId);
    // A refunded buyer leaves the Suite course this product gave them.
    const progIds = rules.map((r) => r.program_id).filter(Boolean) as string[];
    if (progIds.length) await db.from("program_members").update({ status: "removed", ended_at: new Date().toISOString(), end_reason: `refunded on ${label}` }).in("program_id", progIds).eq("contact_id", contact.id).eq("status", "active");
    return "refund recorded";
  }
  if (ev.kind === "cancel") {
    await logEvent(planId, contact.id, "purchase", `Cancelled on ${label}: ${names}`, { bridge: externalId }, db).catch(() => null);
    // A membership in the Suite that this product gave them ends too.
    const progIds = rules.map((r) => r.program_id).filter(Boolean) as string[];
    if (progIds.length) {
      const { data: ms } = await db.from("programs").select("id").in("id", progIds).eq("master_plan_id", planId).eq("kind", "membership");
      const ids = ((ms ?? []) as { id: string }[]).map((m) => m.id);
      if (ids.length) await db.from("program_members").update({ status: "removed", ended_at: new Date().toISOString(), end_reason: `cancelled on ${label}` }).in("program_id", ids).eq("contact_id", contact.id).eq("status", "active");
    }
    return "cancel recorded";
  }

  // A sale (or an enrollment): timeline, income, campaign, course.
  await logEvent(planId, contact.id, "purchase", `${ev.kind === "enroll" ? "Enrolled" : "Bought"} on ${label}: ${names}${ev.kind === "sale" && ev.amountCents ? ` (${money})` : ""}`, { bridge: ref }, db).catch(() => null);
  if (ev.kind === "sale" && ev.amountCents > 0 && (rules.length === 0 || rules.some((r) => r.record_income))) {
    await db.from("finance_entries").insert({ master_plan_id: planId, type: "income", amount: ev.amountCents / 100, category: "Course sales", description: `${label}: ${names}`.slice(0, 300), occurred_on: new Date().toISOString().slice(0, 10), source: `bridge:${c.platform}`, external_id: externalId, currency });
  }
  for (const r of rules) {
    if (r.sequence_key) await enrolContact({ masterPlanId: planId, sequenceKey: r.sequence_key, email: ev.email, firstName: ev.firstName || null, lastName: ev.lastName || null, source: "bridge", sourceRef: ref }).catch((e) => console.error("bridge enrol:", e));
    if (r.program_id) await joinProgram(db, planId, r.program_id, contact.id, `bridge:${c.platform}`, true).catch((e) => console.error("bridge program:", e));
  }
  return ev.kind === "enroll" ? "enrollment recorded" : "sale recorded";
}
