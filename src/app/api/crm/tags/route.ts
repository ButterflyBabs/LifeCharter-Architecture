import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

// Tag Library (each account sees only its own). One row per tag: how many people carry it, what in the
// Suite adds it (forms, calendars, pipelines, broadcasts, invite lists, automations), and the owner's note.
//   GET  → { tags: [{ tag, people, usedBy[], auto, note }] }
//   POST { action: "note", tag, note }      save what a tag means
//        { action: "rename", tag, to }      rename it on every contact
//        { action: "retire", tag }          take it off every contact (people stay in Contacts)
const clean = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) : "");

// Tags the Suite adds by itself, so the library can say where a tag came from.
function automatic(tag: string): string | null {
  if (/^lcmc-[a-z]{3}-\d{1,2}-registered$/.test(tag)) return "Added when someone registers for that MasterClass on Zoom";
  if (/^lcmc-[a-z]{3}-\d{1,2}-attended$/.test(tag)) return "Added after that MasterClass to people who attended";
  if (/^lcmc-[a-z]{3}-\d{1,2}-no-show$/.test(tag)) return "Added after that MasterClass to people who registered and did not come";
  if (tag === "masterclass-registered" || tag === "incubator-registered") return "Added when someone registers on Zoom";
  if (tag === "masterclass-attended") return "Added to everyone who has attended a MasterClass";
  if (tag === "masterclass-no-show") return "Added to anyone who registered for a MasterClass and did not come";
  if (/^from-(instagram|facebook|linkedin|email|text)$/.test(tag)) return "Added from an Outreach Pipeline card: where the conversation started";
  if (/^booked-/.test(tag)) return "Added when they book that calendar";
  if (tag === "executive-consultation-request" || /^consult-/.test(tag)) return "Added by the Executive Consultation questionnaire";
  return null;
}

type Row = { tag: string; people: number; usedBy: string[]; auto: string | null; note: string };

async function library(planId: string): Promise<Row[]> {
  const db = createServerClient();
  const counts = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("seq_contacts").select("tags").eq("master_plan_id", planId).range(from, from + 999);
    for (const c of (data ?? []) as { tags: string[] | null }[]) for (const t of c.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    if (!data || data.length < 1000) break;
  }
  const usedBy = new Map<string, string[]>();
  const use = (tag: string | null | undefined, what: string) => {
    if (!tag) return;
    if (!counts.has(tag)) counts.set(tag, 0);
    usedBy.set(tag, [...(usedBy.get(tag) ?? []), what]);
  };
  const [forms, cals, boards, stages, casts, lists, notes] = await Promise.all([
    db.from("crm_forms").select("name, tags, active").eq("master_plan_id", planId),
    db.from("booking_calendars").select("name, tags").eq("master_plan_id", planId),
    db.from("pipeline_boards").select("id, name, tag").eq("master_plan_id", planId),
    db.from("dm_stages").select("board_id, name, tag").eq("master_plan_id", planId),
    db.from("crm_broadcasts").select("name, tags, status").eq("master_plan_id", planId),
    db.from("crm_invite_lists").select("name, invite_tag, invite_tags").eq("master_plan_id", planId),
    db.from("crm_tag_notes").select("tag, note").eq("master_plan_id", planId),
  ]);
  for (const f of (forms.data ?? []) as { name: string; tags: string[] | null; active: boolean }[]) for (const t of f.tags ?? []) use(t, `Form: ${f.name}${f.active ? "" : " (off)"}`);
  for (const c of (cals.data ?? []) as { name: string; tags: string[] | null }[]) for (const t of c.tags ?? []) use(t, `Calendar: ${c.name}`);
  const boardName = new Map(((boards.data ?? []) as { id: string; name: string; tag: string | null }[]).map((b) => [b.id, b.name]));
  for (const b of (boards.data ?? []) as { id: string; name: string; tag: string | null }[]) use(b.tag, `Pipeline: ${b.name} (everyone on it)`);
  for (const s of (stages.data ?? []) as { board_id: string; name: string; tag: string | null }[]) use(s.tag, `Pipeline stage: ${boardName.get(s.board_id) ?? "Pipeline"} › ${s.name}`);
  for (const b of (casts.data ?? []) as { name: string; tags: string[] | null; status: string }[]) for (const t of b.tags ?? []) use(t, `Broadcast${b.status === "sent" ? " (sent)" : ""}: ${b.name}`);
  for (const l of (lists.data ?? []) as { name: string; invite_tag: string | null; invite_tags: string[] | null }[]) for (const t of Array.from(new Set([...(l.invite_tags ?? []), ...(l.invite_tag ? [l.invite_tag] : [])]))) use(t, `Invite list: ${l.name}`);
  const noteOf = new Map(((notes.data ?? []) as { tag: string; note: string }[]).map((n) => [n.tag, n.note]));
  return Array.from(counts.entries())
    .map(([tag, people]) => ({ tag, people, usedBy: usedBy.get(tag) ?? [], auto: automatic(tag), note: noteOf.get(tag) ?? "" }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  return NextResponse.json({ tags: await library(a.planId) });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const tag = typeof b.tag === "string" ? b.tag.trim().slice(0, 60) : "";
  if (!tag) return NextResponse.json({ error: "Which tag?" }, { status: 400 });
  const db = createServerClient();

  if (b.action === "note") {
    const note = typeof b.note === "string" ? b.note.trim().slice(0, 500) : "";
    const { error } = await db.from("crm_tag_notes").upsert({ master_plan_id: a.planId, tag, note, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id,tag" });
    return error ? NextResponse.json({ error: "Couldn't save the note." }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (b.action === "retire" || b.action === "rename") {
    const to = b.action === "rename" ? clean(b.to) : "";
    if (b.action === "rename" && (!to || to === tag)) return NextResponse.json({ error: "Type the new name." }, { status: 400 });
    let changed = 0;
    for (;;) {
      const { data } = await db.from("seq_contacts").select("id, tags").eq("master_plan_id", a.planId).contains("tags", [tag]).limit(500);
      const rows = (data ?? []) as { id: string; tags: string[] }[];
      if (!rows.length) break;
      for (const c of rows) {
        const next = Array.from(new Set(c.tags.flatMap((t) => (t === tag ? (to ? [to] : []) : [t]))));
        await db.from("seq_contacts").update({ tags: next, tag_source: "tag-library", updated_at: new Date().toISOString() }).eq("id", c.id).eq("master_plan_id", a.planId);
        changed++;
      }
      if (rows.length < 500) break;
    }
    if (to) {
      const { data: n } = await db.from("crm_tag_notes").select("note").eq("master_plan_id", a.planId).eq("tag", tag).maybeSingle();
      if (n?.note) await db.from("crm_tag_notes").upsert({ master_plan_id: a.planId, tag: to, note: n.note, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id,tag" });
    }
    await db.from("crm_tag_notes").delete().eq("master_plan_id", a.planId).eq("tag", tag);
    return NextResponse.json({ ok: true, changed, tags: await library(a.planId) });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
