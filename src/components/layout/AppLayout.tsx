"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CollapsibleSidebarProvider, CollapsibleSidebar, MobileSidebarToggle, useSidebar } from "./CollapsibleSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import AIGuideWidget from "@/components/ai-guide/AIGuideWidget";
import DemoBanner from "./DemoBanner";

interface AppLayoutProps {
  children: ReactNode;
}

// Routes that render full-screen without the app chrome (sidebar/header/widgets).
// Includes every pre-auth / public-prospect page (mirrors middleware's
// PUBLIC_PAGES) other than /demo, which exists specifically to preview the
// dashboard chrome. Without this, a page like /get-started — a public
// self-serve checkout — rendered wrapped in the real internal app sidebar
// (Finance, Settings, Command Center, ...), which is both a confusing first
// impression for an anonymous prospect and, on mobile, was completely
// unusable before the sidebar got an off-canvas mobile state.
const BARE_ROUTES = [
  "/login",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/auth",
  "/get-started",
  "/sales-reference",
  "/schedule",
  "/legal",
  "/join",
  "/community", // The LifeCharter Collective has its own shell
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#1A1A2E]">
      {/* Sidebar */}
      <CollapsibleSidebar />
      <MobileSidebarToggle />

      {/* Main content area — no left margin on mobile, where the sidebar is
          an off-canvas drawer rather than a permanent column. */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <DemoBanner />
        <Header />
        <div className="flex-1">{children}</div>
      </main>

      {/* AI Guide Widget - appears on all pages */}
      <AIGuideWidget />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  // Login / logout render standalone (no sidebar, header, or widgets).
  if (pathname && BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return <>{children}</>;
  }
  return (
    <CollapsibleSidebarProvider>
      <AppLayoutContent>
        {children}
      </AppLayoutContent>
    </CollapsibleSidebarProvider>
  );
}
