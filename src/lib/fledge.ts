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

// ── The AI Assistant's "add posts to my Content Calendar" for Babs: drafts in Fledge, never scheduled. ──
// She approves the preview, the posts land as drafts planned for those days, and nothing publishes until she
// schedules them in Fledge herself.
export interface FledgeDraftInput {
  title: string;
  caption: string;
  platforms: string[];
  scheduledAt: string | null; // planned day/time (ISO), kept as a plan only
  tags: string[];
}

async function accountFor(ws: string, platform: string): Promise<{ id: string; platform: string } | null> {
  const { data } = await createServerClient().from("beacon_accounts").select("id, platform, display_name, username").eq("workspace_id", ws).eq("platform", platform).eq("status", "connected").order("created_at");
  const list = (data ?? []) as { id: string; platform: string; display_name: string; username: string }[];
  if (!list.length) return null;
  const pick =
    platform === "facebook" ? list.find((a) => /lifecharter community/i.test(a.display_name)) :
    platform === "instagram" ? list.find((a) => a.username === "amilynnecarroll") : undefined;
  return pick ?? list[0];
}

export async function createFledgeDrafts(masterPlanId: string, posts: FledgeDraftInput[]): Promise<string[]> {
  const ws = await fledgeWorkspaceId(masterPlanId);
  if (!ws) throw new Error("Your Fledge workspace isn't linked to this account.");
  const db = createServerClient();
  const made: string[] = [];
  for (const p of posts) {
    const { data: post, error } = await db
      .from("beacon_posts")
      .insert({ workspace_id: ws, title: p.title, caption: p.caption.replace(/\r\n?/g, "\n"), tags: p.tags, status: "draft", scheduled_at: p.scheduledAt, source: "api" })
      .select("id")
      .single();
    if (error || !post) continue;
    for (const platform of p.platforms) {
      const acct = await accountFor(ws, platform);
      if (acct) await db.from("beacon_post_targets").insert({ post_id: post.id, account_id: acct.id, platform });
    }
    made.push(post.id as string);
  }
  return made;
}

// Undo removes only posts that are still plain drafts.
export async function deleteFledgeDrafts(ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const db = createServerClient();
  const { data } = await db.from("beacon_posts").delete().in("id", ids).eq("status", "draft").select("id");
  return (data ?? []).length;
}
