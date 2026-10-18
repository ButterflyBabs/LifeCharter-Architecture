"use client";

import { useCallback, useEffect, useState } from "react";
import type { YearReview } from "@/lib/yearReview";
import YearReviewView from "@/components/yearReview/YearReviewView";

type Share = { token: string; show_money: boolean } | null;

export default function YearInReview() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [r, setR] = useState<YearReview | null>(null);
  const [share, setShare] = useState<Share>(null);
  const [showMoney, setShowMoney] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (y: number) => {
    setR(null);
    setErr("");
    const d = await fetch(`/api/year-review?year=${y}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (!d?.review) return setErr("Couldn't load your year. Please refresh.");
    setR(d.review);
    setShare(d.share);
    setShowMoney(Boolean(d.share?.show_money));
  }, []);
  useEffect(() => {
    load(year);
  }, [year, load]);

  const link = share ? `${typeof window === "undefined" ? "" : window.location.origin}/yr/${share.token}` : "";
  async function makeLink(money: boolean) {
    setBusy(true);
    const d = await fetch("/api/year-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, showMoney: money }) }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (d?.share) {
      setShare(d.share);
      setShowMoney(d.share.show_money);
    } else setErr(d?.error || "Couldn't make the link.");
  }
  async function stopSharing() {
    setBusy(true);
    await fetch(`/api/year-review?year=${year}`, { method: "DELETE" });
    setBusy(false);
    setShare(null);
  }

  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Year in review</h1>
          <p className="text-sm text-muted-foreground">Your year on one page, from what's already in your Suite. Share it with a private link.</p>
        </div>
        <label className="text-sm">
          <span className="mr-2">Year</span>
          <select className="rounded-md border border-border bg-background px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: Math.max(1, thisYear - 2024) }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-border p-4">
        <p className="text-sm font-semibold">Share link</p>
        {share ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input readOnly value={link} className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" onFocus={(e) => e.target.select()} />
              <button className="rounded-md bg-[#2E7C83] px-3 py-2 text-sm font-medium text-white" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy"}</button>
              <a className="rounded-md border border-border px-3 py-2 text-sm" href={link} target="_blank" rel="noreferrer">Open</a>
              <button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={stopSharing}>Stop sharing</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showMoney} disabled={busy} onChange={(e) => makeLink(e.target.checked)} />
              Show income, expenses and net on the shared page
            </label>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Anyone with the link can see it. Money stays hidden unless you turn it on.</p>
            <button className="rounded-md bg-[#2E7C83] px-3 py-2 text-sm font-medium text-white" disabled={busy} onClick={() => makeLink(false)}>Make a share link</button>
          </div>
        )}
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}
      {!r && !err && <p className="text-sm text-muted-foreground">Gathering your year…</p>}
      {r && <YearReviewView r={r} />}
    </div>
  );
}
