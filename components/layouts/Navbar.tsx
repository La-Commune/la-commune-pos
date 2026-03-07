"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Clock,
  LogOut,
  ChevronDown,
  Settings,
  Flame,
  Zap,
  Circle,
  Layers,
  Type,
  PanelLeft,
  AlignJustify,
  PanelTop,
  EyeOff,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncStore } from "@/store/sync.store";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore, type SidebarPosition, type Density, type PanelWidth } from "@/store/ui.store";
import { navItems } from "@/components/layouts/Sidebar";
import { cn } from "@/lib/utils";

/* ── Theme options ── */
const themeOptions = [
  { id: "neo-minimal-warm", label: "Neo-Minimal", icon: Flame, desc: "Premium cálido" },
  { id: "sci-fi-gradient", label: "Sci-Fi", icon: Zap, desc: "Neón futurista" },
  { id: "soft-neumorphism", label: "Neumorphism", icon: Circle, desc: "Táctil físico" },
  { id: "glass-layered", label: "Glass", icon: Layers, desc: "Cristal elegante" },
  { id: "mono-editorial", label: "Editorial", icon: Type, desc: "B&N alta cocina" },
] as const;

/* ── Sidebar position options ── */
const sidebarOptions: { id: SidebarPosition; label: string; icon: typeof PanelLeft }[] = [
  { id: "left", label: "Expandible", icon: PanelLeft },
  { id: "left-mini", label: "Mini", icon: AlignJustify },
  { id: "top", label: "Superior", icon: PanelTop },
  { id: "hidden", label: "Oculto", icon: EyeOff },
];

/* ── Density options ── */
const densityOptions: { id: Density; label: string }[] = [
  { id: "spacious", label: "Espacioso" },
  { id: "comfortable", label: "Normal" },
  { id: "compact", label: "Compacto" },
];

/* ── Panel width options ── */
const panelOptions: { id: PanelWidth; label: string }[] = [
  { id: "narrow", label: "Angosto" },
  { id: "default", label: "Normal" },
  { id: "wide", label: "Amplio" },
];

/* ════════════════════════════════════
   LiveClock
   ════════════════════════════════════ */
function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 text-text-45 text-xs tabular-nums">
      <Clock size={14} />
      {time}
    </div>
  );
}

/* ════════════════════════════════════
   SegmentedControl — generic
   ════════════════════════════════════ */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-surface-2 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200",
            value === opt.id
              ? "bg-surface-4 text-text-100 shadow-sm"
              : "text-text-45 hover:text-text-70"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════
   SettingsPanel — all customization
   ════════════════════════════════════ */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { sidebarPosition, density, panelWidth, setSidebarPosition, setDensity, setPanelWidth } =
    useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 w-72 bg-surface-3 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-xs font-semibold text-text-100">Personalizar</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-45 hover:text-text-70 hover:bg-surface-4 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* ── Tema ── */}
          <div>
            <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">
              Tema
            </p>
            <div className="space-y-0.5">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-text-70 hover:text-text-100 hover:bg-surface-4"
                    )}
                  >
                    <Icon size={14} className={isActive ? "text-accent" : "text-text-45"} />
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[11px] font-medium block", isActive && "text-accent")}>
                        {opt.label}
                      </span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sidebar Position ── */}
          <div>
            <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">
              Sidebar
            </p>
            <div className="grid grid-cols-4 gap-1">
              {sidebarOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = sidebarPosition === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSidebarPosition(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-text-45 hover:text-text-70 hover:bg-surface-4"
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-[9px] font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Densidad ── */}
          <div>
            <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">
              Densidad
            </p>
            <SegmentedControl options={densityOptions} value={density} onChange={setDensity} />
          </div>

          {/* ── Panel Width ── */}
          <div>
            <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">
              Ancho paneles
            </p>
            <SegmentedControl options={panelOptions} value={panelWidth} onChange={setPanelWidth} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   Mobile/Hidden Nav — hamburger menu
   ════════════════════════════════════ */
function HamburgerNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-text-45 hover:text-text-70 hover:bg-surface-3 transition-all duration-200"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 w-52 py-1.5 bg-surface-3 border border-border rounded-xl shadow-lg z-50">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-all duration-200",
                    isActive
                      ? "text-text-100 bg-[rgba(255,255,255,0.04)]"
                      : "text-text-45 hover:text-text-70 hover:bg-[rgba(255,255,255,0.03)]"
                  )}
                >
                  <Icon size={15} style={isActive ? { color: item.color } : undefined} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════
   TopNav — horizontal nav for "top" mode
   ════════════════════════════════════ */
function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-[rgba(255,255,255,0.06)] text-text-100"
                : "text-text-45 hover:text-text-70 hover:bg-[rgba(255,255,255,0.03)]"
            )}
          >
            <Icon size={14} style={isActive ? { color: item.color } : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ════════════════════════════════════
   NAVBAR — main component
   ════════════════════════════════════ */
export default function Navbar() {
  const pathname = usePathname();
  const { isOnline, pendingActions, isSyncing } = useSyncStore();
  const { user, logout } = useAuthStore();
  const { sidebarPosition } = useUIStore();
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showHamburger = sidebarPosition === "hidden";
  const showTopNav = sidebarPosition === "top";

  return (
    <header className="h-14 bg-surface-1/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 relative z-50">
      <div id="navbar-title" className="flex items-center gap-3">
        {/* Hamburger for hidden mode */}
        {showHamburger && <HamburgerNav />}

        {/* Logo for top/hidden mode (sidebar not visible) */}
        {(showTopNav || showHamburger) && (
          <Link href="/mesas" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-[#7B6CE0] flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-xs tracking-tight">LC</span>
            </div>
            <span className="font-semibold text-text-100 text-sm tracking-tight hidden sm:block">
              La Commune
            </span>
          </Link>
        )}

        {/* Top nav for "top" mode */}
        {showTopNav && (
          <div className="ml-4 border-l border-border pl-4">
            <TopNav />
          </div>
        )}

        {/* R14: Title muestra módulo activo + breadcrumb */}
        {!showTopNav && !showHamburger && (() => {
          const activeItem = navItems.find((item) => pathname.startsWith(item.href));
          return (
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-text-45 font-medium">La Commune</span>
              {activeItem && (
                <>
                  <span className="text-text-25">/</span>
                  <span className="text-[15px] font-semibold text-text-100 tracking-tight">
                    {activeItem.label}
                  </span>
                </>
              )}
            </div>
          );
        })()}
      </div>

      <div className="flex items-center gap-3">
        {pendingActions > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-warn-bg text-status-warn text-xs font-medium">
            <RefreshCw
              size={13}
              className={cn(isSyncing && "animate-spin")}
            />
            {pendingActions} pendiente{pendingActions > 1 ? "s" : ""}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
            isOnline
              ? "text-status-ok bg-status-ok-bg"
              : "text-status-err bg-status-err-bg"
          )}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? "En línea" : "Sin conexión"}
        </div>

        <LiveClock />

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
              settingsOpen
                ? "bg-accent-soft text-accent"
                : "text-text-45 hover:text-text-70 hover:bg-surface-3"
            )}
            title="Personalizar"
          >
            <Settings size={16} />
          </button>
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuUsuario(!menuUsuario)}
              className="flex items-center gap-2.5 ml-2 pl-3 border-l border-border hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <User size={14} className="text-accent" />
              </div>
              <div className="text-xs text-left">
                <p className="text-text-100 font-medium">{user.nombre}</p>
                <p className="text-text-45 capitalize">{user.rol}</p>
              </div>
              <ChevronDown size={14} className="text-text-45" />
            </button>

            {menuUsuario && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuUsuario(false)} />
                <div className="absolute right-0 top-14 w-48 py-1.5 bg-surface-3 border border-border rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setMenuUsuario(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-status-err hover:bg-status-err-bg transition-all duration-200"
                  >
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
