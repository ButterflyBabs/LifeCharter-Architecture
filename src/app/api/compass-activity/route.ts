import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { dayWindowUtc, dayInTz } from "@/lib/tz";
import { publishedPostCounts } from "@/lib/social/postCounts";
import { resolveUserTimeZone } from "@/lib/userTimezone";

export const dynamic = "force-dynamic";

type ActivityType = "call" | "followup";
type Item = { id: string; contactId: string; contactName: string; type: ActivityType; note: string; createdAt: string };

// GET — today's logged activity (counts + items) for the client, in their tz.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  // The client's chosen time zone, else the browser's, so "today" matches theirs.
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  let startISO: string, endISO: string;
  try {
    ({ startISO, endISO } = dayWindowUtc(tz));
  } catch {
    ({ startISO, endISO } = dayWindowUtc("UTC"));
  }

  // Today's activity, from the same sources as the Weekly View:
  //  • Sales Activities entries dated today (calls, follow-ups)
  //  • follow-up tasks completed today (the follow-up engine)
  //  • the Social Planner's posts for today (planned vs. posted)
  const items: Item[] = [];
  const today = dayInTz(new Date(), tz);
  let salesCalls = 0;
  let salesFollowups = 0;
  let taskFollowups = 0;
  let postsRemaining = 0; // planned for today, not posted yet
  let postsPosted = 0;
  let postsFromPostStream = 0;
  if (masterPlanId) {
    const [{ data: sales }, { data: fuTasks }, { data: posts }, postCounts] = await Promise.all([
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
        .select("status")
        .eq("master_plan_id", masterPlanId)
        .eq("planned_date", today),
      publishedPostCounts(masterPlanId, tz, today),
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
    // Still to go: planned for today but not posted (an idea isn't planned yet).
    for (const p of (posts || []) as { status: string }[]) {
      if (p.status === "draft" || p.status === "scheduled") postsRemaining += 1;
    }
    // Posted: Social Planner posts plus posts published only in PostStream.
    postsPosted = postCounts.byDay.get(today) ?? 0;
    postsFromPostStream = postCounts.fromPostStream.get(today) ?? 0;
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const calls = salesCalls;
  const followups = salesFollowups + taskFollowups;
  const contacts = new Set(items.map((i) => i.contactId).filter(Boolean));
  return NextResponse.json({
    calls,
    followups,
    contactsTouched: contacts.size,
    posts: { posted: postsPosted, remaining: postsRemaining, fromPostStream: postsFromPostStream },
    items,
  });
}
