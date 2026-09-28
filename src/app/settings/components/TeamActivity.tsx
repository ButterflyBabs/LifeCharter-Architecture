"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Crown, Loader2, User } from "lucide-react";

// Settings → Team → Activity (cs184): who did what in the account, with a
// weekly summary per person. Owner and admins only (the API enforces it).

type Entry = { id: number; personId: string; name: string; isOwner: boolean; action: string; area: string | null; summary: string; at: string };
type Weekly = { personId: string; name: string; isOwner: boolean; total: number; lines: string[] };
type Option = { id: string; name?: string; label?: string };

const selectCls =
  "w-full text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]";

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function TeamActivity() {
  const [person, setPerson] = useState("");
  const [area, setArea] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [people, setPeople] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);
  const [areaLabel, setAreaLabel] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (person) qs.set("person", person);
    if (area) qs.set("area", area);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    try {
      const res = await fetch(`/api/team/activity?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Couldn't load activity.");
      setEntries(data.entries || []);
      setWeekly(data.weekly || []);
      setPeople(data.people || []);
      setAreas(data.areas || []);
      setAreaLabel(Object.fromEntries(((data.areas || []) as Option[]).map((a) => [a.id, a.label || a.id])));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [person, area, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = Boolean(person || area || from || to);

  return (
    <div className="space-y-6">
      {/* This week, per person */}
      <div>
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Past 7 days</h4>
        <p className="text-sm text-[#b8a898] mb-3">What each person got done this week.</p>
        {weekly.length === 0 && !loading ? (
          <p className="text-sm text-[#b8a898]">No activity in the past 7 days yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {weekly.map((w) => (
              <Card key={w.personId}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {w.isOwner ? <Crown className="w-4 h-4 text-[#c9a227] flex-shrink-0" /> : <User className="w-4 h-4 text-[#2E7C83] flex-shrink-0" />}
                    <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{w.name}</span>
                  </div>
                  <p className="text-sm text-[#5c5348] dark:text-[#b8c2cf] break-words">
                    {w.lines.slice(0, 6).join(", ")}
                    {w.lines.length > 6 ? `, and ${w.lines.length - 6} more` : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block text-xs text-[#7a8a99]">
          Person
          <select value={person} onChange={(e) => setPerson(e.target.value)} className={`${selectCls} mt-1`}>
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[#7a8a99]">
          Area
          <select value={area} onChange={(e) => setArea(e.target.value)} className={`${selectCls} mt-1`}>
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[#7a8a99]">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${selectCls} mt-1`} />
        </label>
        <label className="block text-xs text-[#7a8a99]">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${selectCls} mt-1`} />
        </label>
      </div>
      {filtered && (
        <button
          type="button"
          onClick={() => {
            setPerson("");
            setArea("");
            setFrom("");
            setTo("");
          }}
          className="text-sm text-[#2E7C83] hover:underline"
        >
          Clear filters
        </button>
      )}

      {/* The log */}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>}
      {loading ? (
        <p className="text-sm text-[#b8a898] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[#b8a898]">
          {filtered ? "Nothing matches these filters." : "Nothing recorded yet. Changes to tasks, finance, the pipeline, SOPs, goals, content, scripts and sales activities show up here."}
        </p>
      ) : (
        <ul className="divide-y divide-[#1a2b4a]/10 rounded-lg border border-[#1a2b4a]/10 bg-white dark:bg-white/5">
          {entries.map((e) => (
            <li key={e.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] break-words">
                  <span className="font-medium">{e.name}</span> <span className="text-[#5c5348] dark:text-[#b8c2cf]">{e.summary.charAt(0).toLowerCase() + e.summary.slice(1)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs text-[#7a8a99]">
                {e.area && <span className="rounded bg-[#2E7C83]/10 text-[#2E7C83] px-2 py-0.5">{areaLabel[e.area] ?? e.area}</span>}
                <time dateTime={e.at}>{when(e.at)}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
