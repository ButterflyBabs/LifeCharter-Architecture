"use client";

import { useCallback, useEffect, useState } from "react";
import AssistantActionCards from "@/components/assistant/ActionCards";
import ReportStepRow, { type ReportStep } from "@/components/assistant/ReportStepRow";
import { onDecision } from "@/lib/assistantPopout";
import { askAssistant } from "@/lib/assistantPopout";

// Everything the assistant has prepared and is waiting on you for, in one place with Approve, Edit and Cancel.
// This is the link the assistant gives when something needs your go-ahead.
interface Row { reportId: string; index: number; itemType: string; itemKey: string; itemTitle: string; step: ReportStep }

export default function AssistantApprovalsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = useCallback(async () => {
    const d = await fetch("/api/assistant/reports?checklist=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    setRows((d?.checklist as Row[]) ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  // After a card is approved (for example the report itself), the checklist it created appears here.
  useEffect(() => onDecision(() => void load()), [load]);
  const groups = new Map<string, Row[]>();
  for (const r of rows ?? []) groups.set(`${r.itemType}:${r.itemKey}:${r.itemTitle}`, [...(groups.get(`${r.itemType}:${r.itemKey}:${r.itemTitle}`) ?? []), r]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c9a227]">Your assistant</p>
      <h1 className="font-serif text-3xl text-[#1a2b4a] dark:text-[#F8F5F0]">Waiting for your approval</h1>
      <p className="mt-1 text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">
        Nothing your assistant prepares happens until you press Approve here. Edit lets you say what to change, and it prepares a corrected one. Cancel throws it away.
      </p>
      <div className="mt-5">
        <AssistantActionCards
          fresh={[]}
          hideLink
          emptyNote="Nothing is waiting for you right now."
          onRevise={async (card, instruction) => {
            askAssistant(
              `Please change what you prepared for me: "${card.title}". What to change: ${instruction}\n\nThe details you had prepared (JSON, for your reference): ${JSON.stringify(card.args ?? {}).slice(0, 8000)}\n\nThat earlier preview has been cancelled and nothing was created, so do not look for it or update anything in my account. Call the ${card.tool} tool again now with the full corrected details to prepare a NEW preview for my approval.`,
              `Change "${card.title}": ${instruction}`
            );
          }}
        />
      </div>

      <h2 className="mt-10 font-serif text-2xl text-[#1a2b4a] dark:text-[#F8F5F0]">Your checklist</h2>
      <p className="mt-1 text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">
        Things your assistant asked you to read, decide or do. Every item is opened, edited and approved on its own: Approve one and the others stay waiting.
      </p>
      <div className="mt-3 space-y-5">
        {rows === null && <p className="text-sm text-[#7a8a99]">Loading…</p>}
        {rows !== null && rows.length === 0 && <p className="text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">Nothing on your checklist right now.</p>}
        {Array.from(groups.entries()).map(([k, list]) => (
          <div key={k}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5d6b7a] dark:text-[#b8c2cf]">{list[0].itemType === "task" ? "Task" : "Reminder"}: {list[0].itemTitle}</p>
            <ul className="divide-y divide-[#e3dccd] rounded-xl border border-[#e3dccd] bg-white dark:divide-[#2b3b5c] dark:border-[#2b3b5c] dark:bg-[#16233b]">
              {list.map((r) => (
                <ReportStepRow
                  key={`${r.reportId}-${r.index}`}
                  reportId={r.reportId}
                  index={r.index}
                  step={r.step}
                  itemTitle={r.itemTitle}
                  onStatus={(idx) => setRows((cur) => (cur ?? []).filter((x) => !(x.reportId === r.reportId && x.index === idx)))}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
