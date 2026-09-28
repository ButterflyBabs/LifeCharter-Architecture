"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Scale, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LEGAL_GROUPS, LEGAL_ITEMS, legalCompletion, type LegalState, type LegalStatus } from "@/lib/legalChecklist";

const STATUS: { value: LegalStatus; label: string; color: string }[] = [
  { value: "not_started", label: "Not started", color: "#8a7f74" },
  { value: "in_progress", label: "In progress", color: "#1c5a60" },
  { value: "done", label: "Done", color: "#2c6b3f" },
  { value: "na", label: "Doesn't apply", color: "#9aa3ad" },
];

interface Row {
  key: string;
  group: string;
  title: string;
  help: string;
  renews: boolean;
  custom: boolean;
}

export default function CompliancePage() {
  const [states, setStates] = useState<LegalState[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/legal-checklist", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setStates(d.states ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const byKey = useMemo(() => new Map((states ?? []).map((s) => [s.item_key, s])), [states]);
  const rows: Row[] = useMemo(
    () => [
      ...LEGAL_ITEMS.map((i) => ({ key: i.key, group: i.group, title: i.title, help: i.help, renews: !!i.renews, custom: false })),
      ...(states ?? [])
        .filter((s) => s.item_key.startsWith("custom:"))
        .map((s) => ({ key: s.item_key, group: s.custom_group || "My items", title: s.custom_title || "My item", help: "", renews: true, custom: true })),
    ],
    [states]
  );
  const groups = [...LEGAL_GROUPS, ...Array.from(new Set(rows.filter((r) => r.custom).map((r) => r.group))).filter((g) => !(LEGAL_GROUPS as readonly string[]).includes(g))];
  const pct = legalCompletion(states ?? []) ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
  const renewals = (states ?? []).filter((s) => s.due_date && s.due_date <= soon && s.status !== "na").sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  async function save(key: string, patch: Record<string, unknown>) {
    setStates((prev) => {
      const list = [...(prev ?? [])];
      const i = list.findIndex((s) => s.item_key === key);
      const base: LegalState = i >= 0 ? list[i] : { item_key: key, status: "not_started", due_date: null, notes: null, doc_link: null, custom_title: null, custom_group: null };
      const next = {
        ...base,
        ...(patch.status ? { status: patch.status as LegalStatus } : {}),
        ...(patch.dueDate !== undefined ? { due_date: (patch.dueDate as string) || null } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes as string } : {}),
        ...(patch.docLink !== undefined ? { doc_link: patch.docLink as string } : {}),
      };
      if (i >= 0) list[i] = next;
      else list.push(next);
      return list;
    });
    await fetch("/api/legal-checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemKey: key, ...patch }) });
  }

  async function addCustom() {
    if (!custom.trim()) return;
    await fetch("/api/legal-checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "custom", title: custom, group: "My items" }) });
    setCustom("");
    void load();
  }

  async function removeCustom(key: string) {
    if (!confirm("Remove this item?")) return;
    await fetch("/api/legal-checklist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemKey: key }) });
    void load();
  }

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Legal & Compliance</h1>
            <p className="text-[#7a8a99]">Contracts, insurance, licenses and filings, in one checklist. Feeds your Legal score.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{pct}%</p>
          <p className="text-xs text-[#7a8a99]">of what applies is done</p>
        </div>
      </div>
      <p className="mb-5 rounded-xl bg-[#c9a227]/10 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
        A general guide for small businesses, not legal advice. Rules vary by state and industry, so check anything you&apos;re unsure of with your attorney or accountant.
      </p>

      {!!renewals.length && (
        <Card className="mb-5 border-[#b06a5a]/30">
          <CardContent className="p-4">
            <p className="mb-1 text-sm font-semibold text-[#8a2f2f]">Coming up in the next 45 days</p>
            <ul className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              {renewals.map((s) => {
                const r = rows.find((x) => x.key === s.item_key);
                return <li key={s.item_key}>{s.due_date! < today ? "Overdue" : s.due_date} · {r?.title ?? s.custom_title}</li>;
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {states === null ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const list = rows.filter((r) => r.group === g);
            if (!list.length) return null;
            const doneN = list.filter((r) => byKey.get(r.key)?.status === "done").length;
            const isFolded = folded[g];
            return (
              <Card key={g}>
                <CardContent className="p-4">
                  <button className="flex w-full items-center justify-between" onClick={() => setFolded({ ...folded, [g]: !isFolded })}>
                    <span className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {g}
                    </span>
                    <span className="text-xs text-[#7a8a99]">{doneN}/{list.length} done</span>
                  </button>
                  {!isFolded && (
                    <div className="mt-2 divide-y divide-[#1a2b4a]/10">
                      {list.map((r) => {
                        const s = byKey.get(r.key);
                        const st = STATUS.find((x) => x.value === (s?.status ?? "not_started")) ?? STATUS[0];
                        const expanded = open === r.key;
                        return (
                          <div key={r.key} className="py-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <button onClick={() => setOpen(expanded ? null : r.key)} className={`min-w-0 flex-1 text-left text-sm ${s?.status === "na" ? "text-[#9aa3ad] line-through" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                                {r.title}
                                {s?.due_date && <span className="ml-2 text-xs text-[#7a8a99]">· due {s.due_date}</span>}
                              </button>
                              <select
                                value={s?.status ?? "not_started"}
                                onChange={(e) => save(r.key, { status: e.target.value })}
                                className="h-8 rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 px-2 text-xs font-semibold"
                                style={{ color: st.color }}
                                aria-label={`Status for ${r.title}`}
                              >
                                {STATUS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                              </select>
                              {r.custom && <Button size="sm" variant="ghost" onClick={() => removeCustom(r.key)} aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></Button>}
                            </div>
                            {expanded && (
                              <div className="mt-2 space-y-2 rounded-xl bg-[#1a2b4a]/5 p-3">
                                {r.help && <p className="text-xs text-[#7a8a99]">{r.help}</p>}
                                <div className="grid gap-2 md:grid-cols-[170px_1fr]">
                                  {r.renews ? (
                                    <Input type="date" defaultValue={s?.due_date ?? ""} onBlur={(e) => save(r.key, { dueDate: e.target.value })} aria-label="Renewal or due date" />
                                  ) : (
                                    <span />
                                  )}
                                  <Input placeholder="Where the document lives (link)" defaultValue={s?.doc_link ?? ""} onBlur={(e) => save(r.key, { docLink: e.target.value })} />
                                </div>
                                <textarea defaultValue={s?.notes ?? ""} onBlur={(e) => save(r.key, { notes: e.target.value })} rows={2} placeholder="Notes" className="w-full rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 p-2 text-sm" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <div className="flex gap-2">
            <Input placeholder="Add your own item (e.g. HIPAA training, food handler permit)" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <Button onClick={addCustom}><Plus className="w-4 h-4 mr-1" />Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}
