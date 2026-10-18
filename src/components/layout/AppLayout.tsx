"use client";

import AssistantPopout from "@/components/assistant/AssistantPopout";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CollapsibleSidebarProvider, CollapsibleSidebar, MobileSidebarToggle, useSidebar } from "./CollapsibleSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import TravelPartnerWidget from "@/components/travel-partner/TravelPartnerWidget";
import UpdateNotice from "@/components/layout/UpdateNotice";
import DemoBanner from "./DemoBanner";
import ViewAsBanner from "./ViewAsBanner";

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
  "/yr",
  "/go",
  "/reviews/collect",
  "/unsubscribe",
  "/f",
  "/book",
  "/a", // an affiliate's private dashboard
  "/partner", // an outside accountability partner's private page
  "/p", // a client or contractor's private project page
  "/e", // public event pages, challenge pages and replay links (task 1149)
  "/portal", // a client's private portal (task 1147) and the send-my-link page
  "/masterclass-signup", // public MasterClass signup
  "/investor-brief", // unlisted investor page: the brief with its PDFs
  "/dm-send", // a DM message in its own small window, opened from a pipeline card
  "/m", // a prospect's personal registration link (redirects)
  "/r", // affiliate links (redirect)
  "/login",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/auth",
  "/get-started",
  "/sales-reference",
  "/huddle", // the shared Team Huddle (own page, no app menu)
  "/schedule",
  "/legal",
  "/join",
  "/collective", // public landing page for The LifeCharter Collective
  "/community", // The LifeCharter Collective has its own shell
];

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();
  // Until all three assessments are finished the assistant stays closed (it could change the account).
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLocked(d?.assessmentsLocked === true))
      .catch(() => {});
  }, []);

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
        <ViewAsBanner />
        <Header />
        <div className="flex-1">{children}</div>
      </main>

      {/* Travel Partner: the one floating button (Ask the assistant, or Help & setup) */}
      <TravelPartnerWidget />
      <UpdateNotice />

      {/* The AI assistant, when popped out: floats over any page */}
      {!locked && <AssistantPopout />}
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  // Makes the Suite installable as a phone app (same service worker as the Collective).
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) navigator.serviceWorker.register("/community-sw.js").catch(() => {});
  }, []);
  // Tell the server this browser's time zone, so the assistant and every page read the same clock as the person using it.
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.split("; ").includes(`lc_tz=${encodeURIComponent(tz)}`)) {
        document.cookie = `lc_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {
      /* the account's own setting or UTC is used */
    }
  }, []);
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
