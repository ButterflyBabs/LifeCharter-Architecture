"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  Filter,
  ArrowRight,
  Star,
  AlertCircle
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

const priorityColors = {
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
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);

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
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#5E3B6C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                Sales Activities
              </h1>
              <p className="text-[#B9A9A9]">
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
            <p className="text-sm text-[#B9A9A9]">Calls</p>
            <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              {stats.callsMade}/{stats.callsGoal}
            </p>
            <div className="w-full bg-[#1F315B]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#5E3B6C] h-1.5 rounded-full"
                style={{ width: `${(stats.callsMade/stats.callsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#B9A9A9]">Follow-ups</p>
            <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              {stats.followupsSent}/{stats.followupsGoal}
            </p>
            <div className="w-full bg-[#1F315B]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#2E7C83] h-1.5 rounded-full"
                style={{ width: `${(stats.followupsSent/stats.followupsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#B9A9A9]">Proposals</p>
            <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              {stats.proposalsSent}/{stats.proposalsGoal}
            </p>
            <div className="w-full bg-[#1F315B]/10 rounded-full h-1.5 mt-2">
              <div 
                className="bg-[#D4AF63] h-1.5 rounded-full"
                style={{ width: `${(stats.proposalsSent/stats.proposalsGoal)*100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C]">
          <CardContent className="p-4">
            <p className="text-sm text-[#CDBED6]">Pipeline Value</p>
            <p className="text-2xl font-bold text-[#F6F1E8]">
              ${stats.revenueInPipeline.toLocaleString()}
            </p>
            <p className="text-xs text-[#D4AF63] mt-1">Active opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "today", "overdue", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[#1F315B] text-[#F6F1E8]"
                : "bg-[#1F315B]/10 text-[#1F315B] dark:text-[#F6F1E8] hover:bg-[#1F315B]/20"
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
                  ? "bg-[#1F315B]/5 border-[#1F315B]/10 opacity-60"
                  : "bg-white dark:bg-[#1F315B]/50 border-[#1F315B]/20"
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
                    <div className="w-5 h-5 rounded-full border-2 border-[#B9A9A9] hover:border-[#D4AF63]" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 bg-[#1F315B]/10 rounded">
                      <TypeIcon className="w-4 h-4 text-[#5E3B6C]" />
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[activity.priority]}`}>
                      {activity.priority}
                    </span>
                    <span className="text-xs text-[#B9A9A9] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.dueDate}
                    </span>
                  </div>

                  <h3 className={`font-medium ${activity.completed ? "line-through text-[#B9A9A9]" : "text-[#1F315B] dark:text-[#F6F1E8]"}`}>
                    {activity.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-[#B9A9A9]" />
                    <span className="text-sm text-[#B9A9A9]">
                      {activity.contactName}
                      {activity.contactCompany && ` • ${activity.contactCompany}`}
                    </span>
                  </div>

                  {activity.notes && (
                    <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] mt-2 bg-[#5E3B6C]/10 p-2 rounded">
                      {activity.notes}
                    </p>
                  )}

                  {activity.linkedTo && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#2E7C83]">
                      <TrendingUp className="w-3 h-3" />
                      <span>Linked to: {activity.linkedTo}</span>
                    </div>
                  )}

                  {activity.estimatedValue && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#D4AF63]">
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
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              Today&apos;s Progress
            </h3>
            <span className="text-sm text-[#B9A9A9]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-[#1F315B]/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#5E3B6C] to-[#D4AF63] h-3 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
