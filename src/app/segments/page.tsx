"use client";

import { useEffect, useState } from "react";

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

export default function SegmentsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBusinesses(d?.businesses ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">
          Sacred Kaleidoscope
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
          Your businesses and segments, each scored across the 12 dimensions.
        </p>
      </div>

      {businesses === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-gray-400">No businesses yet.</p>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                      <p className="mt-2 text-[11px] text-[#7C7C82]">
                        12 dimensions · hover a bar for its score
                      </p>
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
