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
  AlertCircle
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
      description: "Based on your Marketing Plan messaging: 'Alignment over hustle'",
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

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF63] to-[#2E7C83] flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                Daily Compass
              </h1>
              <p className="text-[#B9A9A9]">
                {greeting}, Babs • {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#D4AF63]/10 rounded-full">
              <Flame className="w-5 h-5 text-[#D4AF63]" />
              <span className="font-semibold text-[#D4AF63]">{streak.current} day streak</span>
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
        <div className="bg-white dark:bg-[#1F315B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
              TodayTodayToday'sapos;sapos;s Progress
            </span>
            <span className="text-sm text-[#B9A9A9]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-[#1F315B]/10 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#2E7C83] to-[#D4AF63] h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* TodayTodayToday'sapos;sapos;s Focus */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF63]" />
                TodayTodayToday'sapos;sapos;s Focus
              </CardTitle>
              <div className="flex gap-2">
                <select 
                  className="text-sm p-2 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B]"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                >
                  <option value={3}>High Energy</option>
                  <option value={2}>Medium Energy</option>
                  <option value={1}>Low Energy</option>
                </select>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {focusItems.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all ${
                    item.completed 
                      ? "bg-[#1F315B]/5 border-[#1F315B]/10 opacity-60" 
                      : "bg-white dark:bg-[#1F315B]/50 border-[#1F315B]/20 hover:border-[#D4AF63]/50"
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
                        <Circle className="w-5 h-5 text-[#B9A9A9] hover:text-[#D4AF63]" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`p-1 rounded ${getPriorityColor(item.priority)}`}>
                          {getTypeIcon(item.type)}
                        </span>
                        <span className={`font-medium ${item.completed ? "line-through text-[#B9A9A9]" : "text-[#1F315B] dark:text-[#F6F1E8]"}`}>
                          {item.title}
                        </span>
                      </div>
                      <p className="text-sm text-[#B9A9A9] mb-2">{item.description}</p>
                      
                      {/* Linked Goal */}
                      {item.linkedGoal && (
                        <div className="flex items-center gap-2 text-xs text-[#5E3B6C] dark:text-[#CDBED6] bg-[#5E3B6C]/10 px-2 py-1 rounded w-fit">
                          <Link className="w-3 h-3" href={`/business-plan`} />
                          <span>Linked to: {item.linkedGoal}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[#B9A9A9] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.estimatedTime} min
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#1F315B]/10 text-[#5E3B6C] dark:text-[#CDBED6] rounded-full">
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
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/daily-compass/content-studio">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center mx-auto mb-2">
                    <Share2 className="w-5 h-5 text-[#2E7C83]" />
                  </div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] text-sm">Create Content</p>
                  <p className="text-xs text-[#B9A9A9]">Social post, script</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/sales-activities">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-5 h-5 text-[#5E3B6C]" />
                  </div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] text-sm">Sales Activities</p>
                  <p className="text-xs text-[#B9A9A9]">Calls, follow-ups</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/calendar">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-[#D4AF63]" />
                  </div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] text-sm">Content Calendar</p>
                  <p className="text-xs text-[#B9A9A9]">Schedule posts</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/scripts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-[#2E7C83]" />
                  </div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] text-sm">Scripts & Templates</p>
                  <p className="text-xs text-[#B9A9A9]">Sales, emails</p>
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
                <TrendingUp className="w-5 h-5 text-[#D4AF63]" />
                TodayTodayToday'sapos;sapos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#B9A9A9]">Sales Calls</span>
                  <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{metrics.callsMade}/{metrics.callsGoal}</span>
                </div>
                <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
                  <div className="bg-[#5E3B6C] h-2 rounded-full" style={{ width: `${(metrics.callsMade/metrics.callsGoal)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#B9A9A9]">Content Posts</span>
                  <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{metrics.postsCreated}/{metrics.postsGoal}</span>
                </div>
                <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
                  <div className="bg-[#2E7C83] h-2 rounded-full" style={{ width: `${(metrics.postsCreated/metrics.postsGoal)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#B9A9A9]">Follow-ups</span>
                  <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{metrics.followupsSent}/{metrics.followupsGoal}</span>
                </div>
                <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
                  <div className="bg-[#D4AF63] h-2 rounded-full" style={{ width: `${(metrics.followupsSent/metrics.followupsGoal)*100}%` }} />
                </div>
              </div>
              <div className="pt-3 border-t border-[#1F315B]/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#B9A9A9]">Engagement</span>
                  <span className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">{metrics.contentEngagement}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights from Business Management */}
          <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF63]" />
                Insights
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D4AF63] mt-0.5" />
                  <p className="text-[#CDBED6]">
                    Your <strong>Sales domain</strong> score dropped 5 points. Focus on making 3 more calls today.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[#D4AF63] mt-0.5" />
                  <p className="text-[#CDBED6]">
                    Marketing Plan suggests posting about &quot;alignment over hustle&quot; - content idea ready in Studio.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-[#D4AF63] mt-0.5" />
                  <p className="text-[#CDBED6]">
                    YouYouYou'reapos;reapos;re on track to hit your Q3 revenue goal! Keep the momentum.
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full mt-4 border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                  View Business Health
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4AF63]" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Send a testimonial request</p>
                  <p className="text-xs text-[#B9A9A9]">To your best client from last week</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                <span className="text-2xl mr-3">📱</span>
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Share a client win</p>
                  <p className="text-xs text-[#B9A9A9]">5-minute social post</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Review your Domain Scores</p>
                  <p className="text-xs text-[#B9A9A9]">2-minute check-in</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
