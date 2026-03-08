"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Coffee,
  Snowflake,
  Leaf,
  Sunset,
  Sparkles,
  Moon,
  Hexagon,
  Grid3X3,
  List,
  Accessibility,
  Volume2,
  VolumeX,
  Keyboard,
  Sun,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncStore } from "@/store/sync.store";
import { useAuthStore } from "@/store/auth.store";
import {
  useUIStore,
  type SidebarPosition,
  type Density,
  type PanelWidth,
  type FontScale,
  type KDSDisplayMode,
} from "@/store/ui.store";
import { navItems } from "@/components/layouts/Sidebar";
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

/* ── Theme options ── */
const themeOptions = [
  { id: "neo-minimal-warm", label: "Neo-Minimal", icon: Flame, desc: "Premium cálido" },
  { id: "sci-fi-gradient", label: "Sci-Fi", icon: Zap, desc: "Neón futurista" },
  { id: "soft-neumorphism", label: "Neumorphism", icon: Circle, desc: "Táctil físico" },
  { id: "glass-layered", label: "Glass", icon: Layers, desc: "Cristal elegante" },
  { id: "mono-editorial", label: "Editorial", icon: Type, desc: "B&N alta cocina" },
  { id: "terracotta-bistro", label: "Terracotta", icon: Coffee, desc: "Café artesanal" },
  { id: "nordic-frost", label: "Nordic", icon: Snowflake, desc: "Escandinavo frío" },
  { id: "matcha-zen", label: "Matcha", icon: Leaf, desc: "Zen orgánico" },
  { id: "sunset-diner", label: "Sunset", icon: Sunset, desc: "Retro neón cálido" },
  { id: "lavender-dream", label: "Lavender", icon: Sparkles, desc: "Pastel moderno" },
  { id: "obsidian-amoled", label: "Obsidian", icon: Moon, desc: "OLED nocturno" },
  { id: "copper-industrial", label: "Copper", icon: Hexagon, desc: "Industrial cobre" },
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

/* ── Font scale options ── */
const fontScaleOptions: { id: FontScale; label: string }[] = [
  { id: 90, label: "90%" },
  { id: 100, label: "100%" },
  { id: 110, label: "110%" },
  { id: 120, label: "120%" },
];

/* ── KDS Display modes ── */
const kdsDisplayOptions: { id: KDSDisplayMode; label: string }[] = [
  { id: "classic", label: "Kanban" },
  { id: "tiled", label: "Grid" },
  { id: "split", label: "Dividido" },
];

/* ── Settings sections ── */
type SettingsSection = "main" | "apariencia" | "layout" | "accesibilidad" | "kds" | "atajos" | "auto-dark";

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
function SegmentedControl<T extends string | number>({
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
          key={String(opt.id)}
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
   Toggle — reusable
   ════════════════════════════════════ */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2 text-[11px] font-medium text-text-70 hover:text-text-100 transition-colors"
    >
      <span>{label}</span>
      <div className={cn(
        "w-9 h-5 rounded-full transition-colors duration-200 relative",
        checked ? "bg-accent" : "bg-surface-4"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0.5"
        )} />
      </div>
    </button>
  );
}

/* ════════════════════════════════════
   SettingsPanel — all customization
   ════════════════════════════════════ */
function SettingsPanel({ onClose, anchorRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const { theme, setTheme } = useTheme();
  const store = useUIStore();

  /* When user manually picks a theme, disable auto dark mode */
  const handleSetTheme = (id: string) => {
    if (store.autoDarkMode) {
      store.setAutoDarkMode(false);
    }
    setTheme(id);
  };
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [section, setSection] = useState<SettingsSection>("main");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Calculate position from anchor
  useEffect(() => {
    if (!mounted || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, [mounted, anchorRef]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (section !== "main") setSection("main");
        else onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, section]);

  if (!mounted || !pos) return null;

  const menuItems: { id: SettingsSection; label: string; icon: typeof Settings; desc: string }[] = [
    { id: "apariencia", label: "Apariencia", icon: Flame, desc: "Tema, fuente" },
    { id: "layout", label: "Layout", icon: PanelLeft, desc: "Sidebar, densidad, paneles" },
    { id: "accesibilidad", label: "Accesibilidad", icon: Accessibility, desc: "Movimiento, contraste, touch" },
    { id: "kds", label: "Cocina (KDS)", icon: Grid3X3, desc: "Display, sonidos" },
    { id: "atajos", label: "Atajos de teclado", icon: Keyboard, desc: "Shortcuts" },
    { id: "auto-dark", label: "Auto dark mode", icon: Sun, desc: "Cambio por horario" },
  ];

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed w-80 max-h-[80vh] bg-surface-3 border border-border rounded-xl shadow-lg z-[9999] overflow-hidden flex flex-col"
        style={{ top: pos.top, right: pos.right }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 flex-shrink-0">
          {section !== "main" ? (
            <button
              onClick={() => setSection("main")}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-70 hover:text-text-100 transition-colors"
            >
              <ChevronDown size={14} className="rotate-90" />
              Personalizar
            </button>
          ) : (
            <span className="text-xs font-semibold text-text-100">Personalizar</span>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar personalización"
            className="p-1 rounded-md text-text-45 hover:text-text-70 hover:bg-surface-4 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {section === "main" && (
            <div className="space-y-1 pt-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-text-70 hover:text-text-100 hover:bg-surface-4"
                  >
                    <Icon size={15} className="text-text-45 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium block">{item.label}</span>
                      <span className="text-[10px] text-text-25">{item.desc}</span>
                    </div>
                    <ChevronRight size={14} className="text-text-25" />
                  </button>
                );
              })}
            </div>
          )}

          {/* ── APARIENCIA ── */}
          {section === "apariencia" && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Tema</p>
                <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSetTheme(opt.id)}
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

              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Tamaño de fuente</p>
                <SegmentedControl options={fontScaleOptions} value={store.fontScale} onChange={store.setFontScale} />
              </div>
            </div>
          )}

          {/* ── LAYOUT ── */}
          {section === "layout" && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Sidebar</p>
                <div className="grid grid-cols-4 gap-1">
                  {sidebarOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = store.sidebarPosition === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => store.setSidebarPosition(opt.id)}
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

              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Densidad</p>
                <SegmentedControl options={densityOptions} value={store.density} onChange={store.setDensity} />
              </div>

              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Ancho paneles</p>
                <SegmentedControl options={panelOptions} value={store.panelWidth} onChange={store.setPanelWidth} />
              </div>

              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Vista productos</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => store.setMenuViewMode("grid")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-all",
                      store.menuViewMode === "grid" ? "bg-accent-soft text-accent" : "text-text-45 hover:text-text-70 hover:bg-surface-4"
                    )}
                  >
                    <Grid3X3 size={14} /> Grid
                  </button>
                  <button
                    onClick={() => store.setMenuViewMode("list")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-all",
                      store.menuViewMode === "list" ? "bg-accent-soft text-accent" : "text-text-45 hover:text-text-70 hover:bg-surface-4"
                    )}
                  >
                    <List size={14} /> Lista
                  </button>
                </div>
              </div>

              {store.menuViewMode === "grid" && (
                <div>
                  <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Tamaño tiles</p>
                  <SegmentedControl
                    options={[
                      { id: "sm" as const, label: "Pequeño" },
                      { id: "md" as const, label: "Normal" },
                      { id: "lg" as const, label: "Grande" },
                    ]}
                    value={store.menuTileSize}
                    onChange={store.setMenuTileSize}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── ACCESIBILIDAD ── */}
          {section === "accesibilidad" && (
            <div className="space-y-1 pt-1">
              <Toggle
                label="Reducir movimiento"
                checked={store.reducedMotion}
                onChange={store.setReducedMotion}
              />
              <Toggle
                label="Alto contraste"
                checked={store.highContrast}
                onChange={store.setHighContrast}
              />
              <Toggle
                label="Targets táctiles grandes"
                checked={store.largeTouchTargets}
                onChange={store.setLargeTouchTargets}
              />
              <div className="pt-2 border-t border-border mt-2">
                <p className="text-[10px] text-text-25 leading-relaxed">
                  &quot;Reducir movimiento&quot; desactiva animaciones y transiciones.
                  &quot;Alto contraste&quot; elimina transparencias glass y usa bordes sólidos.
                  &quot;Targets grandes&quot; agranda botones a mínimo 48px.
                </p>
              </div>
            </div>
          )}

          {/* ── KDS ── */}
          {section === "kds" && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Modo de display</p>
                <SegmentedControl options={kdsDisplayOptions} value={store.kdsDisplayMode} onChange={store.setKDSDisplayMode} />
                <p className="text-[10px] text-text-25 mt-1.5">
                  {store.kdsDisplayMode === "classic" && "Vista kanban con 3 columnas (nueva, preparando, lista)"}
                  {store.kdsDisplayMode === "tiled" && "Grid compacto que muestra más tickets a la vez"}
                  {store.kdsDisplayMode === "split" && "Dividido: mesa arriba, para llevar abajo"}
                </p>
              </div>

              <div className="space-y-1">
                <Toggle
                  label="Sonidos habilitados"
                  checked={store.kdsSoundEnabled}
                  onChange={store.setKDSSoundEnabled}
                />
                <Toggle
                  label="Alerta urgente (>10min)"
                  checked={store.kdsUrgentSound}
                  onChange={store.setKDSUrgentSound}
                />
              </div>

              {store.kdsSoundEnabled && (
                <div>
                  <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Volumen</p>
                  <div className="flex items-center gap-3">
                    <VolumeX size={14} className="text-text-25 flex-shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={store.kdsSoundVolume}
                      onChange={(e) => store.setKDSSoundVolume(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer accent-accent"
                    />
                    <Volume2 size={14} className="text-text-45 flex-shrink-0" />
                    <span className="text-[11px] text-text-45 tabular-nums w-8 text-right">{store.kdsSoundVolume}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ATAJOS DE TECLADO ── */}
          {section === "atajos" && (
            <div className="space-y-3 pt-1">
              <Toggle
                label="Atajos habilitados"
                checked={store.keyboardShortcutsEnabled}
                onChange={store.setKeyboardShortcutsEnabled}
              />
              <div className="space-y-1 pt-1">
                {Object.values(SHORTCUTS).map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1.5">
                    <span className="text-[11px] text-text-70">{s.label}</span>
                    <kbd className="text-[10px] font-mono bg-surface-2 text-text-45 px-2 py-0.5 rounded border border-border">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AUTO DARK MODE ── */}
          {section === "auto-dark" && (
            <div className="space-y-4 pt-1">
              <Toggle
                label="Activar cambio automático"
                checked={store.autoDarkMode}
                onChange={store.setAutoDarkMode}
              />

              {store.autoDarkMode && (
                <>
                  <div>
                    <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Horario oscuro</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-text-45 block mb-1">Inicia</label>
                        <select
                          value={store.autoDarkStart}
                          onChange={(e) => store.setAutoDarkStart(Number(e.target.value))}
                          className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-100 focus:outline-none focus:border-accent"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-text-25 text-xs mt-4">→</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-text-45 block mb-1">Termina</label>
                        <select
                          value={store.autoDarkEnd}
                          onChange={(e) => store.setAutoDarkEnd(Number(e.target.value))}
                          className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-100 focus:outline-none focus:border-accent"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Tema de día</p>
                    <select
                      value={store.autoDarkLightTheme}
                      onChange={(e) => store.setAutoDarkLightTheme(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-100 focus:outline-none focus:border-accent"
                    >
                      {themeOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Tema de noche</p>
                    <select
                      value={store.autoDarkDarkTheme}
                      onChange={(e) => store.setAutoDarkDarkTheme(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-[11px] text-text-100 focus:outline-none focus:border-accent"
                    >
                      {themeOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
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
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
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
  const settingsRef = useRef<HTMLDivElement>(null);

  /* Activate keyboard shortcuts */
  useKeyboardShortcuts();

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
        <div className="relative" ref={settingsRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); }}
            aria-label="Personalizar POS"
            aria-expanded={settingsOpen}
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
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} anchorRef={settingsRef} />}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuUsuario(!menuUsuario)}
              aria-label={`Menú de ${user?.nombre || 'usuario'}`}
              aria-expanded={menuUsuario}
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
                    onClick={async () => {
                      setMenuUsuario(false);
                      await logout();
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
