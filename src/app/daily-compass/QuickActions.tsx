"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Calendar, MessageSquare, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

// The three Daily Compass quick-action cards (Create Content lives inside the
// Content Calendar now). Drag any card to reorder them —
// the order is remembered on this device. Cards still open on a normal click or
// tap; on a touch screen, press and hold a card a moment, then drag.

type CardId = "sales" | "calendar" | "scripts";
const DEFAULT_ORDER: CardId[] = ["calendar", "sales", "scripts"];
const STORAGE_KEY = "compass-quick-actions-order";

interface Props {
  psConnected: boolean | null;
  socialOn: boolean;
}

function SortableCard({ id, href, children }: { id: CardId; href: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, unknown> & { onKeyDown?: React.KeyboardEventHandler };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 20 : undefined }}
      className="relative group cursor-grab active:cursor-grabbing touch-manipulation"
      {...pointerListeners}
    >
      {/* Keyboard handle: focus it, press Space, then use the arrow keys. */}
      <button
        type="button"
        {...attributes}
        onKeyDown={onKeyDown}
        aria-label="Reorder this card (Space, then arrow keys)"
        className="absolute top-1.5 right-1.5 z-10 p-1 rounded-md text-[#b8a898] opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[#2E7C83]"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <Link href={href} draggable={false} className="block h-full">
        {children}
      </Link>
    </div>
  );
}

export function QuickActions({ psConnected, socialOn }: Props) {
  const [order, setOrder] = useState<CardId[]>(DEFAULT_ORDER);
  const justDragged = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved)) {
        const known = saved.filter((x): x is CardId => DEFAULT_ORDER.includes(x));
        setOrder([...known, ...DEFAULT_ORDER.filter((x) => !known.includes(x))]);
      }
    } catch {
      /* keep the default order */
    }
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (e: DragEndEvent) => {
    // A finished drag shouldn't also count as a click that opens the card.
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 200);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const next = arrayMove(items, items.indexOf(active.id as CardId), items.indexOf(over.id as CardId));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  };

  const cards: Record<CardId, { href: string; body: React.ReactNode }> = {
    sales: {
      href: "/daily-compass/sales-activities",
      body: (
        <>
          <div className="w-10 h-10 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center mx-auto mb-2">
            <Phone className="w-5 h-5 text-[#7b6b8d]" />
          </div>
          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Sales Activities</p>
          <p className="text-xs text-[#b8a898]">Calls, follow-ups</p>
        </>
      ),
    },
    calendar: {
      href: psConnected === false && !socialOn ? "/settings" : "/daily-compass/calendar",
      body: (
        <>
          <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-[#c9a227]" />
          </div>
          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Content Calendar</p>
          <p className="text-xs text-[#b8a898]">
            {psConnected === false && !socialOn ? "Connect PostStream" : "Plan, create & schedule posts"}
          </p>
        </>
      ),
    },
    scripts: {
      href: "/daily-compass/scripts",
      body: (
        <>
          <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-5 h-5 text-[#4a9b9b]" />
          </div>
          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Scripts &amp; Templates</p>
          <p className="text-xs text-[#b8a898]">Sales, emails</p>
        </>
      ),
    },
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          onClickCapture={(e) => {
            if (justDragged.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {order.map((id) => (
            <SortableCard key={id} id={id} href={cards[id].href}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 text-center">{cards[id].body}</CardContent>
              </Card>
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
