import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";

// PATCH { label?, options? } renames a field or changes its choices ·
// DELETE removes the field and clears its value from every contact.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof b.label === "string" && b.label.trim()) patch.label = b.label.trim().slice(0, 60);
  if (Array.isArray(b.options)) patch.options = b.options.map((o: unknown) => String(o).trim().slice(0, 60)).filter(Boolean).slice(0, 30);
  const { data, error } = await createServerClient().from("crm_custom_fields").update(patch).eq("id", params.id).eq("master_plan_id", a.planId).select("id, key, label, type, options, position").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save." }, { status: error ? 500 : 404 });
  return NextResponse.json({ field: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: f } = await db.from("crm_custom_fields").select("key").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!f) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const key = f.key as string;
  for (let i = 0; i < 100; i++) {
    const { data: rows } = await db.from("seq_contacts").select("id, custom").eq("master_plan_id", a.planId).not(`custom->>${key}`, "is", null).limit(500);
    if (!rows?.length) break;
    for (const r of rows) {
      const next = { ...((r.custom as Record<string, unknown>) ?? {}) };
      delete next[key];
      await db.from("seq_contacts").update({ custom: next }).eq("id", r.id).eq("master_plan_id", a.planId);
    }
  }
  await db.from("crm_custom_fields").delete().eq("id", params.id).eq("master_plan_id", a.planId);
  return NextResponse.json({ ok: true });
}
