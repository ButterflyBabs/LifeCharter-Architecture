import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor, sessionUser } from "@/lib/authz";
import { crmAccount } from "../crm/guard";
import { act, aiHelp, isErr, createPartnership, loadView, partnershipById, sideOfPlan, type Partnership, type Side } from "@/lib/accountability";

export const dynamic = "force-dynamic";

// Accountability partners, for the signed-in account.
//   GET            → my partnerships (started by me, or inviting me) with light stats
//   GET ?id=       → one partnership's full view (the same shape the partner's private link gets)
//   GET ?tasks=1   → my open tasks, to share one into a partnership
//   POST { action: "invite", name, email }
//   POST { id, action, ... }   → any partnership action (see lib/accountability), or action "ai"
// A partner only ever sees what is added to the partnership; nothing else in the account.

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  // Private to the account's owner: an invited team member never sees these.
  if ((await resolveActor()).kind === "member") return NextResponse.json({ error: "Accountability Partner is private to the account owner." }, { status: 403 });
  const db = createServerClient();
  const url = new URL(request.url);

  if (url.searchParams.get("tasks")) {
    const { data } = await db.from("tasks").select("id, title, due_date").eq("master_plan_id", a.planId).neq("status", "done").order("created_at", { ascending: false }).limit(60);
    return NextResponse.json({ tasks: data ?? [] });
  }

  const id = url.searchParams.get("id");
  if (id) {
    const p = await partnershipById(db, id);
    const side = p ? sideOfPlan(p, a.planId) : null;
    if (!p || !side) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(await loadView(db, p, side));
  }

  const { data } = await db.from("accountability_partnerships").select("*").or(`a_plan_id.eq.${a.planId},b_plan_id.eq.${a.planId}`).order("created_at", { ascending: false });
  const rows = (data ?? []) as Partnership[];
  const ids = rows.map((r) => r.id);
  const [{ data: items }, { data: nudges }] = ids.length
    ? await Promise.all([
        db.from("accountability_items").select("partnership_id, side, status, due_on").in("partnership_id", ids),
        db.from("accountability_nudges").select("partnership_id, to_side").in("partnership_id", ids).is("read_at", null),
      ])
    : [{ data: [] }, { data: [] }];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  const partnerships = rows.map((p) => {
    const side: Side = p.a_plan_id === a.planId ? "a" : "b";
    const mine = ((items ?? []) as { partnership_id: string; side: Side; status: string; due_on: string | null }[]).filter((i) => i.partnership_id === p.id && i.side === side);
    return {
      id: p.id,
      side,
      status: p.status,
      partnerName: (side === "a" ? p.b_name : p.a_name) || "Your partner",
      invitedMe: side === "b" && p.status === "invited",
      link: side === "a" && !p.b_plan_id ? `https://lccommandsuite.com/partner/${p.token}` : null,
      open: mine.filter((i) => i.status !== "done").length,
      done: mine.filter((i) => i.status === "done").length,
      overdue: mine.filter((i) => i.status !== "done" && i.due_on && i.due_on < today).length,
      unread: ((nudges ?? []) as { partnership_id: string; to_side: Side }[]).filter((n) => n.partnership_id === p.id && n.to_side === side).length,
    };
  });
  return NextResponse.json({ partnerships });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  // Private to the account's owner: an invited team member never sees these.
  if ((await resolveActor()).kind === "member") return NextResponse.json({ error: "Accountability Partner is private to the account owner." }, { status: 403 });
  const db = createServerClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "invite") {
    const user = await sessionUser();
    let inviterName = "";
    if (user?.id) {
      const { data: prof } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      inviterName = ((prof?.full_name as string) || "").trim();
    }
    const r = await createPartnership(db, a.planId, inviterName || (a.userEmail || "").split("@")[0], a.userEmail || "", String(body.name || ""), String(body.email || ""));
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, id: r.partnership.id, link: r.partnership.b_plan_id ? null : `https://lccommandsuite.com/partner/${r.partnership.token}` });
  }

  const p = typeof body.id === "string" ? await partnershipById(db, body.id) : null;
  const side = p ? sideOfPlan(p, a.planId) : null;
  if (!p || !side) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const r = body.action === "ai" ? await aiHelp(db, p, side, body) : await act(db, p, side, body);
  if (isErr(r)) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
