"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ColorScheme = "lifecharter" | "sacred" | "modern";
type FontSize = "small" | "medium" | "large";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  isDark: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("lifecharter");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [compactMode, setCompactModeState] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load all preferences from localStorage
    try {
      const storedTheme = localStorage.getItem("lc-theme") as Theme;
      const storedColorScheme = localStorage.getItem("lc-color-scheme") as ColorScheme;
      const storedFontSize = localStorage.getItem("lc-font-size") as FontSize;
      const storedCompactMode = localStorage.getItem("lc-compact-mode");

      if (storedTheme) setThemeState(storedTheme);
      if (storedColorScheme) setColorSchemeState(storedColorScheme);
      if (storedFontSize) setFontSizeState(storedFontSize);
      if (storedCompactMode !== null) setCompactModeState(storedCompactMode === "true");
    } catch {
      console.warn("Could not access localStorage for theme");
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
      setIsDark(prefersDark);
    } else {
      root.classList.add(theme);
      setIsDark(theme === "dark");
    }

    try {
      localStorage.setItem("lc-theme", theme);
    } catch {}
  }, [theme, mounted]);

  // Apply color scheme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove("scheme-lifecharter", "scheme-sacred", "scheme-modern");
    root.classList.add(`scheme-${colorScheme}`);

    const isDarkMode = root.classList.contains("dark");

    const lightSchemes = {
      lifecharter: {
        "--primary": "#1F315B",
        "--accent": "#D4AF63",
        "--secondary": "#5E3B6C",
        "--foreground": "#1F315B",
        "--primary-foreground": "#F6F1E8",
        "--secondary-foreground": "#F6F1E8",
        "--muted": "#CDBED6",
        "--muted-foreground": "#5E3B6C",
        "--accent-foreground": "#1F315B",
        "--border": "#B9A9A9",
        "--background": "#F6F1E8",
        "--card": "#FFFFFF",
        "--card-foreground": "#1F315B"
      },
      sacred: {
        "--primary": "#5E3B6C",
        "--accent": "#D4AF63",
        "--secondary": "#2E7C83",
        "--foreground": "#5E3B6C",
        "--primary-foreground": "#F6F1E8",
        "--secondary-foreground": "#F6F1E8",
        "--muted": "#CDBED6",
        "--muted-foreground": "#2E7C83",
        "--accent-foreground": "#5E3B6C",
        "--border": "#B9A9A9",
        "--background": "#F6F1E8",
        "--card": "#FFFFFF",
        "--card-foreground": "#5E3B6C"
      },
      modern: {
        "--primary": "#0F172A",
        "--accent": "#3B82F6",
        "--secondary": "#10B981",
        "--foreground": "#0F172A",
        "--primary-foreground": "#FFFFFF",
        "--secondary-foreground": "#FFFFFF",
        "--muted": "#E2E8F0",
        "--muted-foreground": "#64748B",
        "--accent-foreground": "#FFFFFF",
        "--border": "#CBD5E1",
        "--background": "#F8FAFC",
        "--card": "#FFFFFF",
        "--card-foreground": "#0F172A"
      }
    };

    const darkSchemes = {
      lifecharter: {
        "--primary": "#CDBED6",
        "--accent": "#D4AF63",
        "--secondary": "#D4AF63",
        "--foreground": "#F6F1E8",
        "--primary-foreground": "#1A1A2E",
        "--secondary-foreground": "#1A1A2E",
        "--muted": "#2D3561",
        "--muted-foreground": "#B9A9A9",
        "--accent-foreground": "#1A1A2E",
        "--border": "#2D3561",
        "--background": "#1A1A2E",
        "--card": "#16213E",
        "--card-foreground": "#F6F1E8"
      },
      sacred: {
        "--primary": "#CDBED6",
        "--accent": "#D4AF63",
        "--secondary": "#2E7C83",
        "--foreground": "#F6F1E8",
        "--primary-foreground": "#1A1A2E",
        "--secondary-foreground": "#F6F1E8",
        "--muted": "#2D3561",
        "--muted-foreground": "#B9A9A9",
        "--accent-foreground": "#1A1A2E",
        "--border": "#2D3561",
        "--background": "#1A1A2E",
        "--card": "#16213E",
        "--card-foreground": "#F6F1E8"
      },
      modern: {
        "--primary": "#3B82F6",
        "--accent": "#10B981",
        "--secondary": "#8B5CF6",
        "--foreground": "#F1F5F9",
        "--primary-foreground": "#0F172A",
        "--secondary-foreground": "#F1F5F9",
        "--muted": "#1E293B",
        "--muted-foreground": "#94A3B8",
        "--accent-foreground": "#0F172A",
        "--border": "#334155",
        "--background": "#0F172A",
        "--card": "#1E293B",
        "--card-foreground": "#F1F5F9"
      }
    };

    const scheme = isDarkMode ? darkSchemes[colorScheme] : lightSchemes[colorScheme];
    Object.entries(scheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    try {
      localStorage.setItem("lc-color-scheme", colorScheme);
    } catch {}
  }, [colorScheme, mounted, isDark]);

  // Apply font size changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove("text-size-small", "text-size-medium", "text-size-large");
    root.classList.add(`text-size-${fontSize}`);

    const sizes = {
      small: "14px",
      medium: "16px",
      large: "18px"
    };
    root.style.fontSize = sizes[fontSize];

    try {
      localStorage.setItem("lc-font-size", fontSize);
    } catch {}
  }, [fontSize, mounted]);

  // Apply compact mode changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    try {
      localStorage.setItem("lc-compact-mode", compactMode.toString());
    } catch {}
  }, [compactMode, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setColorScheme = (newScheme: ColorScheme) => setColorSchemeState(newScheme);
  const setFontSize = (newSize: FontSize) => setFontSizeState(newSize);
  const setCompactMode = (newCompact: boolean) => setCompactModeState(newCompact);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        colorScheme,
        setColorScheme,
        fontSize,
        setFontSize,
        compactMode,
        setCompactMode,
        isDark,
        mounted
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
