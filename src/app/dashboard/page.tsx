"use client";

import { useState, useEffect, useRef } from "react";
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
import { GripVertical, ChevronDown, Building2, Plus } from "lucide-react";
import { OverallBusinessHealth } from "@/components/dashboard/OverallBusinessHealth";
import { DomainAlignmentRadar } from "@/components/dashboard/DomainAlignmentRadar";
import { AIBusinessGuide } from "@/components/dashboard/AIBusinessGuide";
import { NextThreeMoves } from "@/components/dashboard/NextThreeMoves";
import { DomainScores } from "@/components/dashboard/DomainScores";
import { BusinessHealthTrend } from "@/components/dashboard/BusinessHealthTrend";
import { OperatingRhythm } from "@/components/dashboard/OperatingRhythm";
import { MilestonesMomentum } from "@/components/dashboard/MilestonesMomentum";
import { RevenueSnapshot } from "@/components/dashboard/RevenueSnapshot";
import { Card, CardContent } from "@/components/ui/Card";

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
      {/* Drag Handle - z-50 to ensure it's above all card content */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-50 p-1.5 rounded-md bg-[#1a2b4a]/10 hover:bg-[#1a2b4a]/20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-[#1a2b4a]/10"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-[#1a2b4a] dark:text-[#F8F5F0]" />
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

  // Workspace state
  const [workspaces] = useState([
    { id: "ws-1", name: "Soulful Solutions Co.", role: "Owner" },
    { id: "ws-2", name: "Sacred Kaleidoscope", role: "Admin" },
    { id: "ws-3", name: "LifeCharter Ventures", role: "Member" },
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="space-y-6 pt-6 px-8">
      {/* Welcome Section with Centered Workspace Dropdown */}
      <div className="mb-8">
        {/* Centered Workspace Selector with top padding */}
        <div className="flex justify-center mb-6 pt-4">
          <div className="relative" ref={workspaceDropdownRef}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1a2b4a] dark:bg-[#7b6b8d] text-[#F8F5F0] hover:bg-[#1a2b4a]/90 dark:hover:bg-[#7b6b8d]/90 transition-all shadow-md hover:shadow-lg border border-[#c9a227]/30"
            >
              <Building2 className="w-5 h-5 text-[#c9a227]" />
              <div className="text-left">
                <p className="text-xs text-[#c9a227] uppercase tracking-wider">Current Workspace</p>
                <p className="text-sm font-semibold">{currentWorkspace.name}</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#c9a227] transition-transform ml-2 ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu - Theme Coordinated */}
            {showWorkspaceDropdown && (
              <Card className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 z-50 shadow-xl border-[#c9a227]/20">
                <CardContent className="p-3">
                  <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] uppercase tracking-wider px-3 py-2 font-semibold">
                    Your Workspaces
                  </p>
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => {
                        setCurrentWorkspace(workspace);
                        setShowWorkspaceDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all ${
                        currentWorkspace.id === workspace.id
                          ? 'bg-[#1a2b4a] dark:bg-[#7b6b8d] text-[#F8F5F0] shadow-md'
                          : 'hover:bg-[#1a2b4a]/5 dark:hover:bg-[#e8e4f0]/10 text-[#1a2b4a] dark:text-[#F8F5F0]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentWorkspace.id === workspace.id 
                            ? 'bg-[#c9a227]/20' 
                            : 'bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10'
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            currentWorkspace.id === workspace.id 
                              ? 'text-[#c9a227]' 
                              : 'text-[#1a2b4a] dark:text-[#e8e4f0]'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            currentWorkspace.id === workspace.id ? 'text-[#F8F5F0]' : ''
                          }`}>{workspace.name}</p>
                          <p className={`text-xs ${
                            currentWorkspace.id === workspace.id 
                              ? 'text-[#c9a227]' 
                              : 'text-[#b8a898]'
                          }`}>{workspace.role}</p>
                        </div>
                      </div>
                      {currentWorkspace.id === workspace.id && (
                        <div className="w-3 h-3 rounded-full bg-[#c9a227] shadow-sm" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-[#1a2b4a]/10 dark:border-[#e8e4f0]/20 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        alert("Create new workspace - coming soon!");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center group-hover:bg-[#c9a227]/20">
                        <Plus className="w-5 h-5 text-[#c9a227]" />
                      </div>
                      <span className="text-sm font-medium">Create New Workspace</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Welcome Text - Left justified with drag hint on same line right justified */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">
              Welcome back, Seraphina
            </h1>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
              Here&apos;s your business at a glance
            </p>
          </div>
          <p className="text-sm text-[#b8a898]">
            💡 Hover over cards and drag the handle to reorder
          </p>
        </div>
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
