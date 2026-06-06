"use client";

/* ============================================================
   POSLayout — PoC dirección V3 "Barra":
   ShellV3 (riel + dock tablet-nativo) reemplaza Sidebar + Navbar.
   Se conservan AutoDarkMode, RouteGuard, PageTransition y Toasts.
   ============================================================ */

import { useState, useEffect } from "react";
import ShellV3 from "@/components/layouts/ShellV3";
import ToastContainer from "@/components/ui/Toast";
import AutoDarkMode from "@/components/providers/AutoDarkMode";
import RouteGuard from "@/components/providers/RouteGuard";
import PageTransition from "@/components/ui/PageTransition";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent flash: don't render layout chrome until mounted (hydration-safe)
  if (!mounted) {
    return <div className="min-h-screen bg-surface-0" />;
  }

  return (
    <div className="min-h-screen">
      <AutoDarkMode />
      <ShellV3>
        <RouteGuard>
          <PageTransition>{children}</PageTransition>
        </RouteGuard>
        {/* dentro del shell: hereda el puente de tokens V3 (posición fixed no cambia) */}
        <ToastContainer />
      </ShellV3>
    </div>
  );
}
