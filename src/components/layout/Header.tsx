"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  HelpCircle,
  LifeBuoy,
  Sparkles,
} from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import { FeedbackButton } from "./FeedbackButton";
import { QuickAddMenu } from "./QuickAddMenu";
import { BusinessSwitcher } from "./BusinessSwitcher";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  workspace?: string;
}

// Page title per route, mirroring the sidebar's own nav labels — kept here
// rather than passed as a prop by every page, so wiring this header into
// the shared AppLayout doesn't require touching every route.
const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/morning-brief": "Morning Brief",
  "/daily-compass": "Daily Compass",
  "/assessments": "Alignment Profile",
  "/business-plan": "Business Plan",
  "/marketing-plan": "Marketing Plan",
  "/marketing-plan/social-planner": "Social Planner",
  "/daily-compass/calendar": "Content Calendar",
  "/sales": "Sales",
  "/sales/offers": "Offers & Packages",
  "/sales/pipeline": "Pipeline",
  "/finance": "Finance",
  "/planning": "Planning Hub",
  "/planning/forecast": "Forecasting",
  "/operations": "Operations",
  "/reviews": "Testimonials",
  "/settings": "Settings",
};

function titleForPath(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "Dashboard";
}

export function Header({
  title,
  workspace: workspaceProp,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  // The signed-in account's own workspace name — never a fixed one.
  const [workspaceName, setWorkspaceName] = useState("");
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWorkspaceName(((d?.workspaceName as string) || "").trim()))
      .catch(() => {});
  }, []);
  const workspace = workspaceProp ?? workspaceName;
  const { mounted } = useTheme();
  const pathname = usePathname();
  const resolvedTitle = title ?? titleForPath(pathname);

  // SSR fallback - simplified version
  if (!mounted) {
    return (
      <header className="h-16 bg-card border-b border-[#c9a227]/20 flex items-center justify-between pl-14 pr-6 lg:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-xl font-bold text-[#1a2b4a]">
            {resolvedTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a2b4a]/5" />
          <div className="w-9 h-9 rounded-full bg-[#1a2b4a]/5" />
          <div className="w-9 h-9 rounded-full bg-[#1a2b4a]/5" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-card border-b border-[#c9a227]/20 flex items-center justify-between pl-14 pr-6 lg:px-6 sticky top-0 z-40">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          {resolvedTitle}
        </h1>
        <Sparkles className="w-4 h-4 text-[#c9a227]" />
      </div>

      {/* Center: business switcher (or the account name when there's only one business) */}
      <BusinessSwitcher workspace={workspace} />

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className={cn(
            "relative hidden sm:block transition-all duration-200",
            searchFocused ? "w-72" : "w-56"
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8a898]" />
          <input
            type="text"
            placeholder="Search LifeCharter..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full pl-10 pr-4 py-2 rounded-full text-sm",
              "bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10",
              "border border-transparent focus:border-[#c9a227]/50",
              "text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#b8a898]",
              "focus:outline-none focus:ring-2 focus:ring-[#c9a227]/20",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Quick add menu */}
        <QuickAddMenu />

        {/* Glitch / suggestion / feedback */}
        <FeedbackButton />

        {/* Notifications — live feed */}
        <NotificationsBell />

        {/* Help — opens the comprehensive Q&A knowledge base */}
        <Link
          href="/help/qa"
          aria-label="Help and Q&A"
          className="w-9 h-9 rounded-full bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 flex items-center justify-center hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/20 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-[#1a2b4a] dark:text-[#e8e4f0]" />
        </Link>

        {/* Contact Support: tickets, updates and fixes, suggestions */}
        <Link
          href="/help/contact"
          aria-label="Contact Support"
          title="Contact Support"
          className="w-9 h-9 rounded-full bg-[#c9a227]/15 dark:bg-[#c9a227]/20 flex items-center justify-center hover:bg-[#c9a227]/25 dark:hover:bg-[#c9a227]/30 transition-colors"
        >
          <LifeBuoy className="w-5 h-5 text-[#c9a227]" />
        </Link>

      </div>
    </header>
  );
}
