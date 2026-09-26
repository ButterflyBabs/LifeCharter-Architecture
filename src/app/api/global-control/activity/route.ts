import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { dayWindowUtc, dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

const TYPES = ["call", "followup"] as const;
type ActivityType = (typeof TYPES)[number];

type Row = {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  type: string;
  note: string | null;
  created_at: string;
};

function serialize(r: Row) {
  return {
    id: r.id,
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    type: (TYPES.includes(r.type as ActivityType) ? r.type : "call") as ActivityType,
    note: r.note || "",
    createdAt: r.created_at,
  };
}

// GET — today's logged activity (counts + items) for the client, in their tz.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const tz = new URL(request.url).searchParams.get("tz") || "UTC";
  let startISO: string, endISO: string;
  try {
    ({ startISO, endISO } = dayWindowUtc(tz));
  } catch {
    ({ startISO, endISO } = dayWindowUtc("UTC"));
  }

  const { data, error } = await supabase
    .from("contact_activity_log")
    .select("id, contact_id, contact_name, type, note, created_at")
    .eq("master_plan_id", masterPlanId)
    .gte("created_at", startISO)
    .lt("created_at", endISO)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET activity:", error.message);
    return NextResponse.json({ calls: 0, followups: 0, items: [] }, { status: 200 });
  }

  const rows = (data || []) as Row[];
  const items = rows.map(serialize);

  // The other places these things get recorded today, so the counts reflect
  // ALL of the client's real activity, not just what's logged against a Global
  // Control contact:
  //  • Sales Activities entries dated today (calls, follow-ups)
  //  • follow-up tasks completed today (the follow-up engine)
  //  • the Social Planner's posts for today (planned vs. posted)
  const today = dayInTz(new Date(), tz);
  let salesCalls = 0;
  let salesFollowups = 0;
  let taskFollowups = 0;
  let postsPlanned = 0;
  let postsPosted = 0;
  if (masterPlanId) {
    const [{ data: sales }, { data: fuTasks }, { data: posts }] = await Promise.all([
      supabase
        .from("sales_activities")
        .select("id, type, contact_name, notes, created_at")
        .eq("master_plan_id", masterPlanId)
        .eq("occurred_on", today)
        .in("type", ["call", "followup"]),
      supabase
        .from("tasks")
        .select("id, title, followup, completed_at")
        .eq("master_plan_id", masterPlanId)
        .eq("status", "done")
        .gte("completed_at", startISO)
        .lt("completed_at", endISO)
        .not("followup->>channel", "is", null),
      supabase
        .from("social_posts")
        .select("status, posted_at")
        .eq("master_plan_id", masterPlanId)
        .eq("planned_date", today),
    ]);
    for (const a of (sales || []) as { id: string; type: string; contact_name: string | null; notes: string | null; created_at: string }[]) {
      if (a.type === "call") salesCalls += 1;
      else salesFollowups += 1;
      items.push({
        id: `sa-${a.id}`,
        contactId: "",
        contactName: a.contact_name || "",
        type: a.type === "call" ? "call" : "followup",
        note: a.notes || "",
        createdAt: a.created_at,
      });
    }
    for (const t of (fuTasks || []) as { id: number; title: string; followup: { contactName?: string } | null; completed_at: string }[]) {
      taskFollowups += 1;
      items.push({
        id: `tk-${t.id}`,
        contactId: "",
        contactName: t.followup?.contactName || t.title,
        type: "followup",
        note: "Completed",
        createdAt: t.completed_at,
      });
    }
    for (const p of (posts || []) as { status: string; posted_at: string | null }[]) {
      if (p.status === "idea") continue; // an idea isn't planned yet
      postsPlanned += 1;
      if (p.status === "posted") postsPosted += 1;
    }
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const calls = rows.filter((r) => r.type !== "followup").length + salesCalls;
  const followups = rows.filter((r) => r.type === "followup").length + salesFollowups + taskFollowups;
  const contacts = new Set(items.map((i) => i.contactId).filter(Boolean));
  return NextResponse.json({
    calls,
    followups,
    contactsTouched: contacts.size,
    posts: { planned: postsPlanned, posted: postsPosted },
    items,
  });
}

// POST — log a call or follow-up (with an optional note) against a contact.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const type: ActivityType = TYPES.includes(body.type as ActivityType) ? (body.type as ActivityType) : "call";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const contactId = typeof body.contactId === "string" ? body.contactId : "";
  const contactName = typeof body.contactName === "string" ? body.contactName : "";

  const { data, error } = await supabase
    .from("contact_activity_log")
    .insert({
      master_plan_id: masterPlanId,
      contact_id: contactId || null,
      contact_name: contactName || null,
      type,
      note: note || null,
    })
    .select("id, contact_id, contact_name, type, note, created_at")
    .single();

  if (error) {
    console.error("POST activity:", error.message);
    return NextResponse.json({ error: "Couldn't log the activity." }, { status: 500 });
  }
  return NextResponse.json({ item: serialize(data as Row) });
}
