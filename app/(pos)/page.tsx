"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesas, useOrdenes, subscribeToTable } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { Mesa, Orden } from "@/types/database";

interface DashboardKPIs {
  ventasHoy: number;
  ordenesHoy: number;
  ticketPromedio: number;
  mesasOcupadas: number;
  mesasTotal: number;
  ordenesPendientes: number;
  ordenesEnKDS: number;
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl bg-surface-2 border border-border hover:border-border-hover transition-all duration-300 text-left group",
        onClick && "cursor-pointer hover:shadow-md",
      )}
    >
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-bold text-text-100 tracking-tight">{value}</p>
      </div>
      {onClick && (
        <ArrowRight size={16} className="text-text-25 group-hover:text-text-45 mt-3 transition-colors" />
      )}
    </button>
  );
}

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
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 text-left w-full",
        color,
      )}
    >
      <Icon size={18} />
      <span className="text-sm font-medium flex-1">
        {count} {label}
      </span>
      <ArrowRight size={14} />
    </button>
  );
}

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
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-surface-2 border border-border hover:border-border-hover hover:shadow-md transition-all duration-300 min-h-[44px]"
    >
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-xs font-medium text-text-70">{label}</span>
    </button>
  );
}

function DashboardContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: mesas } = useMesas();
  const { data: ordenes, refetch: refetchOrdenes } = useOrdenes();
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ordenesHoyCount, setOrdenesHoyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar ventas de hoy desde pagos
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

  // Realtime: refresh ventas cuando hay pagos nuevos
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

  // KPIs derivados
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

  // Hora actual
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
      <div className="mb-8">
        <h1 className="text-xl font-medium text-text-100 tracking-tight">
          {saludo}, {nombreCorto}
        </h1>
        <p className="text-sm text-text-25 mt-1">
          {hora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          {" · "}
          {hora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-text-25" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Ventas hoy"
              value={formatMXN(ventasHoy)}
              icon={DollarSign}
              color="bg-status-ok"
              onClick={() => router.push("/reportes")}
            />
            <KPICard
              label="Órdenes completadas"
              value={String(ordenesHoyCount)}
              icon={ClipboardList}
              color="bg-[#9B8AFB]"
              onClick={() => router.push("/ordenes")}
            />
            <KPICard
              label="Ticket promedio"
              value={formatMXN(ticketPromedio)}
              icon={TrendingUp}
              color="bg-[#60A5FA]"
            />
            <KPICard
              label="Mesas ocupadas"
              value={`${mesasOcupadas} / ${mesasList.length}`}
              icon={LayoutGrid}
              color="bg-[#7EC8E3]"
              onClick={() => router.push("/mesas")}
            />
          </div>

          {/* Alertas */}
          <div className="space-y-2 mb-6">
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
          </div>

          {/* Accesos rápidos */}
          <div className="mb-2">
            <h2 className="text-xs font-medium text-text-25 uppercase tracking-widest mb-3">Accesos rápidos</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <QuickLink label="Mesas" icon={LayoutGrid} color="bg-[#7EC8E3]" onClick={() => router.push("/mesas")} />
            <QuickLink label="Órdenes" icon={ClipboardList} color="bg-[#9B8AFB]" onClick={() => router.push("/ordenes")} />
            <QuickLink label="Cocina" icon={ChefHat} color="bg-[#FFB347]" onClick={() => router.push("/kds")} />
            <QuickLink label="Cobros" icon={CreditCard} color="bg-[#F5C26B]" onClick={() => router.push("/cobros")} />
            <QuickLink label="Reportes" icon={TrendingUp} color="bg-[#60A5FA]" onClick={() => router.push("/reportes")} />
          </div>
        </>
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
