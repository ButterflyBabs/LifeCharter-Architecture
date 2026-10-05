"use client";

import { useState, createContext, useContext, ReactNode, useRef, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { featureForPage, type FeatureMap } from "@/lib/teamRoles";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { STARTER_GUIDE_URL } from "@/lib/starterGuide";
import {
  LayoutDashboard,
  FileText,
  Mail,
  Handshake,
  PhoneCall,
  HeartHandshake,
  MessagesSquare,
  Presentation,
  MonitorPlay,
  MailCheck,
  CalendarDays,
  Package,
  KanbanSquare,
  Globe,
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
  X,
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
  LineChart,
  Rocket,
  LogOut,
  Users,
  ClipboardCheck,
  Mountain,
  BookOpen,
  Scale,
  Sprout,
  GraduationCap,
  Inbox,
  Smartphone,
  MessageCircle,
  GripVertical,
  Link2,
} from "lucide-react";

// Navigation grouped into labeled sections, matching the Executive
// Dashboard's sidebar pattern (colored section dot + uppercase label) —
// same shape as that app's DAILY OPERATIONS / STRATEGIC PLANNING groups,
// built from this app's own eleven pages rather than copying its content.
const navigationSections = [
  // Today's rhythm: where the day starts and runs.
  {
    title: "DAILY OPERATIONS",
    color: "text-[#c9a227]",
    items: [
      { id: "executive-home", label: "Executive Home", icon: LayoutDashboard, href: "/" },
      { id: "daily-compass", label: "Daily Compass", icon: Compass, href: "/daily-compass" },
      { id: "content-calendar", label: "Content Calendar", icon: CalendarDays, href: "/daily-compass/calendar" },
      { id: "tasks", label: "Tasks", icon: ListChecks, href: "/tasks" },
      { id: "accountability", label: "Accountability Partner", icon: HeartHandshake, href: "/accountability" },
      { id: "capture", label: "Quick Capture", icon: Smartphone, href: "/capture" },
      { id: "community", label: "The Collective", icon: Users, href: "/community" },
    ],
  },
  // The CRM: every account, each seeing only its own people, deals, calendars and emails.
  {
    title: "CLIENTS & SALES",
    color: "text-[#2E7C83]",
    items: [
      { id: "contacts", label: "Contacts", icon: Users, href: "/contacts" },
      { id: "pipeline", label: "Pipeline", icon: KanbanSquare, href: "/sales/pipeline" },
      { id: "dm-pipeline", label: "Outreach Pipelines", icon: MessagesSquare, href: "/dm-pipeline" },
      { id: "calendars", label: "Calendars", icon: CalendarDays, href: "/calendars" },
      { id: "sequences-manager", label: "Campaigns & Broadcasts", icon: Mail, href: "/sequences-manager" },
      { id: "invites", label: "Invite Tracker", icon: MailCheck, href: "/invites" },
      { id: "affiliates", label: "Affiliates", icon: Handshake, href: "/affiliates" },
      { id: "short-links", label: "Short Links", icon: Link2, href: "/short-links" },
    ],
  },
  // Your weekly rhythm and the money.
  {
    title: "PLANNING & NUMBERS",
    color: "text-[#4a9b9b]",
    items: [
      { id: "review", label: "Weekly Review", icon: ClipboardCheck, href: "/planning/review" },
      { id: "finance", label: "Finance", icon: DollarSign, href: "/finance" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/progress" },
    ],
  },
  // What you sell and how you're seen.
  {
    title: "GROWTH",
    color: "text-[#c9855e]",
    items: [
      { id: "offers", label: "Offers & Packages", icon: Package, href: "/sales/offers" },
      { id: "reviews", label: "Testimonials", icon: Star, href: "/reviews" },
      { id: "website-review", label: "Website Review", icon: Globe, href: "/website-review" },
    ],
  },
  // The big picture, the four plans and how the business runs, all in one place.
  {
    title: "ALIGNMENT & SYSTEMS",
    color: "text-[#7b6b8d]",
    items: [
      { id: "business-alignment", label: "Business Alignment", icon: BarChart3, href: "/business-alignment" },
      { id: "alignment-profile", label: "Alignment Profile", icon: ClipboardList, href: "/assessments" },
      { id: "business-plan", label: "Business Plan", icon: Briefcase, href: "/business-plan" },
      { id: "marketing-plan", label: "Marketing Plan", icon: Megaphone, href: "/marketing-plan" },
      { id: "sales", label: "Sales Plan", icon: TrendingUp, href: "/sales" },
      { id: "forecasting", label: "Forecasting", icon: LineChart, href: "/planning/forecast" },
      { id: "goals", label: "Goal Ladder", icon: Mountain, href: "/planning/goals" },
      { id: "planning", label: "Planning Hub", icon: Target, href: "/planning" },
      { id: "segments", label: "Business Segments", icon: Boxes, href: "/segments" },
      { id: "operations", label: "Operations", icon: Settings, href: "/operations" },
      { id: "sops", label: "Playbook & SOPs", icon: BookOpen, href: "/operations/sops" },
      { id: "compliance", label: "Legal & Compliance", icon: Scale, href: "/compliance" },
    ],
  },
  {
    title: "SETTINGS",
    color: "text-[#b8a898]",
    items: [
      { id: "ai-guide", label: "AI Assistant", icon: Sparkles, href: "/settings?tab=ai" },
      { id: "settings", label: "Settings", icon: Settings2, href: "/settings" },
    ],
  },
  {
    title: "GETTING STARTED",
    color: "text-[#8fb58a]",
    items: [
      { id: "setup", label: "Set up Suite", icon: Rocket, href: "/setup" },
      { id: "first30", label: "First 30 Days", icon: Sprout, href: "/first-30-days" },
      { id: "starter-guide", label: "Starter Guide", icon: BookOpen, href: STARTER_GUIDE_URL },
    ],
  },
];

// Alignment Architect pages: Babs only (her email, hard-wired). Shown only when /api/me says
// so; the pages and their APIs enforce the same check on the server.
const ownerSection = {
  title: "ALIGNMENT ARCHITECT",
  color: "text-[#c9a227]",
  items: [
    { id: "master-punch-list", label: "Master Punch List", icon: ClipboardList, href: "https://claude.ai/artifact/63hHW1x177qZcxYjNhCn3H" },
    { id: "sneak-peek-run-of-show", label: "Sneak Peek Run of Show", icon: Presentation, href: "https://claude.ai/artifact/HpJ3wVr8gua2gskrupNrz9" },
    { id: "lifecharter-lesson-studio", label: "LifeCharter Lesson Studio", icon: BookOpen, href: "https://claude.ai/artifact/4M3MyiwRX5T4dAQsG39RhW" },
    { id: "demo-account", label: "Demo Account (turns demo on)", icon: MonitorPlay, href: "https://lccommandsuite.com/demo" },
    { id: "lifecharter-app", label: "LifeCharter App", icon: Sprout, href: "https://lifecharter.life/app" },
    { id: "team-briefing-90-day", label: "Team Briefing: 90-Day Strategy", icon: BookOpen, href: "https://claude.ai/artifact/1XzBT3JuQCRy6b8KEx3F4x" },
    { id: "lc-spark", label: "LC Spark", icon: MessageCircle, href: "/lc-spark" },
    { id: "event-emails", label: "Event Emails", icon: Mail, href: "/event-emails" },
    { id: "support-desk", label: "Support Desk", icon: Inbox, href: "/support-desk" },
    { id: "command-center", label: "Command Center", icon: Activity, href: "/command-center" },
    { id: "website-reviews", label: "Website Reviews", icon: Globe, href: "/website-reviews" },
    { id: "planner-sales", label: "Planner Sales", icon: Wallet, href: "/planner-sales" },
    { id: "accountability-coach", label: "Accountability Partners", icon: HeartHandshake, href: "/accountability-coach" },
    { id: "masterclass-results", label: "MasterClass Results", icon: BarChart3, href: "/masterclass-results" },
    { id: "challenge-participants", label: "Command Shift Participants", icon: Activity, href: "/challenge-participants" },
    { id: "pre-founder-call", label: "Pre-Founder Call", icon: PhoneCall, href: "/pre-founder-call" },
    { id: "sales-reference", label: "Sales Reference", icon: DollarSign, href: "/sales-reference" },
    { id: "lessons-manager", label: "Lessons", icon: GraduationCap, href: "/lessons-manager" },
  ],
};

// DEMO ACCOUNT ONLY (lc_demo cookie). The pages in the order the guided tour
// shows them, as one section at the top, so presenting is "click the next one
// down". Everything not on the tour keeps its usual section underneath. No real
// account ever gets this order.
const DEMO_TOUR_ORDER = [
  "setup", "first30", "alignment-profile", // Act 2: where every client starts
  "executive-home", "demo-morning-brief", "daily-compass", "tasks", "accountability", // Act 3: running your day
  "business-alignment", "progress", // Act 4: the whole business
  "goals", "review", "finance", "forecasting", // Act 5: plans and numbers
  "pipeline", "offers", "dm-pipeline", "contacts", "calendars", "sequences-manager", // Act 6: growing
  "sops", "compliance", // Act 7: systems
  "demo-coaching-calls", "demo-collective-events", // Act 8: Executive Coaching
];
const demoOnlyItems = [
  { id: "demo-morning-brief", label: "Morning Brief", icon: Sparkles, href: "/morning-brief" },
  { id: "demo-coaching-calls", label: "Coaching Calls (Home)", icon: LayoutDashboard, href: "/" },
  { id: "demo-collective-events", label: "Collective Events", icon: CalendarDays, href: "/community/events" },
];
function demoTourSections() {
  const all = new Map([...navigationSections.flatMap((s) => s.items), ...demoOnlyItems].map((i) => [i.id, i]));
  const tour = DEMO_TOUR_ORDER.map((id) => all.get(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const onTour = new Set(tour.map((i) => i.id));
  return [
    { title: "DEMO TOUR", color: "text-[#c9a227]", items: tour },
    ...navigationSections.map((s) => ({ ...s, items: s.items.filter((i) => !onTour.has(i.id)) })).filter((s) => s.items.length > 0),
  ];
}

const navigationItems = [...navigationSections, ownerSection, { items: demoOnlyItems }].flatMap((s) => s.items);

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
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  isMobileOpen: false,
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// Below Tailwind's `lg` breakpoint (1024px) the sidebar becomes an off-canvas
// drawer instead of a permanent column — without this, a 375px phone had the
// full-width fixed sidebar (or its w-16 collapsed rail) permanently covering
// the page with no way to dismiss it, since MobileSidebarToggle existed but
// was never rendered anywhere.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface CollapsibleSidebarProps {
  children: ReactNode;
}

export function CollapsibleSidebarProvider({ children }: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // The sidebar remembers how you left it. With no choice made yet it starts as the
  // slim icon rail on windows narrower than 1280px, so the page keeps enough room
  // for its cards instead of squeezing them beside a full-width menu.
  // Applied before the first paint, with animations off, so the page doesn't
  // visibly slide from the wide menu to the rail as it loads.
  const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("no-anim");
    try {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved === "1" || saved === "0") setIsCollapsed(saved === "1");
      else setIsCollapsed(window.innerWidth < 1280);
    } catch {
      setIsCollapsed(window.innerWidth < 1280);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("no-anim")));
  }, []);
  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
    } catch {
      /* not remembered */
    }
  };
  const toggleMobileSidebar = () => setIsMobileOpen((v) => !v);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  // Close the mobile drawer on navigation so it doesn't stay open over the
  // next page.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar, closeMobileSidebar }}
    >
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
        {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer", prefetch: false } : {})}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // A link can be dragged by the browser on its own, which fights the menu's own drag-and-drop and makes a
        // page look as if it will not move (or opens it instead). The menu handles the dragging itself.
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 select-none",
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

// Drag-and-drop wrapper around NavItem (expanded sidebar only — the icon rail
// has no room for a grip handle). The row itself is the drag surface (press
// and hold on touch); the grip button is there so reordering works from the
// keyboard too (Tab to it, Space to pick up, arrow keys to move).
function SortableNavRow({ item, isActive }: { item: typeof navigationItems[0]; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, unknown> & { onKeyDown?: React.KeyboardEventHandler };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 20 : undefined }}
      className="relative group"
      {...pointerListeners}
    >
      <NavItem item={item} isActive={isActive} isCollapsed={false} />
      <button
        type="button"
        {...attributes}
        onKeyDown={onKeyDown}
        aria-label={`Reorder ${item.label} (Space, then arrow keys)`}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/25 opacity-40 group-hover:opacity-100 focus-visible:opacity-100 hover:text-white/70 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// A whole menu section (Daily Operations, Clients & Sales...) that can be dragged to a new place by the
// grip beside its heading. The grip is a separate button so clicking the heading still folds the section.
function SortableSection({ id, title, className, withGrip, onMove, children }: { id: string; title: string; className: string; withGrip: boolean; onMove: (dir: -1 | 1) => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { onKeyDown: dndKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, unknown> & { onKeyDown?: React.KeyboardEventHandler };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, zIndex: isDragging ? 30 : undefined }}
      className={cn("relative group/section", className, isDragging && "rounded-lg bg-[#1a2b4a] shadow-lg")}
    >
      {withGrip && (
        <button
          type="button"
          {...attributes}
          {...pointerListeners}
          onKeyDown={(e) => {
            // Arrow keys move the section straight away (keyboard and screen reader friendly).
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              onMove(e.key === "ArrowUp" ? -1 : 1);
              return;
            }
            dndKeyDown?.(e);
          }}
          aria-label={`Move the ${title} section (arrow up or down)`}
          title="Drag to move this whole section"
          className="absolute left-[-6px] top-1.5 z-10 p-1 rounded-md text-white/25 opacity-0 group-hover/section:opacity-100 focus-visible:opacity-100 hover:text-white/80 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      {children}
    </div>
  );
}

export function CollapsibleSidebar() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { isCollapsed: isCollapsedDesktop, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const isMobile = useIsMobile();
  // The mobile drawer always shows full labels — only the desktop rail
  // collapses to icons-only.
  const isCollapsed = isMobile ? false : isCollapsedDesktop;
  const pathname = usePathname();
  const [helpExpanded, setHelpExpanded] = useState(false);

  // Each section (Daily Operations, Strategic Planning, Alignment, Systems) folds
  // up from its heading; the choice is remembered on this device. A folded
  // section still shows the page you're on so you never lose your place.
  const [foldedSections, setFoldedSections] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nav-folded-sections") || "{}");
      if (saved && typeof saved === "object") setFoldedSections(saved);
    } catch {
      /* keep everything open */
    }
  }, []);
  const toggleSection = (title: string) =>
    setFoldedSections((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem("nav-folded-sections", JSON.stringify(next));
      } catch {
        /* not remembered */
      }
      return next;
    });
  // The account block at the bottom (theme, profile, sign out) folds down to one
  // row so it doesn't crowd the menu; the choice is remembered on this device.
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    try {
      setAccountOpen(localStorage.getItem("nav-account-open") === "1");
    } catch {
      /* start folded */
    }
  }, []);
  const toggleAccount = () =>
    setAccountOpen((prev) => {
      try {
        localStorage.setItem("nav-account-open", prev ? "0" : "1");
      } catch {
        /* not remembered */
      }
      return !prev;
    });
  const [profile, setProfile] = useState<{ fullName: string; avatarUrl: string | null; workspaceName: string }>({
    fullName: "",
    avatarUrl: null,
    workspaceName: "",
  });

  const [superAdmin, setSuperAdmin] = useState(false);
  const [features, setFeatures] = useState<FeatureMap | null>(null);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSuperAdmin(d?.architect === true);
        setFeatures(d?.features ?? null);
      })
      .catch(() => {});
  }, []);
  // Demo mode (lc_demo cookie): used for live sales demos, where the very
  // first click of the script is Getting Started → Set up Suite — nobody
  // should have to scroll to the bottom of the menu to find it. Demo only;
  // every real account keeps the normal section order.
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    setIsDemo(document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1"));
  }, []);
  // A team member with feature limits only sees the areas they can open.
  const visible = (href: string) => {
    if (!features) return true;
    const key = featureForPage(href.split("?")[0]);
    return !key || (features[key] ?? "none") !== "none";
  };
  // The client's own pages (made by them or their AI assistant), in a section at the end of the menu.
  const [customPages, setCustomPages] = useState<{ slug: string; title: string; nav_section?: string }[]>([]);
  useEffect(() => {
    const load = () =>
      fetch("/api/custom-pages", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setCustomPages(Array.isArray(d?.pages) ? d.pages : []))
        .catch(() => {});
    load();
    window.addEventListener("custom-pages-changed", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("custom-pages-changed", load);
      window.removeEventListener("focus", load);
    };
  }, []);
  const pageItem = (p: { slug: string; title: string }) => ({ id: `page-${p.slug}`, label: p.title, icon: FileText, href: `/my-pages/${p.slug}` });
  const architectPages = customPages.filter((p) => p.nav_section === "alignment_architect").map(pageItem);
  const myPages = customPages.filter((p) => p.nav_section !== "alignment_architect").map(pageItem);
  const mySection = myPages.length ? [{ title: "MY PAGES", color: "text-[#c9a227]", items: myPages }] : [];
  const demoOrderedSections = isDemo ? demoTourSections() : navigationSections;
  // The Alignment Architect section never shows while presenting the demo.
  const sections = [...(superAdmin && !isDemo ? [...demoOrderedSections, { ...ownerSection, items: [...ownerSection.items, ...architectPages] }] : demoOrderedSections), ...mySection]
    .map((s) => ({ ...s, items: s.items.filter((i) => visible(i.href)) }))
    .filter((s) => s.items.length > 0);

  // Pages can be dragged into whatever order you use most, within each
  // section — remembered on this device. One saved list per section title;
  // a page not in the saved list (new, or just became visible to you) is
  // appended at the end rather than dropped.
  const [navOrder, setNavOrder] = useState<Record<string, string[]>>({});
  // The order of the sections themselves.
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  // The order is saved on the ACCOUNT (so it is the same on every device and for the account's team);
  // this device keeps a copy so the menu doesn't jump while the saved order loads.
  const [navLoaded, setNavLoaded] = useState(false);
  const skipSave = useRef(true);
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1")) {
      setNavLoaded(true);
      return;
    }
    fetch("/api/nav-order", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.has) {
          skipSave.current = true;
          setSectionOrder(Array.isArray(d.sectionOrder) ? d.sectionOrder : []);
          setNavOrder(d.itemOrder && typeof d.itemOrder === "object" ? d.itemOrder : {});
        } else {
          // Nothing saved on the account yet: if this device has an arrangement, keep it and save it to the account.
          try {
            const localItems = JSON.parse(localStorage.getItem("nav-item-order") || "{}");
            const localSections = JSON.parse(localStorage.getItem("nav-section-order") || "[]");
            if (Object.keys(localItems).length || localSections.length) skipSave.current = false;
          } catch {
            /* nothing to migrate */
          }
        }
      })
      .catch(() => {})
      .finally(() => setNavLoaded(true));
  }, []);
  useEffect(() => {
    if (!navLoaded) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1")) return;
    const t = setTimeout(() => {
      fetch("/api/nav-order", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionOrder, itemOrder: navOrder }) }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [sectionOrder, navOrder, navLoaded]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nav-section-order") || "[]");
      if (Array.isArray(saved)) setSectionOrder(saved.filter((t) => typeof t === "string"));
    } catch {
      /* keep the default order */
    }
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nav-item-order") || "{}");
      if (saved && typeof saved === "object") setNavOrder(saved);
    } catch {
      /* keep the default order */
    }
  }, []);
  // The demo keeps its tour order; every real account can arrange its own sections. A section that is
  // new, or not in the saved list, goes at the end.
  // Sections that were renamed keep the place the account had saved for them.
  const RENAMED: Record<string, string> = { ALIGNMENT: "ALIGNMENT & SYSTEMS", SYSTEMS: "SETTINGS" };
  const savedOrder = sectionOrder.map((t) => RENAMED[t] ?? t).filter((t, i, a) => a.indexOf(t) === i);
  const arranged = isDemo || !savedOrder.length
    ? sections
    : [...sections].sort((a, b) => {
        const ia = savedOrder.indexOf(a.title);
        const ib = savedOrder.indexOf(b.title);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  const orderedSections = arranged.map((s) => {
    const saved = navOrder[s.title];
    if (!saved) return s;
    const byId = new Map(s.items.map((i) => [i.id, i]));
    const known = saved.filter((id) => byId.has(id));
    const rest = s.items.filter((i) => !known.includes(i.id)).map((i) => i.id);
    return { ...s, items: [...known, ...rest].map((id) => byId.get(id)!).filter(Boolean) };
  });
  const navSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  // Pages only compete with pages, and sections with sections.
  // A page only ever competes with the other pages in ITS OWN section, so a drop near the top or bottom of a
  // section (the first and last pages, and the taller two-line ones) always lands on a neighbour in the same
  // section instead of on a page in the section next door, which used to be ignored.
  const navCollision: CollisionDetection = (args) => {
    const sectionDrag = String(args.active.id).startsWith("section:");
    if (sectionDrag) {
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => String(c.id).startsWith("section:")) });
    }
    const mine = new Set((orderedSections.find((sec) => sec.items.some((i) => i.id === args.active.id))?.items ?? []).map((i) => String(i.id)));
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => mine.has(String(c.id))) });
  };
  const resetMenuOrder = () => {
    skipSave.current = true;
    setSectionOrder([]);
    setNavOrder({});
    try {
      localStorage.removeItem("nav-item-order");
      localStorage.removeItem("nav-section-order");
    } catch {
      /* nothing to clear */
    }
    fetch("/api/nav-order", { method: "DELETE" }).catch(() => {});
  };
  const saveSectionOrder = (next: string[]) => {
    setSectionOrder(next);
    try {
      localStorage.setItem("nav-section-order", JSON.stringify(next));
    } catch {
      /* not remembered */
    }
  };
  const moveSection = (title: string, dir: -1 | 1) => {
    const titles = orderedSections.map((s) => s.title);
    const i = titles.indexOf(title);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= titles.length) return;
    saveSectionOrder(arrayMove(titles, i, j));
  };
  const handleNavDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (String(active.id).startsWith("section:")) {
      const titles = orderedSections.map((s) => s.title);
      const from = titles.indexOf(String(active.id).slice(8));
      const to = titles.indexOf(String(over.id).slice(8));
      if (from < 0 || to < 0) return;
      saveSectionOrder(arrayMove(titles, from, to));
      return;
    }
    // Reordering only ever happens within one section; ignore any attempt to
    // drop into a different one.
    const section = orderedSections.find((s) => s.items.some((i) => i.id === active.id));
    if (!section || !section.items.some((i) => i.id === over.id)) return;
    const ids = section.items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setNavOrder((prev) => {
      const merged = { ...prev, [section.title]: next };
      try {
        localStorage.setItem("nav-item-order", JSON.stringify(merged));
      } catch {
        /* not remembered */
      }
      return merged;
    });
  };

  // Load the profile name + headshot for the footer block.
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setProfile({ fullName: (d.fullName || "").trim(), avatarUrl: d.avatarUrl ?? null, workspaceName: (d.workspaceName || "").trim() });
      })
      .catch(() => {});
  }, []);

  const displayName = profile.fullName || "Your account";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "LC";

  // Get active item based on current path
  const getActiveItem = () => {
    // The most specific match wins (so /sales/pipeline lights Pipeline, not Sales Plan).
    const item = [...navigationItems, ...myPages, ...architectPages]
      .filter((i) => i.href !== "/" && !i.href.includes("?") && (pathname === i.href || pathname?.startsWith(i.href + "/")))
      .sort((a, b) => b.href.length - a.href.length)[0];
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
          "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 transition-all duration-300 w-56 -translate-x-full lg:translate-x-0",
          isCollapsedDesktop ? "lg:w-16" : "lg:w-56"
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
    <>
      {/* Backdrop — mobile only, dismisses the drawer on tap outside it */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 lg:z-50 transition-all duration-300 ease-in-out shadow-xl w-56",
          isMobileOpen && "z-[65]",
          isCollapsed ? "lg:w-16" : "lg:w-56",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
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
                Command Suite
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-full border-2 border-[#c9a227] bg-[#1a2b4a] flex items-center justify-center mx-auto">
            <span className="text-[#c9a227] font-bold text-sm">LC</span>
          </div>
        )}

        {/* Collapse/Expand Button — desktop rail only, meaningless on the mobile drawer */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "hidden lg:block p-1.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close Button — mobile drawer only */}
        <button
          onClick={closeMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors"
          title="Close menu"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "py-4 px-2" : "py-4 px-3")}>
        <DndContext sensors={navSensors} collisionDetection={navCollision} autoScroll={{ threshold: { x: 0, y: 0.08 }, acceleration: 4 }} onDragEnd={handleNavDragEnd}>
        <SortableContext items={orderedSections.map((x) => `section:${x.title}`)} strategy={verticalListSortingStrategy}>
        {orderedSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter((item) => isCollapsed || !foldedSections[section.title] || activeItem === item.id);
          return (
          <SortableSection key={section.title} id={`section:${section.title}`} title={section.title} withGrip={!isCollapsed} onMove={(d) => moveSection(section.title, d)} className={sectionIndex > 0 ? (isCollapsed ? "mt-6" : "mt-8") : ""}>
            {/* Section Header */}
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                aria-expanded={!foldedSections[section.title]}
                aria-label={`${foldedSections[section.title] ? "Expand" : "Collapse"} ${section.title}`}
                className="w-full px-4 mb-3 flex items-center gap-2 rounded-md hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a227] py-1"
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
                <h3
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap opacity-80",
                    section.color
                  )}
                >
                  {section.title}
                </h3>
                <ChevronDown
                  className={cn("ml-auto w-3.5 h-3.5 text-white/40 transition-transform duration-200", foldedSections[section.title] && "-rotate-90")}
                />
              </button>
            ) : (
              <div className="px-2 mb-3 flex justify-center">
                <div className={cn("w-1.5 h-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
              </div>
            )}

            {/* Section Items — draggable to reorder, expanded sidebar only */}
            <div className="space-y-1">
              {isCollapsed ? (
                visibleItems.map((item) => <NavItem key={item.id} item={item} isActive={activeItem === item.id} isCollapsed />)
              ) : (
                <SortableContext items={visibleItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {visibleItems.map((item) => (
                    <SortableNavRow key={item.id} item={item} isActive={activeItem === item.id} />
                  ))}
                </SortableContext>
              )}
            </div>
          </SortableSection>
          );
        })}
        </SortableContext>
        </DndContext>

        {!isCollapsed && !isDemo && (sectionOrder.length > 0 || Object.keys(navOrder).length > 0) && (
          <button type="button" onClick={resetMenuOrder} className="mt-6 w-full px-4 text-left text-[11px] text-white/40 hover:text-white/80 hover:underline" title="Put the menu back in the standard order">
            Reset menu order
          </button>
        )}

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

      {/* Account: one row (photo + name) that opens to theme, sign out and workspace */}
      <div className={cn("border-t border-white/10 space-y-2", isCollapsed ? "p-2" : "p-4")}>
        <button
          type="button"
          onClick={toggleAccount}
          aria-expanded={accountOpen}
          aria-controls="sidebar-account"
          title={isCollapsed ? displayName : undefined}
          className={cn(
            "w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left",
            isCollapsed ? "p-2 flex justify-center" : "px-3 py-3"
          )}
        >
          <span className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#c9a227] to-[#a88b1e] flex items-center justify-center text-[#1a2b4a] font-serif font-bold text-sm flex-shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-white truncate">{displayName}</span>
                  <span className="block text-xs text-white/40 truncate">Founder &amp; CEO</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform duration-200", accountOpen && "rotate-180")} aria-hidden />
              </>
            )}
          </span>
          <span className="sr-only">{accountOpen ? "Hide account options" : "Show account options"}</span>
        </button>

        {accountOpen && (
          <div id="sidebar-account" className="space-y-2">
            {/* Theme Toggle */}
            <button
              type="button"
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

            {/* Sign out */}
            <Link
              href="/logout"
              title="Sign out"
              className={cn(
                "flex items-center rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                isCollapsed ? "justify-center w-full p-2" : "gap-2 px-4 py-2.5"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="text-sm">Sign out</span>}
            </Link>

            {/* Workspace - only when expanded */}
            {!isCollapsed && profile.workspaceName && (
              <div className="px-4 py-1 text-xs text-white/40">
                <span className="text-white/30">Workspace:</span> {profile.workspaceName}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

// Mobile hamburger button — opens the off-canvas drawer. Hidden while the
// drawer is open since the drawer has its own close (X) button.
export function MobileSidebarToggle() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (isMobileOpen) return null;

  return (
    <button
      onClick={toggleMobileSidebar}
      className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-[#1a2b4a] text-[#F8F5F0] shadow-lg"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
