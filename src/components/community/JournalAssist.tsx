"use client";

// The journal assistant: runs on the member's own Command Suite AI. Members
// without an AI connection (Collective-only) never see any of this.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui";

interface AiStatus {
  enabled: boolean;
  assistantName: string;
}

let cached: Promise<AiStatus> | null = null;

export function useJournalAi(): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null);
  useEffect(() => {
    cached ??= fetch("/api/community/journal-ai")
      .then((r) => (r.ok ? r.json() : { enabled: false, assistantName: "" }))
      .catch(() => ({ enabled: false, assistantName: "" }));
    let live = true;
    void cached.then((s) => live && setStatus(s));
    return () => {
      live = false;
    };
  }, []);
  return status?.enabled ? status : null;
}

export async function askJournalAi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/community/journal-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.needsKey) throw new Error("Connect your AI in Command Suite settings first.");
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

export const AI_PRIVACY_NOTE = "Uses your own AI connection. Your words go to the AI only when you tap.";
