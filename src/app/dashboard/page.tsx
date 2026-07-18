"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { OverallBusinessHealth } from "@/components/dashboard/OverallBusinessHealth";
import { DomainAlignmentRadar } from "@/components/dashboard/DomainAlignmentRadar";
import { AIBusinessGuide } from "@/components/dashboard/AIBusinessGuide";
import { NextThreeMoves } from "@/components/dashboard/NextThreeMoves";
import { DomainScores } from "@/components/dashboard/DomainScores";
import { BusinessHealthTrend } from "@/components/dashboard/BusinessHealthTrend";
import { OperatingRhythm } from "@/components/dashboard/OperatingRhythm";
import { MilestonesMomentum } from "@/components/dashboard/MilestonesMomentum";
import { RevenueSnapshot } from "@/components/dashboard/RevenueSnapshot";

// Define the dashboard card type
type DashboardCard = {
  id: string;
  component: React.ReactNode;
  title: string;
};

// Sortable wrapper component
function SortableCard({ card }: { card: DashboardCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-[#1F315B]/5 hover:bg-[#1F315B]/10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-[#1F315B] dark:text-[#F6F1E8]" />
      </div>
      {card.component}
    </div>
  );
}

export default function DashboardPage() {
  // Initialize cards with their components
  const [cards, setCards] = useState<DashboardCard[]>([
    {
      id: "overall-health",
      title: "Overall Business Health",
      component: <OverallBusinessHealth />,
    },
    {
      id: "domain-radar",
      title: "Domain Alignment",
      component: <DomainAlignmentRadar />,
    },
    {
      id: "ai-guide",
      title: "AI Business Guide",
      component: <AIBusinessGuide />,
    },
    {
      id: "next-moves",
      title: "Next Three Moves",
      component: <NextThreeMoves />,
    },
    {
      id: "domain-scores",
      title: "Domain Scores",
      component: <DomainScores />,
    },
    {
      id: "health-trend",
      title: "Health Trend",
      component: <BusinessHealthTrend />,
    },
    {
      id: "operating-rhythm",
      title: "Operating Rhythm",
      component: <OperatingRhythm />,
    },
    {
      id: "milestones",
      title: "Milestones",
      component: <MilestonesMomentum />,
    },
    {
      id: "revenue",
      title: "Revenue Snapshot",
      component: <RevenueSnapshot />,
    },
  ]);

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem("dashboard-card-order");
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[];
        // Reorder cards based on saved order
        const orderedCards = orderIds
          .map((id) => cards.find((card) => card.id === id))
          .filter((card): card is DashboardCard => card !== undefined);
        
        // Add any new cards that weren't in the saved order
        const newCards = cards.filter(
          (card) => !orderIds.includes(card.id)
        );
        
        setCards([...orderedCards, ...newCards]);
      } catch {
        console.warn("Failed to parse saved dashboard order");
      }
    }
  }, []);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newCards = arrayMove(items, oldIndex, newIndex);
        
        // Save new order to localStorage
        localStorage.setItem(
          "dashboard-card-order",
          JSON.stringify(newCards.map((card) => card.id))
        );
        
        return newCards;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
            Welcome back, Seraphina
          </h1>
          <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
            Here&apos;s your business at a glance
          </p>
        </div>
        <p className="text-sm text-[#B9A9A9] hidden sm:block">
          💡 Hover over cards and drag the handle to reorder
        </p>
      </div>

      {/* Draggable Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
