"use client";

// Collective engagement at a glance (co027). All numbers come from the
// cm_admin_engagement() database function, which refuses anyone who isn't a
// Collective admin — counts only, never post or message content.
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { Button, Card, ErrorNote, PageLoading } from "@/components/community/ui";

interface Week {
  week: string;
  new_members: number;
  posts: number;
  replies: number;
  dms: number;
  active: number;
}
interface Engagement {
  generated_at: string;
  members_total: number;
  active_7d: number;
  active_30d: number;
  weekly: Week[];
  top_channels: { id: string; name: string; emoji: string | null; posts: number; replies: number; reactions: number; members: number; score: number }[];
  events: { id: string; title: string; starts_at: string; recurrence: string | null; going: number; maybe: number }[];
  dms_30d: number;
  dm_threads_active_30d: number;
  purchase_grants: { pending: number; applied: number };
}

const GOLD = "#D4AF63";
const TEAL = "#2E7C83";

function weekLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[var(--cm-muted)]">{label}</p>
      <p className="mt-1 font-editorial text-[30px] font-semibold leading-none text-[var(--cm-ink)]">{value}</p>
      {note && <p className="mt-1.5 text-[12.5px] text-[var(--cm-muted-2)]">{note}</p>}
    </Card>
  );
}

// Weekly columns; one or two series side by side.
function WeeklyBars({ title, weeks, series }: { title: string; weeks: Week[]; series: { key: keyof Week; label: string; color: string }[] }) {
  const max = Math.max(1, ...weeks.flatMap((w) => series.map((s) => Number(w[s.key]) || 0)));
  const total = (k: keyof Week) => weeks.reduce((n, w) => n + (Number(w[k]) || 0), 0);
  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-[var(--cm-ink)]">{title}</p>
        <div className="flex flex-wrap gap-3 text-[12.5px] text-[var(--cm-muted-2)]">
          {series.map((s) => (
            <span key={String(s.key)} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label} · {total(s.key)} in 12 weeks
            </span>
          ))}
        </div>
      </div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`${title}, last 12 weeks`}>
        {weeks.map((w) => (
          <div key={w.week} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-[2px]">
              {series.map((s) => {
                const v = Number(w[s.key]) || 0;
                return (
                  <div
                    key={String(s.key)}
                    title={`${weekLabel(w.week)}: ${v} ${s.label.toLowerCase()}`}
                    className="w-full max-w-[18px] rounded-t-[3px]"
                    style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0, background: s.color }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 border-t border-[var(--cm-line-soft)] pt-1.5">
        {weeks.map((w, i) => (
          <span key={w.week} className="min-w-0 flex-1 truncate text-center text-[10.5px] text-[var(--cm-muted)]">
            {i % 2 === 1 || i === weeks.length - 1 ? weekLabel(w.week) : ""}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function EngagementDashboard() {
  const { supabase } = useCommunity();
  const [data, setData] = useState<Engagement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const { data: d, error: e } = await supabase.rpc("cm_admin_engagement");
    if (e) setError(e.message);
    else {
      setError(null);
      setData(d as Engagement);
    }
    setBusy(false);
  }, [supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <PageLoading />;

  const weeks = data.weekly ?? [];
  const thisWeek = weeks.at(-1);
  const channels = (data.top_channels ?? []).slice(0, 8);
  const topScore = Math.max(1, ...channels.map((c) => c.score));
  const now = Date.now();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-[var(--cm-muted-2)]">
          &ldquo;Active&rdquo; means posted, replied, reacted, sent a message, RSVP&rsquo;d or wrote in their journal. Counts only &mdash; no content is shown here.
        </p>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={busy}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Members" value={data.members_total} note={`${thisWeek?.new_members ?? 0} new this week`} />
        <Stat label="Active · 7 days" value={data.active_7d} note={data.members_total ? `${Math.round((data.active_7d / data.members_total) * 100)}% of members` : undefined} />
        <Stat label="Active · 30 days" value={data.active_30d} note={data.members_total ? `${Math.round((data.active_30d / data.members_total) * 100)}% of members` : undefined} />
        <Stat label="Private messages · 30 days" value={data.dms_30d} note={`${data.dm_threads_active_30d} active conversations`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <WeeklyBars title="Active members per week" weeks={weeks} series={[{ key: "active", label: "Active", color: TEAL }]} />
        <WeeklyBars title="New members per week" weeks={weeks} series={[{ key: "new_members", label: "New members", color: GOLD }]} />
        <WeeklyBars
          title="Posts and replies per week"
          weeks={weeks}
          series={[
            { key: "posts", label: "Posts", color: GOLD },
            { key: "replies", label: "Replies", color: TEAL },
          ]}
        />
        <WeeklyBars title="Private messages per week" weeks={weeks} series={[{ key: "dms", label: "Messages", color: TEAL }]} />
      </div>

      <Card className="p-4">
        <p className="mb-3 font-semibold text-[var(--cm-ink)]">Top channels · last 30 days</p>
        <div className="space-y-2.5">
          {channels.map((c) => (
            <div key={c.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13.5px]">
                <span className="font-semibold text-[var(--cm-ink)]">
                  {c.emoji} {c.name}
                </span>
                <span className="text-[12.5px] text-[var(--cm-muted-2)]">
                  {c.posts} posts · {c.replies} replies · {c.reactions} reactions · {c.members} members
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--cm-fill-2)]">
                <div className="h-2 rounded-full" style={{ width: `${(c.score / topScore) * 100}%`, minWidth: c.score ? 6 : 0, background: GOLD }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-1 font-semibold text-[var(--cm-ink)]">Events</p>
        <p className="mb-3 text-[12.5px] text-[var(--cm-muted-2)]">RSVPs per event. Live attendance isn&rsquo;t tracked yet.</p>
        {data.events.length ? (
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="text-[12px] uppercase tracking-[0.06em] text-[var(--cm-muted)]">
                <th className="py-1.5 font-semibold">Event</th>
                <th className="py-1.5 font-semibold">Starts</th>
                <th className="py-1.5 text-right font-semibold">Going</th>
                <th className="py-1.5 text-right font-semibold">Maybe</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.id} className="border-t border-[var(--cm-line-soft)]">
                  <td className="py-2 pr-2 text-[var(--cm-ink)]">
                    {e.title}
                    {e.recurrence && <span className="block text-[12px] text-[var(--cm-muted)]">{e.recurrence}</span>}
                  </td>
                  <td className="py-2 pr-2 text-[var(--cm-muted-2)]">
                    {new Date(e.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {new Date(e.starts_at).getTime() < now && !e.recurrence ? " (past)" : ""}
                  </td>
                  <td className="py-2 text-right font-semibold text-[var(--cm-ink)]">{e.going}</td>
                  <td className="py-2 text-right text-[var(--cm-muted-2)]">{e.maybe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[13.5px] text-[var(--cm-muted-2)]">No events yet.</p>
        )}
      </Card>

      <p className="text-[12.5px] text-[var(--cm-muted)]">
        Purchase access: {data.purchase_grants.applied} applied · {data.purchase_grants.pending} waiting for the buyer to create a login. Updated{" "}
        {new Date(data.generated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.
      </p>
    </div>
  );
}
