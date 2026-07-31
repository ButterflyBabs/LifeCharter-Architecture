"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Circle,
  TrendingUp,
  Flame,
  Trophy,
  Zap,
  Phone,
  Share2,
  MessageSquare,
  Star,
  Plus
} from "lucide-react";
import Link from "next/link";

interface WeeklyGoal {
  id: string;
  category: string;
  target: number;
  current: number;
  unit: string;
}

interface DayActivity {
  date: string;
  dayName: string;
  completed: boolean;
  activities: {
    calls: number;
    content: number;
    followups: number;
  };
}

const weeklyGoals: WeeklyGoal[] = [
  { id: "1", category: "Sales Calls", target: 25, current: 12, unit: "calls" },
  { id: "2", category: "Content Posts", target: 15, current: 8, unit: "posts" },
  { id: "3", category: "Follow-ups", target: 20, current: 15, unit: "messages" },
  { id: "4", category: "Proposals Sent", target: 3, current: 1, unit: "proposals" }
];

const weekData: DayActivity[] = [
  { date: "2026-07-14", dayName: "Mon", completed: true, activities: { calls: 5, content: 3, followups: 4 } },
  { date: "2026-07-15", dayName: "Tue", completed: true, activities: { calls: 4, content: 2, followups: 5 } },
  { date: "2026-07-16", dayName: "Wed", completed: true, activities: { calls: 3, content: 3, followups: 6 } },
  { date: "2026-07-17", dayName: "Thu", completed: false, activities: { calls: 0, content: 0, followups: 0 } },
  { date: "2026-07-18", dayName: "Fri", completed: false, activities: { calls: 0, content: 0, followups: 0 } },
  { date: "2026-07-19", dayName: "Sat", completed: false, activities: { calls: 0, content: 0, followups: 0 } },
  { date: "2026-07-20", dayName: "Sun", completed: false, activities: { calls: 0, content: 0, followups: 0 } }
];

export default function WeeklyViewPage() {
  const [currentWeek] = useState("July 14-20, 2026");
  const [streak] = useState({
    current: 12,
    longest: 28,
    weeklyStreak: 3
  });

  // Calculate weekly totals for display
  const weeklyTotals = {
    totalActivities: weekData.reduce((acc, day) => 
      acc + day.activities.calls + day.activities.content + day.activities.followups, 0
    ),
    completedDays: weekData.filter(day => day.completed).length
  };
  
  // Display weekly stats in summary
  // Display weekly stats
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  weeklyTotals;

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
            <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#c9a227]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Weekly View
              </h1>
              <p className="text-[#b8a898]">
                Plan your week, track your progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#1a2b4a]/10 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{currentWeek}</span>
            <button className="p-2 hover:bg-[#1a2b4a]/10 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Streak Banner */}
      <Card className="mb-8 bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{streak.current}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Day Streak</p>
              </div>
              <div className="h-12 w-px bg-[#e8e4f0]/30" />
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{streak.longest}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Longest Streak</p>
              </div>
              <div className="h-12 w-px bg-[#e8e4f0]/30" />
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{streak.weeklyStreak}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Weeks Complete</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#e8e4f0] mb-1">Keep it up!</p>
              <p className="text-xs text-[#c9a227]">
                {streak.current} more days to beat your record
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((day, index) => (
              <Link key={day.date} href="/daily-compass">
                <div
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${
                    day.completed
                      ? "bg-[#4a9b9b]/20 border-2 border-[#4a9b9b]"
                      : index < 3
                      ? "bg-[#1a2b4a]/5 border-2 border-[#1a2b4a]/20"
                      : "bg-white dark:bg-[#1a2b4a]/30 border-2 border-dashed border-[#1a2b4a]/20"
                  }`}
                >
                  <p className="text-sm text-[#b8a898] mb-1">{day.dayName}</p>
                  <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                    {new Date(day.date).getDate()}
                  </p>
                  {day.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#4a9b9b] mx-auto mt-2" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#b8a898] mx-auto mt-2" />
                  )}
                  {day.completed && (
                    <div className="mt-2 text-xs text-[#4a9b9b]">
                      <p>{day.activities.calls}c</p>
                      <p>{day.activities.content}p</p>
                      <p>{day.activities.followups}f</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-[#c9a227]" />
              Weekly Goals
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                      {goal.category}
                    </span>
                    <span className="text-[#b8a898]">
                      {goal.current}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Week Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#c9a227]" />
              Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
                <Phone className="w-6 h-6 text-[#7b6b8d] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">12</p>
                <p className="text-sm text-[#b8a898]">Sales Calls</p>
              </div>
              <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
                <Share2 className="w-6 h-6 text-[#4a9b9b] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">8</p>
                <p className="text-sm text-[#b8a898]">Content Posts</p>
              </div>
              <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
                <MessageSquare className="w-6 h-6 text-[#c9a227] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">15</p>
                <p className="text-sm text-[#b8a898]">Follow-ups</p>
              </div>
              <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
                <Star className="w-6 h-6 text-[#1a2b4a] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">3</p>
                <p className="text-sm text-[#b8a898]">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What Populates Streak */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#c9a227]" />
            How Streaks Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Day Streak</h3>
              <p className="text-sm text-[#b8a898]">
                Increases when you complete at least 3 activities in a day (calls, content, or follow-ups). 
                Breaks if you miss a day entirely.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Weekly Streak</h3>
              <p className="text-sm text-[#b8a898]">
                Increases when you hit 80% of your weekly goals. Tracks consecutive weeks of strong performance.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Activity Tracking</h3>
              <p className="text-sm text-[#b8a898]">
                Each completed task, call made, post published, or follow-up sent counts toward your daily activity total.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
