/**
 * LifeCharter Architecture - Design Tokens
 * Based on the LifeCharter Brand Board
 */

export const colors = {
  // Primary Brand Colors
  deepIndigo: "#1F315B",
  royalPlum: "#5E3B6C",
  sacredTeal: "#2E7C83",
  softLavender: "#CDBED6",
  warmGold: "#D4AF63",
  ivoryLight: "#F6F1E8",
  softTaupe: "#B9A9A9",

  // Dark Mode
  darkBg: "#1A1A2E",
  darkPanel: "#16213E",
  darkBorder: "#2D3561",

  // Semantic
  success: "#2E7C83",
  warning: "#D4AF63",
  error: "#DC2626",
  info: "#1F315B",
} as const;

export const typography = {
  fontFamily: {
    serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
    sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  },
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
} as const;

export const borderRadius = {
  sm: "6px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 2px 8px rgba(31, 49, 91, 0.06)",
  md: "0 4px 20px rgba(31, 49, 91, 0.08)",
  lg: "0 8px 40px rgba(31, 49, 91, 0.12)",
  gold: "0 4px 20px rgba(212, 175, 99, 0.15)",
} as const;

// Domain colors for 12-domain architecture
export const domainColors = [
  colors.deepIndigo,   // Quality of Life
  colors.royalPlum,    // Character
  colors.sacredTeal,   // Intellectual
  colors.softLavender, // Emotional
  colors.warmGold,     // Health
  colors.softTaupe,    // Love
  colors.deepIndigo,   // Parenting
  colors.royalPlum,    // Career
  colors.sacredTeal,   // Spiritual
  colors.softLavender, // Social
  colors.warmGold,     // Financial
  colors.softTaupe,    // Life Vision
] as const;

// Navigation items
export const navigationItems = [
  { id: "overview", label: "Overview", icon: "LayoutDashboard" },
  { id: "assessments", label: "Assessments", icon: "ClipboardList" },
  { id: "dashboard", label: "Dashboard", icon: "BarChart3" },
  { id: "business-plan", label: "Business Plan", icon: "Briefcase" },
  { id: "marketing-plan", label: "Marketing Plan", icon: "Megaphone" },
  { id: "sales", label: "Sales", icon: "TrendingUp" },
  { id: "finance", label: "Finance", icon: "DollarSign" },
  { id: "operations", label: "Operations", icon: "Settings" },
  { id: "reviews", label: "Reviews", icon: "Star" },
  { id: "ai-guide", label: "AI Guide", icon: "Sparkles" },
  { id: "settings", label: "Settings", icon: "Settings2" },
] as const;
