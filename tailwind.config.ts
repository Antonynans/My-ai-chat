import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        sidebar: "var(--sidebar)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        border: "var(--border)",
        border2: "var(--border2)",
        border3: "var(--border3)",
        text: "var(--text)",
        text2: "var(--text2)",
        text3: "var(--text3)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        "accent-bg": "var(--accent-bg)",
        ai: "var(--ai)",
        "ai-bg": "var(--ai-bg)",
        "ai-border": "var(--ai-border)",
        online: "var(--online)",
        away: "var(--away)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: "var(--ff-display)",
        sans: "var(--ff)",
        mono: "var(--ff-mono)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(6px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        blink: {
          "0%, 80%, 100%": {
            opacity: "0.2",
            transform: "scale(0.85)",
          },
          "40%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.18s ease forwards",
        "fade-in": "fade-in 0.15s ease forwards",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
