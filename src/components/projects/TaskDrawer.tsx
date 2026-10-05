"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { COLUMNS, type PData, type PTask } from "./types";

const FIELD = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const LABEL = "mb-1 block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";

// Edit one card. Nothing saves until Save is pressed.
export default function TaskDrawer({ task, data, onClose, onSave, onDelete }: { task: PTask; data: PData; onClose: () => void; onSave: (id: number, patch: Record<string, unknown>) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [f, setF] = useState(task);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => setF(task), [task]);
  const assignee = f.assigneeMemberId ? `m:${f.assigneeMemberId}` : f.assigneeGuestId ? `g:${f.assigneeGuestId}` : "";

  const save = async () => {
    setSaving(true);
    await onSave(task.id, {
      title: f.title,
      description: f.description,
      status: f.status,
      priority: f.priority,
      startDay: f.startDay || null,
      dueDay: f.dueDay || null,
      shared: f.shared,
      assigneeMemberId: f.assigneeMemberId,
      assigneeGuestId: f.assigneeGuestId,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-[#F8F5F0] p-5 shadow-2xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Edit task">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Edit task</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#7a8a99] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL} htmlFor="pt-title">Task</label>
            <input id="pt-title" className={FIELD} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="pt-desc">Notes</label>
            <textarea id="pt-desc" rows={4} className={FIELD} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="pt-status">Stage</label>
              <select id="pt-status" className={FIELD} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pt-pri">Priority</label>
              <select id="pt-pri" className={FIELD} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pt-start">Start</label>
              <input id="pt-start" type="date" className={FIELD} value={f.startDay ?? ""} onChange={(e) => setF({ ...f, startDay: e.target.value || null })} />
            </div>
            <div>
              <label className={LABEL} htmlFor="pt-due">Due</label>
              <input id="pt-due" type="date" className={FIELD} value={f.dueDay ?? ""} onChange={(e) => setF({ ...f, dueDay: e.target.value || null })} />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="pt-who">Assigned to</label>
            <select
              id="pt-who"
              className={FIELD}
              value={assignee}
              onChange={(e) => {
                const v = e.target.value;
                setF({ ...f, assigneeMemberId: v.startsWith("m:") ? v.slice(2) : null, assigneeGuestId: v.startsWith("g:") ? v.slice(2) : null });
              }}
            >
              <option value="">Me</option>
              {data.team.length > 0 && <optgroup label="My team">{data.team.map((m) => <option key={m.id} value={`m:${m.id}`}>{m.name}</option>)}</optgroup>}
              {data.guests.filter((g) => g.role === "contractor").length > 0 && <optgroup label="Contractors">{data.guests.filter((g) => g.role === "contractor").map((g) => <option key={g.id} value={`g:${g.id}`}>{g.name}</option>)}</optgroup>}
            </select>
          </div>
          <label className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <input type="checkbox" className="mt-1" checked={f.shared} onChange={(e) => setF({ ...f, shared: e.target.checked })} />
            <span>Show this task to the clients and contractors this project is shared with</span>
          </label>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button onClick={save} disabled={saving || !f.title.trim()} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
          <span className="flex-1" />
          {confirmDel ? (
            <span className="text-xs text-[#8a2f2f]">Delete it? <button onClick={() => onDelete(task.id).then(onClose)} className="font-semibold underline">Yes</button> · <button onClick={() => setConfirmDel(false)} className="underline">No</button></span>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1 text-xs text-[#8a2f2f] hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          )}
        </div>
      </aside>
    </div>
  );
}
