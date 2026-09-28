"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardCheck, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Cadence = "weekly" | "monthly";
interface Q {
  id: string;
  q: string;
  hint: string;
}
interface Period {
  start: string;
  end: string;
  nextStart: string;
  nextEnd: string;
  label: string;
}
interface Numbers {
  income: number;
  expenses: number;
  incomeGoal: number | null;
  tasksDone: number;
  tasksOverdue: number;
  dealsAdded: number;
  dealsClosed: number;
  openPipeline: number;
  billsNextPeriod: number;
  billsNextCount: number;
  goals: { met: number; inProgress: number; slipped: number; notStarted: number };
  scoreNow: number | null;
  scoreChange: number | null;
}
interface Briefing {
  headline?: string;
  wins?: string[];
  watch?: string[];
  focus?: string;
  needsKey?: boolean;
}
interface Review {
  id: string;
  status: "in_progress" | "completed";
  numbers: Numbers;
  briefing: Briefing;
  answers: Record<string, string>;
  proposed: { title: string; why: string; day: string }[];
  tasks: { id: number; title: string; day: string }[];
  summary: string | null;
}
interface HistoryRow {
  id: string;
  cadence: Cadence;
  period_start: string;
  summary: string | null;
  tasks: { title: string }[];
}

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const tz = () => (typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
const niceDay = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export default function ReviewPage() {
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [period, setPeriod] = useState<Period | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<{ title: string; why: string; day: string; keep: boolean }[]>([]);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("cadence") === "monthly") setCadence("monthly");
    setSessionId(q.get("session"));
  }, []);

  const load = useCallback(async (c: Cadence) => {
    setErr("");
    const r = await fetch(`/api/review?cadence=${c}&tz=${encodeURIComponent(tz())}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    setPeriod(d.period ?? null);
    setQuestions(d.questions ?? []);
    setHistory(d.history ?? []);
    const cur = d.current as Review | null;
    setReview(cur);
    setAnswers(cur?.answers ?? {});
    setPicks((cur?.proposed ?? []).map((t) => ({ ...t, keep: true })));
    setStep(!cur ? 0 : cur.status === "completed" ? 3 : cur.proposed?.length ? 2 : 1);
  }, []);
  useEffect(() => {
    void load(cadence);
  }, [cadence, load]);

  async function post(payload: Record<string, unknown>) {
    const r = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, tz: tz() }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Something went wrong — try again.");
    return d;
  }

  async function start() {
    setBusy("start");
    setErr("");
    try {
      const d = await post({ action: "start", cadence });
      setReview(d.review);
      setStep(1);
    } catch (e) {
      setErr(String((e as Error).message));
    }
    setBusy("");
  }

  async function propose() {
    if (!review) return;
    setBusy("propose");
    setErr("");
    try {
      const d = await post({ action: "propose", id: review.id, answers });
      const list = (d.proposed ?? []) as { title: string; why: string; day: string }[];
      setPicks(
        (list.length ? list : [{ title: "", why: "", day: period?.nextStart ?? "" }, { title: "", why: "", day: period?.nextStart ?? "" }, { title: "", why: "", day: period?.nextStart ?? "" }]).map((t) => ({ ...t, keep: true }))
      );
      setStep(2);
    } catch (e) {
      setErr(String((e as Error).message));
    }
    setBusy("");
  }

  async function complete() {
    if (!review) return;
    setBusy("complete");
    setErr("");
    try {
      await post({ action: "complete", id: review.id, tasks: picks.filter((p) => p.keep && p.title.trim()), sessionId });
      await load(cadence);
    } catch (e) {
      setErr(String((e as Error).message));
    }
    setBusy("");
  }

  const n = review?.numbers;
  const b = review?.briefing ?? {};
  const word = cadence === "weekly" ? "week" : "month";

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/planning" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Planning Hub
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227] flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{cadence === "weekly" ? "Weekly" : "Monthly"} Review</h1>
            <p className="text-[#7a8a99]">{period?.label ?? "…"} · about 10 minutes</p>
          </div>
        </div>
        <div className="flex rounded-full border border-[#1a2b4a]/15 p-1">
          {(["weekly", "monthly"] as Cadence[]).map((c) => (
            <button
              key={c}
              onClick={() => setCadence(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cadence === c ? "bg-[#1a2b4a] text-white" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
            >
              {c === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="mb-4 rounded-lg bg-[#b06a5a]/10 px-4 py-2 text-sm text-[#8a2f2f]">{err}</p>}

      {step === 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
              Three short steps: your assistant briefs you on the {word} from your own numbers, you answer three questions, and you leave with three tasks for
              next {word}.
            </p>
            <Button onClick={start} disabled={busy === "start"}>
              {busy === "start" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Start my {word}ly review
            </Button>
          </CardContent>
        </Card>
      )}

      {step >= 1 && n && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1 · Your {word} at a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Income", `${usd(n.income)}${n.incomeGoal ? ` of ${usd(n.incomeGoal)}` : ""}`],
                ["Tasks finished", `${n.tasksDone}${n.tasksOverdue ? ` · ${n.tasksOverdue} overdue` : ""}`],
                ["Pipeline", `${n.dealsAdded} new · ${n.dealsClosed} closed`],
                [`Bills next ${word}`, n.billsNextCount ? `${n.billsNextCount} · ${usd(n.billsNextPeriod)}` : "None tracked"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[#1a2b4a]/5 p-3">
                  <p className="text-xs text-[#7a8a99]">{k}</p>
                  <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{v}</p>
                </div>
              ))}
            </div>
            {b.needsKey ? (
              <p className="text-sm text-[#7a8a99]">Connect your AI in Settings → AI to get your assistant&apos;s read on these numbers.</p>
            ) : (
              <div className="space-y-3 text-[#1a2b4a] dark:text-[#F8F5F0]">
                {b.headline && <p className="text-lg font-medium">{b.headline}</p>}
                {!!b.wins?.length && (
                  <div>
                    <p className="text-sm font-semibold text-[#2c6b3f]">Went well</p>
                    <ul className="list-disc pl-5 text-sm">{b.wins.map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                )}
                {!!b.watch?.length && (
                  <div>
                    <p className="text-sm font-semibold text-[#8a6a15]">Needs attention</p>
                    <ul className="list-disc pl-5 text-sm">{b.watch.map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                )}
                {b.focus && <p className="text-sm"><strong>Suggested focus:</strong> {b.focus}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step >= 1 && step < 3 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2 · Three questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {questions.map((q) => (
              <div key={q.id}>
                <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{q.q}</label>
                <p className="text-xs text-[#7a8a99] mb-1">{q.hint}</p>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm"
                />
              </div>
            ))}
            {step === 1 && (
              <Button onClick={propose} disabled={busy === "propose" || !questions.some((q) => (answers[q.id] ?? "").trim())}>
                {busy === "propose" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Next: my three tasks
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3 · Three tasks for next {word}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#7a8a99]">Edit anything. Untick one to leave it out. They&apos;ll go on your task list with these due dates.</p>
            {picks.map((p, i) => (
              <div key={i} className="rounded-xl border border-[#1a2b4a]/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={p.keep} onChange={(e) => setPicks(picks.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} className="h-4 w-4" aria-label="Keep this task" />
                  <Input value={p.title} placeholder="Task" onChange={(e) => setPicks(picks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input type="date" value={p.day} className="w-40" onChange={(e) => setPicks(picks.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))} aria-label="Due date" />
                </div>
                {p.why && <p className="text-xs text-[#7a8a99] pl-6">{p.why}</p>}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={complete} disabled={busy === "complete"}>
                {busy === "complete" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Finish my review
              </Button>
              <Button variant="outline" onClick={() => setStep(1)}>Back to my answers</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && review && (
        <Card className="mb-6 border-[#2c6b3f]/30">
          <CardContent className="p-6 space-y-3">
            <p className="text-lg font-semibold text-[#2c6b3f]">Review done for {period?.label}. 🦋</p>
            {sessionId && <p className="text-sm text-[#7a8a99]">Your planning session is marked complete, with this review as its notes.</p>}
            {!!review.tasks?.length && (
              <div>
                <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Added to your tasks:</p>
                <ul className="list-disc pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {review.tasks.map((t) => <li key={t.id}>{t.title} · due {niceDay(t.day)}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Link href="/tasks"><Button variant="outline">Open my tasks</Button></Link>
              <Button variant="ghost" onClick={start}>Redo this review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!!history.length && (
        <Card>
          <CardHeader>
            <CardTitle>Past reviews</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[#1a2b4a]/10">
            {history.map((h) => (
              <div key={h.id} className="py-3">
                <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {h.cadence === "weekly" ? "Week of" : "Month of"} {niceDay(h.period_start)}
                </p>
                {h.summary && <p className="text-sm text-[#7a8a99]">{h.summary}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
