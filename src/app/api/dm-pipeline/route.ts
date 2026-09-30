import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { upsertContact, EMAIL_RE } from "@/lib/crm";
import { DM_PLATFORMS, ensureDmStages, moveCard, createCard, dateIn } from "@/lib/dmPipeline";
import { zonedToUtcISO } from "@/lib/tz";

export const dynamic = "force-dynamic";

// DM Pipeline (each account sees only its own).
// GET ?tz= → stages, cards, today (account zone)
// POST
//   add { name, handle?, profileUrl?, email?, platform, contactId?, stageId?, scriptId?, scriptTitle?, notes? }
//   move { cardId, stageId, sortOrder? }
//   update { cardId, name?, handle?, profileUrl?, email?, platform?, notes?, followUpOn? (YYYY-MM-DD or "") }
//   delete { cardId }
//   stages { stages: [{ id, name, followUpDays }] }   (rename a stage or change its follow-up days)
const PLATFORM_IDS = DM_PLATFORMS.map((p) => p.id) as string[];
const TAG: Record<string, string> = { IG: "dm-instagram", FB: "dm-facebook", LI: "dm-linkedin" };

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const stages = await ensureDmStages(db, a.planId);
  const { data: cards } = await db
    .from("dm_cards")
    .select("id, stage_id, contact_id, name, handle, profile_url, email, platform, script_id, script_title, notes, last_contacted_at, follow_up_on, deal_id, sort_order, stage_changed_at, created_at")
    .eq("master_plan_id", a.planId)
    .order("sort_order")
    .order("created_at")
    .limit(2000);
  return NextResponse.json({ stages, cards: cards ?? [], today: dateIn(tz, 0) });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const tz = await resolveUserTimeZone(str(b.tz, 60) || null);
  const stages = await ensureDmStages(db, a.planId);

  if (b.action === "add") {
    const name = str(b.name, 120);
    const platform = PLATFORM_IDS.includes(b.platform) ? (b.platform as string) : "";
    if (!name) return NextResponse.json({ error: "Add their name." }, { status: 400 });
    if (!platform) return NextResponse.json({ error: "Choose Instagram, Facebook or LinkedIn." }, { status: 400 });
    const stage = stages.find((s) => s.id === b.stageId) ?? stages.find((s) => s.key === "sent") ?? stages[0];
    const email = str(b.email, 200).toLowerCase();
    if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

    // Link to Contacts: the chosen contact, or a new/existing one by email. Either way they get the dm-<platform> tag.
    let contactId: string | null = null;
    if (str(b.contactId, 40)) {
      const { data: c } = await db.from("seq_contacts").select("id, tags, email").eq("id", str(b.contactId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      if (c) {
        contactId = c.id as string;
        const tags = Array.from(new Set([...((c.tags as string[]) ?? []), TAG[platform]]));
        await db.from("seq_contacts").update({ tags, tag_source: "dm-pipeline", updated_at: new Date().toISOString() }).eq("id", c.id).eq("master_plan_id", a.planId);
      }
    } else if (email) {
      const [first, ...rest] = name.split(/\s+/);
      const c = await upsertContact({ masterPlanId: a.planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "dm-pipeline", tags: [TAG[platform]] }, db);
      contactId = c?.id ?? null;
    }
    if (contactId) {
      const { data: dup } = await db.from("dm_cards").select("id").eq("master_plan_id", a.planId).eq("contact_id", contactId).maybeSingle();
      if (dup) return NextResponse.json({ error: "They're already in your DM Pipeline." }, { status: 409 });
    }
    let email2 = email || null;
    if (contactId && !email2) {
      const { data: c } = await db.from("seq_contacts").select("email").eq("id", contactId).maybeSingle();
      email2 = (c?.email as string) ?? null;
    }
    const r = await createCard(db, a.planId, stage, tz, {
      name,
      handle: str(b.handle, 120) || null,
      profileUrl: str(b.profileUrl, 500) || null,
      email: email2,
      platform,
      contactId,
      scriptId: str(b.scriptId, 60) || null,
      scriptTitle: str(b.scriptTitle, 200) || null,
      notes: str(b.notes, 2000) || null,
    });
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ card: r.card });
  }

  const cardId = str(b.cardId, 40);
  const { data: card } = await db.from("dm_cards").select("id, follow_up_task_id").eq("id", cardId).eq("master_plan_id", a.planId).maybeSingle();

  if (b.action === "stages") {
    const list = Array.isArray(b.stages) ? b.stages : [];
    for (const s of list) {
      const st = stages.find((x) => x.id === s?.id);
      if (!st) continue;
      const days = s.followUpDays === null || s.followUpDays === "" ? null : Math.max(0, Math.min(365, Math.round(Number(s.followUpDays))));
      await db
        .from("dm_stages")
        .update({ name: str(s.name, 60) || st.name, follow_up_days: Number.isFinite(days as number) || days === null ? days : st.followUpDays })
        .eq("id", st.id)
        .eq("master_plan_id", a.planId);
    }
    return NextResponse.json({ stages: await ensureDmStages(db, a.planId) });
  }

  if (!card) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (b.action === "move") {
    const stage = stages.find((s) => s.id === b.stageId);
    if (!stage) return NextResponse.json({ error: "Unknown stage." }, { status: 400 });
    const saved = await moveCard(db, a.planId, card.id as string, stage, tz, typeof b.sortOrder === "number" ? b.sortOrder : undefined);
    return saved ? NextResponse.json({ card: saved }) : NextResponse.json({ error: "Couldn't move it." }, { status: 500 });
  }

  if (b.action === "update") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (str(b.name, 120)) patch.name = str(b.name, 120);
    if (b.handle !== undefined) patch.handle = str(b.handle, 120) || null;
    if (b.profileUrl !== undefined) patch.profile_url = str(b.profileUrl, 500) || null;
    if (b.email !== undefined) {
      const e = str(b.email, 200).toLowerCase();
      if (e && !EMAIL_RE.test(e)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
      patch.email = e || null;
    }
    if (PLATFORM_IDS.includes(b.platform)) patch.platform = b.platform;
    if (b.notes !== undefined) patch.notes = str(b.notes, 2000) || null;
    if (b.followUpOn !== undefined) {
      // A new follow-up date moves its task too (or clears both).
      const day = str(b.followUpOn, 10);
      if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: "Pick a valid date." }, { status: 400 });
      patch.follow_up_on = day || null;
      if (card.follow_up_task_id) {
        if (day) await db.from("tasks").update({ due_at: zonedToUtcISO(day, "23:59", tz), due_has_time: false }).eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId);
        else {
          await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId).neq("status", "done");
          patch.follow_up_task_id = null;
        }
      }
    }
    const { data: saved, error } = await db.from("dm_cards").update(patch).eq("id", card.id).eq("master_plan_id", a.planId).select("*").single();
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json({ card: saved });
  }

  if (b.action === "delete") {
    if (card.follow_up_task_id) await db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", a.planId).neq("status", "done");
    await db.from("dm_cards").delete().eq("id", card.id).eq("master_plan_id", a.planId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
