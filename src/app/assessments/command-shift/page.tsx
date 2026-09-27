"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Answer = { key: string; day: number; label: string; text: string };

// The client's Command Shift answers (from the 21-Day Challenge), readable and editable.
export default function CommandShiftAnswersPage() {
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [justImported, setJustImported] = useState(false);

  useEffect(() => {
    setJustImported(new URLSearchParams(window.location.search).get("imported") === "1");
    fetch("/api/command-shift", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setAnswers(d.answers || []);
        setDrafts(Object.fromEntries((d.answers || []).map((a: Answer) => [a.key, a.text])));
      })
      .catch(() => setError("Couldn't load your answers. Please refresh."));
  }, []);

  async function save(key: string) {
    setError("");
    const res = await fetch("/api/command-shift", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, text: drafts[key] ?? "" }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Couldn't save. Please try again.");
      return;
    }
    setAnswers((prev) => (prev || []).map((a) => (a.key === key ? { ...a, text: drafts[key] ?? "" } : a)));
    setSaved(key);
    setTimeout(() => setSaved((k) => (k === key ? null : k)), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link href="/assessments" className="inline-flex items-center gap-1 text-sm text-[#1a2b4a]/70 dark:text-[#e8e4f0] hover:underline">
        <ArrowLeft className="w-4 h-4" /> Alignment Profiles
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Your Command Shift</h1>
        <p className="mt-2 text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
          What you wrote during the 21-Day Challenge. Your assistant and your plan drafts build on these. Change anything that has grown since.
        </p>
      </div>

      {justImported && (
        <div className="rounded-xl border border-[#2E7C83]/30 bg-[#2E7C83]/10 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          Your Command Shift work is in. Where your Marketing Plan had empty sections for positioning, core offer or brand voice, they now start from what you wrote.
        </div>
      )}
      {error && <p className="text-sm text-[#B3392B]">{error}</p>}
      {answers === null ? (
        <p className="text-[#b8a898]">Loading…</p>
      ) : answers.length === 0 ? (
        <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
          Nothing here yet. Use &ldquo;Bring in my Command Shift work&rdquo; on the <Link href="/assessments" className="underline">Alignment Profiles</Link> page.
        </p>
      ) : (
        <div className="space-y-4">
          {answers.map((a) => {
            const changed = (drafts[a.key] ?? "") !== a.text;
            return (
              <div key={a.key} className="rounded-2xl border border-[#c9a227]/20 bg-white dark:bg-[#1a2b4a]/30 p-5">
                <label htmlFor={`cs-${a.key}`} className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#c9a227]">Day {a.day}</span>
                  <span className="block text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{a.label}</span>
                </label>
                <textarea
                  id={`cs-${a.key}`}
                  value={drafts[a.key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [a.key]: e.target.value }))}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-[#1a2b4a]/15 bg-[#F8F5F0]/60 dark:bg-[#1a2b4a]/40 px-3 py-2 text-[15px] text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
                <div className="mt-2 flex items-center gap-3">
                  <Button variant="primary" size="sm" disabled={!changed} onClick={() => save(a.key)}>
                    Save
                  </Button>
                  {saved === a.key && (
                    <span className="inline-flex items-center gap-1 text-sm text-[#2E7C83]">
                      <Check className="w-4 h-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
