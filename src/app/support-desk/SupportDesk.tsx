"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FeedbackAdminTab from "@/components/support/FeedbackAdminTab";
import AssistantFeedbackTab from "@/components/support/AssistantFeedbackTab";

interface Reply {
  author: "client" | "support";
  body: string;
  created_at: string;
}
interface Req {
  id: string;
  name: string;
  email: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  replies: Reply[];
}
const FILTERS: [string, string][] = [
  ["active", "Needs attention"],
  ["open", "Open"],
  ["in_progress", "In progress"],
  ["waiting", "Waiting on client"],
  ["resolved", "Resolved"],
  ["all", "All"],
];
const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", waiting: "Waiting on client", resolved: "Resolved" };
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const TOP_TABS: [string, string][] = [
  ["tickets", "Tickets"],
  ["glitch", "Glitches"],
  ["suggestion", "Suggestions"],
  ["feedback", "Feedback"],
  ["assistant", "Assistant"],
];

export default function SupportDesk() {
  const [topTab, setTopTab] = useState("tickets");
  const [filter, setFilter] = useState("active");
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/support/desk?status=${filter}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setReqs(d.requests ?? []);
    setCounts(d.counts ?? {});
  }, [filter]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
      setSel(id);
      setFilter("all");
    }
  }, []);

  const cur = (reqs ?? []).find((r) => r.id === sel) ?? null;

  async function act(payload: Record<string, unknown>) {
    if (!cur) return;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/support/desk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cur.id, ...payload }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Couldn't save.");
    if (payload.body) setMsg(d.emailed ? `Reply sent to ${cur.email}.` : "Reply saved (the email didn't go out; check the email setup).");
    setDraft("");
    void load();
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c0632f] to-[#1a2b4a] flex items-center justify-center">
          <Inbox className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Support Desk</h1>
          <p className="text-[#7a8a99]">Every client request in one place. Replies are emailed to the client; only you see this page.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-[#1a2b4a]/10 pb-3">
        {TOP_TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTopTab(k)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${topTab === k ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8c2cf]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {topTab === "assistant" ? (
        <AssistantFeedbackTab />
      ) : topTab !== "tickets" ? (
        <FeedbackAdminTab kind={topTab as "glitch" | "suggestion" | "feedback"} />
      ) : (
        <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${filter === k ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
          >
            {label}
            {k !== "active" && k !== "all" && counts[k] ? ` · ${counts[k]}` : ""}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</p>}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardContent className="p-0 divide-y divide-[#1a2b4a]/10">
            {reqs === null ? (
              <p className="p-4 text-sm text-[#7a8a99]">Loading…</p>
            ) : !reqs.length ? (
              <p className="p-4 text-sm text-[#7a8a99]">Nothing here. 🦋</p>
            ) : (
              reqs.map((r) => (
                <button key={r.id} onClick={() => setSel(r.id)} className={`block w-full p-4 text-left hover:bg-[#1a2b4a]/5 ${sel === r.id ? "bg-[#c9a227]/10" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.subject}</span>
                    {(r.priority === "high" || r.priority === "urgent") && <span className="shrink-0 rounded-full bg-[#b06a5a]/15 px-2 text-[11px] font-semibold text-[#8a2f2f]">{r.priority}</span>}
                  </div>
                  <p className="text-xs text-[#7a8a99]">
                    {r.name} · {STATUS_LABEL[r.status] ?? r.status} · {when(r.updated_at)}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            {!cur ? (
              <p className="text-sm text-[#7a8a99]">Choose a request to read and reply.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{cur.subject}</h2>
                    <p className="text-xs text-[#7a8a99]">
                      {cur.name} · <a href={`mailto:${cur.email}`} className="underline">{cur.email}</a> · {cur.category} · {cur.priority}
                      {cur.source === "travel_partner" ? " · from Travel Partner" : ""} · opened {when(cur.created_at)}
                    </p>
                  </div>
                  <select
                    value={cur.status}
                    onChange={(e) => act({ status: e.target.value })}
                    className="h-9 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm"
                    aria-label="Status"
                  >
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="rounded-xl bg-[#1a2b4a]/5 p-3 text-sm whitespace-pre-line text-[#1a2b4a] dark:text-[#F8F5F0]">{cur.message}</div>
                {cur.replies.map((x, i) => (
                  <div key={i} className={`rounded-xl p-3 text-sm whitespace-pre-line ${x.author === "support" ? "ml-8 bg-[#c9a227]/10" : "mr-8 bg-[#1a2b4a]/5"} text-[#1a2b4a] dark:text-[#F8F5F0]`}>
                    <p className="mb-1 text-[11px] font-semibold text-[#7a8a99]">{x.author === "support" ? "You" : cur.name} · {when(x.created_at)}</p>
                    {x.body}
                  </div>
                ))}
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} placeholder={`Reply to ${cur.name.split(" ")[0]}…`} className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => act({ body: draft })} disabled={busy || !draft.trim()}><Send className="w-4 h-4 mr-1" />Send reply</Button>
                  <Button variant="outline" onClick={() => act({ body: draft, status: "resolved" })} disabled={busy || !draft.trim()}>Send & mark resolved</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}
