"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  title?: string;
  workspace?: string;
  notificationCount?: number;
}

export function Header({
  title = "Dashboard",
  workspace = "Soulful Solutions Co.",
  notificationCount = 3,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { mounted } = useTheme();

  // SSR fallback - simplified version
  if (!mounted) {
    return (
      <header className="h-16 bg-card border-b border-[#D4AF63]/20 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-xl font-bold text-[#1F315B]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1F315B]/5" />
          <div className="w-9 h-9 rounded-full bg-[#1F315B]/5" />
          <div className="w-9 h-9 rounded-full bg-[#1F315B]/5" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-card border-b border-[#D4AF63]/20 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
          {title}
        </h1>
        <Sparkles className="w-4 h-4 text-[#D4AF63]" />
      </div>

      {/* Center: Workspace Selector */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs text-[#B9A9A9] uppercase tracking-wider">
          Workspace
        </span>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/20 transition-colors">
          <span className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
            {workspace}
          </span>
          <ChevronDown className="w-4 h-4 text-[#B9A9A9]" />
        </button>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className={cn(
            "relative hidden sm:block transition-all duration-200",
            searchFocused ? "w-72" : "w-56"
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9A9A9]" />
          <input
            type="text"
            placeholder="Search LifeCharter..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-full text-sm",
              "bg-[#1F315B]/5 dark:bg-[#CDBED6]/10",
              "border border-transparent focus:border-[#D4AF63]/50",
              "text-[#1F315B] dark:text-[#F6F1E8] placeholder:text-[#B9A9A9]",
              "focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/20",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Add Button */}
        <button className="w-9 h-9 rounded-full bg-[#1F315B] text-[#F6F1E8] flex items-center justify-center hover:bg-[#1F315B]/90 transition-colors shadow-md">
          <Plus className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-full bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 flex items-center justify-center hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/20 transition-colors">
          <Bell className="w-5 h-5 text-[#1F315B] dark:text-[#CDBED6]" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4AF63] text-[#1F315B] text-xs font-bold flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Help */}
        <button className="w-9 h-9 rounded-full bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 flex items-center justify-center hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/20 transition-colors">
          <HelpCircle className="w-5 h-5 text-[#1F315B] dark:text-[#CDBED6]" />
        </button>

        {/* Decorative Compass */}
        <div className="hidden lg:flex w-9 h-9 rounded-full border border-[#D4AF63]/30 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-[#D4AF63]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v20M2 12h20" />
            <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
          </svg>
        </div>
      </div>
    </header>
  );
}
