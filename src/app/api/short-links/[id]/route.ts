import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";
import { normalizeDestination } from "@/lib/shortLinks";

export const dynamic = "force-dynamic";

// PATCH { destinationUrl?, title?, active? } — edit or switch a short link
// on/off. The code itself never changes (the whole point is a stable,
// already-shared URL) — delete and make a new one for that.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.destinationUrl !== undefined) {
    const destination = normalizeDestination(typeof body.destinationUrl === "string" ? body.destinationUrl : "");
    if (!destination) return NextResponse.json({ error: "Enter a valid destination URL." }, { status: 400 });
    update.destination_url = destination;
  }
  if (body.title !== undefined) update.title = typeof body.title === "string" ? body.title.trim().slice(0, 200) || null : null;
  if (body.active !== undefined) update.active = Boolean(body.active);

  const { data, error } = await db
    .from("short_links")
    .update(update)
    .eq("id", params.id)
    .eq("master_plan_id", a.planId) // only your own link, ever
    .select("id, code, destination_url, title, active, click_count, created_at, updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ link: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { error } = await db.from("short_links").delete().eq("id", params.id).eq("master_plan_id", a.planId);
  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
