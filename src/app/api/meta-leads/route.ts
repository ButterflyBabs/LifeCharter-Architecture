import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { addMeetingRegistrant, isZoomConfigured, masterclassMeetingId } from "@/lib/zoom";
import { advanceCards, boardStages, createCard, slugTag, type Board } from "@/lib/dmPipeline";

export const dynamic = "force-dynamic";

// Meta lead ads → the MasterClass Pipeline. A Make (or Zapier) scenario posts each form submission here, with the
// workspace's secret in the address (?k=...). Each lead is registered on the MasterClass Zoom meeting (register once,
// attend any session), saved as a contact tagged lead-meta-ad and the ad's own tag, and given a card in Registered
// on the MasterClass Pipeline. Zoom's own confirmation goes out at once; the Suite's emails follow the next sync.
// Accepts flat fields (email, first_name, last_name, full_name, ad_name, form_name, ...) or Meta's field_data list.
// ?dry=1 checks the payload and the secret and changes nothing.
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : typeof v === "number" ? String(v) : "");

function flatten(b: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    const val = Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean).join(", ") : str(v, 400);
    if (val) out[k.trim().toLowerCase().replace(/\s+/g, "_")] = val;
  };
  for (const [k, v] of Object.entries(b)) {
    if (k === "field_data" && Array.isArray(v)) {
      for (const f of v as { name?: unknown; values?: unknown }[]) if (f && typeof f.name === "string") put(f.name, f.values);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) put(k2, v2);
    } else put(k, v);
  }
  return out;
}

export async function POST(request: Request) {
  const u = new URL(request.url);
  const key = u.searchParams.get("k") || "";
  const db = createServerClient();
  const { data: set } = key.length >= 24 ? await db.from("meta_lead_settings").select("master_plan_id").eq("secret", key).maybeSingle() : { data: null };
  if (!set) return NextResponse.json({ error: "Unknown key." }, { status: 401 });
  const plan = set.master_plan_id as string;
  const dry = u.searchParams.get("dry") === "1";

  const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const f = flatten(raw);
  const email = (f.email || f.email_address || f.work_email || "").toLowerCase();
  const full = f.full_name || f.name || "";
  const first = f.first_name || f.firstname || full.split(/\s+/)[0] || "";
  const last = f.last_name || f.lastname || (full.includes(" ") ? full.split(/\s+/).slice(1).join(" ") : "");
  const ad = f.ad_name || f.ad || "";
  const form = f.form_name || f.form || "";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "No valid email in the lead." }, { status: 400 });
  if (!first) return NextResponse.json({ error: "No name in the lead." }, { status: 400 });
  const skip = new Set(["email", "email_address", "work_email", "full_name", "name", "first_name", "firstname", "last_name", "lastname", "ad_name", "ad", "form_name", "form", "phone_number"]);
  const answers = Object.fromEntries(Object.entries(f).filter(([k]) => !skip.has(k)));

  // Meta's own "test lead" tool sends dummy addresses; never put those on Zoom or in the pipeline.
  if (/@(meta|fb)\.com$/.test(email) || /^dummy|test@/.test(email)) {
    if (!dry) await db.from("meta_leads").insert({ master_plan_id: plan, email, name: `${first} ${last}`.trim(), ad_name: ad || null, form_name: form || null, answers, status: "test", detail: "Meta test lead, ignored" });
    return NextResponse.json({ ok: true, test: true });
  }
  if (dry) return NextResponse.json({ ok: true, dry: true, email, first, last, ad, answers });

  const { data: log } = await db.from("meta_leads").insert({ master_plan_id: plan, email, name: `${first} ${last}`.trim(), ad_name: ad || null, form_name: form || null, answers, status: "received" }).select("id").single();
  const setStatus = (status: string, detail?: string) => (log ? db.from("meta_leads").update({ status, detail: detail ?? null }).eq("id", log.id as string) : Promise.resolve());

  // 1. Contact, with where they came from.
  const tags = ["lead-meta-ad", ...(ad ? [`meta-ad-${slugTag(ad, 40)}`] : [])];
  const c = await upsertContact({ masterPlanId: plan, email, firstName: first, lastName: last || null, source: "meta-lead-ad", tags }, db).catch(() => null);
  if (!c) { await setStatus("failed", "Couldn't save the contact"); return NextResponse.json({ error: "Couldn't save the contact." }, { status: 500 }); }
  if (c.unsubscribed) { await setStatus("skipped", "Previously unsubscribed"); return NextResponse.json({ ok: true, skipped: "unsubscribed" }); }

  // 2. Their card on the MasterClass Pipeline, in Registered.
  try {
    const { data: board } = await db.from("pipeline_boards").select("id, name, tag, sort_order").eq("master_plan_id", plan).eq("tag", "masterclass-dm").maybeSingle();
    if (board) {
      const b: Board = { id: board.id as string, name: board.name as string, tag: (board.tag as string) ?? null, sortOrder: board.sort_order as number };
      const stages = await boardStages(db, plan, b.id);
      const reg = stages.find((s) => s.key === "registered");
      const { data: have } = await db.from("dm_cards").select("id").eq("master_plan_id", plan).eq("board_id", b.id).or(`email.eq.${email},contact_id.eq.${c.id}`).limit(1);
      if (have?.length) await advanceCards(db, plan, { contactId: c.id, email }, "registered").catch(() => {});
      else if (reg) {
        const notes = [`Meta lead ad${ad ? `: ${ad}` : ""}${form ? ` (${form})` : ""}`, ...Object.entries(answers).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)].join("\n");
        await createCard(db, plan, b, reg, "America/Denver", { name: `${first} ${last}`.trim(), email, platform: "FB", contactId: c.id, notes });
      }
    }
  } catch (e) {
    console.error("meta-leads card:", (e as Error).message);
  }
  await logEvent(plan, c.id, "form", `Meta lead ad${ad ? `: ${ad}` : ""}: registered for the MasterClass`, { form, answers }, db as never).catch(() => {});

  // 3. Register on the MasterClass Zoom meeting. A failure is reported so the sender retries; everything above is repeat-safe.
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
