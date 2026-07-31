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
        "lc-indigo": "#1a2b4a",
        "lc-plum": "#7b6b8d",
        "lc-teal": "#4a9b9b",
        "lc-lavender": "#e8e4f0",
        "lc-gold": "#c9a227",
        "lc-ivory": "#F8F5F0",
        "lc-taupe": "#b8a898",
        
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
        "lc": "0 4px 20px rgba(26, 43, 74, 0.08)",
        "lc-lg": "0 8px 40px rgba(26, 43, 74, 0.12)",
        "soft": "0 4px 20px rgba(26, 43, 74, 0.08)",
        "soft-lg": "0 8px 30px rgba(26, 43, 74, 0.12)",
        "glow": "0 0 20px rgba(201, 162, 39, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
