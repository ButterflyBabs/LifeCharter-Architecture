import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { isDemoRequest, resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { notifyClientReply } from "@/lib/support/email";

export const dynamic = "force-dynamic";

// A client's own support requests and their conversations.
//   GET → my requests (newest first) with replies     POST { id, body } → I reply
export async function GET() {
  const demo = isDemoRequest();
  const user = demo ? null : await sessionUser();
  if (!user && !demo) return NextResponse.json({ requests: [] });
  const db = createServerClient();
  // Demo visitors see the demo account's hand-written tickets (kept out of the hourly reset).
  const demoPlan = demo ? await resolveMasterPlanId() : null;
  if (demo && !demoPlan) return NextResponse.json({ requests: [] });
  let q = db.from("support_requests").select("id, subject, category, status, message, created_at, updated_at");
  q = demoPlan ? q.eq("master_plan_id", demoPlan) : q.eq("user_id", user!.id);
  const { data: reqs } = await q.order("created_at", { ascending: false }).limit(30);
  const ids = ((reqs ?? []) as { id: string }[]).map((r) => r.id);
  const { data: replies } = ids.length ? await db.from("support_replies").select("request_id, author, body, created_at").in("request_id", ids).order("created_at") : { data: [] };
  return NextResponse.json({
    requests: ((reqs ?? []) as { id: string }[]).map((r) => ({ ...r, replies: ((replies ?? []) as { request_id: string }[]).filter((x) => x.request_id === r.id) })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  if (typeof body.id !== "string" || !text) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  const db = createServerClient();
  const { data: r } = await db.from("support_requests").select("id, name, subject").eq("id", body.id).eq("user_id", user.id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  await db.from("support_replies").insert({ request_id: r.id, author: "client", body: text });
  await db.from("support_requests").update({ status: "open", resolved_at: null, updated_at: new Date().toISOString() }).eq("id", r.id);
  await notifyClientReply({ id: r.id as string, name: r.name as string, subject: r.subject as string }, text).catch(() => {});
  return NextResponse.json({ ok: true });
}
