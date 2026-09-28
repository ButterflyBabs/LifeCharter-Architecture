import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planMembers } from "@/lib/taskAssignees";
import { AREA_LABEL, ENTITY_AREA, type ActivityArea, type EntityType } from "@/lib/activity";

export const dynamic = "force-dynamic";

// The account's activity log (cs184), for the owner and admins only.
//   GET ?person=<memberId|owner>&area=<area>&from=YYYY-MM-DD&to=YYYY-MM-DD
// → { entries, people, areas, weekly }. `weekly` is always the past 7 days for
// everyone: "Dana: completed 3 tasks, added 5 expenses".

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

type Row = {
  id: number;
  actor_member_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
};

const NOUN: Record<string, [string, string]> = {
  task: ["task", "tasks"],
  expense: ["expense", "expenses"],
  income: ["income entry", "income entries"],
  bill: ["bill", "bills"],
  deal: ["deal", "deals"],
  sop: ["SOP", "SOPs"],
  goal: ["goal", "goals"],
  content_post: ["post", "posts"],
  script: ["script", "scripts"],
  sales_activity: ["sales activity", "sales activities"],
};
const VERB: Record<string, string> = {
  created: "added",
  completed: "completed",
  reopened: "reopened",
  reassigned: "reassigned",
  updated: "updated",
  deleted: "deleted",
  paid: "paid",
  won: "won",
  lost: "lost",
  moved: "moved",
  published: "published",
};

function phrase(action: string, entity: string, n: number): string {
  const noun = NOUN[entity] ?? [entity.replace(/_/g, " "), entity.replace(/_/g, " ")];
  if (entity === "sales_activity" && action === "created") return `logged ${n} ${n === 1 ? noun[0] : noun[1]}`;
  if (entity === "deal" && (action === "won" || action === "lost")) return `${action} ${n} ${n === 1 ? noun[0] : noun[1]}`;
  return `${VERB[action] ?? action} ${n} ${n === 1 ? noun[0] : noun[1]}`;
}

export async function GET(request: Request) {
  // Owner (or a client account holder) and admins only. Enforced here, not just in the menu.
  const actor = await resolveActor();
  if (actor.kind === "member" && actor.role !== "admin") {
    return NextResponse.json({ error: "Only the account owner or an admin can see team activity." }, { status: 403 });
  }
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const person = url.searchParams.get("person") || "";
  const area = (url.searchParams.get("area") || "") as ActivityArea | "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const db = createServerClient();
  let qy = db
    .from("account_activity")
    .select("id, actor_member_id, actor_name, action, entity_type, entity_id, summary, created_at")
    .eq("master_plan_id", masterPlanId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (person === "owner") qy = qy.is("actor_member_id", null);
  else if (UUID.test(person)) qy = qy.eq("actor_member_id", person);
  if (area && area in AREA_LABEL) {
    const types = (Object.keys(ENTITY_AREA) as EntityType[]).filter((t) => ENTITY_AREA[t] === area);
    qy = qy.in("entity_type", types);
  }
  if (DATE.test(from)) qy = qy.gte("created_at", `${from}T00:00:00Z`);
  if (DATE.test(to)) {
    const end = new Date(`${to}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    qy = qy.lt("created_at", end.toISOString());
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: rows, error }, { data: week }, members] = await Promise.all([
    qy,
    db
      .from("account_activity")
      .select("actor_member_id, actor_name, action, entity_type")
      .eq("master_plan_id", masterPlanId)
      .gte("created_at", weekAgo)
      .limit(5000),
    planMembers(masterPlanId),
  ]);
  if (error) {
    console.error("GET /api/team/activity:", error.message);
    return NextResponse.json({ error: "Couldn't load activity." }, { status: 500 });
  }

  const entries = ((rows || []) as Row[]).map((r) => ({
    id: r.id,
    personId: r.actor_member_id ?? "owner",
    name: r.actor_name || (r.actor_member_id ? "Team member" : "Account owner"),
    isOwner: !r.actor_member_id,
    action: r.action,
    area: ENTITY_AREA[r.entity_type as EntityType] ?? null,
    summary: r.summary,
    at: r.created_at,
  }));

  // Weekly summary per person.
  const byPerson = new Map<string, { name: string; isOwner: boolean; counts: Map<string, number>; total: number }>();
  for (const r of (week || []) as Pick<Row, "actor_member_id" | "actor_name" | "action" | "entity_type">[]) {
    const id = r.actor_member_id ?? "owner";
    const p = byPerson.get(id) ?? { name: r.actor_name || (r.actor_member_id ? "Team member" : "Account owner"), isOwner: !r.actor_member_id, counts: new Map(), total: 0 };
    const k = `${r.action}|${r.entity_type}`;
    p.counts.set(k, (p.counts.get(k) ?? 0) + 1);
    p.total += 1;
    byPerson.set(id, p);
  }
  const weekly = Array.from(byPerson.entries())
    .map(([personId, p]) => ({
      personId,
      name: p.name,
      isOwner: p.isOwner,
      total: p.total,
      lines: Array.from(p.counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => {
          const [action, entity] = k.split("|");
          return phrase(action, entity, n);
        }),
    }))
    .sort((a, b) => (a.isOwner === b.isOwner ? b.total - a.total : a.isOwner ? 1 : -1));

  const people = [{ id: "owner", name: "Account owner" }, ...members.map((m) => ({ id: m.id, name: m.name || m.email }))];
  const areas = (Object.keys(AREA_LABEL) as ActivityArea[]).map((k) => ({ id: k, label: AREA_LABEL[k] }));

  return NextResponse.json({ entries, people, areas, weekly }, { headers: { "Cache-Control": "no-store" } });
}
