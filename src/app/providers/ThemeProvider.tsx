/**
 * Theme Provider
 * Manages theme, color scheme, font size, and compact mode
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ColorScheme = "lifecharter" | "sacred" | "modern";
type FontSize = "small" | "medium" | "large";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("lifecharter");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [compactMode, setCompactModeState] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem("theme") as Theme;
    const savedColorScheme = localStorage.getItem("colorScheme") as ColorScheme;
    const savedFontSize = localStorage.getItem("fontSize") as FontSize;
    const savedCompactMode = localStorage.getItem("compactMode");

    if (savedTheme) setThemeState(savedTheme);
    if (savedColorScheme) setColorSchemeState(savedColorScheme);
    if (savedFontSize) setFontSizeState(savedFontSize);
    if (savedCompactMode !== null) setCompactModeState(savedCompactMode === "true");
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark");
    
    // Apply theme
    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
      setIsDark(systemDark);
    } else {
      root.classList.add(theme);
      setIsDark(theme === "dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Handle color scheme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove all color scheme classes
    root.classList.remove("scheme-lifecharter", "scheme-sacred", "scheme-modern");
    
    // Apply color scheme
    root.classList.add(`scheme-${colorScheme}`);
    
    // Apply CSS variables based on color scheme
    const schemes = {
      lifecharter: {
        "--primary": "#1F315B",
        "--accent": "#D4AF63",
        "--secondary": "#5E3B6C",
        "--tertiary": "#2E7C83"
      },
      sacred: {
        "--primary": "#5E3B6C",
        "--accent": "#D4AF63",
        "--secondary": "#2E7C83",
        "--tertiary": "#1F315B"
      },
      modern: {
        "--primary": "#0F172A",
        "--accent": "#3B82F6",
        "--secondary": "#10B981",
        "--tertiary": "#8B5CF6"
      }
    };

    const scheme = schemes[colorScheme];
    Object.entries(scheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    localStorage.setItem("colorScheme", colorScheme);
  }, [colorScheme, mounted]);

  // Handle font size changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove all font size classes
    root.classList.remove("text-size-small", "text-size-medium", "text-size-large");
    
    // Apply font size
    root.classList.add(`text-size-${fontSize}`);
    
    // Set base font size
    const sizes = {
      small: "14px",
      medium: "16px",
      large: "18px"
    };
    root.style.fontSize = sizes[fontSize];

    localStorage.setItem("fontSize", fontSize);
  }, [fontSize, mounted]);

  // Handle compact mode changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    if (compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }

    localStorage.setItem("compactMode", compactMode.toString());
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

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        colorScheme,
        setColorScheme,
        fontSize,
        setFontSize,
        compactMode,
        setCompactMode,
        isDark
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
