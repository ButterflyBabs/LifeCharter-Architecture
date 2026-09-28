"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Reply {
  author: "client" | "support";
  body: string;
  created_at: string;
}
interface Req {
  id: string;
  subject: string;
  status: string;
  message: string;
  created_at: string;
  replies: Reply[];
}
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "#1c5a60" },
  in_progress: { label: "Being worked on", color: "#8a6a15" },
  waiting: { label: "Replied · waiting on you", color: "#7b6b8d" },
  resolved: { label: "Resolved", color: "#2c6b3f" },
};
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// The client's own support requests, with the conversation and a reply box.
export default function MyRequests({ refreshKey = 0 }: { refreshKey?: number }) {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/support/requests", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setReqs(d.requests ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function reply(id: string) {
    if (!draft.trim()) return;
    setBusy(true);
    await fetch("/api/support/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, body: draft }) });
    setBusy(false);
    setDraft("");
    void load();
  }

  if (!reqs?.length) return null;
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">My requests</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-[#1a2b4a]/10">
        {reqs.map((r) => {
          const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.open;
          const isOpen = open === r.id;
          return (
            <div key={r.id} className="py-3">
              <button onClick={() => setOpen(isOpen ? null : r.id)} className="flex w-full items-center justify-between gap-3 text-left">
                <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{r.subject}</span>
                <span className="shrink-0 text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
              </button>
              <p className="text-xs text-[#7a8a99]">Sent {when(r.created_at)}{r.replies.length ? ` · ${r.replies.length} repl${r.replies.length === 1 ? "y" : "ies"}` : ""}</p>
              {isOpen && (
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-[#1a2b4a]/5 p-3 text-sm whitespace-pre-line text-[#1a2b4a] dark:text-[#F8F5F0]">{r.message}</div>
                  {r.replies.map((x, i) => (
                    <div key={i} className={`rounded-xl p-3 text-sm whitespace-pre-line ${x.author === "support" ? "bg-[#c9a227]/10 text-[#1a2b4a] dark:text-[#F8F5F0]" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                      <p className="mb-1 text-[11px] font-semibold text-[#7a8a99]">{x.author === "support" ? "LifeCharter Support" : "You"} · {when(x.created_at)}</p>
                      {x.body}
                    </div>
                  ))}
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Add a reply" className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-2 text-sm" />
                  <Button size="sm" onClick={() => reply(r.id)} disabled={busy || !draft.trim()}>Send reply</Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
