import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { notifyNewRequest, confirmToClient } from "@/lib/support/email";

export const dynamic = "force-dynamic";

// The light-bulb button's three kinds, from any signed-in Suite user:
//   glitch     — private to the submitter's own account (their team only)
//   suggestion — global: every signed-in user, any account, sees and can vote
//   feedback   — same as suggestion, global
// GET  ?kind=glitch|suggestion|feedback → that list, newest/most-voted first
// POST { kind, title, description, alsoTicket? } → submit one

const KINDS = ["glitch", "suggestion", "feedback"] as const; // what a client can submit
type Kind = (typeof KINDS)[number];
// "update" is read-only for clients: notes from the team about what is new or fixed, shown to everyone.
const READ_KINDS = [...KINDS, "update"] as const;

export async function GET(request: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ items: [] });
  const kind = new URL(request.url).searchParams.get("kind") as Kind | "update" | null;
  if (!kind || !(READ_KINDS as readonly string[]).includes(kind)) return NextResponse.json({ error: "Unknown kind." }, { status: 400 });
  const db = createServerClient();

  if (kind === "update") {
    const { data } = await db
      .from("feedback_items")
      .select("id, kind, title, description, status, submitter_name, created_at")
      .eq("kind", "update")
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ items: data ?? [] });
  }

  if (kind === "glitch") {
    const planId = await resolveMasterPlanId();
    if (!planId) return NextResponse.json({ items: [] });
    const { data } = await db
      .from("feedback_items")
      .select("id, kind, title, description, status, submitter_name, support_request_id, created_at")
      .eq("master_plan_id", planId)
      .eq("kind", "glitch")
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json({ items: data ?? [] });
  }

  // Global board: every signed-in user, every account.
  const [{ data: items }, { data: myVotes }] = await Promise.all([
    db
      .from("feedback_items")
      .select("id, kind, title, description, status, submitter_name, vote_count, created_at")
      .eq("kind", kind)
      .neq("status", "closed")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("feedback_votes").select("item_id").eq("user_id", user.id),
  ]);
  const voted = new Set(((myVotes ?? []) as { item_id: string }[]).map((v) => v.item_id));
  return NextResponse.json({
    items: ((items ?? []) as Array<Record<string, unknown>>).map((i) => ({ ...i, myVote: voted.has(i.id as string) })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const kind = body.kind as Kind;
  if (!KINDS.includes(kind)) return NextResponse.json({ error: "Choose Glitch, Suggestion or Feedback." }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
  if (!title || !description) return NextResponse.json({ error: "Add a short title and a description." }, { status: 400 });

  const db = createServerClient();
  const planId = await resolveMasterPlanId();
  const { data: prof } = await db.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  const fullName = ((prof?.full_name as string) || "").trim();
  const submitterName = fullName.split(/\s+/)[0] || (user.email ?? "").split("@")[0] || "A client";

  const { data: created, error } = await db
    .from("feedback_items")
    .insert({ kind, master_plan_id: planId, user_id: user.id, submitter_name: submitterName, title, description })
    .select("id, kind, title, description, status, submitter_name, vote_count, support_request_id, created_at")
    .single();
  if (error || !created) {
    console.error("POST /api/feedback:", error?.message);
    return NextResponse.json({ error: "Couldn't submit that. Please try again." }, { status: 500 });
  }

  let ticketCreated = false;
  if (kind === "glitch" && body.alsoTicket === true) {
    const email = ((prof?.email as string) || user.email || "").trim();
    const { data: ticket } = await db
      .from("support_requests")
      .insert({
        user_id: user.id,
        master_plan_id: planId,
        name: fullName || submitterName,
        email,
        category: "technical",
        priority: "normal",
        subject: title,
        message: description,
        status: "open",
        source: "glitch",
      })
      .select("id")
      .maybeSingle();
    if (ticket?.id) {
      await db.from("feedback_items").update({ support_request_id: ticket.id }).eq("id", created.id);
      created.support_request_id = ticket.id;
      ticketCreated = true;
      const r = { id: ticket.id as string, name: fullName || submitterName, email, subject: title, message: description, category: "technical", priority: "normal", source: "glitch" };
      await Promise.allSettled([notifyNewRequest(r), confirmToClient(r)]);
    }
  }

  return NextResponse.json({ item: created, ticketCreated });
}
