"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Move {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  impact: "High" | "Medium" | "Low" | null;
  href: string;
  task: string;
}
interface Result { hasData: boolean; source?: "assistant" | "data"; assistant?: string; briefedAt?: string; moves: Move[] }

const badgeColor = (m: Move) => (m.impact === "High" ? "bg-[#7b6b8d] text-[#F8F5F0]" : m.impact === "Medium" ? "bg-[#4a9b9b] text-[#F8F5F0]" : m.impact === "Low" ? "bg-[#e8e4f0] text-[#1a2b4a]" : "bg-[#2E7C83]/12 text-[#2E7C83]");
const numberColors = ["bg-[#7b6b8d]", "bg-[#4a9b9b]", "bg-[#c9a227]"];

// Next 3 Moves — from this client's own scores, tasks, goals and their
// assistant's briefing. Shows a prompt, not made-up moves, when there's no data yet.
export function NextThreeMoves() {
  const [data, setData] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/next-moves?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const addTask = async (m: Move) => {
    setAdded((a) => ({ ...a, [m.id]: true }));
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: m.task, description: m.subtitle, status: "today", priority: "high" }) });
    if (res.ok) window.dispatchEvent(new Event("tasks-changed"));
    else setAdded((a) => ({ ...a, [m.id]: false }));
  };

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader>
        <CardTitle>Next 3 Moves</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {failed ? (
          <p className="text-sm text-[#7a8a99]">Couldn&apos;t load your next moves right now.</p>
        ) : !data ? (
          <p className="text-sm text-[#7a8a99]">Reading your data…</p>
        ) : !data.hasData ? (
          <div className="rounded-xl border border-dashed border-[#1a2b4a]/20 p-5 text-center">
            <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Your next moves start with your assessments.</p>
            <p className="text-xs text-[#7a8a99] mt-1 mb-3">Once you&apos;ve answered some, this is built from your scores, your tasks and your plan goals.</p>
            <Link href="/assessments" className="text-sm font-medium text-[#2E7C83] hover:underline">Start an assessment →</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.moves.map((move, n) => (
                <div key={move.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/5 hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/10 transition-colors flex-wrap sm:flex-nowrap">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${numberColors[n] || "bg-[#7b6b8d]"}`}>{move.id}</div>
                  <div className="flex-1 min-w-0">
                    <Link href={move.href} className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:underline inline-flex items-center gap-1">
                      {move.title} <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                    </Link>
                    <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">{move.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {move.badge && <Badge className={`${badgeColor(move)} text-xs whitespace-nowrap`}>{move.badge}</Badge>}
                    <button onClick={() => addTask(move)} disabled={added[move.id]} className="text-xs font-medium px-2.5 py-1 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-70 whitespace-nowrap">
                      {added[move.id] ? "✓ Added" : "Add to tasks"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#7a8a99]">
              {data.source === "assistant"
                ? `From ${data.assistant || "your assistant"}'s briefing on ${new Date(data.briefedAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — refresh it above.`
                : "Built from your weakest areas, your tasks and your plan goals. Ask your assistant for a briefing above for sharper moves."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
