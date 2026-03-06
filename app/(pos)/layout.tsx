"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Navbar from "@/components/layouts/Navbar";
import ToastContainer from "@/components/ui/Toast";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, sidebarPosition, density, panelWidth } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showSidebar = sidebarPosition === "left" || sidebarPosition === "left-mini";

  /* Margin-left for content area */
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
    >
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
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
