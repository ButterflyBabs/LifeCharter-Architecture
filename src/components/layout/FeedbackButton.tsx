"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, X, AlertTriangle, Sparkles, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";

type Kind = "glitch" | "suggestion" | "feedback";
const CHOICES: { kind: Kind; icon: typeof AlertTriangle; label: string; hint: string }[] = [
  { kind: "glitch", icon: AlertTriangle, label: "Something's not working", hint: "Report a glitch, with the option to open a support ticket" },
  { kind: "suggestion", icon: Sparkles, label: "I have a suggestion", hint: "It would be great to have…" },
  { kind: "feedback", icon: MessageSquare, label: "General feedback", hint: "No ticket needed — just letting you know" },
];
const PROMPT: Record<Kind, { titleLabel: string; titlePlaceholder: string; descLabel: string; descPlaceholder: string }> = {
  glitch: { titleLabel: "What's not working?", titlePlaceholder: "e.g. The Weekly Review button does nothing", descLabel: "What happened?", descPlaceholder: "What you were doing, and what you expected instead…" },
  suggestion: { titleLabel: "Your suggestion", titlePlaceholder: "e.g. Let me reorder my Pipeline columns", descLabel: "Tell us more", descPlaceholder: "What would this help you do?" },
  feedback: { titleLabel: "What's on your mind?", titlePlaceholder: "e.g. The new sidebar is so much easier to use", descLabel: "Details", descPlaceholder: "Anything you'd like us to know…" },
};
const BOARD_NOTE: Record<Kind, string> = {
  glitch: "Only your account sees this — your team, and us.",
  suggestion: "Everyone with a Command Suite login can see and vote on this.",
  feedback: "Everyone with a Command Suite login can see and vote on this.",
};

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | Kind | "done">("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [alsoTicket, setAlsoTicket] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticketCreated, setTicketCreated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setTimeout(() => {
      setStep("choose");
      setTitle("");
      setDescription("");
      setAlsoTicket(true);
      setError("");
      setTicketCreated(false);
    }, 200);
  }

  async function submit() {
    if (step === "choose" || step === "done") return;
    if (!title.trim() || !description.trim()) {
      setError("Add a short title and a few details.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: step, title, description, alsoTicket: step === "glitch" ? alsoTicket : undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't submit that.");
      setTicketCreated(Boolean(d.ticketCreated));
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 flex items-center justify-center hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/20 transition-colors"
        aria-label="Suggestion or feedback"
        title="Report a glitch, suggest an idea or share feedback"
      >
        <Lightbulb className="w-5 h-5 text-[#1a2b4a] dark:text-[#e8e4f0]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-hidden rounded-2xl border border-[#1a2b4a]/12 bg-white dark:bg-[#111d33] shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2b4a]/10">
            <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {step !== "choose" && step !== "done" && (
                <button onClick={() => setStep("choose")} aria-label="Back" className="rounded-md p-0.5 hover:bg-[#1a2b4a]/10">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {step === "choose" ? "Suggestion or feedback" : step === "done" ? "Thanks!" : "Tell us"}
            </p>
            <button onClick={close} aria-label="Close" className="rounded-lg p-1 hover:bg-[#1a2b4a]/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            {step === "choose" && (
              <div className="space-y-2">
                {CHOICES.map((c) => (
                  <button
                    key={c.kind}
                    onClick={() => setStep(c.kind)}
                    className="flex w-full items-start gap-3 rounded-xl border border-[#1a2b4a]/10 dark:border-white/10 p-3 text-left hover:bg-[#2E7C83]/5 dark:hover:bg-white/5"
                  >
                    <c.icon className="mt-0.5 w-4 h-4 flex-shrink-0 text-[#c9a227]" />
                    <span>
                      <span className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{c.label}</span>
                      <span className="block text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{c.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step !== "choose" && step !== "done" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">{PROMPT[step].titleLabel}</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={PROMPT[step].titlePlaceholder}
                    autoFocus
                    className="w-full rounded-lg border border-[#1a2b4a]/20 dark:border-white/15 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#b8a898]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">{PROMPT[step].descLabel}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={PROMPT[step].descPlaceholder}
                    rows={4}
                    className="w-full rounded-lg border border-[#1a2b4a]/20 dark:border-white/15 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#b8a898]"
                  />
                </div>
                {step === "glitch" && (
                  <label className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                    <input type="checkbox" checked={alsoTicket} onChange={(e) => setAlsoTicket(e.target.checked)} className="mt-0.5" />
                    Also open a support ticket so our team follows up with me directly
                  </label>
                )}
                <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{BOARD_NOTE[step]}</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  onClick={submit}
                  disabled={busy}
                  className="w-full rounded-lg bg-[#1a2b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]"
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="py-2 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[#2E7C83]" />
                <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {ticketCreated ? "Got it — a support ticket is open and our team's on it." : "Got it — thank you!"}
                </p>
                <a href="/help/contact" className="mt-2 inline-block text-sm text-[#2E7C83] hover:underline">
                  See it on your Support page →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
