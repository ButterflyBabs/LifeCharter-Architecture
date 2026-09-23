"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Pencil, PlayCircle, Plus, Repeat, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { eventWhen } from "@/lib/community/format";
import { EVENT_KIND_LABELS, type CommunityEvent, type EventKind } from "@/lib/community/types";
import { Badge, Button, Card, EmptyState, ErrorNote, Heading, Input, Label, Modal, PageLoading, RichText, TextArea } from "@/components/community/ui";

type Rsvp = "going" | "maybe" | "not_going";

function icsFor(e: CommunityEvent) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 60 * 60_000);
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeCharter//Collective//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@lifecharter-collective`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
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

type View = "upcoming" | "past" | "calendar";

function useRsvps(events: CommunityEvent[] | null) {
  const { supabase, userId } = useCommunity();
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [going, setGoing] = useState<Record<string, number>>({});
  const key = (events ?? []).map((e) => e.id).join(",");

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
  const [events, setEvents] = useState<CommunityEvent[] | null>(null);
  const [editing, setEditing] = useState<Partial<CommunityEvent> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canCreate = isAdmin || spaces.some((s) => canModerate(s.id));
  const { rsvps, going, rsvp } = useRsvps(view === "calendar" ? null : events);

  const load = useCallback(async () => {
    if (view === "calendar") return;
    const cutoff = new Date(Date.now() - 2 * 3600_000).toISOString();
    const q = supabase.from("cm_events").select("*");
    const { data } =
      view === "upcoming" ? await q.gte("starts_at", cutoff).order("starts_at").limit(50) : await q.lt("starts_at", cutoff).order("starts_at", { ascending: false }).limit(50);
    setEvents((data as CommunityEvent[]) ?? []);
  }, [supabase, view]);

  useEffect(() => {
    setEvents(null);
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!events?.length || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [events]);

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
      ) : events === null ? (
        <PageLoading />
      ) : events.length === 0 ? (
        <EmptyState icon="📅" title={view === "upcoming" ? "Nothing scheduled yet" : "No past events"}>
          {view === "upcoming" ? "New sessions will appear here." : "Replays will collect here after each session."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} e={e} rsvp={rsvps[e.id]} goingCount={going[e.id]} onRsvp={rsvp} onEdit={setEditing} onChanged={reload} />
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
  e,
  rsvp,
  goingCount,
  onRsvp,
  onEdit,
  onChanged,
  compact,
}: {
  e: CommunityEvent;
  rsvp?: Rsvp;
  goingCount?: number;
  onRsvp: (e: CommunityEvent, s: Rsvp) => void;
  onEdit: (e: CommunityEvent) => void;
  onChanged: () => void;
  compact?: boolean;
}) {
  const { supabase, spaces, isAdmin, canModerate } = useCommunity();
  const d = new Date(e.starts_at);
  const endMs = e.ends_at ? new Date(e.ends_at).getTime() : d.getTime() + 2 * 3600_000;
  const upcoming = endMs > Date.now();
  const soon = d.getTime() - Date.now() < 30 * 60_000 && upcoming;
  const space = spaces.find((s) => s.id === e.space_id);
  const manage = isAdmin || (e.space_id ? canModerate(e.space_id) : false);

  return (
    <Card className={cn("scroll-mt-24", compact ? "p-4" : "p-4 sm:p-5")}>
      <div id={e.id} className="flex gap-4">
        <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#1F315B] to-[#0F1A38] text-white">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E6C988]">{d.toLocaleDateString(undefined, { month: "short" })}</span>
          <span className="font-display text-[26px] font-semibold leading-none">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>{EVENT_KIND_LABELS[e.kind]}</Badge>
            <Badge tone="gray">{space ? `${space.emoji} ${space.name}` : "Whole Collective"}</Badge>
          </div>
          <h2 className="mt-1 font-display text-[22px] font-semibold leading-snug text-[#1F315B]">{e.title}</h2>
          <p className="text-[13.5px] text-[#5B6275]">{eventWhen(e.starts_at, e.ends_at)}</p>
          {e.recurrence && (
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#8A8FA0]">
              <Repeat className="h-3.5 w-3.5" /> {e.recurrence}
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
            {e.replay_url && (
              <a href={e.replay_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="gold">
                  <PlayCircle className="h-4 w-4" /> Watch replay
                </Button>
              </a>
            )}
            {upcoming && (
              <>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#DCD3C1]">
                  {(["going", "maybe"] as Rsvp[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onRsvp(e, rsvp === s ? "not_going" : s)}
                      className={cn("px-3 py-1.5 text-[13px] font-semibold", rsvp === s ? "bg-[#1F315B] text-white" : "bg-white text-[#1F315B] hover:bg-[#FBF8F2]")}
                    >
                      {s === "going" ? "Going" : "Maybe"}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={() => icsFor(e)}>
                  <CalendarPlus className="h-4 w-4" /> Add to calendar
                </Button>
              </>
            )}
            {!!goingCount && <span className="text-[12.5px] text-[#8A8FA0]">{goingCount} going</span>}
            {manage && (
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(e)} aria-label="Edit event">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Delete event"
                  onClick={async () => {
                    if (!confirm(`Delete “${e.title}”?`)) return;
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
  const [events, setEvents] = useState<CommunityEvent[] | null>(null);
  const { rsvps, going, rsvp } = useRsvps(events);

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
    setEvents(null);
    void supabase
      .from("cm_events")
      .select("*")
      .gte("starts_at", gridStart.toISOString())
      .lt("starts_at", gridEnd.toISOString())
      .order("starts_at")
      .then(({ data }: { data: CommunityEvent[] | null }) => setEvents(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, month.getTime(), reloadKey]);

  const byDay = new Map<string, CommunityEvent[]>();
  for (const e of events ?? []) {
    const k = dayKey(new Date(e.starts_at));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(e);
  }
  const selectedEvents = byDay.get(dayKey(selected)) ?? [];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).replace(":00", "").replace(" ", "").toLowerCase();

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

        <div className={cn("grid grid-cols-7", events === null && "opacity-60")}>
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
                    {list.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full bg-[#B8923F]" />
                    ))}
                  </span>
                )}
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {list.slice(0, 2).map((e) => (
                    <span key={e.id} title={`${time(e.starts_at)} ${e.title}`} className={cn("truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold", CHIP[e.kind] ?? "bg-[#F5EBD3] text-[#7A5E1F]")}>
                      {time(e.starts_at)} {e.title}
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
        {selectedEvents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#DCD3C1] bg-white/60 px-4 py-6 text-center text-[14px] text-[#8A8FA0]">Nothing scheduled this day.</p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((e) => (
              <EventCard key={e.id} e={e} compact rsvp={rsvps[e.id]} goingCount={going[e.id]} onRsvp={rsvp} onEdit={onEdit} onChanged={onChanged} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventEditor({ initial, onClose, onSaved }: { initial: Partial<CommunityEvent>; onClose: () => void; onSaved: () => void }) {
  const { supabase, userId, spaces, isAdmin, canModerate } = useCommunity();
  const [f, setF] = useState({
    title: initial.title ?? "",
    kind: (initial.kind ?? "session") as EventKind,
    space_id: initial.space_id ?? "",
    starts: toLocalInput(initial.starts_at),
    ends: toLocalInput(initial.ends_at),
    join_url: initial.join_url ?? "",
    location: initial.location ?? "",
    replay_url: initial.replay_url ?? "",
    recurrence: initial.recurrence ?? "",
    description: initial.description ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spaceOptions = spaces.filter((s) => isAdmin || canModerate(s.id));

  async function save() {
    if (!f.title.trim() || !f.starts) return setError("Title and start time are required.");
    if (!f.space_id && !isAdmin) return setError("Choose a space.");
    setBusy(true);
    const row = {
      title: f.title.trim(),
      kind: f.kind,
      space_id: f.space_id || null,
      starts_at: new Date(f.starts).toISOString(),
      ends_at: f.ends ? new Date(f.ends).toISOString() : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      join_url: f.join_url.trim() || null,
      location: f.location.trim() || null,
      replay_url: f.replay_url.trim() || null,
      recurrence: f.recurrence.trim() || null,
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
    <Modal open onClose={onClose} title={initial.id ? "Edit event" : "New event"} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input value={f.title} onChange={set("title")} placeholder="Weekly Alignment Anchor" />
        </div>
        <div>
          <Label>Type</Label>
          <select value={f.kind} onChange={set("kind")} className="w-full rounded-xl border border-[#DCD3C1] bg-white px-3 py-2.5 text-[15px]">
            {Object.entries(EVENT_KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Who can see it</Label>
          <select value={f.space_id} onChange={set("space_id")} className="w-full rounded-xl border border-[#DCD3C1] bg-white px-3 py-2.5 text-[15px]">
            {isAdmin && <option value="">Whole Collective</option>}
            {spaceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Starts</Label>
          <Input type="datetime-local" value={f.starts} onChange={set("starts")} />
        </div>
        <div>
          <Label>Ends</Label>
          <Input type="datetime-local" value={f.ends} onChange={set("ends")} />
        </div>
        <div className="sm:col-span-2">
          <Label>Join link (Zoom, etc.)</Label>
          <Input value={f.join_url} onChange={set("join_url")} placeholder="https://zoom.us/j/…" />
        </div>
        <div>
          <Label>Repeats (shown as text)</Label>
          <Input value={f.recurrence} onChange={set("recurrence")} placeholder="Every Tuesday" />
        </div>
        <div>
          <Label>Location (optional)</Label>
          <Input value={f.location} onChange={set("location")} placeholder="Online" />
        </div>
        <div className="sm:col-span-2">
          <Label>Replay link (add after the session)</Label>
          <Input value={f.replay_url} onChange={set("replay_url")} placeholder="https://…" />
        </div>
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
          {busy ? "Saving…" : "Save event"}
        </Button>
      </div>
    </Modal>
  );
}
