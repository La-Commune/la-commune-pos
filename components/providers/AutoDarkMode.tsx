"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/store/ui.store";

/**
 * Isolated component for auto dark mode.
 * Separated from layout to avoid re-render loops with next-themes.
 * Only calls setTheme when autoDarkMode is enabled.
 */
export default function AutoDarkMode() {
  const autoDarkMode = useUIStore((s) => s.autoDarkMode);
  const autoDarkStart = useUIStore((s) => s.autoDarkStart);
  const autoDarkEnd = useUIStore((s) => s.autoDarkEnd);
  const autoDarkLightTheme = useUIStore((s) => s.autoDarkLightTheme);
  const autoDarkDarkTheme = useUIStore((s) => s.autoDarkDarkTheme);
  const { setTheme } = useTheme();

  // Ref to avoid setTheme causing re-renders in deps
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;

  useEffect(() => {
    if (!autoDarkMode) return;

    const check = () => {
      const hour = new Date().getHours();
      const isDark = autoDarkStart > autoDarkEnd
        ? (hour >= autoDarkStart || hour < autoDarkEnd)
        : (hour >= autoDarkStart && hour < autoDarkEnd);
      setThemeRef.current(isDark ? autoDarkDarkTheme : autoDarkLightTheme);
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [autoDarkMode, autoDarkStart, autoDarkEnd, autoDarkLightTheme, autoDarkDarkTheme]);

  return null;
}
