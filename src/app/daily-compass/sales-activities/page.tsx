"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Phone,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  User,
  Plus,
  ArrowRight,
  Star
} from "lucide-react";
import Link from "next/link";

interface SalesActivity {
  id: string;
  type: "call" | "followup" | "proposal" | "demo";
  contactName: string;
  contactCompany?: string;
  title: string;
  priority: "hot" | "warm" | "cold";
  dueDate: string;
  completed: boolean;
  notes?: string;
  linkedTo?: string;
  estimatedValue?: number;
}

interface DailyStats {
  callsMade: number;
  callsGoal: number;
  followupsSent: number;
  followupsGoal: number;
  proposalsSent: number;
  proposalsGoal: number;
  revenueInPipeline: number;
}

const mockActivities: SalesActivity[] = [
  {
    id: "1",
    type: "call",
    contactName: "Sarah Johnson",
    contactCompany: "Johnson Consulting",
    title: "Follow up on Incubator attendance",
    priority: "hot",
    dueDate: "Today",
    completed: false,
    notes: "She seemed very interested in Circle. Mentioned budget concerns.",
    linkedTo: "Convert 3 Incubator attendees to Circle",
    estimatedValue: 297
  },
  {
    id: "2",
    type: "followup",
    contactName: "Michael Chen",
    contactCompany: "TechStart Inc",
    title: "Send Circle information packet",
    priority: "warm",
    dueDate: "Today",
    completed: false,
    linkedTo: "Q3 Sales Goal",
    estimatedValue: 297
  },
  {
    id: "3",
    type: "proposal",
    contactName: "Amanda Rodriguez",
    contactCompany: "Growth Partners",
    title: "Send VIP coaching proposal",
    priority: "hot",
    dueDate: "Today",
    completed: true,
    notes: "She's ready to commit to 6-month package",
    linkedTo: "VIP Client Acquisition",
    estimatedValue: 5000
  },
  {
    id: "4",
    type: "call",
    contactName: "David Park",
    title: "Check-in on workbook purchase",
    priority: "cold",
    dueDate: "Tomorrow",
    completed: false,
    linkedTo: "Product Upsell"
  }
];

const priorityColors: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-200",
  warm: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cold: "bg-blue-100 text-blue-700 border-blue-200"
};

const typeIcons = {
  call: Phone,
  followup: MessageSquare,
  proposal: FileText,
  demo: Calendar
};

export default function SalesActivitiesPage() {
  const [activities, setActivities] = useState<SalesActivity[]>(mockActivities);
  const [filter, setFilter] = useState<string>("all");
  const [, setShowAddModal] = useState(false);

  const [stats] = useState<DailyStats>({
    callsMade: 2,
    callsGoal: 5,
    followupsSent: 3,
    followupsGoal: 5,
    proposalsSent: 1,
    proposalsGoal: 2,
    revenueInPipeline: 12500
  });

  const toggleComplete = (id: string) => {
    setActivities(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === "today") return activity.dueDate === "Today" && !activity.completed;
    if (filter === "overdue") return activity.dueDate === "Overdue" && !activity.completed;
    if (filter === "completed") return activity.completed;
    return true;
  });

  const completedCount = activities.filter(a => a.completed).length;
  const totalCount = activities.length;

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#7b6b8d]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Sales Activities
              </h1>
              <p className="text-[#b8a898]">
                Track calls, follow-ups, and proposals
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#b8a898]">Calls</p>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {stats.callsMade}/{stats.callsGoal}
            </p>
            <div className="w-full bg-[#1a2b4a]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#7b6b8d] h-1.5 rounded-full"
                style={{ width: `${(stats.callsMade/stats.callsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#b8a898]">Follow-ups</p>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {stats.followupsSent}/{stats.followupsGoal}
            </p>
            <div className="w-full bg-[#1a2b4a]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#4a9b9b] h-1.5 rounded-full"
                style={{ width: `${(stats.followupsSent/stats.followupsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#b8a898]">Proposals</p>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {stats.proposalsSent}/{stats.proposalsGoal}
            </p>
            <div className="w-full bg-[#1a2b4a]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#c9a227] h-1.5 rounded-full"
                style={{ width: `${(stats.proposalsSent/stats.proposalsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d]">
          <CardContent className="p-4">
            <p className="text-sm text-[#e8e4f0]">Pipeline Value</p>
            <p className="text-2xl font-bold text-[#F8F5F0]">
              ${stats.revenueInPipeline.toLocaleString()}
            </p>
            <p className="text-xs text-[#c9a227] mt-1">Active opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "today", "overdue", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as string)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[#1a2b4a] text-[#F8F5F0]"
                : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/20"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => {
          const TypeIcon = typeIcons[activity.type];
          return (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border transition-all ${
                activity.completed
                  ? "bg-[#1a2b4a]/5 border-[#1a2b4a]/10 opacity-60"
                  : "bg-white dark:bg-[#1a2b4a]/50 border-[#1a2b4a]/20"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(activity.id)}
                  className="mt-1"
                >
                  {activity.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#b8a898] hover:border-[#c9a227]" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 bg-[#1a2b4a]/10 rounded">
                      <TypeIcon className="w-4 h-4 text-[#7b6b8d]" />
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[activity.priority]}`}>
                      {activity.priority}
                    </span>
                    <span className="text-xs text-[#b8a898] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.dueDate}
                    </span>
                  </div>

                  <h3 className={`font-medium ${activity.completed ? "line-through text-[#b8a898]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                    {activity.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-[#b8a898]" />
                    <span className="text-sm text-[#b8a898]">
                      {activity.contactName}
                      {activity.contactCompany && ` • ${activity.contactCompany}`}
                    </span>
                  </div>

                  {activity.notes && (
                    <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mt-2 bg-[#7b6b8d]/10 p-2 rounded">
                      {activity.notes}
                    </p>
                  )}

                  {activity.linkedTo && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#4a9b9b]">
                      <TrendingUp className="w-3 h-3" />
                      <span>Linked to: {activity.linkedTo}</span>
                    </div>
                  )}

                  {activity.estimatedValue && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#c9a227]">
                      <Star className="w-3 h-3" />
                      <span>Est. Value: ${activity.estimatedValue}</span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Today&apos;s Progress
            </h3>
            <span className="text-sm text-[#b8a898]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-[#1a2b4a]/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#7b6b8d] to-[#c9a227] h-3 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
