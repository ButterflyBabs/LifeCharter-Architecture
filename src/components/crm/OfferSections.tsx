"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, ChevronUp, GripVertical } from "lucide-react";
import { NO_OFFER, byOffer } from "@/lib/offerSections";

// Campaigns and broadcasts, listed under a header per offer. Each section folds away (remembered on
// this device), and the sections can be put in any order: drag one by its grip, or use the arrows.
// The order is saved to the account, so Campaigns and Broadcasts share it on every device.
const CTRL = "rounded p-0.5 text-[#7a8a99] hover:bg-[#1a2b4a]/10 hover:text-[#1a2b4a] disabled:opacity-30 dark:hover:text-[#F8F5F0]";

let orderCache: string[] | null = null;
const listeners = new Set<(o: string[]) => void>();
function setSharedOrder(o: string[]) {
  orderCache = o;
  listeners.forEach((l) => l(o));
}

function Section({ name, count, open, first, last, onToggle, onStep, children }: { name: string; count: number; open: boolean; first: boolean; last: boolean; onToggle: () => void; onStep: (by: number) => void; children: ReactNode }) {
  const { attributes, listeners: drag, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: name });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined }} className={`space-y-2 ${isDragging ? "opacity-80" : ""}`}>
      <div className="mt-4 flex items-start gap-1 rounded-lg bg-[#1a2b4a]/[0.05] px-2 py-1.5 first:mt-0 dark:bg-white/[0.06]">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-1.5 text-left text-[13px] font-bold leading-snug tracking-wide text-[#1a2b4a] dark:text-[#F8F5F0]">
          {open ? <ChevronDown className="mt-0.5 h-4 w-4 flex-none" /> : <ChevronRight className="mt-0.5 h-4 w-4 flex-none" />}
          <span className="min-w-0 break-words">{name}</span>
          <span className="ml-auto flex-none rounded-full bg-[#c9a227]/25 px-2 py-0.5 text-[11px] font-semibold text-[#7a5a0e] dark:text-[#e0c35a]">{count}</span>
        </button>
        <button type="button" onClick={() => onStep(-1)} disabled={first} aria-label={`Move ${name} up`} title="Move up" className={CTRL}><ChevronUp className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => onStep(1)} disabled={last} aria-label={`Move ${name} down`} title="Move down" className={CTRL}><ChevronDown className="h-3.5 w-3.5" /></button>
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...drag} aria-label={`Drag ${name} to reorder`} title="Drag to reorder" className={`${CTRL} cursor-grab touch-none active:cursor-grabbing`}><GripVertical className="h-3.5 w-3.5" /></button>
      </div>
      {open && children}
    </div>
  );
}

export default function OfferSections<T extends { offer?: string | null }>({ items, storageKey, children }: { items: T[]; storageKey: string; children: (item: T) => ReactNode }) {
  const [order, setOrder] = useState<string[]>(orderCache ?? []);
  const [closed, setClosed] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    listeners.add(setOrder);
    if (!orderCache) {
      fetch("/api/crm/offer-order", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setSharedOrder(d.order ?? []))
        .catch(() => {});
    }
    try {
      setClosed(JSON.parse(localStorage.getItem(`offer-closed:${storageKey}`) || "[]"));
    } catch {
      /* private mode */
    }
    return () => {
      listeners.delete(setOrder);
    };
  }, [storageKey]);

  const sections = useMemo(() => {
    const groups = byOffer(items);
    const at = (n: string) => (n === NO_OFFER ? 1e6 : order.indexOf(n) < 0 ? 1e5 : order.indexOf(n));
    return [...groups].sort((a, b) => at(a[0]) - at(b[0]) || a[0].localeCompare(b[0]));
  }, [items, order]);
  const names = sections.map((s) => s[0]);

  const toggle = (name: string) => {
    const next = closed.includes(name) ? closed.filter((n) => n !== name) : [...closed, name];
    setClosed(next);
    try {
      localStorage.setItem(`offer-closed:${storageKey}`, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };
  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || to >= names.length || from === to) return;
    const shown = arrayMove(names, from, to);
    // Sections that exist only on the other tab keep their place after these.
    const next = [...shown, ...order.filter((n) => !shown.includes(n))];
    setSharedOrder(next);
    fetch("/api/crm/offer-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next }) }).catch(() => {});
  };
  const dragEnd = (e: DragEndEvent) => {
    if (e.over) move(names.indexOf(String(e.active.id)), names.indexOf(String(e.over.id)));
  };

  const setAll = (openAll: boolean) => {
    const next = openAll ? [] : names;
    setClosed(next);
    try {
      localStorage.setItem(`offer-closed:${storageKey}`, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  return (
    <>
    {names.length > 1 && (
      <div className="mb-1 flex justify-end gap-3 text-xs font-semibold text-[#2E7C83]">
        <button type="button" onClick={() => setAll(true)} className="hover:underline">Open all</button>
        <button type="button" onClick={() => setAll(false)} className="hover:underline">Fold all</button>
      </div>
    )}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
      <SortableContext items={names} strategy={verticalListSortingStrategy}>
        {sections.map(([name, group], i) => (
          <Section key={name} name={name} count={group.length} open={!closed.includes(name)} first={i === 0} last={i === sections.length - 1} onToggle={() => toggle(name)} onStep={(by) => move(i, i + by)}>
            {group.map((it) => children(it))}
          </Section>
        ))}
      </SortableContext>
    </DndContext>
    </>
  );
}
