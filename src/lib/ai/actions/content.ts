import type { ActionTool } from "./types";
import { getClientKey, createPost, deletePost, PLATFORMS } from "@/lib/postStream";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { zonedToUtcISO } from "@/lib/tz";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string) => /^\d{2}:\d{2}$/.test(s);
const MAX_POSTS = 31;

interface P { title: string; caption: string; platforms: string[]; date: string; time: string; tags: string[] }
const postsOf = (v: unknown): P[] =>
  (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
    .map((p) => ({
      title: str(p.title, 140),
      caption: str(p.caption, 5000),
      platforms: (Array.isArray(p.platforms) ? p.platforms : []).map(String).filter((x) => (PLATFORMS as readonly string[]).includes(x)),
      date: isDay(str(p.date, 10)) ? str(p.date, 10) : "",
      time: isTime(str(p.time, 5)) ? str(p.time, 5) : "09:00",
      tags: (Array.isArray(p.tags) ? p.tags : []).map((t) => str(t, 40)).filter(Boolean).slice(0, 10),
    }))
    .filter((p) => p.title && p.platforms.length)
    .slice(0, MAX_POSTS);

export const createContentPosts: ActionTool = {
  name: "create_content_posts",
  kind: "write",
  apiPath: "/api/content/posts",
  description:
    `Write social posts and put them on the client's Content Calendar (through their connected PostStream). Use it for a single post or a whole content plan. Posts WITHOUT a date are saved as drafts; posts WITH a date are scheduled for that day and time and will publish themselves then, so only add dates when the client asked for a schedule. Valid platforms: ${(PLATFORMS as readonly string[]).join(", ")}. Write each caption in full in the client's voice. The client approves first, and sees every date.`,
  parameters: {
    type: "object",
    properties: {
      posts: {
        type: "array",
        description: `Up to ${MAX_POSTS} posts.`,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short internal title." },
            caption: { type: "string", description: "The full post text." },
            platforms: { type: "array", items: { type: "string" } },
            date: { type: "string", description: "YYYY-MM-DD. Leave out for a draft." },
            time: { type: "string", description: "HH:MM, 24-hour, in the client's time zone. Default 09:00." },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["title", "caption", "platforms"],
        },
      },
    },
    required: ["posts"],
  },
  plan: async (args) => {
    if (!(await getClientKey())) return { error: "Their content calendar isn't connected yet (PostStream in Settings → Integrations). I can write the posts here in chat instead." };
    const posts = postsOf(args.posts);
    if (!posts.length) return { error: "I need at least one post with a title, text and a platform." };
    const scheduled = posts.filter((p) => p.date).length;
    return {
      preview: {
        title: `Add ${posts.length} post${posts.length === 1 ? "" : "s"} to your Content Calendar${scheduled ? ` (${scheduled} scheduled, ${posts.length - scheduled} draft)` : " as drafts"}`,
        lines: [
          ...posts.slice(0, 10).map((p) => `${p.date ? `${p.date} ${p.time}` : "Draft"} · ${p.platforms.join(", ")} · ${p.title}: ${p.caption.slice(0, 70)}${p.caption.length > 70 ? "…" : ""}`),
          ...(posts.length > 10 ? [`…and ${posts.length - 10} more`] : []),
          ...(scheduled ? ["Scheduled posts publish themselves at those times."] : ["Drafts are not published."]),
        ],
      },
    };
  },
  run: async (args) => {
    const key = await getClientKey();
    if (!key) throw new Error("Content calendar isn't connected.");
    const tz = await resolveUserTimeZone(null);
    const made: string[] = [];
    for (const p of postsOf(args.posts)) {
      try {
        const post = await createPost(key, {
          title: p.title,
          caption: p.caption,
          platforms: p.platforms,
          status: p.date ? "scheduled" : "draft",
          scheduledAt: p.date ? zonedToUtcISO(p.date, p.time, tz) : null,
          tags: p.tags,
        });
        const id = (post as { id?: string } | null)?.id;
        if (id) made.push(id);
      } catch (e) {
        console.error("assistant create post:", e);
      }
    }
    if (!made.length) throw new Error("None of the posts saved. Check your PostStream connection.");
    return { summary: `Added ${made.length} post${made.length === 1 ? "" : "s"} to your Content Calendar.`, result: { count: made.length }, undo: { ids: made } };
  },
  undo: async (u) => {
    const key = await getClientKey();
    if (!key) return "Couldn't reach the content calendar.";
    let n = 0;
    for (const id of (u.ids as string[]) ?? []) {
      try {
        await deletePost(key, id);
        n++;
      } catch {
        /* keep going */
      }
    }
    return `Removed ${n} post${n === 1 ? "" : "s"}.`;
  },
};

export const CONTENT_TOOLS: ActionTool[] = [createContentPosts];
