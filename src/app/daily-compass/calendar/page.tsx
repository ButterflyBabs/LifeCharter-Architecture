"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/postStreamConstants";
import {
  activePlatforms, addDays, fmtDate, isWeekday, mondayOf, parseYmd, platformDef, platformScore, postsIn, todayYmd, weekDates, ymd,
  type PlannedPost,
} from "@/lib/social/planner";
import { useSocialPlanner } from "@/components/social/useSocialPlanner";
import { PostDetail, PostForm } from "@/components/social/PostDetail";
import { PostComposer, type ComposerInitial } from "@/components/content/PostComposer";
import { captionOf } from "@/lib/social/planner";
import { PlatformChip, Ring, StatusBadge, StatusSelect, Tabs, Tip, cx } from "@/components/social/ui";

// PostStream posts (the scheduling service). Planned posts live in the Social
// Planner (/api/social/posts); both show on this calendar.
interface PsPost {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  status: string;
  scheduledAt: string | null;
  createdAt: string | null;
  publishedAt: string | null;
}

const PS_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#5a5148", bg: "#eee9e2" },
  scheduled: { label: "Scheduled", color: "#1c5a60", bg: "#d3ebee" },
  published: { label: "Published", color: "#2c6b3f", bg: "#d8efdd" },
  failed: { label: "Failed", color: "#8a2f2f", bg: "#f6dcdc" },
};

const platformColor = (id: string) => platformDef(id).color;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function psDateKey(p: PsPost): string | null {
  const s = p.scheduledAt || p.publishedAt || p.createdAt;
  return s ? ymd(new Date(s)) : null;
}

type View = "today" | "week" | "month";

export default function ContentCalendarPage() {
  const planner = useSocialPlanner();
  const { enabled, settings, posts, weeks } = planner;

  const [connected, setConnected] = useState<boolean | null>(null);
  const [psPosts, setPsPosts] = useState<PsPost[]>([]);
  const [psLoaded, setPsLoaded] = useState(false);
  const [psError, setPsError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [view, setView] = useState<View>("today");
  const [today, setToday] = useState("");
  const [day, setDay] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [cursor, setCursor] = useState({ y: 0, m: 0 });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null); // date for a new post
  const [composer, setComposer] = useState<ComposerInitial | null>(null); // create / send through PostStream

  const loadPs = useCallback(async () => {
    try {
      const res = await fetch("/api/content/posts");
      const d = await res.json().catch(() => ({}));
      setConnected(Boolean(d.connected));
      if (Array.isArray(d.posts)) setPsPosts(d.posts);
      if (d.error) setPsError(d.error);
    } catch {
      setConnected(false);
    } finally {
      setPsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const t = todayYmd();
    setToday(t);
    setDay(t);
    setWeekStart(mondayOf(t));
    const now = new Date();
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    try {
      const v = localStorage.getItem("lc-calendar-view");
      if (v === "today" || v === "week" || v === "month") setView(v);
      const f = localStorage.getItem("lc-calendar-filter");
      if (f) setFilter(f);
    } catch {}
    if (new URLSearchParams(window.location.search).get("new") === "1") setComposer({});
    loadPs();
  }, [loadPs]);

  // Without the planner the calendar is PostStream-only, as before.
  const plannerOn = enabled === true;
  const effectiveView: View = plannerOn ? view : "month";
  const chooseView = (v: View) => {
    setView(v);
    try { localStorage.setItem("lc-calendar-view", v); } catch {}
  };
  const chooseFilter = (f: string) => {
    setFilter(f);
    try { localStorage.setItem("lc-calendar-filter", f); } catch {}
  };

  const platforms = useMemo(() => (settings ? activePlatforms(settings.platforms, settings.goals, posts) : []), [settings, posts]);
  const visible = useCallback((p: PlannedPost) => filter === "all" || p.platform === filter, [filter]);
  const psVisible = useCallback((p: PsPost) => filter === "all" || p.platforms.includes(filter), [filter]);

  const plannedByDay = useMemo(() => {
    const m = new Map<string, PlannedPost[]>();
    for (const p of posts) {
      if (!visible(p)) continue;
      if (!m.has(p.date)) m.set(p.date, []);
      m.get(p.date)!.push(p);
    }
    Array.from(m.values()).forEach((l) => l.sort((a, b) => a.platform.localeCompare(b.platform)));
    return m;
  }, [posts, visible]);

  // A calendar post that's been sent to PostStream shows once, as the calendar post.
  const linkedPsIds = useMemo(() => new Set(posts.map((p) => p.psId).filter((x): x is string => Boolean(x))), [posts]);

  const psByDay = useMemo(() => {
    const m = new Map<string, PsPost[]>();
    for (const p of psPosts) {
      const k = psDateKey(p);
      if (!k || !psVisible(p) || linkedPsIds.has(p.id)) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return m;
  }, [psPosts, psVisible, linkedPsIds]);

  const openPost = posts.find((p) => p.id === openId) || null;

  /* ---- PostStream actions (unchanged behaviour) ---- */
  const publishPs = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/content/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish" }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.post) setPsPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...d.post } : p)));
      else if (d.error) setPsError(d.error);
    } finally {
      setBusyId(null);
      loadPs();
    }
  };
  const removePs = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/content/posts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setPsPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  /* ---- pieces ---- */
  const PlannedRow = ({ p, showDate }: { p: PlannedPost; showDate?: boolean }) => (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#0F1A38]/10 dark:border-[#334060] bg-white dark:bg-[#1E2A48] px-3 py-2">
      <PlatformChip id={p.platform} />
      <span className="text-[11px] text-[#64748B]">{p.format}</span>
      <button onClick={() => setOpenId(p.id)} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-[#0F1A38] dark:text-[#FAF8F3] hover:underline">
        {p.title || "Untitled"}
        {showDate && <span className="ml-1 text-xs font-normal text-[#64748B]">· {fmtDate(p.date, { weekday: "short", month: "short", day: "numeric" })}</span>}
      </button>
      {p.imagePrompt && <span title="Has a ChatGPT graphic prompt" className="text-[11px] text-[#8C6D24]">✦ graphic</span>}
      {p.psId && <span title="Linked to PostStream" className="text-[11px] text-[#2E7C83]">PostStream</span>}
      <StatusSelect value={p.status} onChange={(status) => planner.savePost(p.id, { status })} />
      <button onClick={() => setOpenId(p.id)} className={`${cx.btn} ${cx.secondary} !px-2.5 !py-1`}>Open</button>
    </div>
  );

  const PsRow = ({ p }: { p: PsPost }) => {
    const m = PS_STATUS[p.status] || PS_STATUS.draft;
    return (
      <div className="rounded-xl border border-[#0F1A38]/10 dark:border-[#334060] bg-white dark:bg-[#1E2A48] p-3">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: m.color, backgroundColor: m.bg }}>PostStream · {m.label}</span>
          {p.platforms.map((pl) => (
            <span key={pl} className="rounded-full bg-[#2E7C83]/10 px-2 py-0.5 text-[11px] text-[#2E7C83]">{PLATFORM_LABELS[pl] || pl}</span>
          ))}
        </div>
        <p className="font-medium text-[#0F1A38] dark:text-[#FAF8F3]">{p.title || "(untitled)"}</p>
        {p.caption && <p className="mt-0.5 line-clamp-2 text-sm text-[#64748B] dark:text-[#b8c2cf]">{p.caption}</p>}
        <div className="mt-2 flex items-center gap-2">
          {p.status !== "published" && (
            <button onClick={() => publishPs(p.id)} disabled={busyId === p.id} className={`${cx.btn} ${cx.primary} !py-1.5`}>
              {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publish now
            </button>
          )}
          <button onClick={() => removePs(p.id)} disabled={busyId === p.id} className={`${cx.btn} ${cx.danger} !py-1.5`}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    );
  };

  /* ---- Today ---- */
  const TodayView = () => {
    if (!settings || !day) return null;
    const mon = mondayOf(day);
    const w = weeks[mon];
    const habits: { pid: string; mid: string; label: string; on: boolean }[] = [];
    for (const p of platforms) {
      for (const m of settings.goals[p.id] || []) {
        if (m.kind !== "habit" || (m.days === "weekdays" && !isWeekday(day))) continue;
        habits.push({ pid: p.id, mid: m.id, label: m.label, on: Boolean(w?.habits?.[`${p.id}.${m.id}`]?.[day]) });
      }
    }
    const done = habits.filter((h) => h.on).length;
    const todays = (plannedByDay.get(day) || []);
    const upcoming = postsIn(posts, addDays(day, 1), addDays(day, 7)).filter((p) => p.status !== "posted" && visible(p)).sort((a, b) => a.date.localeCompare(b.date));
    const psToday = psByDay.get(day) || [];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={cx.eyebrow}>{day === today ? "Today" : "Day view"}</p>
            <h2 className={cx.h2}>{fmtDate(day, { weekday: "long", month: "long", day: "numeric" })}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}><ChevronLeft className="h-5 w-5" /></button>
            {day !== today && <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setDay(today)}>Today</button>}
            <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className={`${cx.card} space-y-2`}>
            <div className="flex items-center justify-between">
              <h3 className={cx.h3}>Daily habits</h3>
              {habits.length > 0 && <span className="text-xs tabular-nums text-[#64748B]">{done} of {habits.length} done</span>}
            </div>
            {habits.length ? (
              habits.map((h) => (
                <button
                  key={`${h.pid}.${h.mid}`}
                  aria-pressed={h.on}
                  onClick={() => planner.toggleHabit(mon, h.pid, h.mid, day, !h.on)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    h.on ? "border-[#2E7C83]/40 bg-[#2E7C83]/8" : "border-[#0F1A38]/10 dark:border-[#334060] hover:bg-[#0F1A38]/[0.03]"
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${h.on ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#0F1A38]/25"}`}>
                    {h.on && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`flex-1 text-sm ${h.on ? "text-[#1f5f65] line-through decoration-[#2E7C83]/40" : "text-[#0F1A38] dark:text-[#FAF8F3]"}`}>{h.label}</span>
                  <PlatformChip id={h.pid} />
                </button>
              ))
            ) : (
              <p className={cx.muted}>
                No daily habits for this day. Add them on the{" "}
                <Link className="underline" href="/marketing-plan/social-planner?tab=goals">Goals tab</Link>.
              </p>
            )}
          </div>

          <div className={`${cx.card} space-y-2`}>
            <div className="flex items-center justify-between">
              <h3 className={cx.h3}>On the plan</h3>
              <button className={`${cx.btn} ${cx.primary}`} onClick={() => setAdding(day)}><Plus className="h-3.5 w-3.5" /> Add post</button>
            </div>
            {todays.length ? todays.map((p) => <PlannedRow key={p.id} p={p} />) : <p className={cx.muted}>Nothing planned for this day yet.</p>}
            {psToday.map((p) => <PsRow key={p.id} p={p} />)}
            {upcoming.length > 0 && (
              <>
                <p className={`${cx.eyebrow} pt-2`}>Coming up</p>
                {upcoming.slice(0, 5).map((p) => <PlannedRow key={p.id} p={p} showDate />)}
              </>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className={cx.h3}>Week of {fmtDate(mon, { month: "short", day: "numeric" })}</h3>
            <Link href={`/marketing-plan/social-planner?tab=week&week=${mon}`} className={`${cx.btn} ${cx.secondary}`}>Open scorecard</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((p) => {
              const s = platformScore(settings.goals, posts, w, p.id, mon);
              return (
                <div key={p.id} className={`${cx.card} !p-3 flex items-center gap-3`}>
                  <Ring pct={s.pct} />
                  <div>
                    <PlatformChip id={p.id} />
                    <p className="mt-1 text-xs tabular-nums text-[#64748B]">{s.met} of {s.total} goals met</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ---- Week ---- */
  const WeekView = () => {
    if (!weekStart) return null;
    const days = weekDates(weekStart);
    const counts = platforms.map((p) => {
      const l = postsIn(posts, weekStart, addDays(weekStart, 6), p.id);
      return { p, n: l.length, posted: l.filter((x) => x.status === "posted").length };
    });
    const nextCount = postsIn(posts, addDays(weekStart, 7), addDays(weekStart, 13)).length;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={cx.eyebrow}>Content calendar</p>
            <h2 className={cx.h2}>
              {fmtDate(weekStart, { month: "long", day: "numeric" })} – {fmtDate(addDays(weekStart, 6), { month: "long", day: "numeric" })}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-5 w-5" /></button>
            {weekStart !== mondayOf(today) && <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setWeekStart(mondayOf(today))}>This week</button>}
            <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <span key={c.p.id} className="inline-flex items-center gap-1 text-xs tabular-nums text-[#475569] dark:text-[#CBD5E1]">
              <PlatformChip id={c.p.id} /> {c.posted}/{c.n} posted
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
          {days.map((d) => {
            const list = plannedByDay.get(d) || [];
            const ps = psByDay.get(d) || [];
            return (
              <div key={d} className={`rounded-2xl border p-2 ${d === today ? "border-[#D4AF63] bg-[#D4AF63]/5" : "border-[#0F1A38]/10 dark:border-[#334060] bg-white/60 dark:bg-[#1E2A48]/60"}`}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <span className={cx.eyebrow}>{fmtDate(d, { weekday: "short" })}</span>
                  <span className="font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">{parseYmd(d).getDate()}</span>
                </div>
                <div className="space-y-1.5">
                  {list.map((p) => (
                    <button key={p.id} onClick={() => setOpenId(p.id)} className={`block w-full rounded-lg border-l-[3px] bg-white dark:bg-[#0E162A] px-2 py-1.5 text-left shadow-sm hover:shadow ${p.status === "posted" ? "opacity-60" : ""}`} style={{ borderLeftColor: platformColor(p.platform) }}>
                      <span className="block text-[10px] uppercase tracking-wide text-[#64748B]">{platformDef(p.platform).short} · {p.format}</span>
                      <span className="block text-xs font-medium leading-snug text-[#0F1A38] dark:text-[#FAF8F3]">{p.title || "Untitled"}</span>
                      <span className="mt-1 flex items-center gap-1"><StatusBadge status={p.status} />{p.imagePrompt && <span className="text-[10px] text-[#8C6D24]" title="Has a ChatGPT graphic prompt">✦</span>}</span>
                    </button>
                  ))}
                  {ps.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedDay(d); chooseView("month"); }} className="block w-full rounded-lg border border-dashed border-[#2E7C83]/40 px-2 py-1.5 text-left text-xs text-[#1c5a60]">
                      PostStream · {p.title || "(untitled)"}
                    </button>
                  ))}
                  <button onClick={() => setAdding(d)} className="w-full rounded-lg py-1 text-xs text-[#64748B] hover:bg-[#0F1A38]/5">+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
        {nextCount > 0 && (
          <Tip action={<button className={`${cx.btn} ${cx.secondary}`} onClick={() => setWeekStart(addDays(weekStart, 7))}>Show next week</button>}>
            Next week already has {nextCount} planned {nextCount === 1 ? "post" : "posts"}.
          </Tip>
        )}
        <p className={cx.muted}>Posts marked Posted count toward your weekly goals automatically.</p>
      </div>
    );
  };

  /* ---- Month ---- */
  const MonthView = () => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(ymd(new Date(cursor.y, cursor.m, d)));
    const move = (delta: number) => {
      setSelectedDay(null);
      setCursor((c) => {
        const nm = c.m + delta;
        return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
      });
    };
    const dayPlanned = selectedDay ? plannedByDay.get(selectedDay) || [] : [];
    const dayPs = selectedDay ? psByDay.get(selectedDay) || [] : [];
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => move(-1)} className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className={cx.h2}>{MONTHS[cursor.m]} {cursor.y}</h2>
          <button onClick={() => move(1)} className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#0F1A38]/10 dark:border-[#334060] bg-white dark:bg-[#1E2A48]">
          <div className="grid grid-cols-7 border-b border-[#0F1A38]/10 dark:border-[#334060]">
            {DOW.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-[#64748B]">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((k, i) => {
              if (!k) return <div key={`e${i}`} className="min-h-[84px] border-b border-r border-[#0F1A38]/5" />;
              const planned = plannedByDay.get(k) || [];
              const ps = psByDay.get(k) || [];
              const items = [
                ...planned.map((p) => ({ id: p.id, title: p.title, color: platformColor(p.platform) })),
                ...ps.map((p) => ({ id: p.id, title: `PostStream · ${p.title}`, color: "#2E7C83" })),
              ];
              return (
                <button
                  key={k}
                  onClick={() => setSelectedDay(k)}
                  className={`min-h-[84px] border-b border-r border-[#0F1A38]/5 p-1.5 text-left align-top hover:bg-[#D4AF63]/5 ${selectedDay === k ? "bg-[#D4AF63]/10" : ""}`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${k === today ? "bg-[#0F1A38] font-bold text-[#FAF8F3]" : "text-[#0F1A38] dark:text-[#FAF8F3]"}`}>
                    {parseYmd(k).getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, 3).map((it) => (
                      <div key={it.id} className="truncate rounded px-1 py-0.5 text-[10px]" style={{ color: it.color, backgroundColor: `${it.color}14` }} title={it.title}>
                        {it.title || "(untitled)"}
                      </div>
                    ))}
                    {items.length > 3 && <div className="text-[10px] text-[#64748B]">+{items.length - 3} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className={`${cx.card} mt-4 space-y-2`}>
            <div className="flex items-center justify-between">
              <h3 className={cx.h3}>{fmtDate(selectedDay, { weekday: "long", month: "long", day: "numeric" })}</h3>
              <div className="flex items-center gap-2">
                {plannerOn && <button className={`${cx.btn} ${cx.primary}`} onClick={() => setAdding(selectedDay)}><Plus className="h-3.5 w-3.5" /> Add post</button>}
                <button onClick={() => setSelectedDay(null)} aria-label="Close"><X className="h-4 w-4 text-[#64748B]" /></button>
              </div>
            </div>
            {dayPlanned.map((p) => <PlannedRow key={p.id} p={p} />)}
            {dayPs.map((p) => <PsRow key={p.id} p={p} />)}
            {!dayPlanned.length && !dayPs.length && (
              <p className={cx.muted}>
                Nothing on this day.{" "}
                <button className="underline" onClick={() => setComposer({ date: selectedDay })}>Create a post</button>.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Planned posts don't wait on PostStream; its posts join the calendar when they arrive.
  const loading = enabled === null || (plannerOn ? !planner.loaded : !psLoaded);

  return (
    <div className={cx.page}>
      <Link href="/daily-compass" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#475569] hover:underline dark:text-[#CBD5E1]">
        <ArrowLeft className="h-4 w-4" /> Back to Daily Compass
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1A38]">
            <CalendarIcon className="h-6 w-6 text-[#D4AF63]" />
          </div>
          <div>
            <p className={cx.eyebrow}>Daily Compass</p>
            <h1 className={cx.h1}>Content Calendar</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plannerOn && (
            <Link href="/marketing-plan/social-planner" className={`${cx.btn} ${cx.secondary}`}>
              <Sparkles className="h-3.5 w-3.5" /> Social Planner
            </Link>
          )}
          <button onClick={() => setComposer({})} className={`${cx.btn} ${cx.primary}`}>
            <Plus className="h-3.5 w-3.5" /> Create content
          </button>
        </div>
      </div>

      {connected === false && !plannerOn && enabled !== null && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8a6a15]" />
          <p className="text-sm text-[#8a6a15]">
            Connect PostStream in <Link href="/settings" className="font-medium underline">Settings → Integrations</Link> to see and schedule your posts here.
          </p>
        </div>
      )}
      {psError && <p className="mb-4 text-xs text-[#8a2f2f]">PostStream: {psError}</p>}
      {planner.error && (
        <p className="mb-4 text-xs text-[#8a2f2f]">
          {planner.error} <button className="underline" onClick={() => planner.setError("")}>Dismiss</button>
        </p>
      )}

      {plannerOn && settings && !settings.setupDone && posts.length === 0 && (
        <div className="mb-6">
          <Tip action={<Link href="/marketing-plan/social-planner" className={`${cx.btn} ${cx.primary}`}>Set up</Link>}>
            Set up your Social Planner (platforms, weekly goals, offers and voice) to plan posts and track daily habits here.
          </Tip>
        </div>
      )}

      {plannerOn && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px]">
            <Tabs
              tabs={[{ id: "today", label: "Today" }, { id: "week", label: "Week" }, { id: "month", label: "Month" }]}
              value={view}
              onChange={chooseView}
            />
          </div>
          <select aria-label="Show platform" value={filter} onChange={(e) => chooseFilter(e.target.value)} className={`${cx.input} !w-auto mb-6`}>
            <option value="all">All platforms</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <p className={cx.muted}>Loading…</p>
      ) : effectiveView === "today" ? (
        TodayView()
      ) : effectiveView === "week" ? (
        WeekView()
      ) : (
        MonthView()
      )}

      {openPost && settings && (
        <PostDetail
          key={openPost.id}
          post={openPost}
          platforms={platforms}
          offers={settings.offers}
          onSave={(patch) => planner.savePost(openPost.id, patch)}
          onDelete={() => {
            planner.deletePost(openPost.id);
            setOpenId(null);
          }}
          onClose={() => setOpenId(null)}
          onSend={() =>
            setComposer({
              title: openPost.title,
              caption: captionOf(openPost.notes),
              platforms: [openPost.platform],
              date: openPost.date,
              plannedIds: [openPost.id],
              mediaUrls: openPost.mediaUrls,
              scheduledAt: openPost.scheduledAt || undefined,
            })
          }
        />
      )}

      {composer && (
        <PostComposer
          plannerOn={plannerOn}
          initial={composer}
          onClose={() => setComposer(null)}
          onSent={() => {
            if (plannerOn) planner.reloadPosts();
            loadPs();
          }}
        />
      )}

      {adding && settings && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0F1A38]/40" onClick={() => setAdding(null)}>
          <div role="dialog" aria-modal="true" aria-label="Add post" className="h-full w-full max-w-2xl overflow-y-auto bg-[#FAF8F3] dark:bg-[#0E162A] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className={`${cx.h2} mb-4`}>Add post</h2>
            {platforms.length === 0 ? (
              <p className={cx.body}>
                Choose your platforms first in the <Link className="underline" href="/marketing-plan/social-planner">Social Planner</Link>.
              </p>
            ) : (
              <PostForm
                initial={{
                  title: "", platform: filter !== "all" ? filter : platforms[0].id, format: platformDef(filter !== "all" ? filter : platforms[0].id).formats[0], date: adding,
                  notes: "", imagePrompt: "", link: "", series: "", offerKey: null,
                }}
                platforms={platforms}
                offers={settings.offers}
                saveLabel="Add to plan"
                onCancel={() => setAdding(null)}
                onSave={async (v) => {
                  const created = await planner.addPost({ ...v, status: "draft" });
                  setAdding(null);
                  if (created) setOpenId(created.id);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
