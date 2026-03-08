"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Coffee,
  BarChart3,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { subscribeToTable } from "@/hooks/useSupabase";
import {
  MOCK_STATS_REPORTES,
  MOCK_VENTAS_SEMANA,
  MOCK_TOP_PRODUCTOS,
  MOCK_METODOS_PAGO,
  MOCK_VENTAS_HORA,
} from "@/lib/mock-data";

// ── Tipos ──
type Periodo = "hoy" | "semana" | "mes";

interface StatsKPI {
  ventas: number;
  ventasPrev: number;
  ordenes: number;
  ordenesPrev: number;
  ticketPromedio: number;
  ticketPromedioPrev: number;
}

interface VentaDia {
  dia: string;
  ventas: number;
}

interface VentaHora {
  hora: string;
  ventas: number;
}

interface TopProducto {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

interface MetodoPago {
  metodo: string;
  monto: number;
  porcentaje: number;
}

// ── Helpers de fecha ──
function getDateRange(periodo: Periodo): { desde: string; desdePrev: string; hasta: string } {
  const now = new Date();
  const hasta = now.toISOString();

  if (periodo === "hoy") {
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    return { desde: hoy.toISOString(), desdePrev: ayer.toISOString(), hasta };
  }

  if (periodo === "semana") {
    const inicioSemana = new Date(now);
    inicioSemana.setDate(now.getDate() - now.getDay()); // domingo
    inicioSemana.setHours(0, 0, 0, 0);
    const prevSemana = new Date(inicioSemana);
    prevSemana.setDate(prevSemana.getDate() - 7);
    return { desde: inicioSemana.toISOString(), desdePrev: prevSemana.toISOString(), hasta };
  }

  // mes
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMes = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { desde: inicioMes.toISOString(), desdePrev: prevMes.toISOString(), hasta };
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ── Componentes ──

function StatCard({
  title,
  value,
  prevValue,
  format = "number",
  icon: Icon,
  suffix,
}: {
  title: string;
  value: number;
  prevValue: number;
  format?: "currency" | "number";
  icon: typeof DollarSign;
  suffix?: string;
}) {
  const delta = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
  const isUp = delta >= 0;

  return (
    <div className="p-5 rounded-xl bg-surface-2 border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">
          {title}
        </span>
        <Icon size={16} className="text-text-25 opacity-40" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">
            {format === "currency" ? formatMXN(value) : value.toLocaleString("es-MX")}
            {suffix && <span className="text-sm text-text-45 ml-1">{suffix}</span>}
          </p>
        </div>
        {prevValue > 0 && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-lg",
              isUp ? "text-status-ok bg-status-ok-bg" : "text-status-err bg-status-err-bg"
            )}
          >
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: { value: number }[]; label?: string; formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-surface-3 border border-border shadow-lg text-xs">
      <p className="text-text-45 mb-0.5">{label}</p>
      <p className="text-text-100 font-semibold tabular-nums">
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── Estado de datos ──
  const [stats, setStats] = useState<StatsKPI>({ ventas: 0, ventasPrev: 0, ordenes: 0, ordenesPrev: 0, ticketPromedio: 0, ticketPromedioPrev: 0 });
  const [ventasSemana, setVentasSemana] = useState<VentaDia[]>([]);
  const [ventasHora, setVentasHora] = useState<VentaHora[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);

  // ── Cargar datos ──
  const cargarDatos = useCallback(async () => {
    if (USE_MOCK || !supabase || !isAuthenticated || !user) {
      // Fallback a mock
      setStats({
        ventas: MOCK_STATS_REPORTES.ventasHoy,
        ventasPrev: MOCK_STATS_REPORTES.ventasAyer,
        ordenes: MOCK_STATS_REPORTES.ordenesHoy,
        ordenesPrev: MOCK_STATS_REPORTES.ordenesAyer,
        ticketPromedio: MOCK_STATS_REPORTES.ticketPromedio,
        ticketPromedioPrev: MOCK_STATS_REPORTES.ticketPromedioAyer,
      });
      setVentasSemana(MOCK_VENTAS_SEMANA);
      setVentasHora(MOCK_VENTAS_HORA);
      setTopProductos(MOCK_TOP_PRODUCTOS);
      setMetodosPago(MOCK_METODOS_PAGO);
      setLoading(false);
      return;
    }

    setLoading(true);
    const negocioId = user.negocio_id;
    const { desde, desdePrev } = getDateRange(periodo);

    try {
      // ── 1. KPIs: período actual ──
      const { data: pagosActual } = await supabase
        .from("pagos")
        .select("monto, propina")
        .eq("negocio_id", negocioId)
        .eq("estado", "completado")
        .gte("creado_en", desde);

      const ventasActual = ((pagosActual ?? []) as any[]).reduce((s: number, p: any) => s + Number(p.monto), 0);
      const ordenesActualCount = (pagosActual ?? []).length;
      const ticketActual = ordenesActualCount > 0 ? ventasActual / ordenesActualCount : 0;

      // ── 2. KPIs: período anterior (para delta %) ──
      const { data: pagosPrev } = await supabase
        .from("pagos")
        .select("monto")
        .eq("negocio_id", negocioId)
        .eq("estado", "completado")
        .gte("creado_en", desdePrev)
        .lt("creado_en", desde);

      const ventasPrev = ((pagosPrev ?? []) as any[]).reduce((s: number, p: any) => s + Number(p.monto), 0);
      const ordenesPrevCount = (pagosPrev ?? []).length;
      const ticketPrev = ordenesPrevCount > 0 ? ventasPrev / ordenesPrevCount : 0;

      setStats({
        ventas: ventasActual,
        ventasPrev: ventasPrev,
        ordenes: ordenesActualCount,
        ordenesPrev: ordenesPrevCount,
        ticketPromedio: ticketActual,
        ticketPromedioPrev: ticketPrev,
      });

      // ── 3. Ventas por día de la semana (últimos 7 días) ──
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const { data: pagos7d } = await supabase
        .from("pagos")
        .select("monto, creado_en")
        .eq("negocio_id", negocioId)
        .eq("estado", "completado")
        .gte("creado_en", hace7Dias.toISOString());

      const ventasPorDia: Record<string, number> = {};
      DIAS_SEMANA.forEach((d) => (ventasPorDia[d] = 0));
      ((pagos7d ?? []) as any[]).forEach((p: any) => {
        const dia = DIAS_SEMANA[new Date(p.creado_en).getDay()];
        ventasPorDia[dia] += Number(p.monto);
      });
      setVentasSemana(DIAS_SEMANA.map((dia) => ({ dia, ventas: Math.round(ventasPorDia[dia]) })));

      // ── 4. Ventas por hora (hoy) ──
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const { data: pagosHoy } = await supabase
        .from("pagos")
        .select("monto, creado_en")
        .eq("negocio_id", negocioId)
        .eq("estado", "completado")
        .gte("creado_en", hoy.toISOString());

      const ventasPorHora: Record<string, number> = {};
      for (let h = 7; h <= 22; h++) {
        ventasPorHora[`${h}:00`] = 0;
      }
      ((pagosHoy ?? []) as any[]).forEach((p: any) => {
        const hora = new Date(p.creado_en).getHours();
        const key = `${hora}:00`;
        if (ventasPorHora[key] !== undefined) {
          ventasPorHora[key] += Number(p.monto);
        }
      });
      setVentasHora(
        Object.entries(ventasPorHora).map(([hora, ventas]) => ({
          hora,
          ventas: Math.round(ventas),
        }))
      );

      // ── 5. Top productos (del período) ──
      const { data: items } = await supabase
        .from("items_orden")
        .select("nombre, cantidad, precio_unitario, creado_en")
        .eq("negocio_id", negocioId)
        .gte("creado_en", desde);

      const productoMap: Record<string, { cantidad: number; ingresos: number }> = {};
      ((items ?? []) as any[]).forEach((item: any) => {
        if (!productoMap[item.nombre]) {
          productoMap[item.nombre] = { cantidad: 0, ingresos: 0 };
        }
        productoMap[item.nombre].cantidad += Number(item.cantidad);
        productoMap[item.nombre].ingresos += Number(item.precio_unitario) * Number(item.cantidad);
      });

      const topProds = Object.entries(productoMap)
        .map(([nombre, data]) => ({ nombre, ...data }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 8);
      setTopProductos(topProds);

      // ── 6. Métodos de pago (del período) ──
      const { data: pagosPeriodo } = await supabase
        .from("pagos")
        .select("monto, tipo_pago")
        .eq("negocio_id", negocioId)
        .eq("estado", "completado")
        .gte("creado_en", desde);

      const metodoMap: Record<string, number> = { efectivo: 0, tarjeta: 0, transferencia: 0 };
      ((pagosPeriodo ?? []) as any[]).forEach((p: any) => {
        const tipo = p.tipo_pago as string;
        if (metodoMap[tipo] !== undefined) {
          metodoMap[tipo] += Number(p.monto);
        }
      });
      const totalMetodos = Object.values(metodoMap).reduce((a, b) => a + b, 0);
      const metodoLabels: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };
      setMetodosPago(
        Object.entries(metodoMap).map(([key, monto]) => ({
          metodo: metodoLabels[key] || key,
          monto,
          porcentaje: totalMetodos > 0 ? Math.round((monto / totalMetodos) * 100) : 0,
        }))
      );
    } catch (err) {
      console.warn("[Reportes] Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }, [periodo, isAuthenticated, user]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Realtime: recargar cuando hay nuevos pagos
  useEffect(() => {
    const sub = subscribeToTable("pagos", () => cargarDatos());
    return () => sub.unsubscribe();
  }, [cargarDatos]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem-4rem)] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <ErrorBoundary moduleName="Reportes">
      <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Reportes</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
          {(["hoy", "semana", "mes"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-300 min-h-[44px]",
                periodo === p
                  ? "bg-surface-4 text-text-100"
                  : "text-text-25 hover:text-text-45"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Ventas"
          value={stats.ventas}
          prevValue={stats.ventasPrev}
          format="currency"
          icon={DollarSign}
        />
        <StatCard
          title="Órdenes"
          value={stats.ordenes}
          prevValue={stats.ordenesPrev}
          icon={ShoppingCart}
        />
        <StatCard
          title="Ticket promedio"
          value={stats.ticketPromedio}
          prevValue={stats.ticketPromedioPrev}
          format="currency"
          icon={BarChart3}
        />
        <StatCard
          title="Propinas"
          value={(stats as any).propinas ?? 0}
          prevValue={0}
          format="currency"
          icon={TrendingUp}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Ventas por día */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Ventas de la semana
            </h3>
            <Calendar size={14} className="text-text-25 opacity-40" />
          </div>
          {ventasSemana.some((v) => v.ventas > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ventasSemana} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: "var(--text-45)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-25)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip formatter={(v) => formatMXN(v)} />} cursor={{ fill: "var(--surface-3)", radius: 8 }} />
                <Bar dataKey="ventas" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-xs text-text-25">Sin ventas esta semana</p>
            </div>
          )}
        </div>

        {/* Ventas por hora */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Ventas por hora (hoy)
            </h3>
            <Clock size={14} className="text-text-25 opacity-40" />
          </div>
          {ventasHora.some((v) => v.ventas > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ventasHora} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 10, fill: "var(--text-45)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-25)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip formatter={(v) => formatMXN(v)} />} cursor={{ fill: "var(--surface-3)", radius: 6 }} />
                <Bar dataKey="ventas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-xs text-text-25">Sin ventas hoy</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top productos */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Productos más vendidos
            </h3>
            <Coffee size={14} className="text-text-25 opacity-40" />
          </div>
          {topProductos.length > 0 ? (
            <div className="space-y-2.5">
              {topProductos.map((prod, idx) => {
                const maxCant = topProductos[0].cantidad;
                return (
                  <div key={prod.nombre} className="flex items-center gap-3">
                    <span className="text-[11px] text-text-25 tabular-nums w-4 text-right">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-100 truncate">{prod.nombre}</span>
                        <span className="text-[11px] text-text-45 tabular-nums">
                          {prod.cantidad} · {formatMXN(prod.ingresos)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${(prod.cantidad / maxCant) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-text-25">Sin productos vendidos en este período</p>
            </div>
          )}
        </div>

        {/* Métodos de pago */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Métodos de pago
            </h3>
          </div>
          {metodosPago.some((m) => m.monto > 0) ? (
            <div className="space-y-4">
              {metodosPago.map((mp) => (
                <div key={mp.metodo}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-100">{mp.metodo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-45 tabular-nums">
                        {formatMXN(mp.monto)}
                      </span>
                      <span className="text-[11px] font-medium text-accent tabular-nums">
                        {mp.porcentaje}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${mp.porcentaje}%`,
                        background:
                          mp.metodo === "Efectivo"
                            ? "var(--ok)"
                            : mp.metodo === "Tarjeta"
                            ? "var(--accent)"
                            : "var(--info)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-text-25">Sin pagos en este período</p>
            </div>
          )}

          {/* Resumen */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-45">Total período</span>
              <span className="text-sm font-semibold text-text-100 tabular-nums">
                {formatMXN(metodosPago.reduce((a, m) => a + m.monto, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
