import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { notifySupportReply } from "@/lib/support/email";

export const dynamic = "force-dynamic";

// The Support Desk inbox (Alignment Architect only).
//   GET ?status=open|in_progress|waiting|resolved|all        → requests + replies
//   POST { id, body?, status? }  → reply to the client (emailed) and/or change status
const STATUSES = ["open", "in_progress", "waiting", "resolved"];

export async function GET(request: Request) {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const status = new URL(request.url).searchParams.get("status") || "active";
  const db = createServerClient();
  let q = db.from("support_requests").select("id, name, email, category, priority, subject, message, status, source, created_at, updated_at, resolved_at").order("updated_at", { ascending: false }).limit(200);
  if (status === "active") q = q.neq("status", "resolved");
  else if (STATUSES.includes(status)) q = q.eq("status", status);
  const { data: reqs } = await q;
  const ids = ((reqs ?? []) as { id: string }[]).map((r) => r.id);
  const { data: replies } = ids.length ? await db.from("support_replies").select("request_id, author, body, created_at").in("request_id", ids).order("created_at") : { data: [] };
  const { data: counts } = await db.from("support_requests").select("status");
  const tally: Record<string, number> = {};
  for (const c of (counts ?? []) as { status: string | null }[]) tally[c.status || "open"] = (tally[c.status || "open"] ?? 0) + 1;
  return NextResponse.json({
    counts: tally,
    requests: ((reqs ?? []) as { id: string }[]).map((r) => ({ ...r, replies: ((replies ?? []) as { request_id: string }[]).filter((x) => x.request_id === r.id) })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing request." }, { status: 400 });
  const db = createServerClient();
  const { data: r } = await db.from("support_requests").select("id, name, email, subject").eq("id", body.id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  const status = STATUSES.includes(body.status) ? body.status : text ? "waiting" : null;
  if (text) await db.from("support_replies").insert({ request_id: r.id, author: "support", body: text });
  if (status || text) {
    await db
      .from("support_requests")
      .update({ ...(status ? { status } : {}), resolved_at: status === "resolved" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq("id", r.id);
  }
  let emailed = false;
  if (text) emailed = await notifySupportReply({ email: r.email as string, name: r.name as string, subject: r.subject as string }, text, status === "resolved").catch(() => false);
  return NextResponse.json({ ok: true, emailed });
}
