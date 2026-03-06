import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },
        text: {
          100: "var(--text-100)",
          70: "var(--text-70)",
          45: "var(--text-45)",
          25: "var(--text-25)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          mid: "var(--accent-mid)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
          active: "var(--border-active)",
        },
        status: {
          ok: "var(--ok)",
          warn: "var(--warn)",
          err: "var(--err)",
          info: "var(--info)",
          "ok-bg": "var(--ok-bg)",
          "warn-bg": "var(--warn-bg)",
          "err-bg": "var(--err-bg)",
          "info-bg": "var(--info-bg)",
        },
        category: {
          1: "var(--cat-1)",
          2: "var(--cat-2)",
          3: "var(--cat-3)",
          4: "var(--cat-4)",
          5: "var(--cat-5)",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.25)",
        md: "0 4px 16px rgba(0,0,0,0.2)",
        lg: "0 8px 32px rgba(0,0,0,0.25)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
