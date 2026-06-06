"use client";

/* ============================================================
   ShellV3 — "Barra" · shell tablet-nativo (PoC dirección V3)
   Firma dos-pulgares: riel de navegación (pulgar izquierdo) /
   trabajo al centro / dock de acciones (pulgar derecho).
   Landscape ≥1024 = riel + dock laterales (PRIMARIO).
   Portrait/phone = topbar + barra de acciones inferior.
   Fuentes y tokens scoped — cero impacto en los 7 temas.
   ============================================================ */

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
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
  const hora = useReloj();
  const [moreOpen, setMoreOpen] = useState(false);

  const iniciales = (user?.nombre ?? "David San")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const esActiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const enMore = MORE.some((m) => pathname.startsWith(m.href));

  return (
    <div className={cn(styles.shell, fontUI.variable, fontMono.variable)}>
      {/* RIEL: navegación, pulgar izquierdo */}
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
          {moreOpen && (
            <div className={styles.morePop}>
              {MORE.map(({ href, label, icon: IconComp }) => (
                <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                  <IconComp size={17} strokeWidth={1.75} />
                  {label}
                </Link>
              ))}
            </div>
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

      {/* ZONA DE TRABAJO */}
      <main className={styles.main}>{children}</main>

      {/* DOCK: acciones primarias, pulgar derecho — LA FIRMA (landscape) */}
      <aside className={styles.dock}>
        <button
          type="button"
          className={cn(styles.dockAct, styles.dockPrimary)}
          onClick={() => router.push("/ordenes")}
        >
          <Plus size={22} strokeWidth={2} />
          Nueva orden
        </button>
        <button type="button" className={styles.dockAct} onClick={() => router.push("/cobros")}>
          <CreditCard size={22} strokeWidth={1.75} />
          Cobrar
        </button>
        <button type="button" className={styles.dockAct} onClick={() => router.push("/mesas")}>
          <LayoutGrid size={22} strokeWidth={1.75} />
          Mesas
        </button>
        <button type="button" className={styles.dockAct} onClick={() => router.push("/kds")}>
          <ChefHat size={22} strokeWidth={1.75} />
          Cocina
        </button>
        <div className={styles.dockFoot}>
          <div className={styles.live}>
            <i className={styles.liveDot} />
            EN VIVO
          </div>
          <div>
            {hora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </div>
        </div>
      </aside>

      {/* BARRA DE ACCIONES inferior (portrait + phone) */}
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
