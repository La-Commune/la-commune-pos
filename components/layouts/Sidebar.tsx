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

export const navItems = [
  { href: "/mesas", label: "Mesas", icon: LayoutGrid, color: "#7EC8E3" },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList, color: "#9B8AFB" },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed, color: "#81D4A8" },
  { href: "/kds", label: "Cocina", icon: ChefHat, color: "#FFB347" },
  { href: "/cobros", label: "Cobros", icon: CreditCard, color: "#F5C26B" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, color: "#60A5FA" },
  { href: "/usuarios", label: "Usuarios", icon: Users, color: "#F2A7C3" },
  { href: "/fidelidad", label: "Fidelidad", icon: Heart, color: "#B8A9EA" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar, sidebarPosition } = useUIStore();

  /* left-mini: always collapsed, no toggle */
  const isMini = sidebarPosition === "left-mini";
  const isCollapsed = isMini || sidebarCollapsed;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-1 border-r border-border"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Link href="/mesas" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-[#7B6CE0] flex items-center justify-center flex-shrink-0 shadow-glow">
            <span className="text-white font-bold text-sm tracking-tight">LC</span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="min-w-0"
            >
              <span className="font-semibold text-text-100 text-[15px] tracking-tight block">
                La Commune
              </span>
              <span className="text-[10px] text-text-45 uppercase tracking-widest">
                Punto de venta
              </span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto", isCollapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-200",
                isCollapsed
                  ? "justify-center py-2.5 px-0"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-[rgba(255,255,255,0.06)] text-text-100"
                  : "text-text-45 hover:text-text-70 hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              {/* Barra lateral activa en modo colapsado */}
              {isActive && isCollapsed && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                  isActive
                    ? "shadow-sm"
                    : "bg-transparent group-hover:bg-[rgba(255,255,255,0.03)]"
                )}
                style={
                  isActive
                    ? { backgroundColor: `${item.color}15`, color: item.color }
                    : undefined
                }
              >
                <Icon
                  size={18}
                  style={isActive ? { color: item.color } : undefined}
                  className={cn(
                    "transition-all duration-200",
                    !isActive && "text-text-45 group-hover:text-text-70"
                  )}
                />
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — only for "left" mode */}
      {!isMini && (
        <div className="p-3 border-t border-border">
          <button
            onClick={() => collapseSidebar(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2.5 rounded-lg text-text-45 hover:text-text-70 hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>
      )}
    </motion.aside>
  );
}
