import { createServerClient } from "@/lib/supabase/server";
import { createPost, updatePost, publishPost, listPosts, PLATFORMS, type PsPost } from "@/lib/postStream";
import { captionOf } from "@/lib/social/planner";
import { POST_COLUMNS, type PostRow } from "@/lib/social/server";
import { dayInTz } from "@/lib/tz";

// One flow for content: a post lives on the Content Calendar, and PostStream is
// how it gets scheduled and published. These two functions keep them together —
// sendToPostStream() creates/updates the PostStream post and records the link on
// the calendar's post; syncFromPostStream() pulls back what happened there
// (published, or posts made directly in PostStream) so the calendar is the whole
// picture. Everything is scoped to one account's plan and its own PostStream key.

export type SendWhen = "draft" | "schedule" | "now";

export interface SendInput {
  title: string;
  caption: string;
  platforms: string[];
  when: SendWhen;
  scheduledAt: string | null; // ISO
  date: string | null; // YYYY-MM-DD the post belongs to on the calendar
  mediaUrls: string[];
  mediaType?: "image" | "video" | "carousel";
  plannedIds: string[]; // existing calendar posts being sent (may be empty)
}

export class SendError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const supported = (p: string) => (PLATFORMS as readonly string[]).includes(p);
const today = () => new Date().toISOString().slice(0, 10);

// key === null means PostStream isn't connected: only calendar-only drafts work.
export async function sendToPostStream(
  masterPlanId: string,
  key: string | null,
  plannerOn: boolean,
  input: SendInput
): Promise<{ ps: PsPost | null; rows: PostRow[] }> {
  const db = createServerClient();

  let existing: PostRow[] = [];
  if (input.plannedIds.length) {
    const { data } = await db.from("social_posts").select(POST_COLUMNS).eq("master_plan_id", masterPlanId).in("id", input.plannedIds);
    existing = (data || []) as PostRow[];
    if (!existing.length) throw new SendError("That post wasn't found.", 404);
  }

  const platforms = existing.length ? Array.from(new Set(existing.map((r) => r.platform))) : input.platforms;
  const title = (input.title || existing[0]?.title || "").trim();
  if (!title) throw new SendError("Give your post a title.");
  if (!platforms.length) throw new SendError("Pick at least one platform.");
  if (input.when === "schedule" && !input.scheduledAt) throw new SendError("Choose a date and time to schedule.");

  let ps: PsPost | null = null;
  if (key) {
    const bad = platforms.filter((p) => !supported(p));
    if (bad.length) throw new SendError(`${bad.join(", ")} can't be published through PostStream.`);
    const linkedId = existing.find((r) => r.poststream_post_id)?.poststream_post_id || null;
    const body = {
      title,
      caption: input.caption,
      platforms,
      status: (input.when === "schedule" ? "scheduled" : "draft") as "scheduled" | "draft",
      scheduledAt: input.when === "schedule" ? input.scheduledAt : null,
      mediaUrls: input.mediaUrls,
      mediaType: input.mediaType,
    };
    ps = linkedId ? await updatePost(key, linkedId, body) : await createPost(key, body);
    if (input.when === "now") {
      try {
        ps = await publishPost(key, ps.id);
      } catch (e) {
        // Keep what was saved; tell the caller publishing itself failed.
        throw new SendError(`Saved as a draft in PostStream, but publishing failed: ${e instanceof Error ? e.message : "try again"}.`, 502);
      }
    }
  } else if (!(plannerOn && input.when === "draft")) {
    throw new SendError("PostStream isn't connected. Add your key in Settings → Integrations.");
  }

  if (!plannerOn) return { ps, rows: [] };

  const status = input.when === "now" ? "posted" : input.when === "schedule" ? "scheduled" : "draft";
  const patch = {
    status,
    poststream_post_id: ps?.id ?? null,
    scheduled_at: input.when === "schedule" ? input.scheduledAt : null,
    posted_at: input.when === "now" ? ps?.publishedAt || new Date().toISOString() : null,
    media_urls: input.mediaUrls,
    media_type: input.mediaType ?? null,
    updated_at: new Date().toISOString(),
    ...(input.date ? { planned_date: input.date } : {}),
  };

  let rows: PostRow[] = [];
  if (existing.length) {
    const { data, error } = await db.from("social_posts").update(patch).eq("master_plan_id", masterPlanId).in("id", existing.map((r) => r.id)).select(POST_COLUMNS);
    if (error) throw new SendError(error.message, 500);
    rows = (data || []) as PostRow[];
  } else {
    const date = input.date || (input.scheduledAt ? input.scheduledAt.slice(0, 10) : today());
    const inserts = platforms.map((platform) => ({
      master_plan_id: masterPlanId,
      planned_date: date,
      platform,
      format: "post",
      title,
      notes: `CAPTION\n${input.caption}`,
      image_prompt: "",
      link: "",
      series: "",
      ...patch,
      ...(input.date ? {} : { planned_date: date }),
    }));
    const { data, error } = await db.from("social_posts").insert(inserts).select(POST_COLUMNS);
    if (error) throw new SendError(error.message, 500);
    rows = (data || []) as PostRow[];
  }
  return { ps, rows };
}

// Reads the caption a planned post would send.
export const captionFor = (row: Pick<PostRow, "notes">) => captionOf(row.notes || "");

const ADOPT_DAYS = 90; // rolling window: bring in PostStream posts from the last 90 days onward
const ADOPT_MAX = 100;

// Brings the calendar in line with PostStream. Returns how many rows changed.
export async function syncFromPostStream(masterPlanId: string, key: string, tz: string): Promise<number> {
  const db = createServerClient();
  const all = await listPosts(key);

  const [{ data: linked }, { data: ignored }] = await Promise.all([
    db.from("social_posts").select("id, poststream_post_id, platform, status").eq("master_plan_id", masterPlanId).not("poststream_post_id", "is", null),
    db.from("social_ps_ignored").select("poststream_post_id").eq("master_plan_id", masterPlanId),
  ]);
  const byPs = new Map<string, { id: string; platform: string; status: string }[]>();
  for (const r of (linked || []) as { id: string; poststream_post_id: string; platform: string; status: string }[]) {
    byPs.set(r.poststream_post_id, [...(byPs.get(r.poststream_post_id) || []), r]);
  }
  const skip = new Set(((ignored || []) as { poststream_post_id: string }[]).map((r) => r.poststream_post_id));

  const cutoff = dayInTz(new Date(Date.now() - ADOPT_DAYS * 86400000), tz);
  let changed = 0;
  let adopted = 0;

  for (const ps of all) {
    if (!ps.id || skip.has(ps.id)) continue;
    const rows = byPs.get(ps.id);

    if (rows) {
      // Published in PostStream → mark the calendar's post as posted.
      if (ps.status === "published") {
        const ids = rows.filter((r) => r.status !== "posted").map((r) => r.id);
        if (ids.length) {
          await db.from("social_posts").update({ status: "posted", posted_at: ps.publishedAt || new Date().toISOString(), updated_at: new Date().toISOString() }).in("id", ids);
          changed += ids.length;
        }
      }
      continue;
    }

    // Made directly in PostStream → add it to the calendar.
    if (adopted >= ADOPT_MAX) continue;
    const when = ps.scheduledAt || ps.publishedAt || ps.createdAt;
    if (!when) continue;
    const day = dayInTz(when, tz);
    if (day < cutoff) continue;
    const platforms = ps.platforms.filter(Boolean);
    if (!platforms.length) continue;
    const status = ps.status === "published" ? "posted" : ps.status === "scheduled" ? "scheduled" : "draft";
    const inserts = platforms.map((platform) => ({
      master_plan_id: masterPlanId,
      planned_date: day,
      platform,
      format: "post",
      status,
      title: ps.title || "(untitled)",
      notes: ps.caption ? `CAPTION\n${ps.caption}` : "",
      image_prompt: "",
      link: "",
      series: "",
      poststream_post_id: ps.id,
      scheduled_at: ps.scheduledAt,
      posted_at: status === "posted" ? ps.publishedAt || when : null,
      media_urls: ps.mediaUrls,
      media_type: ps.mediaType || null,
    }));
    const { data, error } = await db
      .from("social_posts")
      .upsert(inserts, { onConflict: "master_plan_id,poststream_post_id,platform", ignoreDuplicates: true })
      .select("id");
    if (!error) {
      changed += (data || []).length;
      adopted += 1;
    }
  }
  return changed;
}
