"use client";

// The journal assistant: runs on the member's own Command Suite AI, or on
// Mariposa for Collective Plus members. Free members see a Plus invitation.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui";

export interface AiStatus {
  enabled: boolean;
  assistantName: string;
  plus?: boolean;
  source?: "own" | "plus" | null;
  unavailable?: string | null;
}

let cached: Promise<AiStatus> | null = null;

export function useJournalAi(): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null);
  useEffect(() => {
    cached ??= loadStatus();
    let live = true;
    void cached.then((s) => live && setStatus(s));
    return () => {
      live = false;
    };
  }, []);
  return status?.enabled ? status : null;
}

// Full status (null while loading) — for showing the Plus invitation or a
// "limit reached" note instead of the buttons.
export function useJournalAiStatus(): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null);
  useEffect(() => {
    cached ??= loadStatus();
    let live = true;
    void cached.then((s) => live && setStatus(s));
    return () => {
      live = false;
    };
  }, []);
  return status;
}

export function resetJournalAiStatus() {
  cached = null;
}

function loadStatus(): Promise<AiStatus> {
  return fetch("/api/community/journal-ai")
    .then((r) => (r.ok ? r.json() : { enabled: false, assistantName: "Mariposa" }))
    .catch(() => ({ enabled: false, assistantName: "Mariposa" }));
}

// Shown to free members wherever Mariposa would appear.
export function PlusInvite({ what, title = "Mariposa can help", compact }: { what: string; title?: string; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D4AF63]/60 bg-[var(--cm-surface)] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--cm-ink)]">
          <Sparkles className="h-4 w-4 text-[var(--cm-gold-text)]" /> {title}
        </span>
        <Link
          href="/community/plus"
          className="rounded-full bg-[var(--cm-navy)] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90"
        >
          See Collective Plus
        </Link>
      </div>
      {!compact && <p className="mt-1 text-[12.5px] text-[var(--cm-muted)]">{what} {title === "Mariposa can help" ? "Mariposa, your LifeCharter AI coach, comes with Collective Plus." : "Included with Collective Plus."}</p>}
    </div>
  );
}

export async function askJournalAi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/community/journal-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.result) throw new Error(json.error || "The AI didn't respond — try again.");
  return json.result as T;
}

export function AssistButton({ children, busy, onClick }: { children: React.ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="ghost" onClick={onClick} disabled={busy} className="text-[var(--cm-gold-text)]">
      <Sparkles className="h-4 w-4" /> {busy ? "Thinking…" : children}
    </Button>
  );
}

// A suggestion from the assistant, with Use / Dismiss.
export function Suggestion({ name, children, onUse, onDismiss, useLabel = "Use this" }: { name: string; children: React.ReactNode; onUse?: () => void; onDismiss: () => void; useLabel?: string }) {
  return (
    <div className="rounded-2xl border border-[#D4AF63]/50 bg-[var(--cm-gold-soft)] p-3.5 text-[14px] text-[var(--cm-ink)]">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-gold-text)]">
        <Sparkles className="h-3.5 w-3.5" /> {name} suggests
      </p>
      {children}
      <div className="mt-2.5 flex gap-2">
        {onUse && (
          <Button type="button" size="sm" variant="gold" onClick={onUse}>
            {useLabel}
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          {onUse ? "Dismiss" : "Close"}
        </Button>
      </div>
    </div>
  );
}

export const AI_PRIVACY_NOTE = "Private to you — your words go to the AI only when you tap.";

// Plus features (report, focus, Ask the Library, export) are open to Plus
// members and to Command Suite clients (who bring their own AI).
export function usePlusAccess(isPlus: boolean): { loading: boolean; has: boolean; viaCommandSuite: boolean } {
  const status = useJournalAiStatus();
  if (isPlus) return { loading: false, has: true, viaCommandSuite: false };
  if (!status) return { loading: true, has: false, viaCommandSuite: false };
  return { loading: false, has: status.source === "own", viaCommandSuite: status.source === "own" };
}
