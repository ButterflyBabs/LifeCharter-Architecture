import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent } from "@/lib/crm";
import { isHousePlan } from "@/lib/housePlan";
import { addMeetingRegistrant, isZoomConfigured, masterclassMeetingId } from "@/lib/zoom";
import { advanceCards, boardStages, createCard, type Board } from "@/lib/dmPipeline";
import { LEAD_SOURCES, isTestLead, parseLead, validLead, type LeadSource } from "@/lib/leadIntake";

// Lead forms → the Suite. A Make (or Zapier) scenario posts each form submission to /api/meta-leads (Facebook and Instagram lead ads)
// or /api/linkedin-leads (LinkedIn Lead Gen Forms), with the workspace's secret in the address (?k=...). Both use the same secret.
// Each lead is saved as a contact tagged with its source and the form's own tag, given a card in the pipeline the account chose, and
// logged in the lead list. Babs's account registers Meta lead ads on the MasterClass Zoom meeting (and LinkedIn ones only when the
// address says ?masterclass=1). Every other account has no Zoom step. ?dry=1 checks the payload and the secret and changes nothing.

export async function ingestLead(request: Request, sourceKey: LeadSource): Promise<NextResponse> {
  const src = LEAD_SOURCES[sourceKey];
  const u = new URL(request.url);
  const key = u.searchParams.get("k") || "";
  const db = createServerClient();
  const { data: set } = key.length >= 24 ? await db.from("meta_lead_settings").select("master_plan_id, board_id").eq("secret", key).maybeSingle() : { data: null };
  if (!set) return NextResponse.json({ error: "Unknown key." }, { status: 401 });
  const plan = set.master_plan_id as string;
  const house = await isHousePlan(plan, db);
  const dry = u.searchParams.get("dry") === "1";
  const masterclassFlag = u.searchParams.get("masterclass") === "1";

  // JSON, or a plain form (Make's "x-www-form-urlencoded" body).
  const ct = request.headers.get("content-type") || "";
  const raw = (ct.includes("json")
    ? await request.json().catch(() => ({}))
    : await request.formData().then((f) => Object.fromEntries(Array.from(f.entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""]))).catch(() => ({}))) as Record<string, unknown>;
  const lead = parseLead(raw);
  const bad = validLead(lead);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const { email, first, last, form, answers, adId } = lead;
  // Facebook sends the Ad ID, not the ad's name: the name comes from the account's own list of ad IDs.
  let ad = lead.ad;
  if (!ad && adId) ad = ((await db.from("meta_ad_names").select("ad_name").eq("master_plan_id", plan).eq("ad_id", adId).maybeSingle()).data?.ad_name as string | undefined) || "";
  const origin = ad || form; // the ad (Meta) or the form (LinkedIn) the person came from

  if (isTestLead(email)) {
    if (!dry) await db.from("meta_leads").insert({ master_plan_id: plan, source: src.source, email, name: `${first} ${last}`.trim(), ad_name: ad || null, ad_id: adId || null, form_name: form || null, answers, status: "test", detail: "Test lead, ignored" });
    return NextResponse.json({ ok: true, test: true });
  }
  if (dry) return NextResponse.json({ ok: true, dry: true, source: src.source, email, first, last, ad, form, answers });

  const { data: log } = await db.from("meta_leads").insert({ master_plan_id: plan, source: src.source, email, name: `${first} ${last}`.trim(), ad_name: ad || null, ad_id: adId || null, form_name: form || null, answers, status: "received" }).select("id").single();
  const setStatus = (status: string, detail?: string) => (log ? db.from("meta_leads").update({ status, detail: detail ?? null }).eq("id", log.id as string) : Promise.resolve());

  // 1. Contact, with where they came from.
  const formTag = src.perFormTag(origin);
  const c = await upsertContact({ masterPlanId: plan, email, firstName: first, lastName: last || null, phone: lead.phone || null, source: src.contactSource, tags: [src.tag, ...(formTag ? [formTag] : [])] }, db).catch(() => null);
  if (!c) { await setStatus("failed", "Couldn't save the contact"); return NextResponse.json({ error: "Couldn't save the contact." }, { status: 500 }); }
  if (c.unsubscribed) { await setStatus("skipped", "Previously unsubscribed"); return NextResponse.json({ ok: true, skipped: "unsubscribed" }); }

  const registers = src.registersMasterclass(house, masterclassFlag);

  // 2. Their card: a MasterClass lead on Babs's account goes to the MasterClass Pipeline's Registered stage; otherwise the pipeline the account chose.
  try {
    const sel = db.from("pipeline_boards").select("id, name, tag, sort_order").eq("master_plan_id", plan);
    const { data: board } = registers ? await sel.eq("tag", "masterclass-dm").maybeSingle() : set.board_id ? await sel.eq("id", set.board_id as string).maybeSingle() : { data: null };
    if (board) {
      const b: Board = { id: board.id as string, name: board.name as string, tag: (board.tag as string) ?? null, sortOrder: board.sort_order as number };
      const stages = await boardStages(db, plan, b.id);
      const target = registers ? stages.find((s) => s.key === "registered") : stages[0];
      const { data: have } = await db.from("dm_cards").select("id").eq("master_plan_id", plan).eq("board_id", b.id).or(`email.eq.${email},contact_id.eq.${c.id}`).limit(1);
      if (have?.length) { if (registers) await advanceCards(db, plan, { contactId: c.id, email }, "registered").catch(() => {}); }
      else if (target) {
        const notes = [`${src.label}${origin ? `: ${origin}` : ""}${ad && form ? ` (${form})` : ""}`, ...Object.entries(answers).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)].join("\n");
        await createCard(db, plan, b, target, "America/Denver", { name: `${first} ${last}`.trim(), email, platform: src.platform, contactId: c.id, notes });
      }
    }
  } catch (e) {
    console.error(`${src.source}-leads card:`, (e as Error).message);
  }
  await logEvent(plan, c.id, "form", `${src.label}${origin ? `: ${origin}` : ""}${registers ? ": registered for the MasterClass" : ""}`, { form, answers }, db as never).catch(() => {});

  if (!registers) { await setStatus("saved", "Saved to Contacts"); return NextResponse.json({ ok: true }); }

  // 3. Register on the MasterClass Zoom meeting (Babs's account only). A failure is reported so the sender retries; everything above is repeat-safe.
  if (!isZoomConfigured()) { await setStatus("failed", "Zoom isn't configured"); return NextResponse.json({ error: "Registration is unavailable." }, { status: 503 }); }
  try {
    await addMeetingRegistrant(masterclassMeetingId(), { email, firstName: first, lastName: last });
  } catch (e) {
    await setStatus("failed", `Zoom: ${(e as Error).message.slice(0, 180)}`);
    return NextResponse.json({ error: "Couldn't register on Zoom." }, { status: 502 });
  }
  await setStatus("registered");
  return NextResponse.json({ ok: true });
}
