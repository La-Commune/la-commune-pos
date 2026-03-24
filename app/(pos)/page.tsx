"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  ClipboardList,
  Users,
  ChefHat,
  LayoutGrid,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertTriangle,
  CreditCard,
  Package,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesas, useOrdenes, useInventario, subscribeToTable } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SkeletonKPICard, SkeletonAlertCard, SkeletonQuickLink } from "@/components/ui/Skeleton";
import { AnimatedCounter, FractionCounter } from "@/components/ui/AnimatedCounter";
import { StaggerGrid, MotionItem } from "@/components/ui/MotionCard";
import { staggerContainer, fadeUp, cardHover, timing, ease } from "@/lib/motion";
import type { Mesa, Orden } from "@/types/database";

/* ── KPI Card with micro-interactions ── */
function KPICard({
  label,
  value,
  numericValue,
  isCurrency,
  icon: Icon,
  color,
  onClick,
  delay = 0,
}: {
  label: string;
  value: string;
  numericValue?: number;
  isCurrency?: boolean;
  icon: typeof DollarSign;
  color: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileHover={onClick ? cardHover.hover : undefined}
      whileTap={onClick ? cardHover.tap : undefined}
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl bg-surface-2 border border-border transition-colors duration-200 text-left group",
        onClick && "cursor-pointer hover:border-border-hover",
      )}
    >
      <motion.div
        className={cn("p-3 rounded-xl", color)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: timing.smooth, ease: ease.spring, delay: delay + 0.1 }}
      >
        <Icon size={20} className="text-white" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-25 uppercase tracking-widest mb-1">{label}</p>
        {numericValue !== undefined ? (
          <AnimatedCounter
            value={numericValue}
            format={isCurrency ? formatMXN : undefined}
            className="text-xl font-bold text-text-100 tracking-tight"
            delay={delay + 0.15}
          />
        ) : (
          <p className="text-xl font-bold text-text-100 tracking-tight">{value}</p>
        )}
      </div>
      {onClick && (
        <ArrowRight size={16} className="text-text-25 group-hover:text-text-45 mt-3 transition-colors" />
      )}
    </motion.button>
  );
}

/* ── Alert Card with entrance animation ── */
function AlertCard({
  label,
  count,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof AlertTriangle;
  color: string;
  onClick?: () => void;
}) {
  if (count === 0) return null;
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: timing.fast, ease: ease.out }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-200 text-left w-full",
        color,
      )}
    >
      <Icon size={18} />
      <span className="text-sm font-medium flex-1">
        {count} {label}
      </span>
      <ArrowRight size={14} />
    </motion.button>
  );
}

/* ── Quick Link with hover bounce ── */
function QuickLink({
  label,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  icon: typeof LayoutGrid;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-colors duration-200 min-h-[44px] cursor-pointer"
    >
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-xs font-medium text-text-70">{label}</span>
    </motion.button>
  );
}

/* ── Main Dashboard Content ── */
function DashboardContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: mesas } = useMesas();
  const { data: ordenes, refetch: refetchOrdenes } = useOrdenes();
  const { data: inventario } = useInventario();
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ordenesHoyCount, setOrdenesHoyCount] = useState(0);
  const [loading, setLoading] = useState(!USE_MOCK);

  const cargarVentas = async () => {
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
  };

  useEffect(() => {
    cargarVentas();
  }, []);

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
  }, [refetchOrdenes]);

  const mesasList = mesas as unknown as Mesa[];
  const ordenesList = ordenes as unknown as Orden[];

  const mesasOcupadas = mesasList.filter((m) => m.estado === "ocupada").length;
  const ordenesPendientes = ordenesList.filter((o) =>
    ["nueva", "confirmada"].includes(o.estado),
  ).length;
  const ordenesEnKDS = ordenesList.filter((o) =>
    ["preparando", "lista"].includes(o.estado),
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
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.smooth, ease: ease.out }}
      >
        <h1 className="text-xl font-medium text-text-100 tracking-tight">
          {saludo}, {nombreCorto}
        </h1>
        <p className="text-sm text-text-25 mt-1">
          {hora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          {" · "}
          {hora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </motion.div>

      {/* KPIs — staggered grid with animated counters */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKPICard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <KPICard
            label="Ventas hoy"
            numericValue={ventasHoy}
            isCurrency
            value={formatMXN(ventasHoy)}
            icon={DollarSign}
            color="bg-status-ok"
            onClick={() => router.push("/reportes")}
            delay={0}
          />
          <KPICard
            label="Órdenes completadas"
            numericValue={ordenesHoyCount}
            value={String(ordenesHoyCount)}
            icon={ClipboardList}
            color="bg-cat-4"
            onClick={() => router.push("/ordenes")}
            delay={0.07}
          />
          <KPICard
            label="Ticket promedio"
            numericValue={ticketPromedio}
            isCurrency
            value={formatMXN(ticketPromedio)}
            icon={TrendingUp}
            color="bg-[var(--info)]"
            delay={0.14}
          />
          <KPICard
            label="Mesas ocupadas"
            value={`${mesasOcupadas} / ${mesasList.length}`}
            icon={LayoutGrid}
            color="bg-cat-3"
            onClick={() => router.push("/mesas")}
            delay={0.21}
          />
        </motion.div>
      )}

      {/* Alertas — staggered */}
      {loading ? (
        <div className="space-y-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonAlertCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="space-y-2 mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <AlertCard
            label={ordenesPendientes === 1 ? "orden pendiente de confirmar" : "órdenes pendientes de confirmar"}
            count={ordenesPendientes}
            icon={AlertTriangle}
            color="bg-status-warn-bg text-status-warn border-status-warn/20"
            onClick={() => router.push("/ordenes")}
          />
          <AlertCard
            label={ordenesEnKDS === 1 ? "orden en cocina" : "órdenes en cocina"}
            count={ordenesEnKDS}
            icon={ChefHat}
            color="bg-status-info-bg text-status-info border-status-info/20"
            onClick={() => router.push("/kds")}
          />
          <AlertCard
            label={ingredientesBajos === 1 ? "ingrediente con stock bajo" : "ingredientes con stock bajo"}
            count={ingredientesBajos}
            icon={Package}
            color="bg-status-error-bg text-status-error border-status-error/20"
            onClick={() => router.push("/inventario")}
          />
        </motion.div>
      )}

      {/* Accesos rápidos — staggered */}
      <motion.div
        className="mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: timing.normal, delay: 0.3 }}
      >
        <h2 className="text-xs font-medium text-text-25 uppercase tracking-widest mb-3">Accesos rápidos</h2>
      </motion.div>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonQuickLink key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-5 gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <QuickLink label="Mesas" icon={LayoutGrid} color="bg-cat-3" onClick={() => router.push("/mesas")} />
          <QuickLink label="Órdenes" icon={ClipboardList} color="bg-cat-4" onClick={() => router.push("/ordenes")} />
          <QuickLink label="Cocina" icon={ChefHat} color="bg-cat-5" onClick={() => router.push("/kds")} />
          <QuickLink label="Cobros" icon={CreditCard} color="bg-cat-1" onClick={() => router.push("/cobros")} />
          <QuickLink label="Reportes" icon={TrendingUp} color="bg-[var(--info)]" onClick={() => router.push("/reportes")} />
        </motion.div>
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
