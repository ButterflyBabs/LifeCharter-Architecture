"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Settings, CheckCircle2, Clock, AlertTriangle, Circle } from "lucide-react";
import { STATUS_LABEL } from "@/lib/operations";

interface Pillar {
  key: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "needs_attention" | "complete";
  notes: string;
}

const STATUS_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  complete: { color: "#2c6b3f", bg: "#d8efdd", icon: <CheckCircle2 className="w-4 h-4" /> },
  in_progress: { color: "#1c5a60", bg: "#d3ebee", icon: <Clock className="w-4 h-4" /> },
  needs_attention: { color: "#8a6a15", bg: "#f4e6c9", icon: <AlertTriangle className="w-4 h-4" /> },
  not_started: { color: "#8a7f74", bg: "#eee9e2", icon: <Circle className="w-4 h-4" /> },
};

export default function OperationsPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operations");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.pillars)) setPillars(d.pillars);
      if (d.counts) setCounts(d.counts);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, patch: Partial<Pillar>) => {
    setPillars((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    setSavingKey(key);
    try {
      await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pillarKey: key, ...patch }),
      });
      // Refresh counts.
      const res = await fetch("/api/operations");
      const d = await res.json().catch(() => ({}));
      if (d.counts) setCounts(d.counts);
    } finally {
      setSavingKey(null);
    }
  };

  const total = pillars.length || 8;
  const solid = counts.complete || 0;

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Operations</h1>
          <p className="text-[#b8a898]">Your 8 operational pillars</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(["complete", "in_progress", "needs_attention", "not_started"] as const).map((st) => (
          <div key={st} className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
            <div className="flex items-center gap-2" style={{ color: STATUS_META[st].color }}>
              {STATUS_META[st].icon}
              <span className="text-sm">{STATUS_LABEL[st]}</span>
            </div>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mt-1">{counts[st] || 0}</p>
          </div>
        ))}
      </div>

      {solid >= 0 && loaded && (
        <p className="text-sm text-[#b8a898] mb-4">
          {solid} of {total} pillars solid. Set each pillar&apos;s status below — it feeds your Daily Compass
          insights and overall business health.
        </p>
      )}

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loaded ? (
          <p className="text-sm text-[#b8a898]">Loading…</p>
        ) : (
          pillars.map((p) => {
            const meta = STATUS_META[p.status];
            return (
              <Card key={p.key}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-xs text-[#b8a898] mt-0.5">{p.description}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {meta.icon}
                    {STATUS_LABEL[p.status]}
                  </span>
                </CardHeader>
                <CardContent>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Status</label>
                  <select
                    value={p.status}
                    disabled={savingKey === p.key}
                    onChange={(e) => save(p.key, { status: e.target.value as Pillar["status"] })}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] mb-3"
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="needs_attention">Needs attention</option>
                    <option value="complete">Solid</option>
                  </select>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Notes</label>
                  <textarea
                    defaultValue={p.notes}
                    onBlur={(e) => {
                      if (e.target.value !== p.notes) save(p.key, { notes: e.target.value });
                    }}
                    rows={2}
                    placeholder="What's working, what needs attention…"
                    className="w-full p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
