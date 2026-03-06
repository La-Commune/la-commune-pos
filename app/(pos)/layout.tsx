"use client";

import Sidebar from "@/components/layouts/Sidebar";
import Navbar from "@/components/layouts/Navbar";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-200 ease-smooth",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <Navbar />
        <main className="p-8 bg-surface-1 min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
