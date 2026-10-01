"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { ThumbsUp, Ticket } from "lucide-react";

type Status = "open" | "under_review" | "planned" | "shipped" | "closed";
const STATUS_LABEL: Record<Status, string> = { open: "Open", under_review: "Under review", planned: "Planned", shipped: "Shipped", closed: "Closed" };
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

interface Item {
  id: string;
  title: string;
  description: string;
  status: Status;
  submitter_name: string;
  vote_count: number;
  support_request_id: string | null;
  accountName: string | null;
  created_at: string;
}

// Admin view of one kind (Glitches, Suggestions or Feedback) — Support Desk's
// extra tabs. Glitches show which account reported it; Suggestions/Feedback
// show the vote count, so demand is visible at a glance.
export default function FeedbackAdminTab({ kind }: { kind: "glitch" | "suggestion" | "feedback" }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetch(`/api/feedback/admin?kind=${kind}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setItems(d.items ?? []);
  }, [kind]);
  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    await fetch(`/api/feedback/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    void load();
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-[#1a2b4a]/10">
        {items === null ? (
          <p className="p-4 text-sm text-[#7a8a99]">Loading…</p>
        ) : !items.length ? (
          <p className="p-4 text-sm text-[#7a8a99]">Nothing here yet.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-start gap-3 p-4">
              {kind !== "glitch" && (
                <span className="flex flex-shrink-0 flex-col items-center rounded-lg border border-[#1a2b4a]/15 px-2.5 py-1.5 text-xs font-semibold text-[#5a6472]">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {it.vote_count}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{it.title}</p>
                  {it.support_request_id && (
                    <a href={`/support-desk?id=${it.support_request_id}`} className="inline-flex items-center gap-1 text-[11px] text-[#2E7C83] hover:underline">
                      <Ticket className="w-3 h-3" /> Open ticket
                    </a>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-line text-sm text-[#5a6472] dark:text-[#b8c2cf]">{it.description}</p>
                <p className="mt-1 text-xs text-[#b8a898]">
                  {it.accountName ? `${it.accountName} · ` : ""}
                  {it.submitter_name} · {when(it.created_at)}
                </p>
              </div>
              <select
                value={it.status}
                onChange={(e) => setStatus(it.id, e.target.value as Status)}
                disabled={busy === it.id}
                className="h-9 flex-shrink-0 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm"
                aria-label="Status"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
