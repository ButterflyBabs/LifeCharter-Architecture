"use client";

import { collectiveHref } from "@/lib/collective";
import { useState, createContext, useContext, ReactNode, useRef, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { customPageLevel, featureForPage, type AccessExtras, type FeatureMap } from "@/lib/teamRoles";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { STARTER_GUIDE_URL, WELCOME_OVERVIEW_PATH, WELCOME_OVERVIEW_URL } from "@/lib/starterGuide";
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
  Tags,
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
  Mic,
  MapPin,
  CalendarRange,
  Settings2,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Menu,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  LifeBuoy,
  HeartPulse,
  Target,
  Bot,
  ListChecks, BellRing,
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
  Feather,
  ClipboardCheck,
  Mountain,
  BookOpen,
  Video,
  Scale,
  Sprout,
  GraduationCap,
  Inbox,
  Smartphone,
  MessageCircle,
  GripVertical,
  FolderKanban,
  Link2,
  UserCheck,
  KeyRound,
  Eye,
  Receipt,
  UsersRound,
  Award,
  PanelsTopLeft,
  FileSignature,
} from "lucide-react";
import { QUALIFIER_OPEN_TO_ALL } from "@/lib/qualifier";
import { VOLANT_OPEN_TO_ALL } from "@/lib/volant";
import { PAYMENTS_OPEN_TO_ALL } from "@/lib/paymentsFlag";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";

// Navigation grouped into labeled sections, matching the Executive
// Dashboard's sidebar pattern (colored section dot + uppercase label) —
// same shape as that app's DAILY OPERATIONS / STRATEGIC PLANNING groups,
// built from this app's own eleven pages rather than copying its content.
const navigationSections = [
  // Today's rhythm: where the day starts and runs. Most-used first (left menu audit, approved by Babs 2026-10-18).
  {
    title: "DAILY OPERATIONS",
    color: "text-[#c9a227]",
    items: [
      { id: "executive-home", label: "Executive Home", icon: LayoutDashboard, href: "/" },
      { id: "daily-compass", label: "Daily Compass", icon: Compass, href: "/daily-compass" },
      { id: "tasks", label: "Tasks", icon: ListChecks, href: "/tasks" },
      { id: "reminders", label: "Reminders", icon: BellRing, href: "/reminders" },
      { id: "assistant-approvals", label: "Waiting for my approval", icon: ClipboardCheck, href: "/assistant-approvals" },
      { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
      { id: "time", label: "Time", icon: Timer, href: "/time" },
      { id: "volant", label: "LC Volant", icon: Feather, href: "/volant" },
      { id: "team-huddle", label: "Team Huddle", icon: Users, href: "/team-huddle" },
      { id: "accountability", label: "Accountability Partner", icon: HeartHandshake, href: "/accountability" },
      { id: "capture", label: "Quick Capture", icon: Smartphone, href: "/capture" },
      { id: "community", label: "The Collective", icon: Users, href: collectiveHref("/community") },
    ],
  },
  // Finding and closing clients: every account, each seeing only its own people, deals and calendars.
  {
    title: "CLIENTS & SALES",
    color: "text-[#2E7C83]",
    items: [
      { id: "contacts", label: "Contacts", icon: Users, href: "/contacts" },
      { id: "pipeline", label: "Pipeline", icon: KanbanSquare, href: "/sales/pipeline" },
      { id: "calendars", label: "Calendars", icon: CalendarDays, href: "/calendars" },
      { id: "dm-pipeline", label: "Outreach Pipelines", icon: MessagesSquare, href: "/dm-pipeline" },
      { id: "offers", label: "Offers & Packages", icon: Package, href: "/sales/offers" },
      { id: "agreements", label: "LC Plume", icon: FileSignature, href: "/agreements" },
      { id: "qualifier", label: "Prospect Qualifier", icon: UserCheck, href: "/qualifier" },
      { id: "tags", label: "Tag Library", icon: Tags, href: "/tags" },
      { id: "affiliates", label: "Affiliates", icon: Handshake, href: "/affiliates" },
    ],
  },
  // Reaching many people at once and bringing them in.
  {
    title: "MARKETING",
    color: "text-[#b5654a]",
    items: [
      { id: "content-calendar", label: "Content Calendar", icon: CalendarDays, href: "/daily-compass/calendar" },
      { id: "sequences-manager", label: "Campaigns & Broadcasts", icon: Mail, href: "/sequences-manager" },
      { id: "events", label: "Events", icon: Megaphone, href: "/events" },
      { id: "landing-pages", label: "Landing Pages", icon: PanelsTopLeft, href: "/landing-pages" },
      { id: "reviews", label: "Testimonials", icon: Star, href: "/reviews" },
      { id: "links-directory", label: "Links & Forms", icon: Link2, href: "/links-directory" },
      { id: "short-links", label: "Short Links", icon: Link2, href: "/short-links" },
      { id: "invites", label: "Invite Tracker", icon: MailCheck, href: "/invites" },
      { id: "meta-leads", label: "Meta Lead Ads", icon: BarChart3, href: "/meta-leads" },
    ],
  },
  // Serving clients after they buy.
  {
    title: "CLIENT DELIVERY",
    color: "text-[#5b8fb9]",
    items: [
      { id: "client-portals", label: "Client Portals", icon: UsersRound, href: "/client-portals" },
      { id: "programs", label: "Courses & Memberships", icon: GraduationCap, href: "/programs" },
      { id: "client-care", label: "Client Care", icon: HeartHandshake, href: "/client-care" },
    ],
  },
  // Money in and out.
  {
    title: "MONEY",
    color: "text-[#8fb58a]",
    items: [
      { id: "finance", label: "Finance", icon: DollarSign, href: "/finance" },
      { id: "payments", label: "Payments & Invoices", icon: Receipt, href: "/payments" },
    ],
  },
  // The big picture, the four plans and how the business runs, all in one place.
  {
    title: "ALIGNMENT & SYSTEMS",
    color: "text-[#7b6b8d]",
    items: [
      { id: "business-alignment", label: "Business Alignment", icon: BarChart3, href: "/business-alignment" },
      { id: "goals", label: "Goal Ladder", icon: Mountain, href: "/planning/goals" },
      { id: "review", label: "Weekly Review", icon: ClipboardCheck, href: "/planning/review" },
      { id: "progress", label: "Progress", icon: TrendingUp, href: "/progress" },
      { id: "planning", label: "Planning Hub", icon: Target, href: "/planning" },
      { id: "business-plan", label: "Business Plan", icon: Briefcase, href: "/business-plan" },
      { id: "marketing-plan", label: "Marketing Plan", icon: Megaphone, href: "/marketing-plan" },
      { id: "sales", label: "Sales Plan", icon: TrendingUp, href: "/sales" },
      { id: "forecasting", label: "Forecasting", icon: LineChart, href: "/planning/forecast" },
      { id: "sops", label: "Playbook & SOPs", icon: BookOpen, href: "/operations/sops" },
      { id: "operations", label: "Operations", icon: Settings, href: "/operations" },
      { id: "alignment-profile", label: "Alignment Profile", icon: ClipboardList, href: "/assessments" },
      { id: "compliance", label: "Legal & Compliance", icon: Scale, href: "/compliance" },
      { id: "year-in-review", label: "Year in Review", icon: Award, href: "/year-in-review" },
    ],
  },
  {
    title: "SETTINGS",
    color: "text-[#b8a898]",
    items: [
      { id: "settings", label: "Settings", icon: Settings2, href: "/settings" },
      { id: "ai-guide", label: "AI Assistant", icon: Sparkles, href: "/settings?tab=ai" },
      { id: "vault", label: "Logins & Passwords", icon: KeyRound, href: "/vault" },
      { id: "segments", label: "Business Segments", icon: Boxes, href: "/segments" },
    ],
  },
  {
    title: "GETTING STARTED",
    color: "text-[#8fb58a]",
    items: [
      { id: "user-guide", label: "User Guide", icon: BookOpen, href: "/user-guide" },
      { id: "setup", label: "Set up Suite", icon: Rocket, href: "/setup" },
      { id: "first30", label: "First 30 Days", icon: Sprout, href: "/first-30-days" },
      { id: "starter-guide", label: "Starter Guide", icon: BookOpen, href: STARTER_GUIDE_URL },
      { id: "welcome-overview", label: "Welcome Overview", icon: BookOpen, href: WELCOME_OVERVIEW_URL },
      { id: "website-review", label: "Website Review", icon: Globe, href: "/website-review" },
      { id: "glossary", label: "Glossary", icon: BookOpen, href: "/glossary" },
    ],
  },
];

// Pages in the everyday sections that only Babs sees while they are being shaped.
const ARCHITECT_ONLY_IDS: string[] = [...(QUALIFIER_OPEN_TO_ALL ? [] : ["qualifier"]), ...(VOLANT_OPEN_TO_ALL ? [] : ["volant"]), ...(PAYMENTS_OPEN_TO_ALL ? [] : ["payments"]), ...(PORTAL_OPEN_TO_ALL ? [] : ["client-portals", "programs"])];

// Alignment Architect pages: Babs only (her email, hard-wired). Shown only when /api/me says
// so; the pages and their APIs enforce the same check on the server.
// Embraced;Fully: her own section, always apart from the Command Suite and the LifeCharter Program. Babs only (shown
// only when /api/me says so; the pages and their APIs enforce the same check on the server). Never for clients or team.
const efSection = {
  title: "EMBRACED;FULLY",
  color: "text-[#d9a0c0]",
  items: [
    { id: "ef-tasks", label: "Tasks", icon: ClipboardList, href: "/ef-tasks" },
    { id: "ef-projects", label: "Projects", icon: FolderKanban, href: "/ef-projects" },
  ],
};

// Team members Babs gave the Support Desk to (Sumbal, 2026-10-16): the Support Desk in a small section of its own.
// It shows only when /api/me says the member has that feature.
const teamSection = {
  title: "TEAM",
  color: "text-[#c9a227]",
  items: [
    { id: "sales-reference-team", label: "Sales Reference", icon: DollarSign, href: "/sales-reference" },
    { id: "support-desk-team", label: "Support Desk", icon: Inbox, href: "/support-desk" },
    { id: "masterclass-results-team", label: "MasterClass Results", icon: TrendingUp, href: "/masterclass-results" },
    { id: "demo-account-team", label: "Demo Account (turns demo on)", icon: MonitorPlay, href: "/demo" },
  ],
};

// Alignment Architect: Babs only (her email, hard-wired), shown only when /api/me says so; the pages and their APIs
// enforce the same check. Five folding groups (left menu audit, approved 2026-10-18); the Archive starts folded.
// Executive Consultation Map, Saving a Call Note and Team Briefing are her own pages (custom_pages, nav_section
// alignment_architect) and are placed into a group by ARCHITECT_PAGE_GROUP below.
const ARCHIVE_TITLE = "ARCHITECT · ARCHIVE";
const ownerSections = [
  {
    title: "ALIGNMENT ARCHITECT",
    color: "text-[#c9a227]",
    items: [
      { id: "command-center", label: "Command Center", icon: Activity, href: "/command-center" },
      { id: "platform-costs", label: "Platform Costs", icon: Wallet, href: "/platform-costs" },
      { id: "planner-sales", label: "Planner Sales", icon: Wallet, href: "/planner-sales" },
      { id: "masterclass-results", label: "MasterClass Results", icon: BarChart3, href: "/masterclass-results" },
      { id: "challenge-participants", label: "Command Shift Participants", icon: Activity, href: "/challenge-participants" },
      { id: "website-reviews", label: "Website Reviews", icon: Globe, href: "/website-reviews" },
      { id: "accountability-coach", label: "Accountability Partners", icon: HeartHandshake, href: "/accountability-coach" },
      { id: "session-checklists", label: "Session Checklists", icon: ClipboardCheck, href: "/session-checklists" },
      { id: "support-desk", label: "Support Desk", icon: Inbox, href: "/support-desk" },
      { id: "view-as", label: "View as Client", icon: Eye, href: "/view-as" },
      { id: "client-journey", label: "New Client Journey", icon: UserCheck, href: "/client-journey" },
      { id: "lc-spark", label: "LC Spark", icon: MessageCircle, href: "/lc-spark" },
      { id: "meta-app-review-kit", label: "Meta App Review Kit", icon: ClipboardCheck, href: "https://claude.ai/artifact/HgagtgZDDHEAuuRF2NqVNJ" },
    ],
  },
  {
    title: "ARCHITECT · SALES",
    color: "text-[#c9a227]",
    items: [
      { id: "sales-reference", label: "Sales Reference", icon: DollarSign, href: "/sales-reference" },
      { id: "pre-founder-call", label: "Pre-Founder Call", icon: PhoneCall, href: "/pre-founder-call" },
      { id: "starter-signup-map", label: "Starter Sign-Up Map", icon: BookOpen, href: "https://claude.ai/artifact/Q8YshdhqnBFX3sMwNVve2R" },
      { id: "demo-account", label: "Demo Account (turns demo on)", icon: MonitorPlay, href: "https://lccommandsuite.com/demo" },
      { id: "sneak-peek-run-of-show", label: "Command Suite Short Demo", icon: Presentation, href: "https://claude.ai/artifact/HpJ3wVr8gua2gskrupNrz9" },
      { id: "short-demo-slides", label: "Short Demo Slides", icon: Presentation, href: "https://claude.ai/artifact/CsTuHezMWhXz1DpbugffRU" },
    ],
  },
  {
    title: "ARCHITECT · PROGRAMS & EVENTS",
    color: "text-[#c9a227]",
    items: [
      { id: "life-by-design", label: "Life by Design", icon: Mic, href: "/life-by-design" },
      { id: "annual-retreat", label: "Annual In Person Retreat", icon: MapPin, href: "/annual-retreat" },
      { id: "quarterly-intensive", label: "Quarterly Intensive", icon: CalendarRange, href: "/quarterly-intensive" },
      { id: "masterclass-script-1022", label: "10/22 MasterClass Script (See It Clearly)", icon: BookOpen, href: "https://claude.ai/artifact/8beWZbbh6t3ko3cfZhqNsi" },
      { id: "lifecharter-lesson-studio", label: "LifeCharter Lesson Studio", icon: BookOpen, href: "https://claude.ai/artifact/4M3MyiwRX5T4dAQsG39RhW" },
      { id: "lessons-manager", label: "Lessons", icon: GraduationCap, href: "/lessons-manager" },
      { id: "lifecharter-app", label: "LifeCharter App", icon: Sprout, href: "https://lifecharter.life/app" },
    ],
  },
  {
    title: "ARCHITECT · INVESTORS & LEGAL",
    color: "text-[#c9a227]",
    items: [
      { id: "investor-access", label: "Investor Access Requests", icon: UserCheck, href: "/investor-access" },
      { id: "investor-brief-page", label: "Investor Brief (live page)", icon: Presentation, href: "/investor-brief" },
      { id: "due-diligence-review", label: "Due Diligence Q&A (review and approve)", icon: Scale, href: "https://claude.ai/artifact/1DndhgttBrt3qxzr4EQgMh" },
      { id: "prep-documents", label: "Prep Documents (LCCS 2027 > Prep)", icon: BookOpen, href: "https://claude.ai/artifact/FmsjAZMcfyVAnsa4Xat2Dy" },
      { id: "attorney-review-founder-pricing", label: "Attorney Review: Founder Pricing", icon: Scale, href: "https://claude.ai/artifact/5PwmizNZMxJokEnFtNpypA" },
      { id: "google-demo-video", label: "Google Demo Video", icon: Video, href: "https://youtu.be/UmaGoM4NvJ4" },
    ],
  },
  {
    title: "ARCHITECT · ARCHIVE",
    color: "text-[#c9a227]",
    items: [
      { id: "master-punch-list", label: "Master Punch List (archive)", icon: ClipboardList, href: "https://claude.ai/artifact/63hHW1x177qZcxYjNhCn3H" },
      { id: "masterclass-script-1008", label: "10/08 MasterClass Script", icon: BookOpen, href: "https://claude.ai/artifact/8BTWYQvfDSeFQNpWd7BF5j" },
      { id: "fb-event-copy", label: "From Hustle to Command: Facebook Event Copy", icon: BookOpen, href: "https://claude.ai/artifact/QdNU7zJng7DovSwjFrrrge" },
    ],
  },
];
// Babs's own pages: which Architect group each sits in (anything else goes in the first group).
const ARCHITECT_PAGE_GROUP: Record<string, string> = {
  "executive-consultation-map": "ARCHITECT · SALES",
  "saving-a-call-note": "ARCHITECT · SALES",
  "team-briefing": "ARCHITECT · PROGRAMS & EVENTS",
  "masterclass-lenses": "ARCHITECT · PROGRAMS & EVENTS",
};
// Sections that start folded until someone opens them.
const DEFAULT_FOLDED = [ARCHIVE_TITLE];

// DEMO ACCOUNT ONLY (lc_demo cookie). The pages in the order the guided tour
// shows them, as one section at the top, so presenting is "click the next one
// down". Everything not on the tour keeps its usual section underneath. No real
// account ever gets this order.
const DEMO_TOUR_ORDER = [
  // The Command Suite Short Demo script, in the order it shows them (the "DEMO TOUR" list is the run of show).
  "setup", "first30", "alignment-profile", // Beat 1: know you first
  "executive-home", "demo-morning-brief", // Beat 2: start your day
  "business-alignment", // Beat 3: see the whole business
  "goals", "review", "finance", // Beat 4: turn it into this week (Finance if time allows)
  "pipeline", "contacts", "links-directory", // Beat 5: grow
  "demo-coaching-calls", "accountability", // Beat 6: be held
];
// Bump this when the default tour order above changes: a browser that saved its own drag-and-drop order for the
// tour starts from the new default once, then keeps whatever it arranges after that.
const DEMO_TOUR_VERSION = "2026-10-11-short-demo";
const demoOnlyItems = [
  { id: "demo-morning-brief", label: "Morning Brief", icon: Sparkles, href: "/morning-brief" },
  { id: "demo-coaching-calls", label: "Coaching Calls (Home)", icon: LayoutDashboard, href: "/" },
  { id: "demo-collective-events", label: "Collective Events", icon: CalendarDays, href: collectiveHref("/community/events") },
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

const navigationItems = [...navigationSections, teamSection, ...ownerSections, efSection, { items: demoOnlyItems }].flatMap((s) => s.items);

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
// Letting go of a dragged menu page also counts as a click on its link, which used to open the page instead of
// just moving it. While a drag is on, and for a moment after, link clicks are ignored.
let navDragActive = false;
let navDragEndedAt = 0;
// Where the mouse went down, so a press that travelled is treated as a drag and never as a click on the page.
let navDown: { x: number; y: number } | null = null;
// While a menu page is being dragged (and for a moment after), swallow any click on the page, whatever it landed on.
const blockNavClick = (ev: MouseEvent) => {
  ev.preventDefault();
  ev.stopPropagation();
};
const startClickBlock = () => window.addEventListener("click", blockNavClick, true);
const stopClickBlock = () => setTimeout(() => window.removeEventListener("click", blockNavClick, true), 400);

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
        onPointerDown={(e) => {
          navDown = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          // A keyboard activation (no pointer position) must always go through.
          const keyboard = (e.nativeEvent as PointerEvent).pointerType === "" && e.clientX === 0 && e.clientY === 0;
          const travelled = navDown && !keyboard ? Math.hypot(e.clientX - navDown.x, e.clientY - navDown.y) : 0;
          if (travelled > 4 || navDragActive || Date.now() - navDragEndedAt < 500) e.preventDefault();
        }}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 select-none",
          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2.5",
          isActive
            ? "bg-white/10 text-[#c9a227] border-[#c9a227]"
            : "text-white/90 hover:bg-white/10 hover:text-white border-transparent"
        )}
      >
        <Icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
        {!isCollapsed && <span className="nav-label tracking-wide">{item.label}</span>}
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
function SortableNavRow({ item, isActive, onMove }: { item: typeof navigationItems[0]; isActive: boolean; onMove?: (dir: -1 | 1) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, unknown> & { onKeyDown?: React.KeyboardEventHandler };
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 20 : undefined }}
      className="relative group"
      data-nav-id={item.id}
      {...pointerListeners}
    >
      <NavItem item={item} isActive={isActive} isCollapsed={false} />
      {onMove && (
        <span className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" onClick={() => onMove(-1)} aria-label={`Move ${item.label} up`} title="Move up" className="rounded p-0.5 text-white/30 hover:text-white/80">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label={`Move ${item.label} down`} title="Move down" className="rounded p-0.5 text-white/30 hover:text-white/80">
            <ChevronDown className="h-3 w-3" />
          </button>
        </span>
      )}
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
  // section hides all of its pages, including the one you're on.
  const [foldedSections, setFoldedSections] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nav-folded-sections") || "{}");
      if (saved && typeof saved === "object") setFoldedSections(saved);
    } catch {
      /* keep everything open */
    }
  }, []);
  // A section the person never opened or closed uses its default (the Architect Archive starts folded).
  const isFolded = (title: string) => foldedSections[title] ?? DEFAULT_FOLDED.includes(title);
  const toggleSection = (title: string) =>
    setFoldedSections((prev) => {
      const next = { ...prev, [title]: !(prev[title] ?? DEFAULT_FOLDED.includes(title)) };
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
  // New clients: Getting Started sits at the TOP of the menu until every First 30 Days step is complete, then goes back to
  // wherever the account keeps it (the bottom by default). The server decides (never Babs's own account).
  const [pinGettingStarted, setPinGettingStarted] = useState(false);
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1")) return;
    const load = () =>
      fetch("/api/first30", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setPinGettingStarted(d?.pin === true))
        .catch(() => {});
    load();
    window.addEventListener("focus", load);
    window.addEventListener("tasks-changed", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("tasks-changed", load);
    };
  }, [pathname]);
  const [features, setFeatures] = useState<FeatureMap | null>(null);
  const [extras, setExtras] = useState<AccessExtras | null>(null);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  // Until all three assessments are finished the menu shows only Set up Suite, the assessments, Settings and support.
  const [assessmentsLocked, setAssessmentsLocked] = useState(false);
  // Team Huddle shows only for an account with a team (a member, or someone added to the huddle by email).
  const [hasTeam, setHasTeam] = useState(true);
  const [userGuide, setUserGuide] = useState(false);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSuperAdmin(d?.architect === true);
        setTeamRole(typeof d?.teamRole === "string" ? d.teamRole : null);
        setFeatures(d?.features ?? null);
        setExtras(d?.extras ?? null);
        setAssessmentsLocked(d?.assessmentsLocked === true);
        setHasTeam(d?.hasTeam !== false);
        setUserGuide(d?.userGuide === true);
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
    // Presenting the demo (a member Babs allowed): the sample-data tour shows every page.
    if (isDemo && extras?.demo) return true;
    if (href === "/demo") return extras?.demo === true;
    if (assessmentsLocked) {
      const p = href.split("?")[0];
      return p === "/setup" || p.endsWith("/starter-guide.html") || p.endsWith(WELCOME_OVERVIEW_PATH) || p === "/assessments" || p.startsWith("/assessments/brain") || p.startsWith("/assessments/soul") || p.startsWith("/assessments/profit") || p.startsWith("/settings") || p === "/glossary" || p === "/user-guide" || p === "/help" || p.startsWith("/help/");
    }
    if (!features) return true;
    // A custom page can be given to a member one at a time, even with My Pages off.
    const mine = /^\/my-pages\/([^/?]+)/.exec(href);
    if (mine) return customPageLevel(features, extras, mine[1]) !== "none";
    const p = href.split("?")[0];
    const key = featureForPage(p);
    // "Show only their areas": a page that belongs to no area they have stays out of the menu (Settings and Help stay).
    if (extras?.restrict && !key) return p.startsWith("/settings") || p === "/user-guide" || p === "/help" || p.startsWith("/help/");
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
  // Babs's Alignment Architect pages sit in her Architect groups; a team member she shared one with sees it under My Pages.
  const myPages = customPages.filter((p) => !superAdmin || p.nav_section !== "alignment_architect").map(pageItem);
  const mySection = myPages.length ? [{ title: "MY PAGES", color: "text-[#c9a227]", items: myPages }] : [];
  const demoOrderedSections = isDemo ? demoTourSections() : navigationSections;
  // The Alignment Architect section never shows while presenting the demo.
  // The TEAM section (Briefing + Support Desk) is only for a restricted member; Babs has both elsewhere.
  const teamExtra = !superAdmin && (extras?.restrict || extras?.demo) ? [teamSection] : [];
  const architectGroups = ownerSections.map((g) => ({
    ...g,
    items: [
      ...g.items,
      ...customPages
        .filter((p) => p.nav_section === "alignment_architect" && (ARCHITECT_PAGE_GROUP[p.slug] ?? ownerSections[0].title) === g.title)
        .map(pageItem),
    ],
  }));
  // A Call to Close consultant has no menu of pages: their workspace is the one page, reached from the logo, and the
  // left bar holds only Settings (profile, appearance and security).
  const consultantNav = [{ title: "MY ACCOUNT", color: "text-[#c9a227]", items: [{ id: "settings", label: "Settings", icon: Settings2, href: "/settings" }] }];
  const sections = teamRole === "consultant" ? consultantNav : [...(superAdmin && !isDemo ? [...demoOrderedSections, ...architectGroups, efSection] : demoOrderedSections), ...teamExtra, ...mySection]
    .map((s) => ({ ...s, items: s.items.filter((i) => visible(i.href) && ((superAdmin && !isDemo) || !ARCHITECT_ONLY_IDS.includes(i.id)) && (i.id !== "team-huddle" || hasTeam) && (i.id !== "user-guide" || userGuide)) }))
    .filter((s) => s.items.length > 0);

  // Pages can be dragged into whatever order you use most, within each
  // section — remembered on this device. One saved list per section title;
  // a page not in the saved list (new, or just became visible to you) is
  // appended at the end rather than dropped.
  const [navOrder, setNavOrder] = useState<Record<string, string[]>>({});
  const navOrderRef = useRef<Record<string, string[]>>({});
  navOrderRef.current = navOrder;
  // The order of the sections themselves.
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  // The order is saved on the ACCOUNT (so it is the same on every device and for the account's team);
  // this device keeps a copy so the menu doesn't jump while the saved order loads.
  const [navLoaded, setNavLoaded] = useState(false);
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});
  const skipSave = useRef(true);
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1")) {
      setNavLoaded(true);
      return;
    }
    fetch("/api/nav-order", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.labels && typeof d.labels === "object") setItemLabels(d.labels);
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
      if (document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1") && localStorage.getItem("nav-demo-tour-v") !== DEMO_TOUR_VERSION) {
        if (saved && typeof saved === "object") delete saved["DEMO TOUR"];
        localStorage.setItem("nav-item-order", JSON.stringify(saved || {}));
        localStorage.setItem("nav-demo-tour-v", DEMO_TOUR_VERSION);
      }
      if (saved && typeof saved === "object") setNavOrder(saved);
    } catch {
      /* keep the default order */
    }
  }, []);
  // The demo keeps its tour order; every real account can arrange its own sections. A section that is
  // new, or not in the saved list, goes at the end.
  // Sections that were renamed keep the place the account had saved for them.
  const RENAMED: Record<string, string> = { ALIGNMENT: "ALIGNMENT & SYSTEMS", SYSTEMS: "SETTINGS" };
  const savedBase = sectionOrder.map((t) => RENAMED[t] ?? t).filter((t, i, a) => a.indexOf(t) === i);
  // Sections added after an account saved its order go right after their neighbour instead of at the very end.
  const NEW_SECTION_AFTER: [string, string][] = [
    ["MARKETING", "CLIENTS & SALES"],
    ["CLIENT DELIVERY", "MARKETING"],
    ["MONEY", "CLIENT DELIVERY"],
    ["ARCHITECT · SALES", "ALIGNMENT ARCHITECT"],
    ["ARCHITECT · PROGRAMS & EVENTS", "ARCHITECT · SALES"],
    ["ARCHITECT · INVESTORS & LEGAL", "ARCHITECT · PROGRAMS & EVENTS"],
    ["ARCHITECT · ARCHIVE", "ARCHITECT · INVESTORS & LEGAL"],
  ];
  const savedOrder = [...savedBase];
  if (savedOrder.length) {
    for (const [title, after] of NEW_SECTION_AFTER) {
      if (savedOrder.includes(title)) continue;
      const at = savedOrder.indexOf(after);
      if (at !== -1) savedOrder.splice(at + 1, 0, title);
    }
  }
  const arranged = isDemo || !savedOrder.length
    ? sections
    : [...sections].sort((a, b) => {
        const ia = savedOrder.indexOf(a.title);
        const ib = savedOrder.indexOf(b.title);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  const baseSections = arranged.map((s) => {
    // The Architect groups start from the order Babs saved for the one Alignment Architect list.
    const saved = navOrder[s.title] ?? (s.title.startsWith("ARCHITECT · ") ? navOrder["ALIGNMENT ARCHITECT"] : undefined);
    if (!saved) return s;
    const byId = new Map(s.items.map((i) => [i.id, i]));
    const known = saved.filter((id) => byId.has(id));
    // A new item that has a home right after another (Reminders sits under Tasks) goes there, even in an order the
    // client saved before it existed; anything else new goes to the end of its section.
    const NEW_AFTER: Record<string, string> = { reminders: "tasks", "due-diligence-review": "platform-costs", "prep-documents": "due-diligence-review", "fb-event-copy": "prep-documents", "team-huddle": "reminders", "assistant-approvals": "reminders", volant: "team-huddle", "welcome-overview": "starter-guide", payments: "finance", events: "sequences-manager", time: "volant", offers: "dm-pipeline", agreements: "offers", segments: "vault", glossary: "website-review" };
    const placed = [...known];
    for (const i of s.items) {
      if (known.includes(i.id) || !NEW_AFTER[i.id]) continue;
      const at = placed.indexOf(NEW_AFTER[i.id]);
      placed.splice(at === -1 ? placed.length : at + 1, 0, i.id);
    }
    const rest = s.items.filter((i) => !placed.includes(i.id)).map((i) => i.id);
    const order = [...placed, ...rest];
    // The User Guide goes first in Getting Started, even in an order saved before it existed.
    if (order.includes("user-guide") && !known.includes("user-guide")) order.unshift(...order.splice(order.indexOf("user-guide"), 1));
    return { ...s, items: order.map((id) => byId.get(id)!).filter(Boolean) };
  }).map((s) => (Object.keys(itemLabels).length ? { ...s, items: s.items.map((i) => (itemLabels[i.id] ? { ...i, label: itemLabels[i.id] } : i)) } : s));
  const GS_TITLE = "GETTING STARTED";
  const gsBaseIdx = baseSections.findIndex((x) => x.title === GS_TITLE);
  const gsPinned = !isDemo && pinGettingStarted && gsBaseIdx > 0;
  const orderedSections = gsPinned ? [baseSections[gsBaseIdx], ...baseSections.filter((_, i) => i !== gsBaseIdx)] : baseSections;
  // What gets saved is the account's own order: Getting Started goes back to where it was, not to the top.
  const savableTitles = (next: string[]) => {
    if (!gsPinned) return next;
    const rest = next.filter((t) => t !== GS_TITLE);
    rest.splice(gsBaseIdx, 0, GS_TITLE);
    return rest;
  };
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
    const own = { ...args, droppableContainers: args.droppableContainers.filter((c) => mine.has(String(c.id))) };
    // Where the pointer is decides the drop (up or down alike); if it is between rows, the nearest row wins.
    const under = pointerWithin(own);
    return under.length ? under : closestCenter(own);
  };
  // If a drop does not land, say so (and point to the arrows) instead of the page quietly snapping back.
  const [dragNote, setDragNote] = useState("");
  const noteDrag = (e: DragEndEvent) => {
    const { active, over } = e;
    if (String(active.id).startsWith("section:")) return;
    let why = "";
    if (rowUnderPointer(e)) return;
    if (!over) why = "nothing under the pointer";
    else if (active.id !== over.id) {
      const sec = orderedSections.find((x) => x.items.some((i) => i.id === active.id));
      if (!sec || !sec.items.some((i) => i.id === over.id)) why = "dropped in a different section";
    }
    if (why) {
      setDragNote(`That drop didn't land (${why}). Use the small up and down arrows beside the page, or try again.`);
      setTimeout(() => setDragNote(""), 7000);
    }
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
  // Saved the moment it changes (and kept alive if the page changes), so an order can never be lost to a page change.
  const sectionOrderRef = useRef<string[]>([]);
  sectionOrderRef.current = sectionOrder;
  const persistNow = (sections: string[], items: Record<string, string[]>) => {
    if (typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1")) return;
    fetch("/api/nav-order", { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionOrder: sections, itemOrder: items }) }).catch(() => {});
  };
  const saveSectionOrder = (next: string[]) => {
    setSectionOrder(next);
    persistNow(next, navOrderRef.current);
    try {
      localStorage.setItem("nav-section-order", JSON.stringify(next));
    } catch {
      /* not remembered */
    }
  };
  // Move one page up or down inside its section (the arrow buttons on each row; always works, drag or no drag).
  const moveItem = (sectionTitle: string, id: string, dir: -1 | 1) => {
    const section = orderedSections.find((x) => x.title === sectionTitle);
    if (!section) return;
    const ids = section.items.map((i) => i.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = arrayMove(ids, i, j);
    setNavOrder((prev) => {
      const merged = { ...prev, [sectionTitle]: next };
      try {
        localStorage.setItem("nav-item-order", JSON.stringify(merged));
      } catch {
        /* not remembered */
      }
      navOrderRef.current = merged;
      persistNow(sectionOrderRef.current, merged);
      return merged;
    });
  };
  const moveSection = (title: string, dir: -1 | 1) => {
    const titles = orderedSections.map((s) => s.title);
    const i = titles.indexOf(title);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= titles.length) return;
    saveSectionOrder(savableTitles(arrayMove(titles, i, j)));
  };
  // Where the rows of the dragged page's section were when the drag began, so the drop can be decided from where the
  // pointer is (up and down alike) rather than from a guess about what is "over" what.
  const dragSnap = useRef<{ ids: string[]; rects: { top: number; bottom: number }[]; scroll: number; startY: number } | null>(null);
  const startNavDrag = (e: DragStartEvent) => {
    navDragActive = true;
    startClickBlock();
    dragSnap.current = null;
    const activeId = String(e.active.id);
    if (activeId.startsWith("section:")) return;
    const section = orderedSections.find((sec) => sec.items.some((i) => i.id === activeId));
    const navEl = document.querySelector("nav.overflow-y-auto") as HTMLElement | null;
    if (!section) return;
    const ids: string[] = [];
    const rects: { top: number; bottom: number }[] = [];
    for (const i of section.items) {
      const el = document.querySelector(`[data-nav-id="${i.id}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      ids.push(i.id);
      rects.push({ top: r.top, bottom: r.bottom });
    }
    const ev = e.activatorEvent as PointerEvent | undefined;
    dragSnap.current = { ids, rects, scroll: navEl?.scrollTop ?? 0, startY: ev && typeof ev.clientY === "number" ? ev.clientY : NaN };
  };
  // The row under the pointer when the drag ended (nearest row if it is between two).
  const rowUnderPointer = (e: DragEndEvent): string | null => {
    const snap = dragSnap.current;
    if (!snap || !snap.ids.length || Number.isNaN(snap.startY)) return null;
    // delta already includes any auto-scroll, so this is the pointer in the coordinates the rows had when the drag began.
    const y = snap.startY + e.delta.y;
    let best = 0;
    let bestD = Infinity;
    snap.rects.forEach((r, i) => {
      if (y >= r.top && y <= r.bottom) {
        best = i;
        bestD = -1;
      } else if (bestD >= 0) {
        const d = Math.min(Math.abs(y - r.top), Math.abs(y - r.bottom));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    });
    return snap.ids[best];
  };
  const handleNavDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    let over = event.over;
    if (!String(active.id).startsWith("section:")) {
      // Items: the row under the pointer decides (falls back to dnd-kit's own answer).
      const decided = rowUnderPointer(event);
      if (decided) over = { ...(event.over ?? ({} as NonNullable<typeof event.over>)), id: decided } as NonNullable<typeof event.over>;
    }
    if (!over || active.id === over.id) return;
    if (String(active.id).startsWith("section:")) {
      const titles = orderedSections.map((s) => s.title);
      const from = titles.indexOf(String(active.id).slice(8));
      const to = titles.indexOf(String(over.id).slice(8));
      if (from < 0 || to < 0) return;
      saveSectionOrder(savableTitles(arrayMove(titles, from, to)));
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
      navOrderRef.current = merged;
      persistNow(sectionOrderRef.current, merged);
      return merged;
    });
  };

  // One click puts a section's pages in A to Z order (drag them afterwards to arrange for the day).
  const sortSectionAZ = (title: string, items: { id: string; label: string }[]) => {
    const ids = [...items].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" })).map((i) => i.id);
    setNavOrder((prev) => {
      const merged = { ...prev, [title]: ids };
      try {
        localStorage.setItem("nav-item-order", JSON.stringify(merged));
      } catch {
        /* not remembered */
      }
      navOrderRef.current = merged;
      persistNow(sectionOrderRef.current, merged);
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
    const item = [...navigationItems, ...myPages, ...customPages.filter((p) => p.nav_section === "alignment_architect").map(pageItem)]
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
          "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 transition-all duration-300 w-64 -translate-x-full lg:translate-x-0",
          isCollapsedDesktop ? "lg:w-16" : "lg:w-64"
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
          "fixed left-0 top-0 h-full bg-[#1a2b4a] flex flex-col z-50 lg:z-50 transition-all duration-300 ease-in-out shadow-xl w-64",
          isMobileOpen && "z-[65]",
          isCollapsed ? "lg:w-16" : "lg:w-64",
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
            "hidden lg:block p-1.5 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-colors",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close Button — mobile drawer only */}
        <button
          onClick={closeMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-colors"
          title="Close menu"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "py-4 px-2" : "py-4 px-3")}>
        <DndContext sensors={navSensors} collisionDetection={navCollision} autoScroll={{ threshold: { x: 0, y: 0.08 }, acceleration: 4 }} onDragStart={startNavDrag} onDragCancel={() => { navDragActive = false; navDragEndedAt = Date.now(); stopClickBlock(); }} onDragEnd={(e) => { navDragActive = false; navDragEndedAt = Date.now(); stopClickBlock(); noteDrag(e); handleNavDragEnd(e); }}>
        <SortableContext items={orderedSections.map((x) => `section:${x.title}`)} strategy={verticalListSortingStrategy}>
        {orderedSections.map((section, sectionIndex) => {
          // A closed section hides all its pages, including the one you're on (Babs, 2026-10-18).
          const visibleItems = section.items.filter(() => isCollapsed || !isFolded(section.title));
          return (
          <SortableSection key={section.title} id={`section:${section.title}`} title={section.title} withGrip={!isCollapsed} onMove={(d) => moveSection(section.title, d)} className={sectionIndex > 0 ? (isCollapsed ? "mt-6" : "mt-8") : ""}>
            {/* Section Header */}
            {!isCollapsed ? (
              <div className="mb-3 flex items-center gap-1 group/head">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                aria-expanded={!isFolded(section.title)}
                aria-label={`${isFolded(section.title) ? "Expand" : "Collapse"} ${section.title}`}
                className="min-w-0 flex-1 px-4 flex items-center gap-2 rounded-md hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a227] py-1"
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
                <h3
                  className={cn(
                    "nav-head font-semibold tracking-[0.12em] uppercase whitespace-nowrap",
                    section.color
                  )}
                >
                  {section.title}
                </h3>
                <ChevronDown
                  className={cn("ml-auto w-3.5 h-3.5 text-white/70 transition-transform duration-200", isFolded(section.title) && "-rotate-90")}
                />
              </button>
              {!isDemo && section.items.length > 2 && !isFolded(section.title) && (
                <button
                  type="button"
                  onClick={() => sortSectionAZ(section.title, section.items)}
                  title={`Put the pages in ${section.title.toLowerCase()} in A to Z order`}
                  aria-label={`Sort ${section.title} A to Z`}
                  className="flex-none rounded-md px-1.5 py-1 text-[9px] font-semibold tracking-wider text-white/30 opacity-0 group-hover/head:opacity-100 focus-visible:opacity-100 hover:text-white/80"
                >
                  A–Z
                </button>
              )}
              </div>
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
                    <SortableNavRow key={item.id} item={item} isActive={activeItem === item.id} onMove={(d) => moveItem(section.title, item.id, d)} />
                  ))}
                </SortableContext>
              )}
            </div>
          </SortableSection>
          );
        })}
        </SortableContext>
        </DndContext>
        {dragNote && (
          <div role="status" className="fixed bottom-24 left-3 z-[60] w-[13.5rem] rounded-lg bg-[#c9a227] px-3 py-2 text-xs font-medium text-[#0F1A38] shadow-lg">
            {dragNote}
          </div>
        )}

        {!isCollapsed && !isDemo && teamRole !== "consultant" && (sectionOrder.length > 0 || Object.keys(navOrder).length > 0) && (
          <button type="button" onClick={resetMenuOrder} className="mt-6 w-full px-4 text-left text-[11px] text-white/40 hover:text-white/80 hover:underline" title="Put the menu back in the standard order">
            Reset menu order
          </button>
        )}

        {/* Help Section (a Call to Close consultant's left bar is Settings only) */}
        {!isCollapsed && teamRole !== "consultant" && (
          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              onClick={() => setHelpExpanded(!helpExpanded)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                helpExpanded || isHelpActive
                  ? "bg-white/10 text-[#c9a227]"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
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
                          isActive ? "bg-white/10 text-[#c9a227]" : "text-white/90 hover:bg-white/10 hover:text-white"
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
        {isCollapsed && teamRole !== "consultant" && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              href="/help/12-domain-alignment"
              className={cn(
                "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                isHelpActive ? "bg-white/10 text-[#c9a227]" : "text-white/90 hover:bg-white/10 hover:text-white"
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
                  <span className="block text-xs text-white/70 truncate">Founder &amp; CEO</span>
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
                "flex items-center rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors",
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
