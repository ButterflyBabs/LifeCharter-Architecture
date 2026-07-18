"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MoreHorizontal,
  Share2
} from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: "draft" | "scheduled" | "published" | "failed";
  type: "image" | "video" | "carousel" | "text";
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const mockPosts: ScheduledPost[] = [
  {
    id: "1",
    content: "What if I told you that everything you've been taught about business growth is backwards? We've been told to hustle harder. But what if the real key is alignment?",
    platforms: ["linkedin", "instagram"],
    scheduledDate: "2026-07-18",
    scheduledTime: "09:00",
    status: "scheduled",
    type: "image"
  },
  {
    id: "2",
    content: "3 signs you're out of alignment: 1) Everything feels hard 2) You're exhausted but not fulfilled 3) Success doesn't feel like success",
    platforms: ["instagram", "facebook"],
    scheduledDate: "2026-07-18",
    scheduledTime: "14:00",
    status: "draft",
    type: "carousel"
  },
  {
    id: "3",
    content: "Just watched a client go from overwhelmed to aligned in 90 days. The transformation wasn't about doing more—it was about doing what matters.",
    platforms: ["linkedin"],
    scheduledDate: "2026-07-19",
    scheduledTime: "10:00",
    status: "scheduled",
    type: "text"
  },
  {
    id: "4",
    content: "Your morning routine sets the tone for your entire day. What's one thing you do to align yourself before the chaos begins?",
    platforms: ["instagram", "twitter", "facebook"],
    scheduledDate: "2026-07-17",
    scheduledTime: "08:00",
    status: "published",
    type: "image",
    engagement: { likes: 234, comments: 45, shares: 12 }
  }
];

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <span className="text-xs font-bold">IG</span>,
  linkedin: <span className="text-xs font-bold">LI</span>,
  twitter: <span className="text-xs font-bold">X</span>,
  facebook: <span className="text-xs font-bold">FB</span>
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _platformColors: Record<string, string> = {};

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  linkedin: "bg-blue-600",
  twitter: "bg-sky-500",
  facebook: "bg-blue-700"
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-600",
  published: "bg-green-100 text-green-600",
  failed: "bg-red-100 text-red-600"
};

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [, setSelectedPost] = useState<ScheduledPost | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getPostsForDate = (dateStr: string) => {
    return mockPosts.filter(post => post.scheduledDate === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-[#1F315B]/5 rounded-lg" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const posts = getPostsForDate(dateStr);
      const isToday = dateStr === formatDate(new Date());

      days.push(
        <div
          key={day}
          className={`h-24 p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
            isToday
              ? "border-[#D4AF63] bg-[#D4AF63]/10"
              : "border-[#1F315B]/10 bg-white dark:bg-[#1F315B]/30"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${isToday ? "text-[#D4AF63]" : "text-[#1F315B] dark:text-[#F6F1E8]"}`}>
              {day}
            </span>
            {posts.length > 0 && (
              <span className="text-xs bg-[#2E7C83] text-white px-1.5 py-0.5 rounded-full">
                {posts.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {posts.slice(0, 2).map((post, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1"
                onClick={() => setSelectedPost(post)}
              >
                {post.platforms.slice(0, 2).map((platform, pidx) => (
                  <span key={pidx} className={`w-2 h-2 rounded-full ${platformColors[platform]}`} />
                ))}
                <span className="text-xs text-[#B9A9A9] truncate flex-1">
                  {post.content.substring(0, 20)}...
                </span>
              </div>
            ))}
            {posts.length > 2 && (
              <p className="text-xs text-[#B9A9A9]">+{posts.length - 2} more</p>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

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
            <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#D4AF63]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                Content Calendar
              </h1>
              <p className="text-[#B9A9A9]">
                Schedule and manage your social media posts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#1F315B]/10 rounded-lg p-1">
              {["day", "week", "month"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    view === v
                      ? "bg-[#1F315B] text-[#F6F1E8]"
                      : "text-[#1F315B] dark:text-[#F6F1E8]"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-[#1F315B]/10 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-[#1F315B]/10 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-[#B9A9A9] py-2">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF63]" />
            Upcoming Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPosts
              .filter(post => post.status !== "published")
              .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
              .map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 bg-[#1F315B]/5 rounded-lg hover:bg-[#1F315B]/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                      {new Date(post.scheduledDate).getDate()}
                    </span>
                    <span className="text-xs text-[#B9A9A9]">
                      {new Date(post.scheduledDate).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1F315B] dark:text-[#F6F1E8] line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {post.platforms.map((platform) => (
                          <span
                            key={platform}
                            className={`w-6 h-6 rounded flex items-center justify-center text-white ${platformColors[platform]}`}
                          >
                            {platformIcons[platform]}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-[#B9A9A9] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.scheduledTime}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[post.status]}`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* PostStream Integration Note */}
      <Card className="mt-8 bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-[#D4AF63]" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">PostStream Integration</h3>
              <p className="text-sm text-[#CDBED6] mb-4">
                Connect your social media accounts to schedule posts directly from the Content Studio.
                PostStream supports Instagram, LinkedIn, Twitter/X, Facebook, and more.
              </p>
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Connect Accounts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
