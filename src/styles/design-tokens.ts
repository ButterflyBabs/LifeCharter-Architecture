/**
 * LifeCharter Command Suite - Design Tokens
 * Based on the LifeCharter Brand Board (May 2026)
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  deepIndigo: "#1a2b4a",
  royalPlum: "#7b6b8d",
  sacredTeal: "#4a9b9b",
  
  // Secondary Colors
  softLavender: "#e8e4f0",
  warmGold: "#c9a227",
  ivoryLight: "#F8F5F0",
  softTaupe: "#b8a898",
  
  // Legacy Colors (still valid)
  paper: "#F5F1E8",
  fog: "#DAD2B9",
  sage: "#ADB8A0",
  ochre: "#C4B792",
  clay: "#CBA488",
  ink: "#2F312F",
  lineworkTaupe: "#8F8875",
  
  // Dark Mode
  darkBackground: "#1A1A2E",
  darkCard: "#16213E",
  darkMuted: "#2D3561",
};

// Domain Colors for 12-Domain Architecture
export const domainColors = {
  qualityOfLife: "#1a2b4a",    // Deep Indigo
  character: "#7b6b8d",        // Royal Plum
  intellectual: "#4a9b9b",     // Sacred Teal
  emotional: "#e8e4f0",        // Soft Lavender
  health: "#c9a227",           // Warm Gold
  love: "#b8a898",             // Soft Taupe
  parenting: "#1a2b4a",        // Deep Indigo
  career: "#7b6b8d",           // Royal Plum
  spiritual: "#4a9b9b",        // Sacred Teal
  social: "#e8e4f0",           // Soft Lavender
  financial: "#c9a227",        // Warm Gold
  lifeVision: "#b8a898",       // Soft Taupe
};

// Business Domain Colors (for dashboard)
export const businessDomainColors: Record<string, string> = {
  Marketing: "#1a2b4a",
  Sales: "#7b6b8d",
  Operations: "#4a9b9b",
  Finance: "#e8e4f0",
  Team: "#c9a227",
  Systems: "#b8a898",
  Leadership: "#1a2b4a",
  Vision: "#7b6b8d",
  Product: "#4a9b9b",
  "Client Exp": "#e8e4f0",
  Legal: "#c9a227",
  Sustainability: "#b8a898",
};

// Typography
export const typography = {
  // Font Families
  fontFamily: {
    serif: "Georgia, Cambria, 'Times New Roman', serif",
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "Georgia, Cambria, 'Times New Roman', serif",
  },
  
  // Font Sizes
  fontSize: {
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
  },
  
  // Font Weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  
  // Line Heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
};

// Spacing
export const spacing = {
  0: "0",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
};

// Border Radius
export const borderRadius = {
  none: "0",
  sm: "0.375rem",   // 6px
  md: "0.5rem",     // 8px
  lg: "0.75rem",    // 12px
  xl: "1rem",       // 16px
  "2xl": "1.25rem", // 20px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
};

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(31, 49, 91, 0.05)",
  md: "0 4px 6px -1px rgba(31, 49, 91, 0.1), 0 2px 4px -1px rgba(31, 49, 91, 0.06)",
  lg: "0 10px 15px -3px rgba(31, 49, 91, 0.1), 0 4px 6px -2px rgba(31, 49, 91, 0.05)",
  xl: "0 20px 25px -5px rgba(31, 49, 91, 0.1), 0 10px 10px -5px rgba(31, 49, 91, 0.04)",
  card: "0 4px 20px rgba(31, 49, 91, 0.08)",
  gold: "0 4px 20px rgba(212, 175, 99, 0.15)",
};

// Transitions
export const transitions = {
  fast: "150ms ease-in-out",
  normal: "200ms ease-in-out",
  slow: "300ms ease-in-out",
};

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Canva / Social Media Sizing
export const socialSizing = {
  feedPost: { width: 1080, height: 1350 },
  squareCarousel: { width: 1080, height: 1080 },
  videoExport: { width: 1920, height: 1080 },
  storiesReels: { width: 1080, height: 1920 },
};

// Typography Hierarchy for Social
export const socialTypography = {
  feed: {
    h1: "72-88pt",
    h2: "42-54pt",
    body: "24-28pt",
    cta: "22-24pt",
  },
  story: {
    h1: "56-68pt",
  },
  square: {
    h1: "60-72pt",
  },
};

// Export all tokens
export const designTokens = {
  colors,
  domainColors,
  businessDomainColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  socialSizing,
  socialTypography,
};

export default designTokens;
