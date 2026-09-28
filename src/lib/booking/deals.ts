import { createServerClient } from "@/lib/supabase/server";
import { ensureStages, type Stage } from "@/lib/sales/pipeline";

// Bookings ↔ Pipeline. A calendar with create_deal on opens (or reopens) one
// deal per person per calendar when they book, moves it to Lost when they
// cancel or don't show, and to Won when they buy (Stripe webhook).

type Db = ReturnType<typeof createServerClient>;

// Where this person first came from, from their contact record's original source.
export function originLabel(source: string | null | undefined): string {
  const s = source || "";
  if (s === "zoom:masterclass") return "Command Shift MasterClass";
  if (s === "zoom:incubator") return "LifeCharter Incubator";
  if (s === "executive-assessment") return "Executive Business Assessment";
  if (s === "stripe") return "The Life Shift";
  if (s === "manual") return "Added by hand";
  if (s.startsWith("form:")) return ({ contact: "Contact form", speaking: "Speaking request", "lifecharter-program-waitlist": "LifeCharter Program waitlist", "coc-sample": "Conversations of Consequence sample" } as Record<string, string>)[s.slice(5)] || `Form: ${s.slice(5)}`;
  if (s.startsWith("booking:")) return "Booked directly";
  return s || "Unknown";
}

const openStage = (stages: Stage[]) => stages.find((s) => s.kind === "open" && /discovery|call|consult/i.test(s.name)) ?? stages.find((s) => s.kind === "open");

export async function dealForBooking(
  db: Db,
  cal: { master_plan_id: string; slug: string; name: string; deal_value: number | null },
  b: { name: string; email: string; startISO: string; answers: Record<string, string> }
): Promise<string | null> {
  const stages = await ensureStages(db, cal.master_plan_id);
  const stage = openStage(stages);
  if (!stage) return null;
  const key = `booking:${cal.slug}`; // internal link to the calendar (deals.origin)
  const day = b.startISO.slice(0, 10);
  const now = new Date().toISOString();
  const { data: contact } = await db.from("seq_contacts").select("source").eq("master_plan_id", cal.master_plan_id).eq("email", b.email.toLowerCase()).maybeSingle();
  const origin = originLabel(contact?.source as string | null);
  const notes = [...Object.entries(b.answers).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)].join("\n");
  // Same person booking this calendar again: reopen their deal instead of duplicating it.
  const { data: existing } = await db
    .from("pipeline_deals")
    .select("id, stage_id")
    .eq("master_plan_id", cal.master_plan_id)
    .eq("origin", key)
    .ilike("email", b.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const wonIds = new Set(stages.filter((s) => s.kind === "won").map((s) => s.id));
  if (existing && !wonIds.has(existing.stage_id as string)) {
    await db
      .from("pipeline_deals")
      .update({ stage_id: stage.id, next_step: cal.name, next_step_due: day, closed_at: null, stage_changed_at: now, updated_at: now })
      .eq("id", existing.id);
    return existing.id as string;
  }
  const { data } = await db
    .from("pipeline_deals")
    .insert({
      master_plan_id: cal.master_plan_id,
      stage_id: stage.id,
      contact_name: b.name,
      email: b.email,
      value: cal.deal_value,
      expected_close: day,
      next_step: cal.name,
      next_step_due: day,
      source: origin, // shown in the Pipeline as "Where they came from"
      origin: key,
      notes,
    })
    .select("id")
    .single();
  return (data?.id as string) ?? null;
}

export async function moveDeal(db: Db, masterPlanId: string, dealId: string, kind: "won" | "lost", note?: string) {
  const stages = await ensureStages(db, masterPlanId);
  const target = stages.find((s) => s.kind === kind);
  if (!target) return;
  const { data: d } = await db.from("pipeline_deals").select("stage_id, notes").eq("id", dealId).eq("master_plan_id", masterPlanId).maybeSingle();
  if (!d) return;
  const current = stages.find((s) => s.id === d.stage_id);
  if (current?.kind === "won") return; // never undo a win
  const now = new Date().toISOString();
  await db
    .from("pipeline_deals")
    .update({ stage_id: target.id, closed_at: now, stage_changed_at: now, updated_at: now, ...(note ? { notes: [d.notes, note].filter(Boolean).join("\n") } : {}) })
    .eq("id", dealId);
}

// Stripe: someone bought the Command Suite. Their open booking deals are won.
export async function winBookingDeals(masterPlanId: string, email: string) {
  const db = createServerClient();
  const stages = await ensureStages(db, masterPlanId);
  const open = new Set(stages.filter((s) => s.kind !== "won").map((s) => s.id));
  const { data } = await db.from("pipeline_deals").select("id, stage_id").eq("master_plan_id", masterPlanId).like("origin", "booking:%").ilike("email", email);
  for (const d of data ?? []) if (open.has(d.stage_id as string)) await moveDeal(db, masterPlanId, d.id as string, "won", "Bought the Command Suite.");
}
