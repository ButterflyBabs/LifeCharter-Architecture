import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// Life by Design Summit workspace (Alignment Architect only). Tabs: Speakers, Topics, and any notes or
// tracker pages Babs adds. A tracker row can be added to the task list (LCCS Tasks, project "Life by Design
// Summit"); its tick then follows the task so there is one place to look for completion.

// The same workspace serves several events; each has its own pages, speakers, topics and rows (event_key).
const EVENTS: Record<string, { business: number; project: string; goal: string; due: string | null }> = {
  "life-by-design": { business: 16, project: "Life by Design Summit (April 15-17, 2027)", goal: "Plan, promote and hold the Life by Design Summit.", due: "2027-04-17" }, // AmiLynne Speaks
  "annual-retreat": { business: 15, project: "Annual In Person Retreat", goal: "Plan and hold the annual in-person Command Suite retreat.", due: null }, // LifeCharter Command Suite
};
const eventOf = (v: unknown) => (typeof v === "string" && v in EVENTS ? v : "life-by-design");
const SPEAKER_FIELDS = ["name", "promo_name", "email", "phone", "status", "topic", "dimension", "session_date", "session_time", "length", "style", "promo_agreement", "freebie", "giveaway", "assets", "tech_check", "notes"] as const;
const TOPIC_FIELDS = ["dimension", "title", "description", "day", "speaker_id", "status", "notes"] as const;
const ITEM_FIELDS = ["title", "status", "owner", "due_date", "note"] as const;

type Row = Record<string, unknown>;
const pick = (src: Row, keys: readonly string[]) => {
  const out: Row = {};
  for (const k of keys) if (k in src) out[k] = src[k] === "" ? null : src[k];
  return out;
};

async function guard() {
  if (!(await isAlignmentArchitect())) return { err: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const db = createServerClient();
  const plan = await housePlanId(db);
  if (!plan) return { err: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  return { db, plan };
}

export async function GET(req: Request) {
  const ev = eventOf(new URL(req.url).searchParams.get("event"));
  const g = await guard();
  if ("err" in g) return g.err;
  const { db, plan } = g;
  const [pages, speakers, topics, items] = await Promise.all([
    db.from("lbd_pages").select("*").eq("master_plan_id", plan).eq("event_key", ev).order("position").order("created_at"),
    db.from("lbd_speakers").select("*").eq("master_plan_id", plan).eq("event_key", ev).order("position").order("created_at"),
    db.from("lbd_topics").select("*").eq("master_plan_id", plan).eq("event_key", ev).order("position").order("created_at"),
    db.from("lbd_items").select("*").eq("master_plan_id", plan).eq("event_key", ev).order("position").order("created_at"),
  ]);
  const itemRows = (items.data ?? []) as (Row & { task_id: number | null; status: string })[];
  const taskIds = itemRows.map((i) => i.task_id).filter((x): x is number => typeof x === "number");
  const taskState = new Map<number, string>();
  if (taskIds.length) {
    const { data } = await db.from("tasks").select("id, status").in("id", taskIds);
    for (const t of (data ?? []) as { id: number; status: string }[]) taskState.set(t.id, t.status);
  }
  const outItems = itemRows.map((i) => {
    if (i.task_id == null) return i;
    const s = taskState.get(i.task_id);
    if (s === "done") return { ...i, status: "done" };
    if (s && i.status === "done") return { ...i, status: "todo" };
    return i;
  });
  return NextResponse.json(
    { pages: pages.data ?? [], speakers: speakers.data ?? [], topics: topics.data ?? [], items: outItems },
    { headers: { "Cache-Control": "no-store" } },
  );
}

async function ensureProject(db: ReturnType<typeof createServerClient>, plan: string, ev: string): Promise<string | null> {
  const cfg = EVENTS[ev];
  const { data: found } = await db.from("projects").select("id").eq("master_plan_id", plan).eq("name", cfg.project).maybeSingle();
  if (found?.id) return found.id as string;
  const { data, error } = await db
    .from("projects")
    .insert({ master_plan_id: plan, name: cfg.project, goal: cfg.goal, status: "active", ...(cfg.due ? { due_date: cfg.due } : {}) })
    .select("id")
    .single();
  return error || !data ? null : (data.id as string);
}

export async function POST(req: Request) {
  const g = await guard();
  if ("err" in g) return g.err;
  const { db, plan } = g;
  const b = (await req.json().catch(() => ({}))) as Row & { action?: string };
  const ev = eventOf(b.event);
  const id = typeof b.id === "string" ? b.id : null;
  const ok = () => NextResponse.json({ ok: true });
  const fail = (m: string) => NextResponse.json({ error: m }, { status: 400 });

  switch (b.action) {
    case "add_page": {
      const kind = b.kind === "tracker" ? "tracker" : b.kind === "notes" ? "notes" : null;
      const title = String(b.title ?? "").trim().slice(0, 80);
      if (!kind || !title) return fail("Give the page a name.");
      const { data: last } = await db.from("lbd_pages").select("position").eq("master_plan_id", plan).eq("event_key", ev).order("position", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("lbd_pages").insert({ master_plan_id: plan, event_key: ev, kind, title, position: ((last?.position as number) ?? 0) + 1 }).select("id").single();
      return error ? fail("Couldn't add the page.") : NextResponse.json({ ok: true, id: data.id });
    }
    case "rename_page": {
      const title = String(b.title ?? "").trim().slice(0, 80);
      if (!id || !title) return fail("Give the page a name.");
      await db.from("lbd_pages").update({ title }).eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "delete_page": {
      if (!id) return fail("Missing page.");
      const { data: pg } = await db.from("lbd_pages").select("built_in").eq("id", id).eq("master_plan_id", plan).maybeSingle();
      if (!pg) return fail("Page not found.");
      if (pg.built_in) return fail("Speakers and Topics stay. You can add or remove your own pages.");
      await db.from("lbd_pages").delete().eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "save_notes": {
      if (!id) return fail("Missing page.");
      await db.from("lbd_pages").update({ body: String(b.body ?? "").slice(0, 20000) }).eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "save_speaker": {
      const f = pick(b, SPEAKER_FIELDS);
      if (!id && !String(f.name ?? "").trim()) return fail("A speaker needs a name.");
      if (id) await db.from("lbd_speakers").update(f).eq("id", id).eq("master_plan_id", plan);
      else {
        const { data: last } = await db.from("lbd_speakers").select("position").eq("master_plan_id", plan).eq("event_key", ev).order("position", { ascending: false }).limit(1).maybeSingle();
        await db.from("lbd_speakers").insert({ ...f, master_plan_id: plan, event_key: ev, position: ((last?.position as number) ?? 0) + 1 });
      }
      return ok();
    }
    case "delete_speaker": {
      if (!id) return fail("Missing speaker.");
      await db.from("lbd_speakers").delete().eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "save_topic": {
      const f = pick(b, TOPIC_FIELDS);
      if (!id && !String(f.title ?? "").trim()) return fail("A topic needs a title.");
      if (id) await db.from("lbd_topics").update(f).eq("id", id).eq("master_plan_id", plan);
      else {
        const { data: last } = await db.from("lbd_topics").select("position").eq("master_plan_id", plan).eq("event_key", ev).order("position", { ascending: false }).limit(1).maybeSingle();
        await db.from("lbd_topics").insert({ ...f, master_plan_id: plan, event_key: ev, position: ((last?.position as number) ?? 0) + 1 });
      }
      return ok();
    }
    case "delete_topic": {
      if (!id) return fail("Missing topic.");
      await db.from("lbd_topics").delete().eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "save_item": {
      const f = pick(b, ITEM_FIELDS);
      if (id) {
        const { data: cur } = await db.from("lbd_items").select("task_id").eq("id", id).eq("master_plan_id", plan).maybeSingle();
        await db.from("lbd_items").update(f).eq("id", id).eq("master_plan_id", plan);
        if (cur?.task_id && typeof f.status === "string") {
          await db.from("tasks").update({ status: f.status === "done" ? "done" : f.status === "doing" ? "in_progress" : "backlog" }).eq("id", cur.task_id as number).eq("master_plan_id", plan);
        }
      } else {
        const pageId = typeof b.page_id === "string" ? b.page_id : null;
        if (!pageId || !String(f.title ?? "").trim()) return fail("Write what needs doing.");
        const { data: last } = await db.from("lbd_items").select("position").eq("page_id", pageId).order("position", { ascending: false }).limit(1).maybeSingle();
        await db.from("lbd_items").insert({ ...f, master_plan_id: plan, event_key: ev, page_id: pageId, position: ((last?.position as number) ?? 0) + 1 });
      }
      return ok();
    }
    case "delete_item": {
      if (!id) return fail("Missing item.");
      await db.from("lbd_items").delete().eq("id", id).eq("master_plan_id", plan);
      return ok();
    }
    case "to_task": {
      if (!id) return fail("Missing item.");
      const { data: it } = await db.from("lbd_items").select("*").eq("id", id).eq("master_plan_id", plan).maybeSingle();
      if (!it) return fail("Item not found.");
      if (it.task_id) return ok();
      const project = await ensureProject(db, plan, ev);
      if (!project) return fail("Couldn't set up the project.");
      const { data: t, error } = await db
        .from("tasks")
        .insert({
          master_plan_id: plan,
          project_id: project,
          business_id: EVENTS[ev].business,
          title: it.title as string,
          description: (it.note as string | null) ?? null,
          priority: "medium",
          status: it.status === "done" ? "done" : it.status === "doing" ? "in_progress" : "backlog",
          owner_action: String(it.owner ?? "").toLowerCase() !== "claude",
          due_date: (it.due_date as string | null) ?? null,
          time_kind: "deadline",
        })
        .select("id")
        .single();
      if (error || !t) return fail("Couldn't add it to your task list.");
      await db.from("lbd_items").update({ task_id: t.id }).eq("id", id);
      return NextResponse.json({ ok: true, task_id: t.id });
    }
    default:
      return fail("Unknown action.");
  }
}
