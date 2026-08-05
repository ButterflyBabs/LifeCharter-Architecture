"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";

const DIMENSIONS: { key: string; name: string }[] = [
  { key: "marketing", name: "Marketing" },
  { key: "sales", name: "Sales" },
  { key: "operations", name: "Operations" },
  { key: "finance", name: "Finance" },
  { key: "team", name: "Team" },
  { key: "systems", name: "Systems" },
  { key: "leadership", name: "Leadership" },
  { key: "vision", name: "Vision" },
  { key: "product", name: "Product" },
  { key: "customer_experience", name: "Client Experience" },
  { key: "legal", name: "Legal" },
  { key: "sustainability", name: "Sustainability" },
];

const healthColor = (s: number) => (s < 60 ? "#D83A34" : s < 80 ? "#c9a227" : "#2E7C83");

function SortableDimension({ id, name, score }: { id: string; name: string; score: number | null }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-white dark:bg-[#1A1A2E] rounded-xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-3 group hover:border-[#2E7C83]/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 flex-shrink-0 z-10"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <Link href={`/dimensions/${id}`} className="block" title={`Why is ${name} ${score ?? "—"}?`}>
        <span className="text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] leading-tight pr-4 block">{name}</span>
        <p className="text-xl font-serif mt-1" style={{ color: score !== null ? healthColor(score) : "#9CA3AF" }}>
          {score ?? "—"}
        </p>
        <div className="mt-1.5 h-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${score ?? 0}%`, backgroundColor: score !== null ? healthColor(score) : "#E8E4E0" }}
          />
        </div>
        <span className="mt-1.5 block text-[10px] text-[#2E7C83] opacity-0 group-hover:opacity-100 transition-opacity">
          Why this score →
        </span>
      </Link>
    </div>
  );
}

export default function DimensionCards() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<string[]>(DIMENSIONS.map((d) => d.key));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("exec-dimension-order") : null;
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setOrder(arr);
      } catch {
        /* ignore */
      }
    }
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasData) {
          const m: Record<string, number> = {};
          for (const dim of d.domains as Array<{ key: string; score: number }>) m[dim.key] = dim.score;
          setScores(m);
        }
      })
      .catch(() => {});
  }, []);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const next = arrayMove(items, items.indexOf(String(active.id)), items.indexOf(String(over.id)));
        localStorage.setItem("exec-dimension-order", JSON.stringify(next));
        return next;
      });
    }
  };

  const nameByKey = new Map(DIMENSIONS.map((d) => [d.key, d.name]));
  const orderedKeys = order
    .filter((k) => nameByKey.has(k))
    .concat(DIMENSIONS.map((d) => d.key).filter((k) => !order.includes(k)));

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-base text-indigo-900 dark:text-[#F8F5F0]">12 Business Dimensions</h2>
        <span className="text-[11px] text-gray-400">Drag to reorder</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orderedKeys} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {orderedKeys.map((k) => (
              <SortableDimension key={k} id={k} name={nameByKey.get(k) ?? k} score={scores[k] ?? null} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
