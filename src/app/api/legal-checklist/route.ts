import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { LEGAL_ITEMS } from "@/lib/legalChecklist";

export const dynamic = "force-dynamic";

// Legal & Compliance checklist state for this client.
//   GET                                   → saved states
//   POST { itemKey, status?, dueDate?, notes?, docLink? }   → save one item
//   POST { action: "custom", title, group }                  → add their own item
//   DELETE { itemKey }                    → remove a custom item (or reset a standard one)

const KEYS = new Set(LEGAL_ITEMS.map((i) => i.key));
const STATUSES = new Set(["not_started", "in_progress", "done", "na"]);
const SELECT = "item_key, status, due_date, notes, doc_link, custom_title, custom_group";

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ states: [] });
  const { data } = await createServerClient().from("legal_checklist").select(SELECT).eq("master_plan_id", masterPlanId);
  return NextResponse.json({ states: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const db = createServerClient();

  if (body.action === "custom") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!title) return NextResponse.json({ error: "Name the item." }, { status: 400 });
    const { data, error } = await db
      .from("legal_checklist")
      .insert({ master_plan_id: masterPlanId, item_key: `custom:${crypto.randomUUID()}`, custom_title: title, custom_group: typeof body.group === "string" ? body.group.slice(0, 80) : "My items" })
      .select(SELECT)
      .single();
    if (error) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
    return NextResponse.json({ state: data });
  }

  const itemKey = typeof body.itemKey === "string" ? body.itemKey : "";
  if (!KEYS.has(itemKey) && !itemKey.startsWith("custom:")) return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  const row: Record<string, unknown> = { master_plan_id: masterPlanId, item_key: itemKey, updated_at: new Date().toISOString() };
  if (typeof body.status === "string" && STATUSES.has(body.status)) row.status = body.status;
  if (body.dueDate !== undefined) row.due_date = typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null;
  if (typeof body.notes === "string") row.notes = body.notes.trim().slice(0, 1000) || null;
  if (typeof body.docLink === "string") row.doc_link = body.docLink.trim().slice(0, 500) || null;
  const { data, error } = await db.from("legal_checklist").upsert(row, { onConflict: "master_plan_id,item_key" }).select(SELECT).single();
  if (error) {
    console.error("legal checklist save:", error.message);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
  return NextResponse.json({ state: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  if (!masterPlanId || typeof body.itemKey !== "string") return NextResponse.json({ error: "Missing item." }, { status: 400 });
  await createServerClient().from("legal_checklist").delete().eq("master_plan_id", masterPlanId).eq("item_key", body.itemKey);
  return NextResponse.json({ ok: true });
}
