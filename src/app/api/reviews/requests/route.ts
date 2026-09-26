import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";

export const dynamic = "force-dynamic";
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// POST — create a review request: a personal link this client can send to one
// of THEIR clients. Nothing is emailed from here; they send the link themselves.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const client_name = str(b.clientName, 120);
  if (!client_name) return NextResponse.json({ error: "Who is this request for?" }, { status: 400 });

  const db = createServerClient();
  // Who the request is "from" on the page their client sees: what the sender typed,
  // else their own name on file.
  let from_name = str(b.fromName, 120);
  if (!from_name) {
    const user = await sessionUser();
    if (user) {
      const { data: p } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      from_name = ((p?.full_name as string) || "").trim();
    }
  }
  const token = randomBytes(18).toString("hex");
  const { data, error } = await db
    .from("review_requests")
    .insert({
      master_plan_id: planId, token, client_name, client_email: str(b.clientEmail, 200) || null, program: str(b.program, 120),
      from_name, message: str(b.message, 1500),
    })
    .select("id, token, client_name, client_email, program, from_name, message, status, created_at, completed_at")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't create the request." }, { status: 500 });
  return NextResponse.json({ request: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await createServerClient().from("review_requests").delete().eq("id", id).eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
