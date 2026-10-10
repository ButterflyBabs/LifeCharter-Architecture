import { createServerClient } from "@/lib/supabase/server";
import { upsertContact } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { slugCode, uniqueCode } from "@/lib/affiliates";

type Db = ReturnType<typeof createServerClient>;

// Every new client gets a ready affiliate page: one tracked link per LifeCharter product, so they can share any
// of them from day one. Their commission rate is left blank (the account default applies once Babs sets it).
// Idempotent: a client who already has an affiliate record is left alone.
export const STARTER_PRODUCTS: { product: string; short: string; landing: string }[] = [
  { product: "MasterClass + Command Suite", short: "masterclass", landing: "https://lccommandsuite.com/masterclass-signup" },
  { product: "LifeCharter Incubator", short: "incubator", landing: "https://www.amilynnecarroll.com/lifecharterincubator" },
  { product: "The Life Shift (21-Day Challenge)", short: "lifeshift", landing: "https://www.amilynnecarroll.com/21-day-challenge" },
  { product: "SOUL Sessions", short: "soul", landing: "https://www.amilynnecarroll.com/soul-sessions" },
  { product: "LifeCharter Program", short: "program", landing: "https://www.amilynnecarroll.com/life-charter" },
  { product: "Digital Planners", short: "planners", landing: "https://www.amilynnecarroll.com/planners" },
  { product: "Coaching Certification", short: "certification", landing: "https://coaching-certification-portal.vercel.app/" },
];

export async function ensureClientAffiliate(input: { email: string; name?: string | null }, db: Db = createServerClient()): Promise<{ created: boolean; links: number } | null> {
  try {
    const house = await ownerMasterPlanId();
    const email = input.email.trim().toLowerCase();
    if (!house || !email) return null;
    const name = (input.name || "").trim() || email.split("@")[0];
    const { data: have } = await db.from("affiliates").select("id").eq("master_plan_id", house).eq("email", email).maybeSingle();
    if (have) return { created: false, links: 0 };

    const [first, ...rest] = name.split(/\s+/);
    const contact = await upsertContact({ masterPlanId: house, email, firstName: first || null, lastName: rest.join(" ") || null, source: "affiliate", tags: ["affiliate"] }, db);
    const code = await uniqueCode(db, slugCode(first || name) || "client");
    const { data: aff, error } = await db
      .from("affiliates")
      .insert({ master_plan_id: house, contact_id: contact?.id ?? null, name, email, code, payout_delay_days: 30, notes: "Created automatically with the client's account." })
      .select("id, code")
      .single();
    if (error || !aff) return null;
    let links = 0;
    for (const p of STARTER_PRODUCTS) {
      const linkCode = await uniqueCode(db, `${aff.code}-${p.short}`);
      const { error: e } = await db.from("affiliate_links").insert({ affiliate_id: aff.id, master_plan_id: house, product: p.product, code: linkCode, landing_url: p.landing, commission_on: "all" });
      if (!e) links++;
    }
    return { created: true, links };
  } catch (e) {
    console.error("ensureClientAffiliate:", e);
    return null;
  }
}
