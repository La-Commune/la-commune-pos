"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui.store";

const SHORTCUTS: Record<string, { key: string; label: string; route?: string; action?: string }> = {
  "F1": { key: "F1", label: "Buscar", action: "search" },
  "F2": { key: "F2", label: "Nueva orden", route: "/ordenes?nueva=1" },
  "F3": { key: "F3", label: "Mesas", route: "/mesas" },
  "F4": { key: "F4", label: "Menú", route: "/menu" },
  "F5": { key: "F5", label: "Cocina (KDS)", route: "/kds" },
  "F8": { key: "F8", label: "Cobros", route: "/cobros" },
  "F9": { key: "F9", label: "Reportes", route: "/reportes" },
  "F10": { key: "F10", label: "Caja", route: "/caja" },
};

export { SHORTCUTS };

export function useKeyboardShortcuts() {
  const router = useRouter();
  const enabled = useUIStore((s) => s.keyboardShortcutsEnabled);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const shortcut = SHORTCUTS[e.key];
      if (!shortcut) return;

      e.preventDefault();

      if (shortcut.route) {
        router.push(shortcut.route);
      }

      if (shortcut.action === "search") {
        // Focus the first search input on the page
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Buscar"]');
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, router]);
}
