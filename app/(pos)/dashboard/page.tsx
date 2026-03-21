"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ClipboardList,
  ChefHat,
  LayoutGrid,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  CreditCard,
  Package,
  Zap,
  Activity,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesas, useOrdenes, useInventario, subscribeToTable } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { Mesa, Orden } from "@/types/database";

/* ─────────────────────────────────────────────
   Animated number — efecto count-up premium
   ───────────────────────────────────────────── */
function AnimatedValue({ value, format }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const duration = 500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      /* Decisión: easeOutExpo para que el número "aterrice" suave */
      const eased = 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(to);
        prevRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{format ? format(display) : Math.round(display)}</>;
}

/* ─────────────────────────────────────────────
   KPI Card — rediseño con jerarquía dramática
   ───────────────────────────────────────────── */
function KPICard({
  label,
  value,
  numericValue,
  icon: Icon,
  trend,
  onClick,
  delay = 0,
}: {
  label: string;
  value: string;
  numericValue?: number;
  icon: typeof DollarSign;
  trend?: { value: number; label: string };
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between p-5 rounded-xl",
        "bg-surface-1 border border-border",
        "hover:border-border-hover hover:bg-surface-2",
        "transition-all duration-200 ease-smooth text-left group",
        "min-h-[140px]",
        onClick && "cursor-pointer",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decisión: glow sutil en hover — señal de interactividad */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)" }}
      />

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-text-45" />
          <span className="text-[11px] font-medium text-text-45 uppercase tracking-[0.08em]">
            {label}
          </span>
        </div>
        {onClick && (
          <ArrowUpRight
            size={14}
            className="text-text-25 group-hover:text-accent transition-colors duration-200"
          />
        )}
      </div>

      <div className="mt-auto">
        {/* Decisión: valor gigante — es lo primero que el ojo debe ver */}
        <p className="text-[1.75rem] font-semibold text-text-100 tracking-[-0.03em] leading-none">
          {numericValue !== undefined ? (
            <AnimatedValue
              value={numericValue}
              format={value.startsWith("$") ? (n) => formatMXN(n) : undefined}
            />
          ) : (
            value
          )}
        </p>
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full",
            trend.value >= 0
              ? "text-status-ok bg-status-ok-bg"
              : "text-status-err bg-status-err-bg",
          )}>
            <TrendingUp size={10} className={trend.value < 0 ? "rotate-180" : ""} />
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Alert Banner — compacto, urgente, con pulso
   ───────────────────────────────────────────── */
function AlertBanner({
  alerts,
}: {
  alerts: Array<{ label: string; count: number; icon: typeof AlertTriangle; color: string; onClick: () => void }>;
}) {
  const active = alerts.filter((a) => a.count > 0);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-1 -my-1">
      {active.map((alert) => (
        <button
          key={alert.label}
          onClick={alert.onClick}
          className={cn(
            "inline-flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-lg",
            "border transition-all duration-200 group",
            "hover:scale-[1.02] active:scale-[0.98]",
            alert.color,
          )}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={cn(
              "absolute inset-[-3px] rounded-full opacity-40",
              alert.count > 3 ? "bg-current animate-ping" : "bg-transparent",
            )} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
          </span>
          <alert.icon size={14} className="shrink-0" />
          <span className="text-xs font-semibold">{alert.count}</span>
          <span className="text-xs font-medium opacity-80">{alert.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Quick Action — botones de navegación con hover premium
   ───────────────────────────────────────────── */
function QuickAction({
  label,
  icon: Icon,
  shortcut,
  onClick,
  delay = 0,
}: {
  label: string;
  icon: typeof LayoutGrid;
  shortcut?: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-surface-1 border border-border",
        "hover:border-border-hover hover:bg-surface-2",
        "transition-all duration-200 ease-smooth group",
        "min-h-[44px]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-2 rounded-lg bg-surface-3 group-hover:bg-accent-soft transition-colors duration-200">
        <Icon size={16} className="text-text-70 group-hover:text-accent transition-colors duration-200" />
      </div>
      <span className="text-sm font-medium text-text-70 group-hover:text-text-100 transition-colors">
        {label}
      </span>
      {shortcut && (
        <span className="ml-auto text-[10px] font-mono text-text-25 bg-surface-3 px-1.5 py-0.5 rounded border border-border">
          {shortcut}
        </span>
      )}
      <ArrowUpRight
        size={12}
        className="text-text-25 group-hover:text-text-45 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Status Indicator — estado del restaurante
   ───────────────────────────────────────────── */
function StatusBar({ mesasOcupadas, mesasTotal, ordenesActivas }: {
  mesasOcupadas: number;
  mesasTotal: number;
  ordenesActivas: number;
}) {
  const ocupacion = mesasTotal > 0 ? (mesasOcupadas / mesasTotal) * 100 : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-surface-1 border border-border">
      {/* Live dot */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-status-ok opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-ok" />
        </span>
        <span className="text-[11px] font-semibold text-status-ok uppercase tracking-[0.06em]">En vivo</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Ocupación con mini progress bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <LayoutGrid size={12} className="text-text-45" />
          <span className="text-xs text-text-70">
            <span className="font-semibold text-text-100">{mesasOcupadas}</span>
            <span className="text-text-25">/{mesasTotal}</span>
          </span>
        </div>
        <div className="w-16 h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-smooth"
            style={{
              width: `${ocupacion}%`,
              background: ocupacion > 80
                ? "var(--err)"
                : ocupacion > 50
                  ? "var(--warn)"
                  : "var(--ok)",
            }}
          />
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Órdenes activas */}
      <div className="flex items-center gap-1.5">
        <Activity size={12} className="text-text-45" />
        <span className="text-xs text-text-70">
          <span className="font-semibold text-text-100">{ordenesActivas}</span> activas
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton loading — premium, no spinner
   ───────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-surface-2" />
        <div className="h-4 w-64 rounded-md bg-surface-2" />
      </div>
      {/* KPI skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[140px] rounded-xl bg-surface-2 border border-border" />
        ))}
      </div>
      {/* Actions skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-2 border border-border" />
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   DASHBOARD PRINCIPAL
   ═════════════════════════════════════════════ */
function DashboardContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: mesas } = useMesas();
  const { data: ordenes, refetch: refetchOrdenes } = useOrdenes();
  const { data: inventario } = useInventario();
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ordenesHoyCount, setOrdenesHoyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const cargarVentas = useCallback(async () => {
    if (USE_MOCK || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const { data: pagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("estado", "completado")
        .gte("creado_en", hoy.toISOString());

      const total = (pagos ?? []).reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
      setVentasHoy(total);

      const { data: ordenesCompletadas } = await supabase
        .from("ordenes")
        .select("id")
        .eq("estado", "completada")
        .gte("creado_en", hoy.toISOString());

      setOrdenesHoyCount(ordenesCompletadas?.length ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  useEffect(() => {
    const sub = subscribeToTable("pagos", () => {
      cargarVentas();
      refetchOrdenes();
    });
    const subOrdenes = subscribeToTable("ordenes", () => {
      refetchOrdenes();
    });
    return () => {
      sub.unsubscribe();
      subOrdenes.unsubscribe();
    };
  }, [refetchOrdenes, cargarVentas]);

  const mesasList = mesas as unknown as Mesa[];
  const ordenesList = ordenes as unknown as Orden[];

  const mesasOcupadas = mesasList.filter((m) => m.estado === "ocupada").length;
  const ordenesPendientes = ordenesList.filter((o) =>
    ["nueva", "confirmada"].includes(o.estado),
  ).length;
  const ordenesEnKDS = ordenesList.filter((o) =>
    ["preparando", "lista"].includes(o.estado),
  ).length;
  const ordenesActivas = ordenesList.filter((o) =>
    ["nueva", "confirmada", "preparando", "lista"].includes(o.estado),
  ).length;
  const ticketPromedio = ordenesHoyCount > 0 ? ventasHoy / ordenesHoyCount : 0;

  const ingredientesBajos = (inventario as any[]).filter(
    (i) => Number(i.stock_actual ?? 0) <= Number(i.stock_minimo ?? 0) && i.activo !== false,
  ).length;

  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const saludo = hora.getHours() < 12 ? "Buenos días" : hora.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const nombreCorto = user?.nombre?.split(" ")[0] ?? "David";

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto scrollbar-thin">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* ── Header con greeting + status bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {/* Decisión: nombre grande + greeting sutil = jerarquía dramática */}
              <p className="text-xs font-medium text-text-25 uppercase tracking-[0.1em] mb-1">
                {saludo}
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-100 tracking-[-0.02em]">
                {nombreCorto}
              </h1>
              <p className="text-sm text-text-45 mt-0.5">
                {hora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}
                {hora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <StatusBar
              mesasOcupadas={mesasOcupadas}
              mesasTotal={mesasList.length}
              ordenesActivas={ordenesActivas}
            />
          </div>

          {/* ── Alertas como banner — visible pero no invasivo ── */}
          <AlertBanner
            alerts={[
              {
                label: ordenesPendientes === 1 ? "pendiente" : "pendientes",
                count: ordenesPendientes,
                icon: AlertTriangle,
                color: "bg-status-warn-bg text-status-warn border-status-warn/20 hover:border-status-warn/40",
                onClick: () => router.push("/ordenes"),
              },
              {
                label: "en cocina",
                count: ordenesEnKDS,
                icon: ChefHat,
                color: "bg-status-info-bg text-status-info border-status-info/20 hover:border-status-info/40",
                onClick: () => router.push("/kds"),
              },
              {
                label: ingredientesBajos === 1 ? "stock bajo" : "stock bajo",
                count: ingredientesBajos,
                icon: Package,
                color: "bg-status-err-bg text-status-err border-status-err/20 hover:border-status-err/40",
                onClick: () => router.push("/inventario"),
              },
            ]}
          />

          {/* ── KPIs — los números son los protagonistas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              label="Ventas hoy"
              value={formatMXN(ventasHoy)}
              numericValue={ventasHoy}
              icon={DollarSign}
              onClick={() => router.push("/reportes")}
              delay={0}
            />
            <KPICard
              label="Órdenes"
              value={String(ordenesHoyCount)}
              numericValue={ordenesHoyCount}
              icon={ClipboardList}
              onClick={() => router.push("/ordenes")}
              delay={50}
            />
            <KPICard
              label="Ticket promedio"
              value={formatMXN(ticketPromedio)}
              numericValue={ticketPromedio}
              icon={TrendingUp}
              delay={100}
            />
            <KPICard
              label="Mesas"
              value={`${mesasOcupadas} / ${mesasList.length}`}
              icon={LayoutGrid}
              onClick={() => router.push("/mesas")}
              delay={150}
            />
          </div>

          {/* ── Accesos rápidos — horizontal, compacto, con shortcuts ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} className="text-text-25" />
              <h2 className="text-[11px] font-medium text-text-25 uppercase tracking-[0.08em]">
                Accesos rápidos
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <QuickAction label="Mesas" icon={LayoutGrid} onClick={() => router.push("/mesas")} delay={0} />
              <QuickAction label="Órdenes" icon={ClipboardList} onClick={() => router.push("/ordenes")} delay={30} />
              <QuickAction label="Cocina" icon={ChefHat} onClick={() => router.push("/kds")} delay={60} />
              <QuickAction label="Cobros" icon={CreditCard} onClick={() => router.push("/cobros")} delay={90} />
              <QuickAction label="Reportes" icon={TrendingUp} onClick={() => router.push("/reportes")} delay={120} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary moduleName="Dashboard">
      <DashboardContent />
    </ErrorBoundary>
  );
}
