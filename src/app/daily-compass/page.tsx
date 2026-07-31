"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Compass,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  MessageSquare,
  Phone,
  Share2,
  Sparkles,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  Flame,
  Trophy,
  AlertCircle,
  Battery,
  BatteryMedium,
  BatteryLow,
  X
} from "lucide-react";
import Link from "next/link";

interface DailyFocus {
  id: string;
  type: "sales" | "content" | "followup" | "admin" | "strategic";
  title: string;
  description: string;
  estimatedTime: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  source: "business_plan" | "marketing_plan" | "sales_system" | "domain_score" | "manual";
  linkedGoal?: string;
}

interface ActivityStreak {
  current: number;
  longest: number;
  lastActive: string;
}

interface DailyMetrics {
  callsMade: number;
  callsGoal: number;
  postsCreated: number;
  postsGoal: number;
  followupsSent: number;
  followupsGoal: number;
  contentEngagement: number;
}

export default function DailyCompassPage() {
  const [currentDate] = useState(new Date());
  const [greeting, setGreeting] = useState("Good morning");
  const [focusItems, setFocusItems] = useState<DailyFocus[]>([
    {
      id: "1",
      type: "sales",
      title: "Follow up with Sarah Johnson",
      description: "She attended the Incubator last week - time to invite to Circle",
      estimatedTime: 15,
      priority: "high",
      completed: false,
      source: "sales_system",
      linkedGoal: "Convert 3 Incubator attendees to Circle this month"
    },
    {
      id: "2",
      type: "content",
      title: "Create LinkedIn post about alignment",
      description: "Based on your Marketing Plan messaging",
      estimatedTime: 20,
      priority: "high",
      completed: false,
      source: "marketing_plan",
      linkedGoal: "Build thought leadership in alignment space"
    },
    {
      id: "3",
      type: "followup",
      title: "Send value-add to existing Circle members",
      description: "Share the new worksheet on Domain Scores",
      estimatedTime: 10,
      priority: "medium",
      completed: true,
      source: "domain_score",
      linkedGoal: "Improve Customer Experience domain score"
    },
    {
      id: "4",
      type: "strategic",
      title: "Review Q3 Business Plan progress",
      description: "Your Finance domain score dropped - check revenue goals",
      estimatedTime: 30,
      priority: "medium",
      completed: false,
      source: "business_plan",
      linkedGoal: "Hit $50K Q3 revenue target"
    }
  ]);

  const [metrics] = useState<DailyMetrics>({
    callsMade: 2,
    callsGoal: 5,
    postsCreated: 1,
    postsGoal: 3,
    followupsSent: 4,
    followupsGoal: 5,
    contentEngagement: 127
  });

  const [streak] = useState<ActivityStreak>({
    current: 12,
    longest: 28,
    lastActive: "2026-07-17"
  });

  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [showEnergyInfo, setShowEnergyInfo] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<DailyFocus["type"]>("sales");
  const [newTaskPriority, setNewTaskPriority] = useState<DailyFocus["priority"]>("medium");
  const [newTaskTime, setNewTaskTime] = useState(15);

  useEffect(() => {
    const hour = currentDate.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [currentDate]);

  const toggleComplete = (id: string) => {
    setFocusItems(items => 
      items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500 bg-red-50 border-red-200";
      case "medium": return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-500 bg-green-50 border-green-200";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sales": return <Phone className="w-4 h-4" />;
      case "content": return <Share2 className="w-4 h-4" />;
      case "followup": return <MessageSquare className="w-4 h-4" />;
      case "strategic": return <Target className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "business_plan": return "Business Plan";
      case "marketing_plan": return "Marketing Plan";
      case "sales_system": return "Sales System";
      case "domain_score": return "Domain Score";
      default: return "Manual";
    }
  };

  const completedCount = focusItems.filter(i => i.completed).length;
  const totalCount = focusItems.length;
  const progress = (completedCount / totalCount) * 100;

  const handleAddTask = () => {
    if (!newTaskTitle) return;
    const newTask: DailyFocus = {
      id: Date.now().toString(),
      type: newTaskType,
      title: newTaskTitle,
      description: "Added manually",
      estimatedTime: newTaskTime,
      priority: newTaskPriority,
      completed: false,
      source: "manual"
    };
    setFocusItems([...focusItems, newTask]);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleQuickWin = (type: string) => {
    if (type === "testimonial") {
      const newTask: DailyFocus = {
        id: Date.now().toString(),
        type: "followup",
        title: "Send testimonial request to best client",
        description: "Ask for a review from last week's success story",
        estimatedTime: 5,
        priority: "high",
        completed: false,
        source: "manual"
      };
      setFocusItems([newTask, ...focusItems]);
    } else if (type === "win") {
      const newTask: DailyFocus = {
        id: Date.now().toString(),
        type: "content",
        title: "Share a client win on social media",
        description: "5-minute post about recent transformation",
        estimatedTime: 5,
        priority: "medium",
        completed: false,
        source: "manual"
      };
      setFocusItems([newTask, ...focusItems]);
    }
  };

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#4a9b9b] flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Daily Compass
              </h1>
              <p className="text-[#b8a898]">
                {greeting}, Babs • {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a227]/10 rounded-full">
              <Flame className="w-5 h-5 text-[#c9a227]" />
              <span className="font-semibold text-[#c9a227]">{streak.current} day streak</span>
            </div>
            <Link href="/daily-compass/weekly">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Weekly View
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-[#1a2b4a] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
              Today&apos;s Progress
            </span>
            <span className="text-sm text-[#b8a898]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-[#1a2b4a]/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Today&apos;s Focus
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <select 
                  className="text-sm p-2 pr-8 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                >
                  <option value={3}>High Energy</option>
                  <option value={2}>Medium Energy</option>
                  <option value={1}>Low Energy</option>
                </select>
                <button 
                  onClick={() => setShowEnergyInfo(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-[#1a2b4a]/10 rounded"
                >
                  <AlertCircle className="w-3 h-3 text-[#b8a898]" />
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Energy Level Info Modal */}
          {showEnergyInfo && (
            <Card className="border-[#c9a227]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#c9a227]" />
                  Energy Levels Guide
                </CardTitle>
                <button onClick={() => setShowEnergyInfo(false)}>
                  <X className="w-4 h-4 text-[#b8a898]" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Battery className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">High Energy</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You are firing on all cylinders. Perfect for sales calls, content creation, 
                      strategic planning, and tackling your hardest tasks. Aim for 5+ meaningful activities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <BatteryMedium className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Medium Energy</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Steady and sustainable. Good for follow-ups, scheduling, light content creation, 
                      and administrative tasks. Aim for 3-4 focused activities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <BatteryLow className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Low Energy</p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Rest and recharge mode. Focus on quick wins, reviewing your Domain Scores, 
                      light planning, or self-care. Aim for 1-2 small wins and permission to rest.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Task Modal */}
          {showAddTask && (
            <Card className="border-[#4a9b9b]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#4a9b9b]" />
                  Add New Task
                </CardTitle>
                <button onClick={() => setShowAddTask(false)}>
                  <X className="w-4 h-4 text-[#b8a898]" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Task Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as DailyFocus["type"])}
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-sm"
                    >
                      <option value="sales">Sales</option>
                      <option value="content">Content</option>
                      <option value="followup">Follow-up</option>
                      <option value="strategic">Strategic</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as DailyFocus["priority"])}
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-sm"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Time (min)</label>
                    <input
                      type="number"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-sm"
                    />
                  </div>
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  Add Task
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Focus Items */}
          <div className="space-y-3">
            {focusItems.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.completed 
                    ? "bg-[#1a2b4a]/5 border-[#1a2b4a]/10 opacity-60" 
                    : "bg-white dark:bg-[#1a2b4a]/50 border-[#1a2b4a]/20 hover:border-[#c9a227]/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => toggleComplete(item.id)}
                    className="mt-1"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#b8a898] hover:text-[#c9a227]" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`p-1 rounded ${getPriorityColor(item.priority)}`}>
                        {getTypeIcon(item.type)}
                      </span>
                      <span className={`font-medium ${item.completed ? "line-through text-[#b8a898]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-sm text-[#b8a898] mb-2">{item.description}</p>
                    
                    {item.linkedGoal && (
                      <div className="flex items-center gap-2 text-xs text-[#7b6b8d] dark:text-[#e8e4f0] bg-[#7b6b8d]/10 px-2 py-1 rounded w-fit">
                        <ArrowRight className="w-3 h-3" />
                        <span>Linked to: {item.linkedGoal}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[#b8a898] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.estimatedTime} min
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[#1a2b4a]/10 text-[#7b6b8d] dark:text-[#e8e4f0] rounded-full">
                        From: {getSourceLabel(item.source)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/daily-compass/content-studio">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
                    <Share2 className="w-5 h-5 text-[#4a9b9b]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Create Content</p>
                  <p className="text-xs text-[#b8a898]">Social post, script</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/sales-activities">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-5 h-5 text-[#7b6b8d]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Sales Activities</p>
                  <p className="text-xs text-[#b8a898]">Calls, follow-ups</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/calendar">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-[#c9a227]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Content Calendar</p>
                  <p className="text-xs text-[#b8a898]">Schedule posts</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/scripts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-[#4a9b9b]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Scripts & Templates</p>
                  <p className="text-xs text-[#b8a898]">Sales, emails</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Daily Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#c9a227]" />
                Today&apos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#b8a898]">Sales Calls</span>
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{metrics.callsMade}/{metrics.callsGoal}</span>
                </div>
                <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                  <div className="bg-[#7b6b8d] h-2 rounded-full" style={{ width: `${(metrics.callsMade/metrics.callsGoal)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#b8a898]">Content Posts</span>
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{metrics.postsCreated}/{metrics.postsGoal}</span>
                </div>
                <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                  <div className="bg-[#4a9b9b] h-2 rounded-full" style={{ width: `${(metrics.postsCreated/metrics.postsGoal)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#b8a898]">Follow-ups</span>
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{metrics.followupsSent}/{metrics.followupsGoal}</span>
                </div>
                <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                  <div className="bg-[#c9a227] h-2 rounded-full" style={{ width: `${(metrics.followupsSent/metrics.followupsGoal)*100}%` }} />
                </div>
              </div>
              <div className="pt-3 border-t border-[#1a2b4a]/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#b8a898]">Engagement</span>
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{metrics.contentEngagement}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights from Business Management */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9a227]" />
                Insights
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#c9a227] mt-0.5" />
                  <p className="text-[#e8e4f0]">
                    Your <strong>Sales domain</strong> score dropped 5 points. Focus on making 3 more calls today.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[#c9a227] mt-0.5" />
                  <p className="text-[#e8e4f0]">
                    Marketing Plan suggests posting about alignment - content idea ready in Studio.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-[#c9a227] mt-0.5" />
                  <p className="text-[#e8e4f0]">
                    You are on track to hit your Q3 revenue goal! Keep the momentum.
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full mt-4 border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                  View Business Health
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#c9a227]" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleQuickWin("testimonial")}
              >
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Send a testimonial request</p>
                  <p className="text-xs text-[#b8a898]">To your best client from last week</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleQuickWin("win")}
              >
                <span className="text-2xl mr-3">📱</span>
                <div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Share a client win</p>
                  <p className="text-xs text-[#b8a898]">5-minute social post</p>
                </div>
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Review your Domain Scores</p>
                    <p className="text-xs text-[#b8a898]">2-minute check-in</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
