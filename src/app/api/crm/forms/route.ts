import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../guard";
import { cleanFields } from "./clean";

export const dynamic = "force-dynamic";

// GET → the account's forms with submission counts · POST → a new form
export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: forms } = await db.from("crm_forms").select("*").eq("master_plan_id", a.planId).order("created_at");
  const ids = (forms ?? []).map((f) => f.id as string);
  const { data: subs } = ids.length ? await db.from("crm_submissions").select("form_id, created_at").in("form_id", ids) : { data: [] as { form_id: string; created_at: string }[] };
  return NextResponse.json({
    forms: (forms ?? []).map((f) => {
      const mine = (subs ?? []).filter((s) => s.form_id === f.id);
      return { ...f, submissions: mine.length, last_submission: mine.map((s) => s.created_at).sort().pop() ?? null };
    }),
  });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  if (!name) return NextResponse.json({ error: "Give the form a name." }, { status: 400 });
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const fields = cleanFields(b.fields) ?? [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];
  const { data, error } = await createServerClient().from("crm_forms").insert({ master_plan_id: a.planId, key, name, fields, tags: [key] }).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A form with that name already exists." : "Couldn't create it." }, { status: 400 });
  return NextResponse.json({ form: data });
}
