import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { OPERATIONS_PILLARS } from "@/lib/operations";

export const dynamic = "force-dynamic";

interface Derived {
  nkey: string;
  type: string;
  title: string;
  body: string;
  href: string;
}

// Synthesize the current set of "derived" notifications from live business
// state. Each has a stable nkey so read/dismissed state persists. Every source
// is best-effort — a failure in one never blocks the others.
async function deriveNotifications(
  supabase: ReturnType<typeof createServerClient>,
  masterPlanId: string
): Promise<Derived[]> {
  const out: Derived[] = [];
  const nowIso = new Date().toISOString();

  // 1. Uncategorized expenses → tax accuracy.
  try {
    const { data } = await supabase
      .from("finance_entries")
      .select("id, category")
      .eq("master_plan_id", masterPlanId)
      .eq("type", "expense");
    const uncat = (data || []).filter(
      (e: { category: string | null }) => !e.category || !String(e.category).trim()
    ).length;
    if (uncat > 0) {
      out.push({
        nkey: "uncat-expenses",
        type: "warning",
        title: `${uncat} expense${uncat === 1 ? "" : "s"} need categorizing`,
        body: "Categorize these before your next estimated-tax calculation for an accurate number.",
        href: "/finance/tax",
      });
    }
  } catch {
    /* best effort */
  }

  // 2. Operational pillars marked "needs attention".
  try {
    const { data } = await supabase
      .from("operations_pillars")
      .select("pillar_key, status")
      .eq("master_plan_id", masterPlanId)
      .eq("status", "needs_attention");
    const nameOf = (k: string) => OPERATIONS_PILLARS.find((p) => p.key === k)?.name || k;
    for (const row of (data || []) as { pillar_key: string }[]) {
      out.push({
        nkey: `pillar-attn:${row.pillar_key}`,
        type: "action",
        title: `${nameOf(row.pillar_key)} needs attention`,
        body: "You flagged this operational pillar — take one step to move it forward.",
        href: "/operations",
      });
    }
  } catch {
    /* best effort */
  }

  // 3. Tasks due today or overdue (not done).
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, due_at, due_date")
      .neq("status", "done");
    const due = (data || []).filter((t: { due_at: string | null; due_date: string | null }) => {
      const d = t.due_at || t.due_date;
      return d ? new Date(d).getTime() <= Date.now() : false;
    });
    if (due.length > 0) {
      out.push({
        nkey: "tasks-due",
        type: "action",
        title: `${due.length} task${due.length === 1 ? "" : "s"} due`,
        body:
          due.length === 1
            ? `"${String((due[0] as { title: string }).title).slice(0, 60)}" is due.`
            : "You have tasks due today or overdue — knock them out.",
        href: "/tasks",
      });
    }
  } catch {
    /* best effort */
  }

  // 4. Follow-ups that are due (tasks with a followup.dueAt in the past).
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, followup, status")
      .neq("status", "done");
    const dueFollowups = (data || []).filter((t: { followup: unknown }) => {
      const f = t.followup as { dueAt?: string; nextAt?: string } | null;
      const at = f?.dueAt || f?.nextAt;
      return at ? new Date(at).getTime() <= Date.now() : false;
    });
    if (dueFollowups.length > 0) {
      out.push({
        nkey: "followups-due",
        type: "action",
        title: `${dueFollowups.length} follow-up${dueFollowups.length === 1 ? "" : "s"} ready`,
        body: "Contacts are due for a follow-up — reach out while you're top of mind.",
        href: "/daily-compass",
      });
    }
  } catch {
    /* best effort */
  }

  void nowIso;
  return out;
}

export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ items: [], unread: 0 });

  const derived = await deriveNotifications(supabase, masterPlanId);
  const derivedKeys = new Set(derived.map((d) => d.nkey));

  // Existing rows for this client.
  const { data: existingRows } = await supabase
    .from("notifications")
    .select("id, nkey, read, dismissed")
    .eq("master_plan_id", masterPlanId);
  const existing = new Map(
    ((existingRows || []) as { id: string; nkey: string | null; read: boolean; dismissed: boolean }[])
      .filter((r) => r.nkey)
      .map((r) => [r.nkey as string, r])
  );

  // Upsert current derived notifications, preserving read/dismissed state.
  for (const d of derived) {
    const prev = existing.get(d.nkey);
    if (prev) {
      await supabase
        .from("notifications")
        .update({ title: d.title, body: d.body, href: d.href, type: d.type, updated_at: new Date().toISOString() })
        .eq("id", prev.id);
    } else {
      await supabase.from("notifications").insert({
        master_plan_id: masterPlanId,
        nkey: d.nkey,
        type: d.type,
        title: d.title,
        body: d.body,
        href: d.href,
      });
    }
  }

  // Remove derived rows whose condition no longer holds (keep one-offs: nkey null).
  const staleIds = ((existingRows || []) as { id: string; nkey: string | null }[])
    .filter((r) => r.nkey && !derivedKeys.has(r.nkey))
    .map((r) => r.id);
  if (staleIds.length) {
    await supabase.from("notifications").delete().in("id", staleIds);
  }

  const { data: finalRows } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read, created_at")
    .eq("master_plan_id", masterPlanId)
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const items = (finalRows || []) as {
    id: string;
    type: string;
    title: string;
    body: string;
    href: string;
    read: boolean;
    created_at: string;
  }[];
  const unread = items.filter((i) => !i.read).length;

  return NextResponse.json({ items, unread });
}

// POST — { action: "read" | "read_all" | "dismiss", id? }
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === "read_all") {
    await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("master_plan_id", masterPlanId)
      .eq("read", false);
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  if (action === "dismiss") {
    await supabase
      .from("notifications")
      .update({ dismissed: true, read: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("master_plan_id", masterPlanId);
    return NextResponse.json({ ok: true });
  }

  // Default: mark read.
  await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  return NextResponse.json({ ok: true });
}
