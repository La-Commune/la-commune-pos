"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Navbar from "@/components/layouts/Navbar";
import ToastContainer from "@/components/ui/Toast";
import AutoDarkMode from "@/components/providers/AutoDarkMode";
import RouteGuard from "@/components/providers/RouteGuard";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const sidebarPosition = useUIStore((s) => s.sidebarPosition);
  const density = useUIStore((s) => s.density);
  const panelWidth = useUIStore((s) => s.panelWidth);
  const fontScale = useUIStore((s) => s.fontScale);
  const reducedMotion = useUIStore((s) => s.reducedMotion);
  const highContrast = useUIStore((s) => s.highContrast);
  const largeTouchTargets = useUIStore((s) => s.largeTouchTargets);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showSidebar = sidebarPosition === "left" || sidebarPosition === "left-mini";

  const getMarginClass = () => {
    if (!showSidebar) return "ml-0";
    if (sidebarPosition === "left-mini") return "ml-[76px]";
    return sidebarCollapsed ? "ml-[72px]" : "ml-[240px]";
  };

  return (
    <div
      className="min-h-screen bg-surface-0"
      data-density={density !== "comfortable" ? density : undefined}
      data-panel={panelWidth !== "default" ? panelWidth : undefined}
      data-font-scale={fontScale !== 100 ? fontScale : undefined}
      data-reduced-motion={reducedMotion ? "true" : undefined}
      data-high-contrast={highContrast ? "true" : undefined}
      data-large-touch={largeTouchTargets ? "true" : undefined}
    >
      <AutoDarkMode />
      {showSidebar && <Sidebar />}
      <div
        className={cn(
          "transition-all duration-200 ease-smooth",
          mounted ? getMarginClass() : "ml-[240px]"
        )}
      >
        <Navbar />
        <main
          className="bg-surface-1 min-h-[calc(100vh-3.5rem)]"
          style={{ padding: "var(--density-page-padding)" }}
        >
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
