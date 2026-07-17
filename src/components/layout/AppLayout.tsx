"use client";

import { ReactNode } from "react";
import { CollapsibleSidebarProvider, CollapsibleSidebar, useSidebar } from "./CollapsibleSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1A1A2E]">
      {/* Sidebar */}
      <CollapsibleSidebar />

      {/* Main content area */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <CollapsibleSidebarProvider>
      <AppLayoutContent>
        {children}
      </AppLayoutContent>
    </CollapsibleSidebarProvider>
  );
}
