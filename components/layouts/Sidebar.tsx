"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Vault,
} from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useNegocio } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types/database";

/* Role-based access: which roles can see which routes */
const ROLE_ACCESS: Record<string, RolUsuario[]> = {
  "/mesas": ["admin", "camarero", "barista"],
  "/ordenes": ["admin", "camarero", "barista"],
  "/menu": ["admin"],
  "/kds": ["admin", "cocina"],
  "/cobros": ["admin", "camarero", "barista"],
  "/caja": ["admin"],
  "/reportes": ["admin"],
  "/usuarios": ["admin"],
  "/fidelidad": ["admin", "camarero"],
};

/* Default landing page per role */
export const ROLE_HOME: Record<RolUsuario, string> = {
  admin: "/mesas",
  camarero: "/mesas",
  barista: "/ordenes",
  cocina: "/kds",
};

export const navItems = [
  { href: "/mesas", label: "Mesas", icon: LayoutGrid, color: "#7EC8E3" },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList, color: "#9B8AFB" },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed, color: "#81D4A8" },
  { href: "/kds", label: "Cocina", icon: ChefHat, color: "#FFB347" },
  { href: "/cobros", label: "Cobros", icon: CreditCard, color: "#F5C26B" },
  { href: "/caja", label: "Caja", icon: Vault, color: "#34D399" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, color: "#60A5FA" },
  { href: "/usuarios", label: "Usuarios", icon: Users, color: "#F2A7C3" },
  { href: "/fidelidad", label: "Fidelidad", icon: Heart, color: "#B8A9EA" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar, sidebarPosition } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const negocio = useNegocio();

  /* Filter nav items by role */
  const filteredItems = navItems.filter((item) => {
    if (!user) return true; // dev mode: show all
    const allowed = ROLE_ACCESS[item.href];
    if (!allowed) return true;
    return allowed.includes(user.rol);
  });

  /* left-mini: always collapsed, no toggle */
  const isMini = sidebarPosition === "left-mini";
  const isCollapsed = isMini || sidebarCollapsed;

  // Generar iniciales del nombre del negocio (máx 2 letras)
  const iniciales = negocio.nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-1 border-r border-border"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center relative",
        isCollapsed ? "justify-center px-2 h-[72px]" : "px-5 h-[72px]"
      )}>
        <Link href="/mesas" className="flex items-center gap-3.5 min-w-0 group relative">
          {/* Logo mark */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <div
              className="absolute inset-0 rounded-xl transition-all duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #000) 100%)",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 25%, transparent)",
              }}
            />
            <span className="relative z-10 flex items-center justify-center w-full h-full text-white font-display font-bold text-[14px] tracking-wide leading-none">
              {iniciales}
            </span>
          </div>

          {/* Texto con AnimatePresence */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="brand-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="min-w-0 overflow-hidden flex flex-col"
              >
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-display font-semibold text-text-100 text-base tracking-tight block whitespace-nowrap leading-tight"
                >
                  {negocio.nombre}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                  className="text-[10px] text-text-25 uppercase tracking-[0.18em] whitespace-nowrap mt-0.5"
                >
                  Punto de venta
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip en modo colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-50">
              <div className="bg-surface-3 text-text-100 text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border border-border">
                {negocio.nombre}
              </div>
            </div>
          )}
        </Link>

        {/* Separador gradiente */}
        <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto", isCollapsed ? "px-2" : "px-3")}>
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
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
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            aria-expanded={!sidebarCollapsed}
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
