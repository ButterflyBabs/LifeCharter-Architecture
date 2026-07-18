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
        className="absolute top-2 right-2 z-50 p-1.5 rounded-md bg-[#1F315B]/10 hover:bg-[#1F315B]/20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-[#1F315B]/10"
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
    <div className="space-y-6 pt-6 pr-8">
      {/* Welcome Section with Centered Workspace Dropdown */}
      <div className="mb-8">
        {/* Centered Workspace Selector with top padding */}
        <div className="flex justify-center mb-6 pt-4">
          <div className="relative" ref={workspaceDropdownRef}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1F315B] dark:bg-[#5E3B6C] text-[#F6F1E8] hover:bg-[#1F315B]/90 dark:hover:bg-[#5E3B6C]/90 transition-all shadow-md hover:shadow-lg border border-[#D4AF63]/30"
            >
              <Building2 className="w-5 h-5 text-[#D4AF63]" />
              <div className="text-left">
                <p className="text-xs text-[#D4AF63] uppercase tracking-wider">Current Workspace</p>
                <p className="text-sm font-semibold">{currentWorkspace.name}</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#D4AF63] transition-transform ml-2 ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu - Theme Coordinated */}
            {showWorkspaceDropdown && (
              <Card className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 z-50 shadow-xl border-[#D4AF63]/20">
                <CardContent className="p-3">
                  <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6] uppercase tracking-wider px-3 py-2 font-semibold">
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
                          ? 'bg-[#1F315B] dark:bg-[#5E3B6C] text-[#F6F1E8] shadow-md'
                          : 'hover:bg-[#1F315B]/5 dark:hover:bg-[#CDBED6]/10 text-[#1F315B] dark:text-[#F6F1E8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentWorkspace.id === workspace.id 
                            ? 'bg-[#D4AF63]/20' 
                            : 'bg-[#1F315B]/5 dark:bg-[#CDBED6]/10'
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            currentWorkspace.id === workspace.id 
                              ? 'text-[#D4AF63]' 
                              : 'text-[#1F315B] dark:text-[#CDBED6]'
                          }`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            currentWorkspace.id === workspace.id ? 'text-[#F6F1E8]' : ''
                          }`}>{workspace.name}</p>
                          <p className={`text-xs ${
                            currentWorkspace.id === workspace.id 
                              ? 'text-[#D4AF63]' 
                              : 'text-[#B9A9A9]'
                          }`}>{workspace.role}</p>
                        </div>
                      </div>
                      {currentWorkspace.id === workspace.id && (
                        <div className="w-3 h-3 rounded-full bg-[#D4AF63] shadow-sm" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-[#1F315B]/10 dark:border-[#CDBED6]/20 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        alert("Create new workspace - coming soon!");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[#1F315B] dark:text-[#F6F1E8] hover:bg-[#D4AF63]/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF63]/10 flex items-center justify-center group-hover:bg-[#D4AF63]/20">
                        <Plus className="w-5 h-5 text-[#D4AF63]" />
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
            <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Welcome back, Seraphina
            </h1>
            <p className="text-[#5E3B6C] dark:text-[#CDBED6] mt-1">
              Here&apos;s your business at a glance
            </p>
          </div>
          <p className="text-sm text-[#B9A9A9]">
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
