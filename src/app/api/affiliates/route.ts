import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { EMAIL_RE, upsertContact } from "@/lib/crm";
import { slugCode, uniqueCode, rateFor, recordReferral, payableOn, AFF_LINK_DAYS } from "@/lib/affiliates";

export const dynamic = "force-dynamic";

// Affiliates for the signed-in account only.
// GET            → affiliates (with clicks, leads, sales owed/paid), offers (with commission %), programs (with earnings)
// GET ?id=       → one affiliate: record, per-offer rates, referrals, sales, recent clicks
// POST actions   → affiliate-create | affiliate-update | affiliate-delete | portal-reset |
//                  offer-rate | relationship-rate | sale-add | sale-update | referral-add |
//                  program-save | program-delete | earning-add | earning-update | earning-delete
const money = (n: number) => Math.round(n * 100) / 100;

// Finance: affiliate income you're paid (programs you promote) and commissions you pay
// out (your affiliates) are real money in and out, so they're kept in finance_entries,
// one row per paid item (external_id links them; un-paying removes the row).
async function syncFinance(db: ReturnType<typeof createServerClient>, planId: string, externalId: string, row: { type: "income" | "expense"; amount: number; category: string; description: string; occurredOn: string } | null) {
  await db.from("finance_entries").delete().eq("master_plan_id", planId).eq("external_id", externalId);
  if (row && row.amount > 0)
    await db.from("finance_entries").insert({ master_plan_id: planId, type: row.type, amount: money(row.amount), category: row.category, description: row.description.slice(0, 300), occurred_on: row.occurredOn, source: "affiliate", external_id: externalId });
}

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const { data: aff } = await db.from("affiliates").select("*").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
    if (!aff) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const [{ data: rates }, { data: refs }, { data: sales }, { count: clicks30 }] = await Promise.all([
      db.from("affiliate_offer_rates").select("offer_id, rate").eq("affiliate_id", id),
      db.from("affiliate_referrals").select("id, kind, source, created_at, seq_contacts(id, first_name, last_name, email)").eq("affiliate_id", id).order("created_at", { ascending: false }).limit(200),
      db.from("affiliate_sales").select("*").eq("affiliate_id", id).order("sale_date", { ascending: false }).limit(500),
      db.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", id).gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
    ]);
    const { data: links } = await db.from("affiliate_links").select("*").eq("affiliate_id", id).order("created_at");
    return NextResponse.json({ affiliate: aff, rates: rates ?? [], referrals: refs ?? [], sales: sales ?? [], clicks30: clicks30 ?? 0, links: links ?? [] });
  }

  const [{ data: affs }, { data: offers }, { data: programs }, { data: clicks }, { data: refs }, { data: sales }, { data: earnings }] = await Promise.all([
    db.from("affiliates").select("id, name, email, code, status, default_rate, payout_delay_days, contact_id, portal_token, landing_url, created_at").eq("master_plan_id", a.planId).order("created_at"),
    db.from("sales_offers").select("id, name, price, affiliate_rate, status").eq("master_plan_id", a.planId).order("sort_order"),
    db.from("affiliate_programs").select("*").eq("master_plan_id", a.planId).order("created_at"),
    db.from("affiliate_clicks").select("affiliate_id").eq("master_plan_id", a.planId).limit(20000),
    db.from("affiliate_referrals").select("affiliate_id").eq("master_plan_id", a.planId).limit(20000),
    db.from("affiliate_sales").select("affiliate_id, commission, amount, status").eq("master_plan_id", a.planId).limit(20000),
    db.from("affiliate_program_earnings").select("*").eq("master_plan_id", a.planId).order("earned_on", { ascending: false }),
  ]);
  const { data: allLinks } = await db.from("affiliate_links").select("id, affiliate_id, product, code, status").eq("master_plan_id", a.planId).order("created_at");
  const count = (rows: { affiliate_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.affiliate_id === id).length;
  const list = (affs ?? []).map((f) => {
    const mine = (sales ?? []).filter((s) => s.affiliate_id === f.id && s.status !== "void");
    return {
      ...f,
      links: (allLinks ?? []).filter((l) => l.affiliate_id === f.id),
      clicks: count(clicks as { affiliate_id: string }[], f.id as string),
      referrals: count(refs as { affiliate_id: string }[], f.id as string),
      salesCount: mine.length,
      revenue: money(mine.reduce((t, s) => t + Number(s.amount), 0)),
      owed: money(mine.filter((s) => s.status === "owed").reduce((t, s) => t + Number(s.commission), 0)),
      paid: money(mine.filter((s) => s.status === "paid").reduce((t, s) => t + Number(s.commission), 0)),
      review: mine.filter((s) => s.status === "review").length,
    };
  });
  const progs = (programs ?? []).map((p) => {
    const e = (earnings ?? []).filter((x) => x.program_id === p.id);
    return { ...p, earnings: e, expected: money(e.filter((x) => x.status === "expected").reduce((t, x) => t + Number(x.amount), 0)), paid: money(e.filter((x) => x.status === "paid").reduce((t, x) => t + Number(x.amount), 0)) };
  });
  return NextResponse.json({ affiliates: list, offers: offers ?? [], programs: progs });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const days = (v: unknown) => (v === null || v === "" || v === undefined || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.min(365, Math.round(Number(v)))));
  const pct = (v: unknown) => (v === null || v === "" || v === undefined ? null : Math.max(0, Math.min(100, Number(v))));
  const url = (v: unknown) => {
    const u = str(v, 500);
    return u ? (/^https?:\/\//i.test(u) ? u : `https://${u}`) : null;
  };
  const own = async (table: string, id: unknown) => {
    const { data } = await db.from(table).select("*").eq("id", str(id, 40)).eq("master_plan_id", a.planId).maybeSingle();
    return data as Record<string, unknown> | null;
  };

  switch (b.action) {
    case "affiliate-create": {
      const name = str(b.name, 120);
      if (!name) return NextResponse.json({ error: "Add their name." }, { status: 400 });
      const email = str(b.email, 200).toLowerCase() || null;
      if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
      let contactId: string | null = str(b.contactId, 40) || null;
      if (contactId) {
        const { data: c } = await db.from("seq_contacts").select("id").eq("id", contactId).eq("master_plan_id", a.planId).maybeSingle();
        contactId = (c?.id as string) ?? null;
      }
      if (!contactId && email) {
        const [first, ...rest] = name.split(/\s+/);
        contactId = (await upsertContact({ masterPlanId: a.planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "affiliate", tags: ["affiliate"] }, db))?.id ?? null;
      }
      const code = await uniqueCode(db, str(b.code, 40) || name.split(/\s+/)[0] || name);
      const { data, error } = await db
        .from("affiliates")
        .insert({ master_plan_id: a.planId, contact_id: contactId, name, email, code, default_rate: pct(b.defaultRate), payout_delay_days: days(b.payoutDelayDays), landing_url: url(b.landingUrl), notes: str(b.notes, 2000) || null, agreement_on: str(b.agreementOn, 10) || null })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: "Couldn't add them." }, { status: 500 });
      if (contactId) {
        const { data: c } = await db.from("seq_contacts").select("tags").eq("id", contactId).maybeSingle();
        const tags = Array.from(new Set([...((c?.tags as string[]) ?? []), "affiliate"]));
        await db.from("seq_contacts").update({ tags, tag_source: "affiliate" }).eq("id", contactId);
      }
      return NextResponse.json({ affiliate: data });
    }
    case "affiliate-update": {
      const f = await own("affiliates", b.id);
      if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (str(b.name, 120)) patch.name = str(b.name, 120);
      if (b.email !== undefined) patch.email = str(b.email, 200).toLowerCase() || null;
      if (b.status === "active" || b.status === "paused") patch.status = b.status;
      if (b.defaultRate !== undefined) patch.default_rate = pct(b.defaultRate);
      if (b.payoutDelayDays !== undefined) patch.payout_delay_days = days(b.payoutDelayDays);
      if (b.landingUrl !== undefined) patch.landing_url = url(b.landingUrl);
      if (b.notes !== undefined) patch.notes = str(b.notes, 2000) || null;
      if (b.agreementOn !== undefined) patch.agreement_on = str(b.agreementOn, 10) || null;
      if (str(b.code, 40) && slugCode(str(b.code, 40)) !== f.code) {
        const wanted = slugCode(str(b.code, 40));
        const { data: taken } = await db.from("affiliates").select("id").eq("code", wanted).maybeSingle();
        if (taken) return NextResponse.json({ error: "That code is taken. Try another." }, { status: 409 });
        patch.code = wanted;
      }
      const { data } = await db.from("affiliates").update(patch).eq("id", f.id).select("*").single();
      return NextResponse.json({ affiliate: data });
    }
    case "affiliate-delete": {
      const f = await own("affiliates", b.id);
      if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("affiliates").delete().eq("id", f.id);
      return NextResponse.json({ ok: true });
    }
    case "portal-reset": {
      const f = await own("affiliates", b.id);
      if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const token = Array.from(crypto.getRandomValues(new Uint8Array(18))).map((x) => x.toString(16).padStart(2, "0")).join("");
      await db.from("affiliates").update({ portal_token: token }).eq("id", f.id);
      return NextResponse.json({ token });
    }
    case "offer-rate": {
      const o = await own("sales_offers", b.offerId);
      if (!o) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("sales_offers").update({ affiliate_rate: pct(b.rate) }).eq("id", o.id);
      return NextResponse.json({ ok: true });
    }
    case "relationship-rate": {
      const f = await own("affiliates", b.affiliateId);
      const o = await own("sales_offers", b.offerId);
      if (!f || !o) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const rate = pct(b.rate);
      if (rate == null) await db.from("affiliate_offer_rates").delete().eq("affiliate_id", f.id).eq("offer_id", o.id);
      else await db.from("affiliate_offer_rates").upsert({ affiliate_id: f.id, offer_id: o.id, master_plan_id: a.planId, rate }, { onConflict: "affiliate_id,offer_id" });
      return NextResponse.json({ ok: true });
    }
    case "link-add": {
      const f = await own("affiliates", b.affiliateId);
      if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const product = str(b.product, 120);
      if (!product) return NextResponse.json({ error: "Name the product this link is for." }, { status: 400 });
      const code = await uniqueCode(db, str(b.code, 40) || `${f.code}-${product}`);
      const { data, error } = await db.from("affiliate_links").insert({ affiliate_id: f.id, master_plan_id: a.planId, product, code, landing_url: url(b.landingUrl), rate: pct(b.rate), commission_on: b.commissionOn === "implementation" ? "implementation" : "all" }).select("*").single();
      if (error) return NextResponse.json({ error: "Couldn't add the link." }, { status: 500 });
      return NextResponse.json({ link: data });
    }
    case "link-update": {
      const l = await own("affiliate_links", b.linkId);
      if (!l) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const patch: Record<string, unknown> = {};
      if (str(b.product, 120)) patch.product = str(b.product, 120);
      if (b.landingUrl !== undefined) patch.landing_url = url(b.landingUrl);
      if (b.rate !== undefined) patch.rate = pct(b.rate);
      if (b.commissionOn === "implementation" || b.commissionOn === "all") patch.commission_on = b.commissionOn;
      if (b.status === "active" || b.status === "paused") patch.status = b.status;
      const { data } = await db.from("affiliate_links").update(patch).eq("id", l.id).select("*").single();
      return NextResponse.json({ link: data });
    }
    case "link-renew": {
      const l = await own("affiliate_links", b.linkId);
      if (!l) return NextResponse.json({ error: "Not found." }, { status: 404 });
      // 365 days from the later of today and the current end, so renewing early loses nothing.
      const base = Math.max(Date.now(), l.expires_at ? new Date(l.expires_at as string).getTime() : 0);
      const { data } = await db.from("affiliate_links").update({ expires_at: new Date(base + AFF_LINK_DAYS * 86_400_000).toISOString(), expiry_notified_at: null, status: "active" }).eq("id", l.id).select("*").single();
      return NextResponse.json({ link: data });
    }
    case "link-delete": {
      const l = await own("affiliate_links", b.linkId);
      if (!l) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("affiliate_links").delete().eq("id", l.id);
      return NextResponse.json({ ok: true });
    }
    case "sale-add": {
      const f = await own("affiliates", b.affiliateId);
      if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const amount = Number(b.amount);
      if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: "Enter the sale amount." }, { status: 400 });
      const offer = str(b.offerId, 40) ? await own("sales_offers", b.offerId) : null;
      const rate = pct(b.rate) ?? (await rateFor(db, f.id as string, (offer?.id as string) ?? null));
      const description = str(b.description, 300) || (offer?.name as string) || "Sale";
      const saleDate = str(b.saleDate, 10) || new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from("affiliate_sales")
        .insert({
          affiliate_id: f.id,
          master_plan_id: a.planId,
          contact_id: str(b.contactId, 40) || null,
          offer_id: (offer?.id as string) ?? null,
          description,
          amount: money(amount),
          rate,
          commission: rate != null ? money((amount * rate) / 100) : 0,
          sale_date: saleDate,
          payable_on: await payableOn(db, f.id as string, saleDate),
          status: rate == null ? "review" : "owed",
          source: "manual",
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: "Couldn't save the sale." }, { status: 500 });
      return NextResponse.json({ sale: data });
    }
    case "sale-update": {
      const s = await own("affiliate_sales", b.saleId);
      if (!s) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const patch: Record<string, unknown> = {};
      if (b.rate !== undefined || b.amount !== undefined) {
        const amount = b.amount !== undefined ? Number(b.amount) : Number(s.amount);
        const rate = b.rate !== undefined ? pct(b.rate) : (s.rate as number | null);
        patch.amount = money(amount);
        patch.rate = rate;
        patch.commission = rate != null ? money((amount * rate) / 100) : 0;
        if (s.status === "review" && rate != null) patch.status = "owed";
      }
      if (["owed", "paid", "void", "review"].includes(b.status)) {
        patch.status = b.status;
        patch.paid_at = b.status === "paid" ? new Date().toISOString() : null;
      }
      if (b.payoutNote !== undefined) patch.payout_note = str(b.payoutNote, 300) || null;
      const { data } = await db.from("affiliate_sales").update(patch).eq("id", s.id).select("*").single();
      if (data) {
        const { data: f } = await db.from("affiliates").select("name").eq("id", data.affiliate_id).maybeSingle();
        await syncFinance(db, a.planId, `aff-sale:${data.id}`, data.status === "paid" ? { type: "expense", amount: Number(data.commission), category: "Affiliate Commissions", description: `Commission to ${f?.name ?? "affiliate"}: ${data.description}`, occurredOn: (data.paid_at as string)?.slice(0, 10) || (data.sale_date as string) } : null);
      }
      return NextResponse.json({ sale: data });
    }
    case "referral-add": {
      const f = await own("affiliates", b.affiliateId);
      const c = await own("seq_contacts", b.contactId);
      if (!f || !c) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await recordReferral(db, a.planId, { id: f.id as string, name: f.name as string, code: f.code as string }, c.id as string, "manual", "added by hand");
      return NextResponse.json({ ok: true });
    }
    case "program-save": {
      const name = str(b.name, 120);
      if (!name) return NextResponse.json({ error: "Name the program." }, { status: 400 });
      const row = {
        name,
        website: url(b.website),
        my_link: url(b.myLink),
        my_code: str(b.myCode, 120) || null,
        commission_terms: str(b.commissionTerms, 300) || null,
        login_url: url(b.loginUrl),
        status: ["applied", "active", "paused", "ended"].includes(b.status) ? b.status : "active",
        notes: str(b.notes, 2000) || null,
      };
      if (b.id) {
        const p = await own("affiliate_programs", b.id);
        if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
        const { data } = await db.from("affiliate_programs").update(row).eq("id", p.id).select("*").single();
        return NextResponse.json({ program: data });
      }
      const { data } = await db.from("affiliate_programs").insert({ ...row, master_plan_id: a.planId }).select("*").single();
      return NextResponse.json({ program: data });
    }
    case "program-delete": {
      const p = await own("affiliate_programs", b.id);
      if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const { data: gone } = await db.from("affiliate_program_earnings").select("id").eq("program_id", p.id);
      for (const e of gone ?? []) await syncFinance(db, a.planId, `aff-earning:${e.id}`, null);
      await db.from("affiliate_programs").delete().eq("id", p.id);
      return NextResponse.json({ ok: true });
    }
    case "earning-add": {
      const p = await own("affiliate_programs", b.programId);
      const amount = Number(b.amount);
      if (!p || !Number.isFinite(amount)) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
      const { data: e } = await db.from("affiliate_program_earnings").insert({ program_id: p.id, master_plan_id: a.planId, amount: money(amount), earned_on: str(b.earnedOn, 10) || new Date().toISOString().slice(0, 10), status: b.status === "paid" ? "paid" : "expected", note: str(b.note, 300) || null }).select("*").single();
      if (e?.status === "paid") await syncFinance(db, a.planId, `aff-earning:${e.id}`, { type: "income", amount: Number(e.amount), category: "Affiliate Income", description: `${p.name} affiliate earnings`, occurredOn: e.earned_on as string });
      return NextResponse.json({ ok: true });
    }
    case "earning-update": {
      const e = await own("affiliate_program_earnings", b.id);
      if (!e) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const status = b.status === "paid" ? "paid" : "expected";
      await db.from("affiliate_program_earnings").update({ status }).eq("id", e.id);
      const { data: p } = await db.from("affiliate_programs").select("name").eq("id", e.program_id).maybeSingle();
      await syncFinance(db, a.planId, `aff-earning:${e.id}`, status === "paid" ? { type: "income", amount: Number(e.amount), category: "Affiliate Income", description: `${p?.name ?? "Affiliate program"} affiliate earnings`, occurredOn: e.earned_on as string } : null);
      return NextResponse.json({ ok: true });
    }
    case "earning-delete": {
      const e = await own("affiliate_program_earnings", b.id);
      if (!e) return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("affiliate_program_earnings").delete().eq("id", e.id);
      await syncFinance(db, a.planId, `aff-earning:${e.id}`, null);
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
