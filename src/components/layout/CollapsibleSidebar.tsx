"use client";

import { useState, createContext, useContext, ReactNode, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  Menu,
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
  targetRef 
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
      className="fixed px-3 py-1.5 bg-[#1F315B] text-[#F6F1E8] text-sm font-medium rounded-lg whitespace-nowrap shadow-lg z-[9999] pointer-events-none"
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
          borderRight: "6px solid #1F315B",
        }}
      />
    </div>
  );
}

// Navigation item with tooltip
function NavItem({ 
  item, 
  isActive, 
  isCollapsed 
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
          "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2.5",
          isActive
            ? "bg-[#1F315B] text-[#F6F1E8] shadow-md"
            : "text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10"
        )}
      >
        <Icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-5 h-5")} />
        {!isCollapsed && <span>{item.label}</span>}
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

  // Get active item based on current path
  const getActiveItem = () => {
    const item = navigationItems.find(item => pathname?.startsWith(item.href) && item.href !== "/");
    if (item) return item.id;
    if (pathname === "/") return "overview";
    return "overview";
  };

  const activeItem = getActiveItem();

  // SSR fallback
  if (!mounted) {
    return (
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-[#F6F1E8] border-r border-[#D4AF63]/20 flex flex-col z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b border-[#D4AF63]/20">
          <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center">
            <span className="text-[#D4AF63] font-bold text-sm">LC</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-[#F6F1E8] dark:bg-[#1A1A2E] border-r border-[#D4AF63]/20 flex flex-col z-50 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Area & Toggle */}
      <div className={cn(
        "border-b border-[#D4AF63]/20 flex items-center justify-between",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
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
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">Architecture</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-full bg-[#1F315B] flex items-center justify-center mx-auto">
            <span className="text-[#D4AF63] font-bold text-sm">LC</span>
          </div>
        )}
        
        {/* Collapse/Expand Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 rounded-lg text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10 transition-colors",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <NavItem
                item={item}
                isActive={activeItem === item.id}
                isCollapsed={isCollapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Theme Toggle */}
      <div className={cn(
        "border-t border-[#D4AF63]/20 space-y-2",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/5 dark:hover:bg-[#CDBED6]/5 transition-colors",
            isCollapsed ? "justify-center w-full p-2" : "justify-between w-full px-4 py-2.5"
          )}
          title={isCollapsed ? (theme === "light" ? "Light Mode" : "Dark Mode") : undefined}
        >
          <span className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
            {theme === "light" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {!isCollapsed && (theme === "light" ? "Light Mode" : "Dark Mode")}
          </span>
          {!isCollapsed && (
            <span className="text-xs text-[#B9A9A9]">
              {theme === "light" ? "☀️" : "🌙"}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className={cn(
          "rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5",
          isCollapsed ? "p-2 flex justify-center" : "px-4 py-3"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="w-10 h-10 rounded-full bg-[#5E3B6C] flex items-center justify-center text-[#F6F1E8] font-serif font-bold flex-shrink-0">
              SR
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] truncate">
                  Seraphina Rose
                </p>
                <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6] truncate">
                  Founder & CEO
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Selector - only when expanded */}
        {!isCollapsed && (
          <div className="px-4 py-2 text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
            <span className="text-[#B9A9A9]">Workspace:</span> Soulful Solutions Co.
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
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1F315B] text-[#F6F1E8] shadow-lg"
      aria-label="Toggle sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
