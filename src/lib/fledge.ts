import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { dayInTz } from "@/lib/tz";

// LC Fledge replaces PostStream for the Alignment Architect (Babs) alone, from
// 2026-11-04. Every other account keeps the Suite's own Content Calendar and its
// existing behaviour. Posts are written, scheduled and published in Fledge; the
// Suite only reads back what went out (for the activity counts).

export const FLEDGE_URL = "https://fledge.lccommandsuite.com";

export const fledgeForMe = () => isAlignmentArchitect();

// The Fledge workspace linked to this Suite account (beacon_workspaces.lccs_master_plan_id).
export async function fledgeWorkspaceId(masterPlanId: string): Promise<string | null> {
  const { data } = await createServerClient().from("beacon_workspaces").select("id").eq("lccs_master_plan_id", masterPlanId).limit(1).maybeSingle();
  return (data?.id as string) || null;
}

// Posts that went out through Fledge, one per platform it reached, by day.
export async function fledgePublishedCounts(masterPlanId: string, tz: string, sinceDay: string): Promise<Map<string, number>> {
  const byDay = new Map<string, number>();
  const ws = await fledgeWorkspaceId(masterPlanId);
  if (!ws) return byDay;
  const since = new Date(`${sinceDay}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - 1); // time-zone slack; the day check below is exact
  const { data } = await createServerClient()
    .from("beacon_post_targets")
    .select("published_at, post:beacon_posts!inner(workspace_id)")
    .eq("status", "published")
    .eq("post.workspace_id", ws)
    .gte("published_at", since.toISOString())
    .limit(5000);
  for (const t of (data ?? []) as { published_at: string | null }[]) {
    if (!t.published_at) continue;
    const day = dayInTz(t.published_at, tz);
    if (day < sinceDay) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return byDay;
}

// Planned for today in Fledge and not out yet (drafts and scheduled posts; an idea isn't planned).
export async function fledgeRemainingToday(masterPlanId: string, tz: string): Promise<number> {
  const ws = await fledgeWorkspaceId(masterPlanId);
  if (!ws) return 0;
  const now = new Date();
  const from = new Date(now.getTime() - 36 * 3600_000).toISOString();
  const to = new Date(now.getTime() + 36 * 3600_000).toISOString();
  const today = dayInTz(now, tz);
  const { data } = await createServerClient()
    .from("beacon_posts")
    .select("scheduled_at")
    .eq("workspace_id", ws)
    .is("hidden_at", null)
    .in("status", ["draft", "scheduled"])
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .limit(500);
  return ((data ?? []) as { scheduled_at: string | null }[]).filter((p) => p.scheduled_at && dayInTz(p.scheduled_at, tz) === today).length;
}
