"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Briefcase,
  Megaphone,
  TrendingUp,
  DollarSign,
  Settings,
  Star,
  Sparkles,
  Settings2,
  Moon,
  Sun,
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  HeartPulse,
  Target,
  Bot,
  ListChecks,
  Activity,
  Timer,
  Flag,
  Wallet,
} from "lucide-react";

const navigationItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/" },
  { id: "assessments", label: "Assessments", icon: ClipboardList, href: "/assessments" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { id: "business-plan", label: "Business Plan", icon: Briefcase, href: "/business-plan" },
  { id: "marketing-plan", label: "Marketing Plan", icon: Megaphone, href: "/marketing-plan" },
  { id: "sales", label: "Sales", icon: TrendingUp, href: "/sales" },
  { id: "finance", label: "Finance", icon: DollarSign, href: "/finance" },
  { id: "operations", label: "Operations", icon: Settings, href: "/operations" },
  { id: "reviews", label: "Reviews", icon: Star, href: "/reviews" },
  { id: "ai-guide", label: "AI Guide", icon: Sparkles, href: "/ai-guide" },
  { id: "settings", label: "Settings", icon: Settings2, href: "/settings" },
];

// Help section navigation items
const helpItems = [
  { id: "contact-support", label: "Contact Support", icon: LifeBuoy, href: "/help/contact" },
  { id: "overall-health", label: "Overall Business Health", icon: HeartPulse, href: "/help/overall-health" },
  { id: "12-domain", label: "12-Domain Business Alignment", icon: Target, href: "/help/12-domain-alignment" },
  { id: "ai-guide-help", label: "AI Business Guide", icon: Bot, href: "/help/ai-guide" },
  { id: "next-3-moves", label: "Next 3 Moves", icon: ListChecks, href: "/help/next-3-moves" },
  { id: "domain-scores", label: "Domain Scores", icon: Activity, href: "/help/domain-scores" },
  { id: "health-trend", label: "Business Health Trend", icon: TrendingUp, href: "/help/health-trend" },
  { id: "operating-rhythm", label: "Operating Rhythm", icon: Timer, href: "/help/operating-rhythm" },
  { id: "milestones", label: "Milestones & Momentum", icon: Flag, href: "/help/milestones" },
  { id: "revenue", label: "Revenue Snapshot", icon: Wallet, href: "/help/revenue" },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({ activeItem = "overview", onNavigate }: SidebarProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);

  // SSR fallback - render a simplified version without theme-dependent classes
  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#F6F1E8] border-r border-[#D4AF63]/20 flex flex-col z-50">
        <div className="p-6 border-b border-[#D4AF63]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F315B] flex items-center justify-center">
              <span className="text-[#D4AF63] font-bold">LC</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#1F315B]">
                LifeCharter
              </h1>
              <p className="text-xs text-[#5E3B6C]">Architecture</p>
            </div>
          </div>
        </div>
        <div className="flex-1 py-4 px-3">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <div key={item.id} className="h-10 bg-[#1F315B]/5 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[#D4AF63]/20">
          <div className="h-16 bg-[#1F315B]/5 rounded-xl" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#F6F1E8] dark:bg-[#1A1A2E] border-r border-[#D4AF63]/20 flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-[#D4AF63]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1F315B] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-[#D4AF63]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20" />
              <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              LifeCharter
            </h1>
            <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
              Architecture
            </p>
          </div>
        </div>
        {/* Decorative butterfly */}
        <div className="absolute top-4 right-4 opacity-20">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-[#5E3B6C] dark:text-[#CDBED6]"
            fill="currentColor"
          >
            <path d="M12 2C12 2 11 4 11 6C11 8 12 10 12 10C12 10 13 8 13 6C13 4 12 2 12 2Z" />
            <path d="M8 6C8 6 4 4 2 8C0 12 4 16 8 14C8 14 6 10 8 6Z" />
            <path d="M16 6C16 6 20 4 22 8C24 12 20 16 16 14C16 14 18 10 16 6Z" />
            <path d="M12 10C12 10 8 14 8 18C8 22 12 22 12 22C12 22 16 22 16 18C16 14 12 10 12 10Z" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const content = (
              <>
                <Icon className="w-5 h-5" />
                {item.label}
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#1F315B] text-[#F6F1E8] shadow-md"
                        : "text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    onClick={() => onNavigate?.(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#1F315B] text-[#F6F1E8] shadow-md"
                        : "text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10"
                    )}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-[#D4AF63]/20">
          <button
            onClick={() => setHelpExpanded(!helpExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              helpExpanded
                ? "bg-[#D4AF63]/20 text-[#1F315B] dark:text-[#F6F1E8]"
                : "text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10"
            )}
          >
            <span className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5" />
              Help
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                helpExpanded && "rotate-180"
              )}
            />
          </button>

          {/* Help Dropdown Items */}
          {helpExpanded && (
            <ul className="mt-2 ml-4 space-y-1 border-l-2 border-[#D4AF63]/30 pl-3">
              {helpItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        isActive
                          ? "bg-[#1F315B] text-[#F6F1E8] shadow-md"
                          : "text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>

      {/* User Profile & Theme Toggle */}
      <div className="p-4 border-t border-[#D4AF63]/20 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/5 dark:hover:bg-[#CDBED6]/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === "light" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {theme === "light" ? "Light Mode" : "Dark Mode"}
          </span>
          <span className="text-xs text-[#B9A9A9]">
            {theme === "light" ? "☀️" : "🌙"}
          </span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5 hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#5E3B6C] flex items-center justify-center text-[#F6F1E8] font-serif font-bold">
              SR
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                Seraphina Rose
              </p>
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                Founder & CEO
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#B9A9A9]" />
          </button>

          {/* Workspace Selector */}
          <div className="mt-2 px-4 py-2 text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
            <span className="text-[#B9A9A9]">Workspace:</span> Soulful Solutions Co.
          </div>
        </div>
      </div>
    </aside>
  );
}
