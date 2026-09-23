"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CalendarX, ChevronLeft, ChevronRight, Pencil, PlayCircle, Plus, Repeat, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { eventWhen } from "@/lib/community/format";
import { sessionsBetween, upcomingEvents, type Session } from "@/lib/community/events";
import { describeRule, icsLocal, rrule, ruleChoices, type RecurFreq } from "@/lib/community/recurrence";
import { EVENT_KIND_LABELS, type CommunityEvent, type EventKind } from "@/lib/community/types";
import { Badge, Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading, RichText, TextArea } from "@/components/community/ui";

type Rsvp = "going" | "maybe" | "not_going";
type View = "upcoming" | "past" | "calendar";

// One-off events download as a single calendar entry; series download with
// their repeat rule, in the event's own time zone, so they stay correct
// across daylight-saving changes.
function icsFor(s: Session) {
  const e = s.event;
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const rule = rrule(e);
  const first = new Date(e.starts_at);
  const firstEnd = e.ends_at ? new Date(e.ends_at) : new Date(first.getTime() + 60 * 60_000);
  const tz = e.timezone || "America/Denver";
  const timing = rule
    ? [
        `DTSTART;TZID=${tz}:${icsLocal(first, tz)}`,
        `DTEND;TZID=${tz}:${icsLocal(firstEnd, tz)}`,
        rule,
        ...(e.recur_exdates ?? []).map((d) => `EXDATE;TZID=${tz}:${d.replace(/-/g, "")}T${icsLocal(first, tz).slice(9)}`),
      ]
    : [`DTSTART:${fmt(s.start)}`, `DTEND:${fmt(s.end)}`];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeCharter//Collective//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@lifecharter-collective`,
    `DTSTAMP:${fmt(new Date())}`,
    ...timing,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc([e.description, e.join_url].filter(Boolean).join("\n\n"))}`,
    e.join_url ? `URL:${e.join_url}` : "",
    e.location ? `LOCATION:${esc(e.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${e.title.replace(/[^\w]+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// RSVPs are per event — "Going" to a series means every session (with a
// reminder before each one).
function useRsvps(sessions: Session[] | null) {
  const { supabase, userId } = useCommunity();
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [going, setGoing] = useState<Record<string, number>>({});
  const key = Array.from(new Set((sessions ?? []).map((s) => s.event.id))).join(",");

  useEffect(() => {
    if (!key) return;
    void (async () => {
      const { data: r } = await supabase.from("cm_event_rsvps").select("event_id, user_id, status").in("event_id", key.split(","));
      const mine: Record<string, Rsvp> = {};
      const counts: Record<string, number> = {};
      for (const x of (r as { event_id: string; user_id: string; status: Rsvp }[]) ?? []) {
        if (x.user_id === userId) mine[x.event_id] = x.status;
        if (x.status === "going") counts[x.event_id] = (counts[x.event_id] ?? 0) + 1;
      }
      setRsvps(mine);
      setGoing(counts);
    })();
  }, [supabase, userId, key]);

  async function rsvp(e: CommunityEvent, status: Rsvp) {
    if (!userId) return;
    const prev = rsvps[e.id];
    setRsvps((r) => ({ ...r, [e.id]: status }));
    setGoing((g) => ({ ...g, [e.id]: (g[e.id] ?? 0) + (status === "going" ? 1 : 0) - (prev === "going" ? 1 : 0) }));
    await supabase.from("cm_event_rsvps").upsert({ event_id: e.id, user_id: userId, status }, { onConflict: "event_id,user_id" });
  }

  return { rsvps, going, rsvp };
}

export default function EventsPage() {
  const { supabase, spaces, isAdmin, canModerate } = useCommunity();
  const [view, setView] = useState<View>("upcoming");
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [editing, setEditing] = useState<Partial<CommunityEvent> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canCreate = isAdmin || spaces.some((s) => canModerate(s.id));
  const { rsvps, going, rsvp } = useRsvps(view === "calendar" ? null : sessions);

  const load = useCallback(async () => {
    if (view === "calendar") return;
    if (view === "upcoming") return setSessions(await upcomingEvents(supabase, { limit: 60 }));
    // Past: sessions from the last 18 months, newest first.
    const now = new Date();
    const past = await sessionsBetween(supabase, new Date(now.getTime() - 540 * 86_400_000), new Date(now.getTime() - 2 * 3600_000));
    setSessions(past.filter((s) => s.end.getTime() < now.getTime()).reverse().slice(0, 60));
  }, [supabase, view]);

  useEffect(() => {
    setSessions(null);
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!sessions?.length || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sessions]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Heading sub="Alignment Anchors, office hours, workshops and more — shown in your time zone.">LifeCharter Live</Heading>
        {canCreate && (
          <Button variant="gold" size="sm" onClick={() => setEditing({ kind: "session", space_id: null })}>
            <Plus className="h-4 w-4" /> New event
          </Button>
        )}
      </div>

      <div className="mb-4 inline-flex rounded-full bg-[#1F315B]/[0.07] p-1">
        {(
          [
            ["upcoming", "Upcoming"],
            ["calendar", "Calendar"],
            ["past", "Past & replays"],
          ] as [View, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={cn("rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold sm:px-4", view === t ? "bg-white text-[#1F315B] shadow-sm" : "text-[#6B6F80]")}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <MonthCalendar
          reloadKey={reloadKey}
          canCreate={canCreate}
          onNew={(day) => {
            const start = new Date(day);
            start.setHours(9, 0, 0, 0);
            setEditing({ kind: "session", space_id: null, starts_at: start.toISOString() });
          }}
          onEdit={setEditing}
          onChanged={reload}
        />
      ) : sessions === null ? (
        <PageLoading />
      ) : sessions.length === 0 ? (
        <EmptyState icon="📅" title={view === "upcoming" ? "Nothing scheduled yet" : "No past events"}>
          {view === "upcoming" ? "New sessions will appear here." : "Replays will collect here after each session."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <EventCard key={`${s.event.id}-${s.date}`} s={s} rsvp={rsvps[s.event.id]} goingCount={going[s.event.id]} onRsvp={rsvp} onEdit={setEditing} onChanged={reload} />
          ))}
        </div>
      )}

      {editing && (
        <EventEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function EventCard({
  s,
  rsvp,
  goingCount,
  onRsvp,
  onEdit,
  onChanged,
  compact,
}: {
  s: Session;
  rsvp?: Rsvp;
  goingCount?: number;
  onRsvp: (e: CommunityEvent, st: Rsvp) => void;
  onEdit: (e: CommunityEvent) => void;
  onChanged: () => void;
  compact?: boolean;
}) {
  const { supabase, spaces, isAdmin, canModerate } = useCommunity();
  const e = s.event;
  const upcoming = s.end.getTime() > Date.now();
  const soon = s.start.getTime() - Date.now() < 30 * 60_000 && upcoming;
  const space = spaces.find((x) => x.id === e.space_id);
  const manage = isAdmin || (e.space_id ? canModerate(e.space_id) : false);
  const repeats = describeRule(e) ?? e.recurrence;

  return (
    <Card className={cn("scroll-mt-24", compact ? "p-4" : "p-4 sm:p-5")}>
      <div id={e.id} className="flex gap-4">
        <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#1F315B] to-[#0F1A38] text-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E6C988]">{s.start.toLocaleDateString(undefined, { month: "short" })}</span>
          <span className="font-display text-[26px] font-semibold leading-none">{s.start.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>{EVENT_KIND_LABELS[e.kind]}</Badge>
            <Badge tone="gray">{space ? `${space.emoji} ${space.name}` : "Whole Collective"}</Badge>
          </div>
          <h2 className="mt-1 font-display text-[22px] font-semibold leading-snug text-[#1F315B]">{e.title}</h2>
          <p className="text-[13.5px] text-[#5B6275]">{eventWhen(s.start.toISOString(), s.end.toISOString())}</p>
          {repeats && (
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#8A8FA0]">
              <Repeat className="h-3.5 w-3.5" /> {repeats}
            </p>
          )}
          {e.description && !compact && <RichText text={e.description} className="mt-2 text-[14.5px]" />}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {upcoming && e.join_url && (
              <a href={e.join_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant={soon ? "gold" : "navy"}>
                  <Video className="h-4 w-4" /> {soon ? "Join now" : "Join link"}
                </Button>
              </a>
            )}
            {e.replay_url && !e.recur_freq && (
              <a href={e.replay_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="gold">
                  <PlayCircle className="h-4 w-4" /> Watch replay
                </Button>
              </a>
            )}
            {upcoming && (
              <>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#DCD3C1]">
                  {(["going", "maybe"] as Rsvp[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onRsvp(e, rsvp === st ? "not_going" : st)}
                      title={e.recur_freq && st === "going" ? "You'll get a reminder before each session" : undefined}
                      className={cn("px-3 py-1.5 text-[13px] font-semibold", rsvp === st ? "bg-[#1F315B] text-white" : "bg-white text-[#1F315B] hover:bg-[#FBF8F2]")}
                    >
                      {st === "going" ? "Going" : "Maybe"}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={() => icsFor(s)}>
                  <CalendarPlus className="h-4 w-4" /> {e.recur_freq ? "Add series to calendar" : "Add to calendar"}
                </Button>
              </>
            )}
            {!!goingCount && <span className="text-[12.5px] text-[#8A8FA0]">{goingCount} going</span>}
            {manage && (
              <span className="ml-auto flex gap-1">
                {e.recur_freq && upcoming && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Skip this date"
                    title="Skip this date only"
                    onClick={async () => {
                      const label = s.start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
                      if (!confirm(`Skip ${label}? The rest of the series stays on the calendar.`)) return;
                      await supabase
                        .from("cm_events")
                        .update({ recur_exdates: Array.from(new Set([...(e.recur_exdates ?? []), s.date])) })
                        .eq("id", e.id);
                      onChanged();
                    }}
                  >
                    <CalendarX className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onEdit(e)} aria-label={e.recur_freq ? "Edit series" : "Edit event"}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={e.recur_freq ? "Delete series" : "Delete event"}
                  onClick={async () => {
                    if (!confirm(e.recur_freq ? `Delete every session of “${e.title}”?` : `Delete “${e.title}”?`)) return;
                    await supabase.from("cm_events").update({ deleted_at: new Date().toISOString() }).eq("id", e.id);
                    onChanged();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Month calendar ────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const CHIP: Partial<Record<EventKind, string>> = {
  anchor: "bg-[#1F315B] text-white",
  masterclass: "bg-[#B8923F] text-white",
  workshop: "bg-[#2E7C83] text-white",
  office_hours: "bg-[#5E3B6C] text-white",
  summit: "bg-[#B8923F] text-white",
};

function MonthCalendar({
  reloadKey,
  canCreate,
  onNew,
  onEdit,
  onChanged,
}: {
  reloadKey: number;
  canCreate: boolean;
  onNew: (day: Date) => void;
  onEdit: (e: CommunityEvent) => void;
  onChanged: () => void;
}) {
  const { supabase } = useCommunity();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const { rsvps, going, rsvp } = useRsvps(sessions);

  // Six-week grid starting on the Sunday on or before the 1st.
  const gridStart = new Date(month);
  gridStart.setDate(1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const gridEnd = new Date(days[41]);
  gridEnd.setDate(gridEnd.getDate() + 1);

  useEffect(() => {
    setSessions(null);
    void sessionsBetween(supabase, gridStart, gridEnd).then(setSessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, month.getTime(), reloadKey]);

  const byDay = new Map<string, Session[]>();
  for (const s of sessions ?? []) {
    const k = dayKey(s.start);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  const selectedSessions = byDay.get(dayKey(selected)) ?? [];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).replace(":00", "").replace(" ", "").toLowerCase();

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE0] px-3 py-3 sm:px-4">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-2 text-[#1F315B] hover:bg-black/5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[22px] font-semibold text-[#1F315B]">
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            {(month.getMonth() !== today.getMonth() || month.getFullYear() !== today.getFullYear()) && (
              <button
                onClick={() => {
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelected(today);
                }}
                className="rounded-full border border-[#DCD3C1] px-2.5 py-0.5 text-[12px] font-semibold text-[#1F315B] hover:border-[#D4AF63]"
              >
                Today
              </button>
            )}
          </div>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-2 text-[#1F315B] hover:bg-black/5">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[#F0EBE0] bg-[#FBF9F5]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8FA0]">
              <span className="sm:hidden">{w[0]}</span>
              <span className="hidden sm:inline">{w}</span>
            </div>
          ))}
        </div>

        <div className={cn("grid grid-cols-7", sessions === null && "opacity-60")}>
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth();
            const isToday = dayKey(d) === dayKey(today);
            const isSel = dayKey(d) === dayKey(selected);
            const list = byDay.get(dayKey(d)) ?? [];
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                aria-label={`${d.toDateString()}${list.length ? `, ${list.length} event${list.length > 1 ? "s" : ""}` : ""}`}
                aria-pressed={isSel}
                className={cn(
                  "flex min-h-[54px] flex-col items-stretch gap-1 border-b border-r border-[#F0EBE0] p-1 text-left transition sm:min-h-[104px] sm:p-1.5",
                  i % 7 === 6 && "border-r-0",
                  i >= 35 && "border-b-0",
                  inMonth ? "bg-white" : "bg-[#FBF9F5]",
                  isSel ? "ring-2 ring-inset ring-[#D4AF63]" : "hover:bg-[#FBF6EA]"
                )}
              >
                <span
                  className={cn(
                    "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-semibold sm:mx-0",
                    isToday ? "bg-[#1F315B] text-white" : inMonth ? "text-[#1F315B]" : "text-[#B8BCC8]"
                  )}
                >
                  {d.getDate()}
                </span>
                {/* Phones: dots. Larger screens: time + title chips. */}
                {list.length > 0 && (
                  <span className="flex justify-center gap-0.5 sm:hidden">
                    {list.slice(0, 3).map((s) => (
                      <span key={`${s.event.id}-${s.date}`} className="h-1.5 w-1.5 rounded-full bg-[#B8923F]" />
                    ))}
                  </span>
                )}
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {list.slice(0, 2).map((s) => (
                    <span
                      key={`${s.event.id}-${s.date}`}
                      title={`${time(s.start)} ${s.event.title}`}
                      className={cn("truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold", CHIP[s.event.kind] ?? "bg-[#F5EBD3] text-[#7A5E1F]")}
                    >
                      {time(s.start)} {s.event.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="px-1 text-[11px] font-semibold text-[#8A8FA0]">+{list.length - 2} more</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-[22px] font-semibold text-[#1F315B]">
            {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {canCreate && (
            <Button size="sm" variant="outline" onClick={() => onNew(selected)}>
              <Plus className="h-4 w-4" /> Add event
            </Button>
          )}
        </div>
        {selectedSessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#DCD3C1] bg-white/60 px-4 py-6 text-center text-[14px] text-[#8A8FA0]">Nothing scheduled this day.</p>
        ) : (
          <div className="space-y-3">
            {selectedSessions.map((s) => (
              <EventCard key={`${s.event.id}-${s.date}`} s={s} compact rsvp={rsvps[s.event.id]} goingCount={going[s.event.id]} onRsvp={rsvp} onEdit={onEdit} onChanged={onChanged} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Editor ────────────────────────────────────────────────────────────────

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const selectClass = "w-full rounded-xl border border-[#DCD3C1] bg-white px-3 py-2.5 text-[15px]";

function EventEditor({ initial, onClose, onSaved }: { initial: Partial<CommunityEvent>; onClose: () => void; onSaved: () => void }) {
  const { supabase, userId, spaces, isAdmin, canModerate } = useCommunity();
  const [f, setF] = useState({
    title: initial.title ?? "",
    kind: (initial.kind ?? "session") as EventKind,
    space_id: initial.space_id ?? "",
    starts: toLocalInput(initial.starts_at),
    ends: toLocalInput(initial.ends_at),
    repeat: (initial.recur_freq ?? "") as RecurFreq | "",
    until: initial.recur_until ?? "",
    join_url: initial.join_url ?? "",
    location: initial.location ?? "",
    replay_url: initial.replay_url ?? "",
    description: initial.description ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spaceOptions = spaces.filter((s) => isAdmin || canModerate(s.id));
  const choices = ruleChoices(f.starts);
  const repeating = !!f.repeat;

  async function save() {
    if (!f.title.trim() || !f.starts) return setError("Title and start time are required.");
    if (!f.space_id && !isAdmin) return setError("Choose a channel.");
    const start = new Date(f.starts);
    const end = f.ends ? new Date(f.ends) : null;
    if (end && end <= start) return setError("The end time needs to be after the start time.");
    if (repeating && end && end.getTime() - start.getTime() > 24 * 3600_000) {
      return setError("For a repeating event, set when this first session ends (the same day), and use “Repeat until” for the last date.");
    }
    if (repeating && f.until && f.until < f.starts.slice(0, 10)) return setError("“Repeat until” needs to be on or after the first session.");
    setBusy(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const rule = {
      starts_at: start.toISOString(),
      timezone,
      recur_freq: (f.repeat || null) as RecurFreq | null,
      recur_until: repeating && f.until ? f.until : null,
    };
    const row = {
      title: f.title.trim(),
      kind: f.kind,
      space_id: f.space_id || null,
      ...rule,
      ends_at: end ? end.toISOString() : null,
      recur_exdates: repeating ? initial.recur_exdates ?? [] : [],
      recurrence: describeRule(rule),
      join_url: f.join_url.trim() || null,
      location: f.location.trim() || null,
      replay_url: f.replay_url.trim() || null,
      description: f.description.trim() || null,
    };
    const { error } = initial.id
      ? await supabase.from("cm_events").update(row).eq("id", initial.id)
      : await supabase.from("cm_events").insert({ ...row, created_by: userId });
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
  }

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={initial.id ? (initial.recur_freq ? "Edit series" : "Edit event") : "New event"} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input value={f.title} onChange={set("title")} placeholder="Weekly Alignment Anchor" />
        </div>
        <div>
          <Label>Type</Label>
          <select value={f.kind} onChange={set("kind")} className={selectClass}>
            {Object.entries(EVENT_KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Who can see it</Label>
          <select value={f.space_id} onChange={set("space_id")} className={selectClass}>
            {isAdmin && <option value="">Whole Collective</option>}
            {spaceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{repeating ? "First session starts" : "Starts"}</Label>
          <Input type="datetime-local" value={f.starts} onChange={set("starts")} />
        </div>
        <div>
          <Label>{repeating ? "First session ends" : "Ends"}</Label>
          <Input type="datetime-local" value={f.ends} onChange={set("ends")} />
        </div>
        <div>
          <Label>Repeats</Label>
          <select value={f.repeat} onChange={set("repeat")} className={selectClass} disabled={!f.starts}>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Repeat until (optional)</Label>
          <Input type="date" value={f.until} onChange={set("until")} disabled={!repeating} min={f.starts.slice(0, 10) || undefined} />
        </div>
        {repeating && (
          <p className="-mt-1 text-[12.5px] text-[#8A8FA0] sm:col-span-2">
            Each session runs at the same local time. Leave “Repeat until” empty to keep it going. To skip a single date later, use the{" "}
            <CalendarX className="inline h-3.5 w-3.5 align-[-2px]" /> button on that session.
          </p>
        )}
        <div className="sm:col-span-2">
          <Label>Join link (Zoom, etc.)</Label>
          <Input value={f.join_url} onChange={set("join_url")} placeholder="https://zoom.us/j/…" />
        </div>
        <div>
          <Label>Location (optional)</Label>
          <Input value={f.location} onChange={set("location")} placeholder="Online" />
        </div>
        {!repeating && (
          <div>
            <Label>Replay link (add after the session)</Label>
            <Input value={f.replay_url} onChange={set("replay_url")} placeholder="https://…" />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <TextArea value={f.description} onChange={set("description")} />
        </div>
      </div>
      <div className="mt-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="gold" onClick={save} disabled={busy}>
          {busy ? "Saving…" : initial.recur_freq || repeating ? "Save series" : "Save event"}
        </Button>
      </div>
    </Modal>
  );
}
