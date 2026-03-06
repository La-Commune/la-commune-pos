import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "[data-theme*='dark']"] as any,
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
          bebidas: "var(--cat-bebidas)",
          cafe: "var(--cat-cafe)",
          postres: "var(--cat-postres)",
          comida: "var(--cat-comida)",
          panaderia: "var(--cat-panaderia)",
          ensaladas: "var(--cat-ensaladas)",
          desayunos: "var(--cat-desayunos)",
          especiales: "var(--cat-especiales)",
        },
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.2)",
        md: "0 4px 20px rgba(0,0,0,0.25)",
        lg: "0 8px 40px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(155,138,251,0.15)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
