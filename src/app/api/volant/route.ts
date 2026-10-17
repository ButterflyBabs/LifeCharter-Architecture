import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { volantAccount } from "@/lib/volantServer";
import { cleanItemEdit, templateByKey, VOLANT_NAME, VOLANT_TEMPLATES, type VolantReport } from "@/lib/volant";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// LC Volant reports for the signed-in account.
//   GET                 -> { reports (no transcript), settings, templates }
//   GET ?id=            -> { report (with transcript) }
//   GET ?contact=       -> { reports } saved on that contact
//   POST { action }     -> approve-item | edit-item | remove-item | rename | delete | settings-save
const LIST = "id, template_key, title, session_date, contact_id, created_at, updated_at, report, seq_contacts(first_name, last_name, email)";
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const firstName = (full: unknown) => {
  const f = (typeof full === "string" ? full : "").trim().split(/\s+/)[0] || "";
  return /@/.test(f) ? "" : f;
};

async function loadSettings(db: ReturnType<typeof createServerClient>, planId: string) {
  const { data } = await db.from("volant_settings").select("label, template_names").eq("master_plan_id", planId).maybeSingle();
  return { label: (data?.label as string) || VOLANT_NAME, templateNames: (data?.template_names as Record<string, string>) ?? {} };
}

export async function GET(request: Request) {
  const a = await volantAccount();
  if ("denied" in a) return a.denied;
  const q = new URL(request.url).searchParams;
  const db = createServerClient();
  const id = q.get("id");
  if (id) {
    const { data } = await db.from("volant_reports").select(`${LIST}, transcript`).eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ report: data });
  }
  const contact = q.get("contact");
  let query = db.from("volant_reports").select(LIST).eq("master_plan_id", a.planId).order("session_date", { ascending: false }).order("created_at", { ascending: false }).limit(contact ? 50 : 200);
  if (contact) query = query.eq("contact_id", contact);
  const [{ data }, settings] = await Promise.all([query, loadSettings(db, a.planId)]);
  // The list carries only what a row needs (how many action items, how many approved), not the whole report.
  const reports = (data ?? []).map((r) => {
    const rep = r.report as VolantReport | null;
    const items = rep?.action_items ?? [];
    const { report: _omit, ...rest } = r;
    void _omit;
    return { ...rest, items: items.length, approved: items.filter((i) => i.task_id).length };
  });
  return NextResponse.json({ reports, settings, templates: VOLANT_TEMPLATES }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = str(b.action, 30);
  const db = createServerClient();
  const now = new Date().toISOString();

  if (action === "settings-save") {
    const names: Record<string, string> = {};
    const raw = (b.templateNames ?? {}) as Record<string, unknown>;
    for (const t of VOLANT_TEMPLATES) {
      const n = str(raw[t.key], 80);
      if (n && n !== t.name) names[t.key] = n;
    }
    const label = str(b.label, 40);
    const { error } = await db
      .from("volant_settings")
      .upsert({ master_plan_id: a.planId, label: label && label !== VOLANT_NAME ? label : null, template_names: names, updated_at: now }, { onConflict: "master_plan_id" });
    return error ? NextResponse.json({ error: "Couldn't save your names." }, { status: 500 }) : NextResponse.json({ ok: true, settings: await loadSettings(db, a.planId) });
  }

  const id = str(b.id, 60);
  const { data: row } = await db.from("volant_reports").select("id, title, session_date, template_key, report").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
  if (!row) return NextResponse.json({ error: "That report could not be found." }, { status: 404 });

  if (action === "delete") {
    const { error } = await db.from("volant_reports").delete().eq("id", row.id).eq("master_plan_id", a.planId);
    return error ? NextResponse.json({ error: "Couldn't delete the report." }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (action === "rename") {
    const title = str(b.title, 160);
    if (!title) return NextResponse.json({ error: "Give the report a name." }, { status: 400 });
    const { error } = await db.from("volant_reports").update({ title, updated_at: now }).eq("id", row.id).eq("master_plan_id", a.planId);
    return error ? NextResponse.json({ error: "Couldn't rename the report." }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  const report = row.report as VolantReport | null;
  if (!report) return NextResponse.json({ error: "This report has no action items." }, { status: 400 });
  const itemId = str(b.itemId, 40);
  const idx = report.action_items.findIndex((i) => i.id === itemId);
  if (idx === -1) return NextResponse.json({ error: "That action item could not be found." }, { status: 404 });
  const item = report.action_items[idx];
  const save = async (next: VolantReport) => {
    const { error } = await db.from("volant_reports").update({ report: next, updated_at: now }).eq("id", row.id).eq("master_plan_id", a.planId);
    return error;
  };

  if (action === "edit-item") {
    if (item.task_id) return NextResponse.json({ error: "This one is already in Tasks. Change it there." }, { status: 400 });
    const edit = cleanItemEdit(b.item);
    if (!edit.text) return NextResponse.json({ error: "The action item needs some words." }, { status: 400 });
    const next = { ...report, action_items: report.action_items.map((x, i) => (i === idx ? { ...x, ...edit } : x)) };
    const error = await save(next);
    return error ? NextResponse.json({ error: "Couldn't save that." }, { status: 500 }) : NextResponse.json({ ok: true, report: next });
  }

  if (action === "remove-item") {
    if (item.task_id) return NextResponse.json({ error: "This one is already in Tasks." }, { status: 400 });
    const next = { ...report, action_items: report.action_items.filter((_, i) => i !== idx) };
    const error = await save(next);
    return error ? NextResponse.json({ error: "Couldn't remove that." }, { status: 500 }) : NextResponse.json({ ok: true, report: next });
  }

  if (action === "approve-item") {
    // One action item becomes one task, only on the owner's own press. The item remembers its task so it can't be sent twice.
    if (item.task_id) return NextResponse.json({ ok: true, report, already: true });
    const t = templateByKey(row.template_key as string);
    const { data: plan } = await db.from("client_master_plans").select("client_name").eq("id", a.planId).maybeSingle();
    const me = firstName(plan?.client_name).toLowerCase();
    const house = await isHousePlan(a.planId, db);
    const o = item.owner.trim().toLowerCase();
    const mine = !o || o === me || (house && /^(babs|amilynne)/.test(o));
    const { data: task, error } = await db
      .from("tasks")
      .insert({
        master_plan_id: a.planId,
        title: item.text.slice(0, 200),
        description: `From the LC Volant report "${row.title}" (${t?.name ?? "report"}, ${row.session_date}).${item.owner ? ` Owner: ${item.owner}.` : ""}`,
        status: "backlog",
        priority: "medium",
        energy: "medium",
        due_date: item.due ? `${item.due}T00:00:00Z` : null,
        followup: {},
        owner_action: mine,
      })
      .select("id")
      .single();
    if (error || !task) return NextResponse.json({ error: "Couldn't add it to Tasks." }, { status: 500 });
    const next = { ...report, action_items: report.action_items.map((x, i) => (i === idx ? { ...x, task_id: task.id as number } : x)) };
    const saveErr = await save(next);
    if (saveErr) console.error("POST /api/volant approve-item save:", saveErr.message);
    return NextResponse.json({ ok: true, report: next, taskId: task.id });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
