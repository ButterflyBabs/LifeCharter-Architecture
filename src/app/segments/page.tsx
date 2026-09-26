"use client";

import { useEffect, useState } from "react";
import { SegmentRead } from "@/components/planning/AssistantPanels";

interface DimensionScore {
  dimension_key: string;
  score: number;
  health: "healthy" | "attention" | "at_risk";
}
interface Segment {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  health: "healthy" | "attention" | "at_risk";
  segment_dimensions: DimensionScore[];
  financials?: { mtdIncome: number; ytdIncome: number; ytdNet: number } | null;
}
interface Business {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  segments: Segment[];
}

const DIMENSION_ORDER = [
  "marketing", "sales", "operations", "finance", "team", "systems",
  "leadership", "vision", "product", "customer_experience", "legal", "sustainability",
];

const HEALTH_COLOR: Record<string, string> = {
  healthy: "#2E7C83",
  attention: "#c9a227",
  at_risk: "#D83A34",
};

function label(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function avg(dims: DimensionScore[]) {
  if (!dims.length) return null;
  return Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
}

function healthFor(score: number): "healthy" | "attention" | "at_risk" {
  if (score < 60) return "at_risk";
  if (score < 80) return "attention";
  return "healthy";
}

export default function SegmentsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsSuperAdmin(Boolean(d?.superAdmin)))
      .catch(() => {});
  }, []);

  const load = () =>
    fetch("/api/segments?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBusinesses(d?.businesses ?? []))
      .catch(() => setBusinesses([]));

  useEffect(() => {
    load();
  }, []);

  const send = async (method: string, url: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(d.error || "Couldn't save that.");
    else setMsg("");
    await load();
  };
  const addBusiness = () => {
    const name = window.prompt("Name of the business (e.g. your company, a brand, a practice):");
    if (name?.trim()) send("POST", "/api/segments", { kind: "business", name });
  };
  const addSegment = (businessId: number) => {
    const name = window.prompt("Name of the segment (a product line, service, program or audience):");
    if (name?.trim()) send("POST", "/api/segments", { kind: "segment", businessId, name });
  };
  const rename = (kind: "business" | "segment", id: number, current: string) => {
    const name = window.prompt("Rename to:", current);
    if (name?.trim() && name.trim() !== current) send("PATCH", "/api/segments", { kind, id, name });
  };
  const remove = (kind: "business" | "segment", id: number, name: string) => {
    if (window.confirm(`Delete "${name}"? Its scores go with it. Income, expenses and tasks tagged to it stay, just untagged.`)) send("DELETE", `/api/segments?kind=${kind}&id=${id}`);
  };
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  const startEdit = (seg: Segment) => {
    const byKey = new Map((seg.segment_dimensions ?? []).map((d) => [d.dimension_key, d.score]));
    const scores: Record<string, number> = {};
    for (const k of DIMENSION_ORDER) scores[k] = byKey.get(k) ?? 70;
    setEditScores(scores);
    setEditingId(seg.id);
  };

  const saveEdit = async (segId: number) => {
    setSaving(true);
    // Fallback to the values we just set; replaced by the server's fresh copy.
    let dims: DimensionScore[] = DIMENSION_ORDER.map((k) => ({
      dimension_key: k,
      score: editScores[k] ?? 70,
      health: healthFor(editScores[k] ?? 70),
    }));
    try {
      const res = await fetch("/api/segments/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: segId,
          dimensions: DIMENSION_ORDER.map((k) => ({ key: k, score: editScores[k] ?? 70 })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.dimensions) && data.dimensions.length) dims = data.dimensions;
      }
    } catch {
      /* keep local dims */
    }
    setBusinesses((prev) =>
      prev?.map((b) => ({
        ...b,
        segments: b.segments.map((s) =>
          s.id === segId ? { ...s, segment_dimensions: dims } : s
        ),
      })) ?? null
    );
    setSaving(false);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">
              Business Segments
            </h1>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0] max-w-3xl">
              Your businesses and the segments inside them — products, services, programs or audiences. Tag income and
              expenses to a segment in the Finance Center and each segment shows what it actually earns. The 12-dimension
              strip is your whole-business alignment; a coach can adjust a segment by hand.
            </p>
          </div>
          <button onClick={addBusiness} className="text-sm font-medium px-4 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]">
            + Add a business
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-[#8a2f2f]">{msg}</p>}
      </div>

      <SegmentRead />

      {businesses === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1a2b4a]/20 p-8 text-center">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">No businesses yet.</p>
          <p className="text-sm text-[#7a8a99] mt-1 mb-4">Add your business, then the segments inside it (for example: Coaching, Courses, Speaking).</p>
          <button onClick={addBusiness} className="text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]">Add your first business</button>
        </div>
      ) : (
        <div className="space-y-10">
          {businesses.map((biz) => (
            <section key={biz.id}>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="w-3 h-8 rounded-full"
                  style={{ backgroundColor: biz.color ?? "#1a2b4a" }}
                />
                <h2 className="text-2xl font-serif font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {biz.icon ? `${biz.icon} ` : ""}
                  {biz.name}
                </h2>
                <div className="ml-auto flex items-center gap-3 text-xs">
                  <button onClick={() => addSegment(biz.id)} className="text-[#2E7C83] hover:underline">+ Add segment</button>
                  <button onClick={() => rename("business", biz.id, biz.name)} className="text-[#7a8a99] hover:underline">Rename</button>
                  <button onClick={() => remove("business", biz.id, biz.name)} className="text-[#b06a5a] hover:underline">Delete</button>
                </div>
              </div>
              {biz.segments.length === 0 && <p className="text-sm text-[#7a8a99] mb-3">No segments yet — add one to track what it earns.</p>}

              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-5">
                {biz.segments.map((seg) => {
                  const dims = seg.segment_dimensions ?? [];
                  const byKey = new Map(dims.map((d) => [d.dimension_key, d]));
                  const score = avg(dims);
                  return (
                    <div
                      key={seg.id}
                      className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: HEALTH_COLOR[seg.health] ?? "#9DA890" }}
                          />
                          <h3 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                            {seg.icon ? `${seg.icon} ` : ""}
                            {seg.name}
                          </h3>
                        </div>
                        {score !== null && (
                          <span className="text-2xl font-serif text-[#c9a227] leading-none">{score}</span>
                        )}
                      </div>

                      {seg.financials && (
                        <p className="mb-3 text-xs text-[#3F4654] dark:text-[#e8e4f0]">
                          <span className="font-semibold">{usd(seg.financials.mtdIncome)}</span> earned this month ·{" "}
                          <span className="font-semibold">{usd(seg.financials.ytdNet)}</span> net this year
                        </p>
                      )}
                      {editingId === seg.id ? (
                        <div className="space-y-1.5">
                          {DIMENSION_ORDER.map((key) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[11px] text-[#3F4654] dark:text-[#e8e4f0] w-24 truncate">
                                {label(key)}
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={editScores[key] ?? 70}
                                onChange={(e) =>
                                  setEditScores((p) => ({ ...p, [key]: Number(e.target.value) }))
                                }
                                className="flex-1 accent-[#2E7C83]"
                              />
                              <span className="text-[11px] text-[#1a2b4a] dark:text-[#F8F5F0] w-7 text-right">
                                {editScores[key] ?? 70}
                              </span>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => saveEdit(seg.id)}
                              disabled={saving}
                              className="flex-1 py-1.5 bg-[#1a2b4a] text-white rounded-md text-xs hover:bg-[#1a2b4a]/90 disabled:opacity-50"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded-md text-xs hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 12-dimension strip */}
                          <div className="grid grid-cols-12 gap-1">
                            {DIMENSION_ORDER.map((key) => {
                              const d = byKey.get(key);
                              const color = d ? HEALTH_COLOR[d.health] ?? "#9DA890" : "#E8E4E0";
                              return (
                                <div
                                  key={key}
                                  title={d ? `${label(key)}: ${d.score}` : label(key)}
                                  className="h-6 rounded"
                                  style={{ backgroundColor: color, opacity: d ? 0.35 + (d.score / 100) * 0.65 : 0.3 }}
                                />
                              );
                            })}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-[11px] text-[#7C7C82]">
                              {seg.financials ? "12 dimensions · hover a bar" : "Tag income to this segment in Finance to see what it earns"}
                            </p>
                            <span className="flex items-center gap-2 text-[11px]">
                              <button onClick={() => rename("segment", seg.id, seg.name)} className="text-[#7a8a99] hover:underline">Rename</button>
                              <button onClick={() => remove("segment", seg.id, seg.name)} className="text-[#b06a5a] hover:underline">Delete</button>
                            </span>
                            {isSuperAdmin && (
                              <button
                                onClick={() => startEdit(seg)}
                                className="text-[11px] text-[#2E7C83] hover:underline"
                              >
                                Coach override
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
