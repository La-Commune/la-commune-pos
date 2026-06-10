"use client";

/* ============================================================
   ShellV3 — "Barra" · Decisiones V3 aprobadas
   ≥1024px: solo dock derecho (sin rail). Dock colapsado 72px /
   expandido 200px como overlay. Split-dock-item "Nueva orden".
   ≤1023px: topbar horizontal + barra de acciones inferior.
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import {
  Home,
  LayoutGrid,
  ClipboardList,
  CreditCard,
  ChefHat,
  BarChart3,
  MoreHorizontal,
  Plus,
  Coffee,
  Heart,
  Wallet,
  Users,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useSyncStore } from "@/store/sync.store";
import styles from "./shell-v3.module.css";

const fontUI = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-v3-ui",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-v3-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/mesas", label: "Mesas", icon: LayoutGrid },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList },
  { href: "/cobros", label: "Cobros", icon: CreditCard },
  { href: "/kds", label: "Cocina", icon: ChefHat },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

const MORE = [
  { href: "/menu", label: "Menú", icon: Coffee },
  { href: "/fidelidad", label: "Fidelidad", icon: Heart },
  { href: "/caja", label: "Caja", icon: Wallet },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function useReloj() {
  const [hora, setHora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return hora;
}

export default function ShellV3({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useSyncStore((s) => s.isOnline);
  const pendientes = useSyncStore((s) => s.pendingActions);
  const hora = useReloj();

  const [moreOpen, setMoreOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);

  const dockRef = useRef<HTMLElement>(null);

  // Cerrar dock al hacer tap fuera (tablet)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setDockOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cerrar dock al navegar
  useEffect(() => {
    setDockOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const iniciales = (user?.nombre ?? "David San")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nombreCorto = user?.nombre?.split(" ")[0] ?? "David";

  const esActiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const enMore = MORE.some((m) => esActiva(m.href));

  const syncLabel = !isOnline ? "SIN RED" : pendientes > 0 ? `${pendientes} EN COLA` : "EN VIVO";
  const syncWarn = !isOnline || pendientes > 0;

  const handleLogout = async () => {
    setMoreOpen(false);
    setDockOpen(false);
    await logout();
    router.push("/login");
  };

  const horaStr = hora.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className={cn(styles.shell, fontUI.variable, fontMono.variable)}>
      {/* ── TOPBAR (mobile + portrait tablet) ── */}
      <nav className={styles.rail}>
        <div className={styles.logo}>LC</div>
        <div className={styles.nav}>
          {NAV.map(({ href, label, icon: IconComp }) => (
            <Link
              key={href}
              href={href}
              className={cn(styles.navItem, esActiva(href) && styles.navOn)}
              title={label}
            >
              <IconComp size={21} strokeWidth={1.75} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
          <button
            type="button"
            className={cn(styles.navItem, (moreOpen || enMore) && styles.navOn)}
            onClick={() => setMoreOpen((v) => !v)}
            title="Más módulos"
          >
            <MoreHorizontal size={21} strokeWidth={1.75} />
            <span className={styles.navLabel}>Más</span>
          </button>
        </div>
        <div className={styles.railFoot}>
          <div className={styles.liveTop}>
            <i className={cn(styles.dot, syncWarn && styles.dotWarn)} />
            {syncLabel}
          </div>
          {moreOpen && (
            <>
              <button
                type="button"
                className={styles.morePopBackdrop}
                aria-label="Cerrar menú"
                onClick={() => setMoreOpen(false)}
              />
              <div className={styles.morePop}>
                {MORE.map(({ href, label, icon: IconComp }) => (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                    <IconComp size={17} strokeWidth={1.75} />
                    {label}
                  </Link>
                ))}
                <button type="button" className={styles.morePopSalir} onClick={handleLogout}>
                  <LogOut size={17} strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            className={styles.avatar}
            title={user?.nombre ?? "Usuario"}
            onClick={() => router.push("/configuracion")}
          >
            {iniciales}
          </button>
        </div>
      </nav>

      {/* ── ZONA DE TRABAJO ── */}
      <main className={styles.main}>{children}</main>

      {/* ── DOCK (≥1024px: reemplaza al rail como navegación principal) ── */}
      <aside
        ref={dockRef}
        className={styles.dock}
        onMouseEnter={() => setDockOpen(true)}
        onMouseLeave={() => {
          if (!moreOpen) setDockOpen(false);
        }}
      >
        <div className={cn(styles.dockPanel, dockOpen && styles.dockPanelOpen)}>
          {/* Logo compacto */}
          <div className={styles.dockLogo}>LC</div>

          {/* Nav items — reemplaza al rail en landscape */}
          <nav className={styles.dockNav}>
            {NAV.map(({ href, label, icon: IconComp }) => (
              <Link
                key={href}
                href={href}
                className={cn(styles.dockNavItem, esActiva(href) && styles.dockNavOn)}
                title={label}
              >
                <span className={styles.dockNavIcon}>
                  <IconComp size={20} strokeWidth={1.75} />
                </span>
                <span className={styles.dockNavLabel}>{label}</span>
              </Link>
            ))}

            {/* "Más" con popover */}
            <button
              type="button"
              className={cn(styles.dockNavItem, (moreOpen || enMore) && styles.dockNavOn)}
              onClick={() => setMoreOpen((v) => !v)}
              title="Más módulos"
            >
              <span className={styles.dockNavIcon}>
                <MoreHorizontal size={20} strokeWidth={1.75} />
              </span>
              <span className={styles.dockNavLabel}>Más</span>
            </button>
          </nav>

          {/* Popover "Más" en contexto de dock */}
          {moreOpen && (
            <>
              <button
                type="button"
                className={styles.morePopBackdrop}
                aria-label="Cerrar menú"
                onClick={() => setMoreOpen(false)}
              />
              <div className={styles.morePop}>
                {MORE.map(({ href, label, icon: IconComp }) => (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                    <IconComp size={17} strokeWidth={1.75} />
                    {label}
                  </Link>
                ))}
                <button type="button" className={styles.morePopSalir} onClick={handleLogout}>
                  <LogOut size={17} strokeWidth={1.75} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}

          {/* Separador */}
          <div className={styles.dockSep} />

          {/* Split-dock-item: "Nueva orden" */}
          <div className={styles.splitDock}>
            {/* Cuerpo principal → /ordenes */}
            <button
              type="button"
              className={styles.splitDockMain}
              onClick={() => router.push("/ordenes")}
              title="Nueva orden"
            >
              <span className={styles.dockNavIcon}>
                <Plus size={20} strokeWidth={2.2} />
              </span>
              <span className={styles.splitDockLabel}>Nueva orden</span>
            </button>
            {/* "+" esquina → crear orden rápida */}
            <button
              type="button"
              className={styles.splitDockPlus}
              onClick={(e) => {
                e.stopPropagation();
                router.push("/ordenes?nueva=1");
              }}
              aria-label="Crear nueva orden rápida"
            >
              <Plus size={11} strokeWidth={2.5} />
            </button>
          </div>

          {/* Footer: avatar + sync + hora */}
          <div className={styles.dockFoot}>
            {/* Avatar row */}
            <div className={styles.dockAvatarRow}>
              <button
                type="button"
                className={styles.dockAvatar}
                title={user?.nombre ?? "Usuario"}
                onClick={() => router.push("/configuracion")}
              >
                {iniciales}
              </button>
              <span className={styles.dockAvatarLabel}>{nombreCorto}</span>
            </div>
            {/* Sync + hora */}
            <div className={styles.live}>
              <i className={cn(styles.dot, syncWarn && styles.dotWarn)} />
              <span className={styles.liveLabel}>{syncLabel}</span>
            </div>
            <div className={styles.horaFoot}>{horaStr}</div>
          </div>
        </div>
      </aside>

      {/* ── BARRA DE ACCIONES inferior (portrait + phone) ── */}
      <div className={styles.actionbar}>
        <button type="button" className={styles.abAct} onClick={() => router.push("/mesas")}>
          <LayoutGrid size={20} strokeWidth={1.75} />
          <span className={styles.abLabel}>Mesas</span>
        </button>
        <button type="button" className={styles.abAct} onClick={() => router.push("/cobros")}>
          <CreditCard size={20} strokeWidth={1.75} />
          <span className={styles.abLabel}>Cobrar</span>
        </button>
        <button
          type="button"
          className={cn(styles.abAct, styles.abPrimary)}
          onClick={() => router.push("/ordenes")}
        >
          <Plus size={20} strokeWidth={2} />
          <span className={styles.abLabel}>Nueva orden</span>
        </button>
      </div>
    </div>
  );
}
