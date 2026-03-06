"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  CreditCard,
  BarChart3,
  Users,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mesas", label: "Mesas", icon: LayoutGrid },
  { href: "/ordenes", label: "Ordenes", icon: ClipboardList },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/kds", label: "Cocina", icon: ChefHat },
  { href: "/cobros", label: "Cobros", icon: CreditCard },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/fidelidad", label: "Fidelidad", icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-1 border-r border-border"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Link href="/mesas" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-accent-mid flex items-center justify-center flex-shrink-0">
            <span className="font-display text-accent text-sm">LC</span>
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-text-100 text-lg truncate"
            >
              La Commune
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent-mid text-text-100 shadow-sm"
                  : "text-text-70 hover:text-text-100 hover:bg-surface-2"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "flex-shrink-0",
                  isActive ? "text-accent" : "text-text-45"
                )}
              />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => collapseSidebar(!sidebarCollapsed)}
          className="w-full flex items-center justify-center py-2 rounded-md text-text-45 hover:text-text-70 hover:bg-surface-2 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
