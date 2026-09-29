import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../guard";
import { cleanFields } from "../clean";

export const dynamic = "force-dynamic";

// One form: GET → form + recent submissions · PATCH → settings / fields
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: form } = await db.from("crm_forms").select("*").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!form) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: subs } = await db.from("crm_submissions").select("id, data, page_url, created_at, contact_id").eq("form_id", form.id).order("created_at", { ascending: false }).limit(200);
  return NextResponse.json({ form, submissions: subs ?? [] });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim().slice(0, 120);
  if (typeof b.description === "string") patch.description = b.description.trim().slice(0, 500) || null;
  if (typeof b.successMessage === "string" && b.successMessage.trim()) patch.success_message = b.successMessage.trim().slice(0, 500);
  if (typeof b.submitLabel === "string") patch.submit_label = b.submitLabel.trim().slice(0, 40) || null;
  if (typeof b.notify === "boolean") patch.notify = b.notify;
  if (typeof b.active === "boolean") patch.active = b.active;
  if (Array.isArray(b.tags)) patch.tags = Array.from(new Set(b.tags.map((t: unknown) => String(t).trim().toLowerCase().slice(0, 60)).filter(Boolean)));
  if (b.sequenceKey !== undefined) patch.sequence_key = typeof b.sequenceKey === "string" && b.sequenceKey.trim() ? b.sequenceKey.trim().slice(0, 60) : null;
  const fields = b.fields !== undefined ? cleanFields(b.fields) : null;
  if (fields) patch.fields = fields;
  const { data, error } = await createServerClient().from("crm_forms").update(patch).eq("id", params.id).eq("master_plan_id", a.planId).select("*").single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ form: data });
}
