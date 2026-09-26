import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const COLS = "id, client_name, client_email, program, rating, type, headline, content, media_url, status, consent, source, shares, created_at";
const STATUSES = ["pending", "approved", "featured", "hidden"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// GET — this client's own testimonials and review requests, with real stats.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ testimonials: [], requests: [], stats: null });
  const db = createServerClient();
  const [{ data: t }, { data: r }] = await Promise.all([
    db.from("testimonials").select(COLS).eq("master_plan_id", planId).order("created_at", { ascending: false }).limit(500),
    db.from("review_requests").select("id, token, client_name, client_email, program, from_name, message, status, created_at, completed_at").eq("master_plan_id", planId).order("created_at", { ascending: false }).limit(200),
  ]);
  const testimonials = (t ?? []) as { rating: number | null; status: string; type: string; shares: number; created_at: string }[];
  const requests = (r ?? []) as { status: string }[];
  const rated = testimonials.filter((x) => x.rating);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const stats = {
    total: testimonials.length,
    thisMonth: testimonials.filter((x) => x.created_at >= monthStart).length,
    averageRating: rated.length ? Math.round((rated.reduce((s, x) => s + (x.rating ?? 0), 0) / rated.length) * 10) / 10 : null,
    pending: testimonials.filter((x) => x.status === "pending").length,
    approved: testimonials.filter((x) => x.status === "approved" || x.status === "featured").length,
    featured: testimonials.filter((x) => x.status === "featured").length,
    shares: testimonials.reduce((s, x) => s + (x.shares || 0), 0),
    requestsSent: requests.length,
    requestsCompleted: requests.filter((x) => x.status === "completed").length,
    responseRate: requests.length ? Math.round((requests.filter((x) => x.status === "completed").length / requests.length) * 100) : null,
  };
  return NextResponse.json({ testimonials: t ?? [], requests: r ?? [], stats });
}

// POST — add a review received somewhere else (a message, an email, a post).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const content = str(b.content, 5000);
  const client_name = str(b.clientName, 120);
  if (!content || !client_name) return NextResponse.json({ error: "Add who said it and what they said." }, { status: 400 });
  const rating = Math.round(Number(b.rating));
  const { data, error } = await createServerClient()
    .from("testimonials")
    .insert({
      master_plan_id: planId, client_name, program: str(b.program, 120), content, headline: str(b.headline, 200),
      rating: rating >= 1 && rating <= 5 ? rating : null, source: "manual", status: "approved", consent: b.consent === true,
    })
    .select(COLS)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ testimonial: data });
}

// PATCH — approve / feature / hide, edit wording, or count a share.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const id = str(b.id, 60);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const db = createServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (STATUSES.includes(b.status)) patch.status = b.status;
  if (typeof b.headline === "string") patch.headline = str(b.headline, 200);
  if (typeof b.content === "string" && b.content.trim()) patch.content = str(b.content, 5000);
  if (b.action === "share") {
    const { data: cur } = await db.from("testimonials").select("shares").eq("id", id).eq("master_plan_id", planId).maybeSingle();
    patch.shares = ((cur?.shares as number | undefined) ?? 0) + 1;
  }
  const { data, error } = await db.from("testimonials").update(patch).eq("id", id).eq("master_plan_id", planId).select(COLS).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ testimonial: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await createServerClient().from("testimonials").delete().eq("id", id).eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
