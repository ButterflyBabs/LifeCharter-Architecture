import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

const FIELD_TYPES = ["text", "long_text", "number", "date", "url", "select"] as const;

// The account's own extra contact fields (values live on each contact under `custom`).
// GET → fields · POST { label, type?, options? } → add one
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const { data } = await createServerClient().from("crm_custom_fields").select("id, key, label, type, options, position").eq("master_plan_id", a.planId).order("position").order("created_at");
  return NextResponse.json({ fields: data ?? [] });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const label = typeof b.label === "string" ? b.label.trim().slice(0, 60) : "";
  if (!label) return NextResponse.json({ error: "Give the field a name." }, { status: 400 });
  const type = (FIELD_TYPES as readonly string[]).includes(b.type) ? b.type : "text";
  const options = type === "select" && Array.isArray(b.options) ? b.options.map((o: unknown) => String(o).trim().slice(0, 60)).filter(Boolean).slice(0, 30) : [];
  if (type === "select" && !options.length) return NextResponse.json({ error: "Add at least one choice." }, { status: 400 });
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "field";
  const db = createServerClient();
  const { data: existing } = await db.from("crm_custom_fields").select("key, position").eq("master_plan_id", a.planId);
  const keys = new Set((existing ?? []).map((f) => f.key as string));
  let key = base;
  for (let i = 2; keys.has(key); i++) key = `${base}_${i}`;
  const position = Math.max(0, ...(existing ?? []).map((f) => (f.position as number) ?? 0)) + 1;
  const { data, error } = await db.from("crm_custom_fields").insert({ master_plan_id: a.planId, key, label, type, options, position }).select("id, key, label, type, options, position").single();
  if (error) return NextResponse.json({ error: "Couldn't add the field." }, { status: 500 });
  return NextResponse.json({ field: data });
}
