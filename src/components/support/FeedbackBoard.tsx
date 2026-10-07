"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ThumbsUp, AlertTriangle, Ticket, Megaphone, CheckCircle2 } from "lucide-react";

type Status = "open" | "under_review" | "planned" | "shipped" | "closed";
const STATUS_LABEL: Record<Status, { label: string; color: string }> = {
  open: { label: "Open", color: "#1c5a60" },
  under_review: { label: "Under review", color: "#7b6b8d" },
  planned: { label: "Planned", color: "#8a6a15" },
  shipped: { label: "Shipped", color: "#2c6b3f" },
  closed: { label: "Closed", color: "#7a8a99" },
};
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

interface GlitchItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  submitter_name: string;
  support_request_id: string | null;
  created_at: string;
}
interface BoardItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  submitter_name: string;
  vote_count: number;
  myVote: boolean;
  created_at: string;
}

function StatusPill({ status }: { status: Status }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.open;
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: s.color, backgroundColor: `${s.color}1A` }}>
      {s.label}
    </span>
  );
}

// My Glitches — private to this account's own team.
export function MyGlitches({ refreshKey = 0 }: { refreshKey?: number }) {
  const [items, setItems] = useState<GlitchItem[] | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/feedback?kind=glitch", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setItems(d.items ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (!items?.length) return null;
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
          <AlertTriangle className="w-5 h-5 text-[#c0632f]" /> Glitches your team has reported
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-[#1a2b4a]/10">
        {items.map((it) => (
          <div key={it.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.title}</p>
              <StatusPill status={it.status} />
              {it.support_request_id && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#7a8a99]">
                  <Ticket className="w-3 h-3" /> Ticket opened
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{it.description}</p>
            <p className="mt-1 text-xs text-[#b8a898]">
              {it.submitter_name} · {when(it.created_at)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Suggestions / Feedback — a shared board every signed-in Suite user sees and
// can vote on, newest/most-voted first.
export function CommunityBoard({ kind, title, icon: Icon }: { kind: "suggestion" | "feedback"; title: string; icon: typeof ThumbsUp }) {
  const [items, setItems] = useState<BoardItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setNote("");
    const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...form }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setSending(false);
    if (!r?.ok) return setNote(d.error || "Couldn't post that. Please try again.");
    setForm({ title: "", description: "" });
    setOpen(false);
    setNote(kind === "suggestion" ? "Thank you. Your suggestion is on the board and our team has been told." : "Thank you. Your feedback is on the board and our team has been told.");
    void load();
  }

  const load = useCallback(async () => {
    const d = await fetch(`/api/feedback?kind=${kind}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setItems(d.items ?? []);
  }, [kind]);
  useEffect(() => {
    void load();
  }, [load]);

  async function vote(id: string) {
    setBusy(id);
    // Optimistic: flip locally, re-sort can wait for the reload.
    setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, myVote: !it.myVote, vote_count: it.vote_count + (it.myVote ? -1 : 1) } : it)) ?? null);
    try {
      await fetch(`/api/feedback/${id}/vote`, { method: "POST" });
    } finally {
      setBusy(null);
      void load();
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
          <Icon className="w-5 h-5 text-[#c9a227]" /> {title}
        </CardTitle>
        <p className="text-sm text-[#7a8a99]">Visible to everyone with a Command Suite login. Vote for ideas you&apos;d like to see too.</p>
        {open ? (
          <form onSubmit={submit} className="mt-3 space-y-2">
            <input className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" placeholder={kind === "suggestion" ? "Your idea in a few words" : "What you'd like to tell us, in a few words"} value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} required aria-label="Title" />
            <textarea className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" rows={4} placeholder="Tell us more" value={form.description} maxLength={4000} onChange={(e) => setForm({ ...form, description: e.target.value })} required aria-label="Details" />
            <div className="flex gap-2">
              <button disabled={sending} className="rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]">{sending ? "Posting…" : kind === "suggestion" ? "Post my suggestion" : "Post my feedback"}</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => { setOpen(true); setNote(""); }} className="mt-3 rounded-full border border-[#c9a227] px-4 py-2 text-sm font-semibold text-[#6b5410] hover:bg-[#c9a227]/10 dark:text-[#E3C27C]">{kind === "suggestion" ? "Share a suggestion" : "Share your feedback"}</button>
        )}
        {note && <p role="status" className="mt-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{note}</p>}
      </CardHeader>
      <CardContent className="divide-y divide-[#1a2b4a]/10">
        {items === null ? (
          <p className="py-3 text-sm text-[#7a8a99]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-3 text-sm text-[#7a8a99]">Nothing here yet — be the first.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <button
                onClick={() => vote(it.id)}
                disabled={busy === it.id}
                aria-pressed={it.myVote}
                className={`flex flex-shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  it.myVote
                    ? "border-[#2E7C83] bg-[#2E7C83]/10 text-[#1F5E63]"
                    : "border-[#1a2b4a]/15 text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8c2cf]"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {it.vote_count}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.title}</p>
                  <StatusPill status={it.status} />
                </div>
                <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{it.description}</p>
                <p className="mt-1 text-xs text-[#b8a898]">
                  {it.submitter_name} · {when(it.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// What's new: updates and fixes the team has made, newest first. Read-only; the same for every account.
interface UpdateItem { id: string; title: string; description: string; created_at: string }
export function WhatsNew() {
  const [items, setItems] = useState<UpdateItem[] | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => {
    fetch("/api/feedback?kind=update", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items?.length) return null;
  const shown = all ? items : items.slice(0, 8);
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
          <Megaphone className="w-5 h-5 text-[#c9a227]" /> What&apos;s new
        </CardTitle>
        <p className="text-sm text-[#7a8a99]">Updates and fixes to the Command Suite, newest first. When you report something with the light bulb, you&apos;ll see the fix here.</p>
      </CardHeader>
      <CardContent className="divide-y divide-[#1a2b4a]/10">
        {shown.map((it) => (
          <div key={it.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.title}</p>
              <span className="text-xs text-[#b8a898]">{when(it.created_at)}</span>
            </div>
            <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{it.description}</p>
          </div>
        ))}
        {items.length > shown.length && (
          <button onClick={() => setAll(true)} className="pt-3 text-sm font-semibold text-[#2E7C83] hover:underline">Show earlier updates</button>
        )}
      </CardContent>
    </Card>
  );
}

// Recently answered: support questions we have resolved, anonymised, with the answer. Read-only; the same for every account.
export function ResolvedLog() {
  const [items, setItems] = useState<UpdateItem[] | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => {
    fetch("/api/feedback?kind=resolved", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items?.length) return null;
  const shown = all ? items : items.slice(0, 6);
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
          <CheckCircle2 className="w-5 h-5 text-[#2E7C83]" /> Recently answered
        </CardTitle>
        <p className="text-sm text-[#7a8a99]">Questions other clients have asked and how we resolved them, with names removed. Your answer may already be here.</p>
      </CardHeader>
      <CardContent className="divide-y divide-[#1a2b4a]/10">
        {shown.map((it) => (
          <div key={it.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.title}</p>
              <span className="text-xs text-[#b8a898]">Resolved {when(it.created_at)}</span>
            </div>
            <p className="mt-0.5 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{it.description}</p>
          </div>
        ))}
        {items.length > shown.length && (
          <button onClick={() => setAll(true)} className="pt-3 text-sm font-semibold text-[#2E7C83] hover:underline">Show more answered questions</button>
        )}
      </CardContent>
    </Card>
  );
}
