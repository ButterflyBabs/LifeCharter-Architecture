"use client";

import { useState, createContext, useContext, ReactNode, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  ClipboardList,
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
  ChevronLeft,
  ChevronRight,
  Menu,
  HelpCircle,
  ChevronDown,
  LifeBuoy,
  HeartPulse,
  Target,
  Bot,
  ListChecks,
  Activity,
  Timer,
  Flag,
  Wallet,
  Boxes,
  BarChart3,
} from "lucide-react";

// Navigation grouped into labeled sections, matching the Executive
// Dashboard's sidebar pattern (colored section dot + uppercase label) —
// same shape as that app's DAILY OPERATIONS / STRATEGIC PLANNING groups,
// built from this app's own eleven pages rather than copying its content.
const navigationSections = [
  {
    title: "DAILY OPERATIONS",
    color: "text-[#c9a227]",
    items: [
      { id: "executive-home", label: "Executive Home", icon: LayoutDashboard, href: "/" },
      { id: "daily-compass", label: "Daily Compass", icon: Compass, href: "/daily-compass" },
    ],
  },
  {
    title: "STRATEGIC PLANNING",
    color: "text-[#4a9b9b]",
    items: [
      { id: "business-plan", label: "Business Plan", icon: Briefcase, href: "/business-plan" },
      { id: "marketing-plan", label: "Marketing Plan", icon: Megaphone, href: "/marketing-plan" },
      { id: "sales", label: "Sales", icon: TrendingUp, href: "/sales" },
      { id: "finance", label: "Finance", icon: DollarSign, href: "/finance" },
    ],
  },
  {
    title: "ALIGNMENT",
    color: "text-[#7b6b8d]",
    items: [
      { id: "business-alignment", label: "Business Alignment", icon: BarChart3, href: "/business-alignment" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/progress" },
      { id: "segments", label: "Business Segments", icon: Boxes, href: "/segments" },
      { id: "alignment-profile", label: "Alignment Profile", icon: ClipboardList, href: "/assessments" },
      { id: "reviews", label: "Reviews", icon: Star, href: "/reviews" },
    ],
  },
  {
    title: "SYSTEMS",
    color: "text-[#b8a898]",
    items: [
      { id: "command-center", label: "Command Center", icon: Activity, href: "/command-center" },
      { id: "operations", label: "Operations", icon: Settings, href: "/operations" },
      { id: "ai-guide", label: "AI Guide", icon: Sparkles, href: "/ai-guide" },
      { id: "settings", label: "Settings", icon: Settings2, href: "/settings" },
    ],
  },
];

const navigationItems = navigationSections.flatMap((s) => s.items);

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

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

interface CollapsibleSidebarProps {
  children: ReactNode;
}

export function CollapsibleSidebarProvider({ children }: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Tooltip component that renders outside the scrollable container
function NavTooltip({
  label,
  isVisible,
  targetRef,
}: {
  label: string;
  isVisible: boolean;
  targetRef: React.RefObject<HTMLAnchorElement | null>;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetRef.current && isVisible) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed px-3 py-1.5 bg-[#1a2b4a] text-[#F8F5F0] text-sm font-medium rounded-lg whitespace-nowrap shadow-lg z-[9999] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateY(-50%)",
      }}
    >
      {label}
      {/* Arrow */}
      <div
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderRight: "6px solid #1a2b4a",
        }}
      />
    </div>
  );
}

// Navigation item with tooltip — left-border accent on the active item
// (rather than a filled pill), matching the Executive Dashboard's
// dark-sidebar nav treatment.
function NavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: typeof navigationItems[0];
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const Icon = item.icon;

  return (
    <>
      <Link
        ref={linkRef}
        href={item.href}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-l-2",
          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2.5",
          isActive
            ? "bg-white/10 text-[#c9a227] border-[#c9a227]"
            : "text-white/50 hover:bg-white/5 hover:text-white border-transparent"
        )}
      >
        <Icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
        {!isCollapsed && <span className="tracking-wide">{item.label}</span>}
      </Link>

      {/* Tooltip rendered via portal-like fixed positioning */}
      {isCollapsed && (
        <NavTooltip
          label={item.label}
          isVisible={isHovered}
          targetRef={linkRef}
        />
      )}
    </>
  );
}

export function CollapsibleSidebar() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [helpExpanded, setHelpExpanded] = useState(false);

  // Get active item based on current path
  const getActiveItem = () => {
    const item = navigationItems.find((item) => item.href !== "/" && pathname?.startsWith(item.href));
    if (item) return item.id;
    if (pathname === "/") return "dashboard";
    return "dashboard";
  };

  const activeItem = getActiveItem();
  const isHelpActive = pathname?.startsWith("/help");

  // SSR fallback
  if (!mounted) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="p-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center">
            <span className="text-[#1a2b4a] font-bold text-sm">LC</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 transition-all duration-300 ease-in-out shadow-xl",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Area & Toggle */}
      <div
        className={cn(
          "border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a2b4a] z-10",
          isCollapsed ? "p-2" : "p-4"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#c9a227] bg-[#1a2b4a] flex items-center justify-center flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-[#c9a227]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" />
                <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
              </svg>
            </div>
            <div className="overflow-hidden">
              <h1 className="font-serif text-lg font-medium tracking-wide whitespace-nowrap text-white">
                LifeCharter
              </h1>
              <p className="text-[10px] text-white/40 tracking-[0.15em] uppercase whitespace-nowrap">
                Architecture
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-full border-2 border-[#c9a227] bg-[#1a2b4a] flex items-center justify-center mx-auto">
            <span className="text-[#c9a227] font-bold text-sm">LC</span>
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "py-4 px-2" : "py-4 px-3")}>
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? (isCollapsed ? "mt-6" : "mt-8") : ""}>
            {/* Section Header */}
            {!isCollapsed ? (
              <div className="px-4 mb-3 flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
                <h3
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap opacity-80",
                    section.color
                  )}
                >
                  {section.title}
                </h3>
              </div>
            ) : (
              <div className="px-2 mb-3 flex justify-center">
                <div className={cn("w-1.5 h-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
              </div>
            )}

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem key={item.id} item={item} isActive={activeItem === item.id} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        ))}

        {/* Help Section */}
        {!isCollapsed && (
          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              onClick={() => setHelpExpanded(!helpExpanded)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                helpExpanded || isHelpActive
                  ? "bg-white/10 text-[#c9a227]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4" />
                Help
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", helpExpanded && "rotate-180")} />
            </button>

            {/* Help Dropdown Items */}
            {helpExpanded && (
              <ul className="mt-2 ml-4 space-y-1 border-l-2 border-white/10 pl-3">
                {helpItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isActive ? "bg-white/10 text-[#c9a227]" : "text-white/50 hover:bg-white/5 hover:text-white"
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
        )}

        {/* Collapsed Help Icon */}
        {isCollapsed && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              href="/help/12-domain-alignment"
              className={cn(
                "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                isHelpActive ? "bg-white/10 text-[#c9a227]" : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile & Theme Toggle */}
      <div className={cn("border-t border-white/10 space-y-2", isCollapsed ? "p-2" : "p-4")}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors",
            isCollapsed ? "justify-center w-full p-2" : "justify-between w-full px-4 py-2.5"
          )}
          title={isCollapsed ? (theme === "light" ? "Light Mode" : "Dark Mode") : undefined}
        >
          <span className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
            {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!isCollapsed && (theme === "light" ? "Light Mode" : "Dark Mode")}
          </span>
        </button>

        {/* User Profile */}
        <div
          className={cn("rounded-xl bg-white/5 border border-white/10", isCollapsed ? "p-2 flex justify-center" : "px-3 py-3")}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a227] to-[#a88b1e] flex items-center justify-center text-[#1a2b4a] font-serif font-bold text-sm flex-shrink-0">
              SR
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">AmiLynne Carroll</p>
                <p className="text-xs text-white/40 truncate">Founder &amp; CEO</p>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Selector - only when expanded */}
        {!isCollapsed && (
          <div className="px-4 py-1 text-xs text-white/40">
            <span className="text-white/30">Workspace:</span> Sacred Kaleidoscope
          </div>
        )}
      </div>
    </aside>
  );
}

// Mobile sidebar toggle button
export function MobileSidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1a2b4a] text-[#F8F5F0] shadow-lg"
      aria-label="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
