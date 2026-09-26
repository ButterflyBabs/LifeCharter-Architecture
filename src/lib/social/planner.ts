// Social Planner — shared, client-safe logic: platform catalogue, neutral
// starting goals, date helpers, the weekly goal math, and the notes parser.
// Nothing here is specific to any one account; each account's goals, rules,
// offers and posts are its own data (see /api/social/*).

export type PostStatus = "idea" | "draft" | "scheduled" | "posted";
export const STATUSES: PostStatus[] = ["idea", "draft", "scheduled", "posted"];

export type MetricKind = "plan" | "manual" | "habit" | "percent";

export interface GoalMetric {
  id: string;
  label: string;
  kind: MetricKind;
  target: number;
  formats?: string[]; // plan: formats that count (empty = every format)
  days?: "all" | "weekdays"; // habit: which days it applies to
}

export type Goals = Record<string, GoalMetric[]>;

export interface PlannedPost {
  id: string;
  date: string; // YYYY-MM-DD
  platform: string;
  format: string;
  status: PostStatus;
  title: string;
  notes: string;
  imagePrompt: string;
  link: string;
  series: string;
  inviteLevel: "give" | "light" | "invite" | null;
  offerKey: string | null;
}

export interface WeekDoc {
  weekStart: string;
  actuals: Record<string, Record<string, number | null>>;
  habits: Record<string, Record<string, boolean>>;
  notes: string;
}

export interface AudienceSnapshot {
  date: string;
  baseline: boolean;
  values: Record<string, Record<string, number | null>>;
}

export interface ContentRules {
  voice: string;
  signOff: string;
  inviteRatio: number; // give-only posts per invitation
  series: { name: string; cadence: string }[];
  wordRules: { avoid: string; instead: string }[];
  personalDetails: string;
  otherRules: string[];
  graphicStyle: string;
}

export interface Offer {
  id?: string;
  key: string;
  name: string;
  link: string;
  kind: "event" | "always-open" | "invite-only" | "private";
  rules: string;
  sortOrder?: number;
}

export interface SocialEvent {
  id?: string;
  offerKey: string | null;
  title: string;
  date: string;
  startTime: string | null; // HH:MM
  timezone: string;
  firstMentionOn: string | null;
  notes: string;
}

/* ---------- platform catalogue ---------- */

export interface PlatformDef {
  id: string;
  name: string;
  short: string;
  color: string;
  formats: string[];
  audienceWhere: string;
  audience: { id: string; label: string }[];
  rate?: [string, string];
  rateLabel?: string;
}

export const PLATFORMS: PlatformDef[] = [
  {
    id: "facebook", name: "Facebook", short: "Facebook", color: "#3b5b9a",
    formats: ["post", "photo", "carousel", "reel", "live", "story"],
    audienceWhere: "Professional dashboard → Insights (last 28 days)",
    audience: [
      { id: "followers", label: "Followers" }, { id: "friends", label: "Friends" },
      { id: "group", label: "Group members" },
      { id: "reach28", label: "Reach (last 28 days)" }, { id: "interactions28", label: "Content interactions (last 28 days)" },
    ],
    rate: ["interactions28", "reach28"],
  },
  {
    id: "instagram", name: "Instagram", short: "Instagram", color: "#a2456f",
    formats: ["photo", "carousel", "reel", "live", "story"],
    audienceWhere: "Profile → Professional dashboard → Insights (last 28 days)",
    audience: [
      { id: "followers", label: "Followers" }, { id: "reach28", label: "Accounts reached (last 28 days)" },
      { id: "engaged28", label: "Accounts engaged (last 28 days)" }, { id: "interactions28", label: "Content interactions (last 28 days)" },
    ],
    rate: ["engaged28", "reach28"],
  },
  {
    id: "linkedin", name: "LinkedIn", short: "LinkedIn", color: "#1f6f9e",
    formats: ["text", "photo", "carousel", "document", "article", "video"],
    audienceWhere: "Profile → Analytics (impressions: past 7 days; profile viewers: past 90 days)",
    audience: [
      { id: "connections", label: "Connections" }, { id: "followers", label: "Followers" },
      { id: "impressions7", label: "Post impressions (last 7 days)" }, { id: "engagements7", label: "Post engagements (last 7 days)" },
      { id: "viewers90", label: "Profile viewers (last 90 days)" },
    ],
    rate: ["engagements7", "impressions7"],
  },
  {
    id: "youtube", name: "YouTube", short: "YouTube", color: "#b23a32",
    formats: ["long video", "short", "community", "live"],
    audienceWhere: "YouTube Studio → Analytics",
    audience: [
      { id: "subscribers", label: "Subscribers" }, { id: "views28", label: "Views (last 28 days)" },
      { id: "hours365", label: "Watch hours (last 12 months)" }, { id: "engagements28", label: "Likes + comments (last 28 days)" },
    ],
  },
  {
    id: "spotify", name: "Podcast (Spotify)", short: "Podcast", color: "#2f7d4f",
    formats: ["episode", "video episode"],
    audienceWhere: "Spotify for Creators → Analytics (all time)",
    audience: [
      { id: "followers", label: "Followers" }, { id: "plays", label: "All-time plays" },
      { id: "streams", label: "All-time streams" }, { id: "consumption", label: "Average consumption %" },
    ],
    rate: ["streams", "plays"], rateLabel: "Stream rate (streams ÷ plays)",
  },
  {
    id: "tiktok", name: "TikTok", short: "TikTok", color: "#3a3f4b",
    formats: ["video", "photo", "story", "live"],
    audienceWhere: "Profile → Analytics (last 28 days)",
    audience: [
      { id: "followers", label: "Followers" }, { id: "views28", label: "Video views (last 28 days)" },
      { id: "engagements28", label: "Likes + comments + shares (last 28 days)" },
    ],
    rate: ["engagements28", "views28"],
  },
  {
    id: "threads", name: "Threads", short: "Threads", color: "#4b4458",
    formats: ["text", "photo", "carousel", "video"],
    audienceWhere: "Profile → Insights (last 30 days)",
    audience: [{ id: "followers", label: "Followers" }, { id: "views30", label: "Views (last 30 days)" }],
  },
  {
    id: "pinterest", name: "Pinterest", short: "Pinterest", color: "#a23b3b",
    formats: ["pin", "video pin", "idea pin"],
    audienceWhere: "Analytics → Overview (last 30 days)",
    audience: [
      { id: "followers", label: "Followers" }, { id: "impressions30", label: "Impressions (last 30 days)" },
      { id: "saves30", label: "Saves (last 30 days)" },
    ],
  },
];

export const PLATFORM_MAP: Record<string, PlatformDef> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export function platformDef(id: string): PlatformDef {
  return (
    PLATFORM_MAP[id] || {
      id, name: id, short: id, color: "#5a5f6b", formats: ["post"], audienceWhere: "", audience: [{ id: "followers", label: "Followers" }],
    }
  );
}

/* ---------- neutral starting goals for a new account ---------- */

// Sensible weekly starting points. A new account picks its platforms in setup
// and gets these for each; every number is editable on the Goals tab.
export const STARTER_GOALS: Goals = {
  facebook: [
    { id: "posts", label: "New public posts", kind: "plan", target: 3, formats: ["post", "photo", "carousel", "reel", "live"] },
    { id: "interactions", label: "Interactions", kind: "manual", target: 25 },
    { id: "story", label: "Post a Story", kind: "habit", days: "weekdays", target: 5 },
  ],
  instagram: [
    { id: "posts", label: "New public posts", kind: "plan", target: 3, formats: ["photo", "carousel", "reel", "live"] },
    { id: "interactions", label: "Interactions", kind: "manual", target: 25 },
    { id: "story", label: "Post a Story", kind: "habit", days: "weekdays", target: 5 },
  ],
  linkedin: [
    { id: "posts", label: "New posts", kind: "plan", target: 2, formats: [] },
    { id: "impressions", label: "Impressions", kind: "manual", target: 300 },
    { id: "comments", label: "Leave 3 thoughtful comments", kind: "habit", days: "weekdays", target: 5 },
  ],
  youtube: [
    { id: "shorts", label: "Shorts", kind: "plan", target: 2, formats: ["short"] },
    { id: "views", label: "Views", kind: "manual", target: 100 },
    { id: "replies", label: "Reply to comments", kind: "habit", days: "weekdays", target: 5 },
  ],
  spotify: [
    { id: "episodes", label: "Episodes published", kind: "plan", target: 1, formats: ["episode", "video episode"] },
    { id: "plays", label: "Plays", kind: "manual", target: 50 },
  ],
  tiktok: [
    { id: "posts", label: "Videos posted", kind: "plan", target: 3, formats: [] },
    { id: "views", label: "Views", kind: "manual", target: 200 },
  ],
  threads: [
    { id: "posts", label: "Posts", kind: "plan", target: 3, formats: [] },
    { id: "replies", label: "Reply to replies", kind: "habit", days: "weekdays", target: 5 },
  ],
  pinterest: [
    { id: "pins", label: "Pins", kind: "plan", target: 5, formats: [] },
    { id: "saves", label: "Saves", kind: "manual", target: 20 },
  ],
};

export const STARTER_RULES: ContentRules = {
  voice: "",
  signOff: "",
  inviteRatio: 4,
  series: [],
  wordRules: [],
  personalDetails: "Never invent details of my life, routines or clients. Leave [brackets] for me to fill in.",
  otherRules: [],
  graphicStyle: "",
};

export function normalizeRules(r: Partial<ContentRules> | null | undefined): ContentRules {
  const x = r || {};
  return {
    voice: String(x.voice ?? ""),
    signOff: String(x.signOff ?? ""),
    inviteRatio: Number.isFinite(Number(x.inviteRatio)) && Number(x.inviteRatio) > 0 ? Number(x.inviteRatio) : 4,
    series: Array.isArray(x.series) ? x.series.map((s) => ({ name: String(s?.name ?? ""), cadence: String(s?.cadence ?? "") })) : [],
    wordRules: Array.isArray(x.wordRules) ? x.wordRules.map((w) => ({ avoid: String(w?.avoid ?? ""), instead: String(w?.instead ?? "") })) : [],
    personalDetails: String(x.personalDetails ?? ""),
    otherRules: Array.isArray(x.otherRules) ? x.otherRules.map(String) : [],
    graphicStyle: String(x.graphicStyle ?? ""),
  };
}

export function normalizeGoals(g: unknown): Goals {
  const out: Goals = {};
  if (!g || typeof g !== "object") return out;
  for (const [pid, list] of Object.entries(g as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    out[pid] = list
      .filter((m) => m && typeof m === "object" && (m as GoalMetric).id)
      .map((raw) => {
        const m = raw as GoalMetric;
        const kind: MetricKind = ["plan", "manual", "habit", "percent"].includes(m.kind) ? m.kind : "manual";
        const metric: GoalMetric = { id: String(m.id), label: String(m.label ?? ""), kind, target: Number(m.target) || 0 };
        if (kind === "plan") metric.formats = Array.isArray(m.formats) ? m.formats.map(String) : [];
        if (kind === "habit") metric.days = m.days === "weekdays" ? "weekdays" : "all";
        return metric;
      });
  }
  return out;
}

/* ---------- dates (local calendar dates, YYYY-MM-DD) ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const mondayOf = (s: string) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(d);
};
export const weekDates = (mon: string) => Array.from({ length: 7 }, (_, i) => addDays(mon, i));
export const isWeekday = (s: string) => {
  const g = parseYmd(s).getDay();
  return g > 0 && g < 6;
};
export const todayYmd = () => ymd(new Date());
export const fmtDate = (s: string, o: Intl.DateTimeFormatOptions) => parseYmd(s).toLocaleDateString(undefined, o);

/* ---------- weekly goal math (same rules as the prototype planner) ---------- */

export function activeDays(m: GoalMetric, mon: string): string[] {
  return weekDates(mon).filter((d) => (m.days === "weekdays" ? isWeekday(d) : true));
}

export function postsIn(posts: PlannedPost[], from: string, to: string, pid?: string): PlannedPost[] {
  return posts.filter((p) => p.date >= from && p.date <= to && (!pid || p.platform === pid));
}

// Plan metrics count posts on that platform in the week whose format is ticked
// (no formats ticked = every format). Only "posted" counts toward the goal.
export function planCount(posts: PlannedPost[], pid: string, m: GoalMetric, mon: string, status: PostStatus | "all" = "posted"): number {
  const list = postsIn(posts, mon, addDays(mon, 6), pid).filter((p) => !m.formats || !m.formats.length || m.formats.includes(p.format));
  return status === "all" ? list.length : list.filter((p) => p.status === status).length;
}

export function actualFor(posts: PlannedPost[], week: WeekDoc | undefined, pid: string, m: GoalMetric, mon: string): number | null {
  if (m.kind === "plan") return planCount(posts, pid, m, mon);
  if (m.kind === "habit") {
    const h = week?.habits?.[`${pid}.${m.id}`] || {};
    return activeDays(m, mon).filter((d) => h[d]).length;
  }
  const v = week?.actuals?.[pid]?.[m.id];
  return v === undefined || v === null || (v as unknown) === "" ? null : Number(v);
}

export const ratio = (a: number | null, t: number) => (t > 0 ? Math.min((a || 0) / t, 1) : 0);

export function platformScore(goals: Goals, posts: PlannedPost[], week: WeekDoc | undefined, pid: string, mon: string) {
  const ms = goals[pid] || [];
  if (!ms.length) return { pct: 0, met: 0, total: 0 };
  let sum = 0;
  let met = 0;
  for (const m of ms) {
    const r = ratio(actualFor(posts, week, pid, m, mon), Number(m.target));
    sum += r;
    if (r >= 1) met++;
  }
  return { pct: Math.round((sum / ms.length) * 100), met, total: ms.length };
}

export function unitFor(m: GoalMetric): string {
  return m.kind === "percent" ? "%" : m.id === "hours" ? " hrs" : "";
}

export function scoreTone(pct: number): "good" | "warn" | "low" {
  return pct >= 100 ? "good" : pct >= 60 ? "warn" : "low";
}

// The platforms an account plans for: its chosen list, plus any that have goals or posts.
export function activePlatforms(chosen: string[], goals: Goals, posts: PlannedPost[] = []): PlatformDef[] {
  const ids = new Set<string>(chosen);
  Object.keys(goals).forEach((k) => ids.add(k));
  posts.forEach((p) => ids.add(p.platform));
  const known = PLATFORMS.filter((p) => ids.has(p.id)).map((p) => p.id);
  const unknown = Array.from(ids).filter((id) => !PLATFORM_MAP[id]);
  return [...known, ...unknown].map(platformDef);
}

/* ---------- notes: sections, brackets, labels ---------- */

export interface NoteSection {
  heading: string; // "" for text before the first heading
  body: string;
}

// A heading is a short line in capitals, e.g. "CAPTION", "SLIDES (10)",
// "STORY (Monday)", "FIRST COMMENT". Text in parentheses may be mixed case.
export function isHeading(line: string): boolean {
  const s = line.trim();
  if (!s || s.length > 60) return false;
  const core = s.replace(/\([^)]*\)/g, "").trim();
  if (!/[A-Z]/.test(core)) return false;
  return /^[A-Z0-9 '&/+:,\-·.!?]+$/.test(core) && !/^\d+[.:]/.test(core) && !/^\d{1,2}:\d{2}/.test(core);
}

export function splitSections(notes: string): NoteSection[] {
  const out: NoteSection[] = [];
  let cur: NoteSection = { heading: "", body: "" };
  const lines = (notes || "").split("\n");
  for (const line of lines) {
    if (isHeading(line)) {
      if (cur.heading || cur.body.trim()) out.push(cur);
      cur = { heading: line.trim(), body: "" };
    } else {
      cur.body += (cur.body ? "\n" : "") + line;
    }
  }
  if (cur.heading || cur.body.trim()) out.push(cur);
  return out.map((s) => ({ heading: s.heading, body: s.body.replace(/^\n+|\s+$/g, "") }));
}

const CAPTION_HEADINGS = ["CAPTION", "POST", "TEXT POST", "POLL POST", "TEXT ABOVE THE POLL", "DESCRIPTION", "EPISODE DESCRIPTION"];

// The text to paste as the post itself: the CAPTION section when there is one,
// else the first post-like section. A note written without headings is all
// caption. "" when the note is sections with no caption (Stories, episodes).
export function captionOf(notes: string): string {
  const secs = splitSections(notes);
  for (const h of CAPTION_HEADINGS) {
    const s = secs.find((x) => x.heading.replace(/\s*\(.*\)$/, "") === h);
    if (s && s.body.trim()) return s.body.trim();
  }
  return secs.every((s) => !s.heading) ? (notes || "").trim() : "";
}

export interface Bracket {
  index: number; // nth bracket in the text
  start: number;
  end: number;
  text: string; // without the brackets
}

// [Fill-in] placeholders, one line max. Markdown-style links "[x](url)" are skipped.
export function findBrackets(text: string): Bracket[] {
  const out: Bracket[] = [];
  const re = /\[([^\]\n]{1,120})\](?!\()/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || ""))) out.push({ index: out.length, start: m.index, end: m.index + m[0].length, text: m[1] });
  return out;
}

export function replaceBracket(text: string, b: Bracket, value: string): string {
  return text.slice(0, b.start) + value + text.slice(b.end);
}

// GIVE-ONLY / LIGHT INVITATION / INVITATION labels written into a post's
// notes: as a heading ("GIVE-ONLY STORY", "MORNING (invitation)"), or as a
// line that starts with the label ("LIGHT INVITATION: The Life Shift, at the
// end"). A post that mixes labels (a day of Stories) takes the strongest one.
export function inviteLevelOf(notes: string): "give" | "light" | "invite" | null {
  const rank = { give: 1, light: 2, invite: 3 } as const;
  let best: "give" | "light" | "invite" | null = null;
  for (const line of (notes || "").split("\n")) {
    let label = "";
    if (isHeading(line)) label = line.toLowerCase();
    else {
      const m = line.trim().match(/^(GIVE-ONLY|LIGHT INVITATION|INVITATION)\b/);
      if (m) label = m[1].toLowerCase();
    }
    label = label.replace(/\bno invitation\b/g, "");
    const level = /light invitation/.test(label) ? "light" : /\binvitation\b/.test(label) ? "invite" : /give-only/.test(label) ? "give" : null;
    if (level && (!best || rank[level] > rank[best])) best = level;
  }
  return best;
}

export const INVITE_LABELS: Record<string, string> = { give: "Give-only", light: "Light invitation", invite: "Invitation" };
