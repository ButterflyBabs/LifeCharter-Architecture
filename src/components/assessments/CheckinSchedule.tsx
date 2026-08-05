"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";

type Status = "never" | "due" | "soon" | "ok";

interface Checkin {
  type: string;
  label: string;
  href: string;
  blurb: string;
  cadence: string;
  cadenceLabel: string;
  lastTaken: string | null;
  nextDue: string | null;
  daysUntilDue: number | null;
  status: Status;
}

const STATUS_STYLE: Record<Status, { label: string; dot: string; text: string; chip: string }> = {
  never: {
    label: "Not started",
    dot: "#9DA890",
    text: "text-[#7C7C82]",
    chip: "bg-[#9DA890]/15 text-[#5b6b52]",
  },
  due: {
    label: "Due now",
    dot: "#D83A34",
    text: "text-[#D83A34]",
    chip: "bg-[#D83A34]/12 text-[#D83A34]",
  },
  soon: {
    label: "Due soon",
    dot: "#c9a227",
    text: "text-[#a5851f]",
    chip: "bg-[#c9a227]/15 text-[#a5851f]",
  },
  ok: {
    label: "Up to date",
    dot: "#2E7C83",
    text: "text-[#2E7C83]",
    chip: "bg-[#2E7C83]/12 text-[#2E7C83]",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function timing(c: Checkin): string {
  if (c.status === "never") return "Take it once to start the rhythm";
  if (c.daysUntilDue === null) return "";
  if (c.daysUntilDue <= 0) {
    const overdue = Math.abs(c.daysUntilDue);
    return overdue === 0 ? "Due today" : `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
  }
  return `Due in ${c.daysUntilDue} day${c.daysUntilDue === 1 ? "" : "s"} · ${formatDate(c.nextDue)}`;
}

export default function CheckinSchedule() {
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);

  useEffect(() => {
    fetch("/api/checkins", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCheckins(Array.isArray(d?.checkins) ? d.checkins : []))
      .catch(() => setCheckins([]));
  }, []);

  if (checkins === null) {
    return (
      <div className="mt-12">
        <p className="text-sm text-[#b8a898]">Loading your check-in schedule…</p>
      </div>
    );
  }
  if (checkins.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock className="w-5 h-5 text-[#4a9b9b]" />
        <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          Your Check-in Rhythm
        </h2>
      </div>
      <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mb-5 max-w-3xl">
        Scores stay meaningful when they stay current. Each assessment has a recommended
        rhythm — a monthly pulse, a quarterly profit re-read, a semi-annual brain refresh,
        and a deep annual soul revisit. Come back when one is due and your dashboard updates itself.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {checkins.map((c) => {
          const s = STATUS_STYLE[c.status];
          return (
            <div
              key={c.type}
              className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                    {c.label}
                  </h3>
                  <p className="text-xs text-[#b8a898] mt-0.5">{c.cadenceLabel}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.chip}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                  {s.label}
                </span>
              </div>

              <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 flex-1">{c.blurb}</p>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="text-[#7C7C82] dark:text-[#e8e4f0]/70">
                  <div>Last taken: {formatDate(c.lastTaken)}</div>
                  <div className={s.text}>{timing(c)}</div>
                </div>
                <Link
                  href={c.href}
                  className="inline-flex items-center gap-1 text-[#2E7C83] font-medium hover:underline whitespace-nowrap"
                >
                  {c.status === "never" ? "Start" : "Retake"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
