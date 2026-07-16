import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // LifeCharter Brand Palette (Light Mode)
        "lc-indigo": "#1F315B",
        "lc-plum": "#5E3B6C",
        "lc-teal": "#2E7C83",
        "lc-lavender": "#CDBED6",
        "lc-gold": "#D4AF63",
        "lc-ivory": "#F6F1E8",
        "lc-taupe": "#B9A9A9",
        
        // Dark Mode variants
        "lc-dark-bg": "#1A1A2E",
        "lc-dark-panel": "#16213E",
        "lc-dark-border": "#2D3561",
        
        // Semantic colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        "lc": "12px",
        "lc-lg": "16px",
        "lc-xl": "24px",
      },
      boxShadow: {
        "lc": "0 4px 20px rgba(31, 49, 91, 0.08)",
        "lc-lg": "0 8px 40px rgba(31, 49, 91, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
