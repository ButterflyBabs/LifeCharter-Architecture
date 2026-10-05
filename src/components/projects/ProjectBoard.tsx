"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Plus, Share2 } from "lucide-react";
import { COLUMNS, PRIORITY_COLOR, fmtDay, todayStr, type PData, type PTask } from "./types";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

function Card({ t, who, onOpen, overlay }: { t: PTask; who: string; onOpen: (t: PTask) => void; overlay?: boolean }) {
  const overdue = t.dueDay && t.status !== "done" && t.dueDay < todayStr();
  return (
    <div
      onClick={() => onOpen(t)}
      className={`cursor-grab rounded-xl border border-[#1a2b4a]/10 bg-white p-3 text-sm shadow-sm hover:border-[#2E7C83]/50 active:cursor-grabbing dark:bg-[#1a2b4a]/40 ${overlay ? "rotate-1 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 flex-none rounded-full" style={{ backgroundColor: PRIORITY_COLOR[t.priority] || "#7b8fa3" }} title={`${t.priority} priority`} />
        <p className={`min-w-0 flex-1 font-medium leading-snug text-[#1a2b4a] dark:text-[#F8F5F0] ${t.status === "done" ? "line-through opacity-60" : ""}`}>{t.title}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#7a8a99]">
        {t.dueDay && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${overdue ? "bg-[#b3392b]/10 text-[#b3392b]" : "bg-[#1a2b4a]/6"}`}>
            <CalendarDays className="h-3 w-3" /> {fmtDay(t.dueDay)}
          </span>
        )}
        {t.shared && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2E7C83]/10 px-2 py-0.5 text-[#2E7C83]" title="Shown to clients and contractors">
            <Share2 className="h-3 w-3" /> shared
          </span>
        )}
        {who && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a227]/25 text-[9px] font-bold text-[#6b5410]" title={who}>{initials(who)}</span>}
      </div>
    </div>
  );
}

function SortableCard(props: { t: PTask; who: string; onOpen: (t: PTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `t:${props.t.id}` });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }} {...attributes} {...listeners}>
      <Card {...props} />
    </div>
  );
}

function Column({ colKey, label, tasks, whoOf, onOpen, onAdd }: { colKey: string; label: string; tasks: PTask[]; whoOf: (t: PTask) => string; onOpen: (t: PTask) => void; onAdd: (status: string, title: string) => Promise<void> }) {
  const { setNodeRef, isOver } = useDroppable({ id: `c:${colKey}` });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  return (
    <div className={`flex w-64 flex-none flex-col rounded-2xl bg-[#1a2b4a]/5 p-2.5 ${isOver ? "ring-2 ring-[#2E7C83]/40" : ""}`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1a2b4a] dark:text-[#F8F5F0]">{label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#7a8a99] dark:bg-[#1a2b4a]/40">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex min-h-[3rem] flex-1 flex-col gap-2">
        <SortableContext items={tasks.map((t) => `t:${t.id}`)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableCard key={t.id} t={t} who={whoOf(t)} onOpen={onOpen} />
          ))}
        </SortableContext>
      </div>
      {adding ? (
        <form
          className="mt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim()) return;
            await onAdd(colKey, title.trim());
            setTitle("");
          }}
        >
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !title && setAdding(false)} placeholder="Task name, then Enter" className="w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-2.5 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]" />
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[#7a8a99] hover:bg-white/60 hover:text-[#1a2b4a]">
          <Plus className="h-3.5 w-3.5" /> Add a task
        </button>
      )}
    </div>
  );
}

// A board like a pipeline: drag cards between stages (and up or down inside one); click a card to edit it.
export default function ProjectBoard({ data, onOpen, onMove, onAdd }: { data: PData; onOpen: (t: PTask) => void; onMove: (moves: { id: number; status: string; position: number }[]) => Promise<void>; onAdd: (status: string, title: string) => Promise<void> }) {
  const [dragId, setDragId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const whoOf = (t: PTask) => data.team.find((m) => m.id === t.assigneeMemberId)?.name || data.guests.find((g) => g.id === t.assigneeGuestId)?.name || "";
  const byCol = (key: string) => data.tasks.filter((t) => t.status === key).sort((a, b) => a.position - b.position || a.id - b.id);
  const active = dragId != null ? data.tasks.find((t) => t.id === dragId) ?? null : null;

  const end = async (e: DragEndEvent) => {
    setDragId(null);
    const { active: a, over } = e;
    if (!over) return;
    const id = Number(String(a.id).slice(2));
    const task = data.tasks.find((t) => t.id === id);
    if (!task) return;
    const overId = String(over.id);
    let toCol = task.status;
    let toIndex: number;
    if (overId.startsWith("c:")) {
      toCol = overId.slice(2);
      toIndex = byCol(toCol).filter((t) => t.id !== id).length;
    } else {
      const other = data.tasks.find((t) => `t:${t.id}` === overId);
      if (!other) return;
      toCol = other.status;
      const list = byCol(toCol).filter((t) => t.id !== id);
      toIndex = list.findIndex((t) => t.id === other.id);
      if (toCol === task.status) {
        const cur = byCol(toCol);
        const from = cur.findIndex((t) => t.id === id);
        const to = cur.findIndex((t) => t.id === other.id);
        if (from === to) return;
        const next = arrayMove(cur, from, to);
        await onMove(next.map((t, i) => ({ id: t.id, status: toCol, position: i })).filter((m) => data.tasks.find((t) => t.id === m.id)?.position !== m.position || m.id === id));
        return;
      }
    }
    const list = byCol(toCol).filter((t) => t.id !== id);
    list.splice(Math.max(0, toIndex), 0, task);
    await onMove(list.map((t, i) => ({ id: t.id, status: toCol, position: i })));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e: DragStartEvent) => setDragId(Number(String(e.active.id).slice(2)))} onDragCancel={() => setDragId(null)} onDragEnd={end}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLUMNS.map((c) => (
          <Column key={c.key} colKey={c.key} label={c.label} tasks={byCol(c.key)} whoOf={whoOf} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>{active ? <Card t={active} who={whoOf(active)} onOpen={() => {}} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
