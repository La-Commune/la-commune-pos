"use client";

import { useState } from "react";
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

// ── Mock data para reportes ──
const MOCK_STATS = {
  ventasHoy: 8_450.60,
  ventasAyer: 7_230.40,
  ordenesHoy: 42,
  ordenesAyer: 38,
  ticketPromedio: 201.20,
  ticketPromedioAyer: 190.27,
  clientesHoy: 35,
  clientesAyer: 31,
  tiempoPromedioPrep: 8.5,
};

const MOCK_VENTAS_SEMANA = [
  { dia: "Lun", ventas: 6_200, ordenes: 32 },
  { dia: "Mar", ventas: 5_800, ordenes: 28 },
  { dia: "Mié", ventas: 7_100, ordenes: 36 },
  { dia: "Jue", ventas: 6_900, ordenes: 34 },
  { dia: "Vie", ventas: 9_200, ordenes: 48 },
  { dia: "Sáb", ventas: 11_500, ordenes: 58 },
  { dia: "Dom", ventas: 8_450, ordenes: 42 },
];

const MOCK_TOP_PRODUCTOS = [
  { nombre: "Americano", cantidad: 68, ingresos: 3_060 },
  { nombre: "Latte", cantidad: 54, ingresos: 2_970 },
  { nombre: "Croissant", cantidad: 42, ingresos: 1_890 },
  { nombre: "Cold Brew", cantidad: 38, ingresos: 2_280 },
  { nombre: "Panini Caprese", cantidad: 28, ingresos: 2_660 },
  { nombre: "Matcha Latte", cantidad: 24, ingresos: 1_560 },
  { nombre: "Cheesecake", cantidad: 22, ingresos: 1_650 },
  { nombre: "Cappuccino", cantidad: 20, ingresos: 1_100 },
];

const MOCK_METODOS_PAGO = [
  { metodo: "Efectivo", porcentaje: 42, monto: 23_540 },
  { metodo: "Tarjeta", porcentaje: 45, monto: 25_220 },
  { metodo: "Transferencia", porcentaje: 13, monto: 7_290 },
];

const MOCK_VENTAS_HORA = [
  { hora: "8am", ventas: 420 },
  { hora: "9am", ventas: 890 },
  { hora: "10am", ventas: 1_200 },
  { hora: "11am", ventas: 980 },
  { hora: "12pm", ventas: 1_450 },
  { hora: "1pm", ventas: 1_680 },
  { hora: "2pm", ventas: 1_320 },
  { hora: "3pm", ventas: 780 },
  { hora: "4pm", ventas: 650 },
  { hora: "5pm", ventas: 520 },
  { hora: "6pm", ventas: 380 },
  { hora: "7pm", ventas: 180 },
];

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
        <div
          className={cn(
            "flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-lg",
            isUp ? "text-status-ok bg-status-ok-bg" : "text-status-err bg-status-err-bg"
          )}
        >
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

/* R8: Custom tooltip para Recharts */
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
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes">("hoy");

  return (
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
          value={MOCK_STATS.ventasHoy}
          prevValue={MOCK_STATS.ventasAyer}
          format="currency"
          icon={DollarSign}
        />
        <StatCard
          title="Órdenes"
          value={MOCK_STATS.ordenesHoy}
          prevValue={MOCK_STATS.ordenesAyer}
          icon={ShoppingCart}
        />
        <StatCard
          title="Ticket promedio"
          value={MOCK_STATS.ticketPromedio}
          prevValue={MOCK_STATS.ticketPromedioAyer}
          format="currency"
          icon={BarChart3}
        />
        <StatCard
          title="Clientes"
          value={MOCK_STATS.clientesHoy}
          prevValue={MOCK_STATS.clientesAyer}
          icon={Users}
        />
      </div>

      {/* R8: Charts row con Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Ventas por día — R8: Recharts con tooltips interactivos */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Ventas de la semana
            </h3>
            <Calendar size={14} className="text-text-25 opacity-40" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_VENTAS_SEMANA} barSize={24}>
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
        </div>

        {/* Ventas por hora — R8: Recharts */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Ventas por hora (hoy)
            </h3>
            <Clock size={14} className="text-text-25 opacity-40" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_VENTAS_HORA} barSize={16}>
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
          <div className="space-y-2.5">
            {MOCK_TOP_PRODUCTOS.map((prod, idx) => {
              const maxCant = MOCK_TOP_PRODUCTOS[0].cantidad;
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
        </div>

        {/* Métodos de pago */}
        <div className="p-5 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Métodos de pago (semana)
            </h3>
          </div>
          <div className="space-y-4">
            {MOCK_METODOS_PAGO.map((mp) => (
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

          {/* Resumen */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-45">Total semana</span>
              <span className="text-sm font-semibold text-text-100 tabular-nums">
                {formatMXN(MOCK_METODOS_PAGO.reduce((a, m) => a + m.monto, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-45">Tiempo promedio prep.</span>
              <span className="text-sm font-medium text-text-100 flex items-center gap-1">
                <Clock size={12} className="text-text-25" />
                {MOCK_STATS.tiempoPromedioPrep}m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
