import { NextResponse } from "next/server";
import { isAlignmentArchitect, sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import {
  VIEW_AS_COOKIE,
  VIEW_AS_NAME_COOKIE,
  VIEW_AS_MAX_SECONDS,
  makeViewAsValue,
  readViewAs,
} from "@/lib/viewAs";

export const dynamic = "force-dynamic";

// "View as client" (Alignment Architect only). GET lists the clients and the recent log, POST opens
// one client's account read-only (and writes the access log), DELETE closes it. The cookie POST sets
// is signed; the middleware refuses every write while it is present.

export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const supabase = createServerClient();
  const me = await sessionUser();

  const { data: plans } = await supabase
    .from("client_master_plans")
    .select("id, client_name, client_email, status, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const clients = (plans || [])
    .filter((p) => p.client_name !== DEMO_PLAN_NAME && p.user_id !== me?.id && p.client_name !== "Primary")
    .map((p) => ({
      id: p.id as string,
      name: (p.client_name as string) || (p.client_email as string) || "Client",
      email: (p.client_email as string) || null,
      status: (p.status as string) || "active",
      createdAt: p.created_at as string,
    }));

  const { data: log } = await supabase
    .from("client_view_log")
    .select("id, master_plan_id, client_name, started_at, ended_at, reason")
    .order("started_at", { ascending: false })
    .limit(25);

  const active = readViewAs();
  return NextResponse.json(
    { clients, log: log || [], activePlanId: active?.planId ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const user = await sessionUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body: { planId?: string; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const planId = (body.planId || "").trim();
  if (!planId) return NextResponse.json({ error: "Choose a client." }, { status: 400 });
  const reason = (body.reason || "").trim().slice(0, 300) || null;

  const supabase = createServerClient();
  const { data: plan } = await supabase
    .from("client_master_plans")
    .select("id, client_name, client_email, user_id")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return NextResponse.json({ error: "That account wasn't found." }, { status: 404 });
  if (plan.client_name === DEMO_PLAN_NAME) return NextResponse.json({ error: "That is the demo account. Use Demo Account in the menu." }, { status: 400 });
  if (plan.user_id === user.id) return NextResponse.json({ error: "That is your own account." }, { status: 400 });

  // Close any earlier open view of this session before starting the next.
  const previous = readViewAs();
  if (previous) {
    await supabase.from("client_view_log").update({ ended_at: new Date().toISOString() }).eq("id", previous.logId).is("ended_at", null);
  }

  const name = (plan.client_name as string) || (plan.client_email as string) || "Client";
  const { data: row, error } = await supabase
    .from("client_view_log")
    .insert({
      master_plan_id: plan.id,
      client_name: name,
      viewer_email: user.email,
      viewer_user_id: user.id,
      reason,
      user_agent: (request.headers.get("user-agent") || "").slice(0, 300),
    })
    .select("id")
    .single();
  if (error || !row) {
    console.error("view-as log insert:", error?.message);
    return NextResponse.json({ error: "Couldn't record the access log, so nothing was opened." }, { status: 500 });
  }

  const expires = Date.now() + VIEW_AS_MAX_SECONDS * 1000;
  const res = NextResponse.json({ ok: true, name, expiresAt: new Date(expires).toISOString() });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(VIEW_AS_COOKIE, makeViewAsValue({ planId: plan.id as string, userId: user.id, logId: row.id as string, expires }), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: VIEW_AS_MAX_SECONDS,
  });
  res.cookies.set(VIEW_AS_NAME_COOKIE, encodeURIComponent(name), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: VIEW_AS_MAX_SECONDS,
  });
  return res;
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const active = readViewAs();
  if (active) {
    const supabase = createServerClient();
    await supabase.from("client_view_log").update({ ended_at: new Date().toISOString() }).eq("id", active.logId).is("ended_at", null);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEW_AS_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(VIEW_AS_NAME_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
