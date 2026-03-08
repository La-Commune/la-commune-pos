import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "[data-theme*='dark']"] as Config["darkMode"],
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
        glass: {
          DEFAULT: "var(--glass)",
          border: "var(--glass-border)",
          hover: "var(--glass-hover)",
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
        cat: {
          1: "var(--cat-1)",
          2: "var(--cat-2)",
          3: "var(--cat-3)",
          4: "var(--cat-4)",
          5: "var(--cat-5)",
          6: "var(--cat-6)",
          7: "var(--cat-7)",
          8: "var(--cat-8)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-ui)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-card)",
        btn: "var(--shadow-btn)",
        modal: "var(--shadow-modal)",
        glow: "var(--shadow-glow)",
      },
      transitionTimingFunction: {
        smooth: "var(--ease)",
      },
    },
  },
  plugins: [],
};

export default config;
