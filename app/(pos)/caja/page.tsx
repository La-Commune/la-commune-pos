"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Clock,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  MoreVertical,
  Loader2,
  X,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── TIPOS ──

type EstadoTurno = "sin_turno" | "abierto" | "cerrando" | "cerrado";

interface CorteDatosMock {
  id: string;
  fecha: string;
  fondo_inicial: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  total_ventas: number;
  propinas: number;
  descuentos: number;
  efectivo_esperado: number;
  efectivo_real: number;
  diferencia: number;
  ordenes_count: number;
  notas: string;
  abierto_en: string;
  cerrado_en: string;
}

// ── MOCK DATA: Histórico de cortes ──
const MOCK_CORTES_HISTORICO: CorteDatosMock[] = [
  {
    id: "corte-5",
    fecha: "2026-03-06",
    fondo_inicial: 500,
    ventas_efectivo: 2840,
    ventas_tarjeta: 1500,
    ventas_transferencia: 800,
    total_ventas: 5140,
    propinas: 320,
    descuentos: 150,
    efectivo_esperado: 3340,
    efectivo_real: 3345,
    diferencia: 5,
    ordenes_count: 42,
    notas: "Día normal, sin incidentes",
    abierto_en: "2026-03-06T08:00:00",
    cerrado_en: "2026-03-06T20:00:00",
  },
  {
    id: "corte-4",
    fecha: "2026-03-05",
    fondo_inicial: 500,
    ventas_efectivo: 2650,
    ventas_tarjeta: 1200,
    ventas_transferencia: 600,
    total_ventas: 4450,
    propinas: 280,
    descuentos: 100,
    efectivo_esperado: 3150,
    efectivo_real: 3140,
    diferencia: -10,
    ordenes_count: 38,
    notas: "Falta de $10 en caja, probablemente cambio mal dado",
    abierto_en: "2026-03-05T08:00:00",
    cerrado_en: "2026-03-05T20:00:00",
  },
  {
    id: "corte-3",
    fecha: "2026-03-04",
    fondo_inicial: 500,
    ventas_efectivo: 3120,
    ventas_tarjeta: 1800,
    ventas_transferencia: 900,
    total_ventas: 5820,
    propinas: 450,
    descuentos: 200,
    efectivo_esperado: 3620,
    efectivo_real: 3620,
    diferencia: 0,
    ordenes_count: 51,
    notas: "Cuadre perfecto",
    abierto_en: "2026-03-04T08:00:00",
    cerrado_en: "2026-03-04T20:00:00",
  },
  {
    id: "corte-2",
    fecha: "2026-03-03",
    fondo_inicial: 500,
    ventas_efectivo: 2400,
    ventas_tarjeta: 950,
    ventas_transferencia: 500,
    total_ventas: 3850,
    propinas: 200,
    descuentos: 75,
    efectivo_esperado: 2900,
    efectivo_real: 2925,
    diferencia: 25,
    ordenes_count: 32,
    notas: "Sobra de $25, cliente dejó propina en efectivo",
    abierto_en: "2026-03-03T08:00:00",
    cerrado_en: "2026-03-03T20:00:00",
  },
  {
    id: "corte-1",
    fecha: "2026-03-02",
    fondo_inicial: 500,
    ventas_efectivo: 2750,
    ventas_tarjeta: 1100,
    ventas_transferencia: 650,
    total_ventas: 4500,
    propinas: 320,
    descuentos: 120,
    efectivo_esperado: 3250,
    efectivo_real: 3255,
    diferencia: 5,
    ordenes_count: 44,
    notas: "Sin incidencias",
    abierto_en: "2026-03-02T08:00:00",
    cerrado_en: "2026-03-02T20:00:00",
  },
];

// ── MOCK DATA: Órdenes del turno actual ──
const MOCK_ORDENES_HOY = [
  {
    id: "ord-1",
    mesa_numero: 2,
    total: 155,
    tipo_pago: "efectivo" as const,
    propina: 20,
    descuento: 0,
    creado_en: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: "ord-2",
    mesa_numero: 3,
    total: 355,
    tipo_pago: "tarjeta" as const,
    propina: 0,
    descuento: 0,
    creado_en: new Date(Date.now() - 95 * 60000).toISOString(),
  },
  {
    id: "ord-3",
    mesa_numero: null,
    total: 165,
    tipo_pago: "efectivo" as const,
    propina: 15,
    descuento: 0,
    creado_en: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "ord-4",
    mesa_numero: null,
    total: 75,
    tipo_pago: "efectivo" as const,
    propina: 0,
    descuento: 0,
    creado_en: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "ord-5",
    mesa_numero: 5,
    total: 220,
    tipo_pago: "transferencia" as const,
    propina: 0,
    descuento: 10,
    creado_en: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "ord-6",
    mesa_numero: 1,
    total: 110,
    tipo_pago: "tarjeta" as const,
    propina: 0,
    descuento: 0,
    creado_en: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

export default function CajaPage() {
  // ── ESTADO PRINCIPAL ──
  const [estadoTurno, setEstadoTurno] = useState<EstadoTurno>("abierto");
  const [fondoInicial, setFondoInicial] = useState<string>("");
  const [efectivoReal, setEfectivoReal] = useState<string>("");
  const [notasCierre, setNotasCierre] = useState<string>("");
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // ── CONFIRMACIONES ──
  const [confirmarApertura, setConfirmarApertura] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // ── CÁLCULOS: Turno abierto ──
  const ventasEfectivo = MOCK_ORDENES_HOY.reduce(
    (acc, ord) => acc + (ord.tipo_pago === "efectivo" ? ord.total : 0),
    0
  );
  const ventasTarjeta = MOCK_ORDENES_HOY.reduce(
    (acc, ord) => acc + (ord.tipo_pago === "tarjeta" ? ord.total : 0),
    0
  );
  const ventasTransferencia = MOCK_ORDENES_HOY.reduce(
    (acc, ord) => acc + (ord.tipo_pago === "transferencia" ? ord.total : 0),
    0
  );
  const totalVentas = ventasEfectivo + ventasTarjeta + ventasTransferencia;
  const propinasTotal = MOCK_ORDENES_HOY.reduce((acc, ord) => acc + ord.propina, 0);
  const descuentosTotal = MOCK_ORDENES_HOY.reduce(
    (acc, ord) => acc + ord.descuento,
    0
  );
  const efectivoEsperado = (parseFloat(fondoInicial) || 0) + ventasEfectivo;

  // ── CÁLCULOS: Cierre ──
  const efectivoRealNum = parseFloat(efectivoReal) || 0;
  const diferencia = efectivoRealNum - efectivoEsperado;
  const diferenciaPorciento =
    efectivoEsperado > 0
      ? Math.round((Math.abs(diferencia) / efectivoEsperado) * 1000) / 10
      : 0;

  // ── HANDLERS: Apertura de turno ──
  const handleAbrirTurno = async () => {
    setProcesando(true);
    // TODO: Crear registro en Supabase
    await new Promise((r) => setTimeout(r, 800));
    setProcesando(false);
    setConfirmarApertura(false);
    setEstadoTurno("abierto");
    setFondoInicial("");
  };

  // ── HANDLERS: Cierre de turno ──
  const handleIniciarCierre = () => {
    if (!efectivoReal || efectivoRealNum === 0) return;
    setConfirmandoCierre(true);
    setEstadoTurno("cerrando");
  };

  const handleConfirmarCierre = async () => {
    setProcesando(true);
    // TODO: Guardar corte en Supabase
    await new Promise((r) => setTimeout(r, 1200));
    setProcesando(false);
    setConfirmarCierre(false);
    setEstadoTurno("cerrado");
  };

  const handleNuevoTurno = () => {
    setEstadoTurno("sin_turno");
    setFondoInicial("");
    setEfectivoReal("");
    setNotasCierre("");
    setConfirmandoCierre(false);
  };

  // ── ESTILOS: Color de diferencia ──
  const diferenciaBg =
    diferencia === 0
      ? "bg-status-ok-bg"
      : diferencia > 0
        ? "bg-status-warn-bg"
        : "bg-status-err-bg";
  const diferenciaText =
    diferencia === 0
      ? "text-status-ok"
      : diferencia > 0
        ? "text-status-warn"
        : "text-status-err";

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)]" style={{ gap: "var(--density-gap)" }}>
      {/* ── PANEL IZQUIERDO: Historial de cortes ── */}
      <div className="flex-shrink-0 bg-surface-2 border-r border-border rounded-2xl flex flex-col shadow-xl shadow-black/20" style={{ width: "var(--panel-sm)" }}>
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-text-100">Histórico</h3>
            </div>
            <span className="text-[11px] text-text-25 tabular-nums font-medium">
              {MOCK_CORTES_HISTORICO.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {MOCK_CORTES_HISTORICO.map((corte) => {
            const fecha = new Date(corte.cerrado_en);
            const diferenciaCorte = corte.diferencia;
            const esPositiva = diferenciaCorte > 0;
            const esNegativa = diferenciaCorte < 0;

            return (
              <button
                key={corte.id}
                onClick={() => setMostrarHistorial(true)}
                className="w-full p-3 rounded-xl bg-surface-3 border border-border/50 text-left hover:border-border transition-all duration-300 hover:shadow-md hover:shadow-black/10 min-h-[44px]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-100">
                    {fecha.toLocaleDateString("es-MX")}
                  </span>
                  {diferenciaCorte === 0 && (
                    <CheckCircle2 size={14} className="text-status-ok" />
                  )}
                  {esPositiva && (
                    <span className="text-[10px] font-semibold text-status-warn tabular-nums">
                      +{formatMXN(diferenciaCorte)}
                    </span>
                  )}
                  {esNegativa && (
                    <span className="text-[10px] font-semibold text-status-err tabular-nums">
                      {formatMXN(diferenciaCorte)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-text-25 tabular-nums">
                  {formatMXN(corte.total_ventas)} · {corte.ordenes_count} órdenes
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO: Contenido principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {estadoTurno === "sin_turno" ? (
          /* ── SIN TURNO: Pantalla de apertura ── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
                  <Unlock size={32} className="text-accent" />
                </div>
                <h1 className="text-2xl font-bold text-text-100 mb-2">
                  Abrir turno
                </h1>
                <p className="text-sm text-text-45">
                  Ingresa el fondo inicial en caja para comenzar
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                    Fondo inicial
                  </label>
                  <input
                    type="number"
                    value={fondoInicial}
                    onChange={(e) => setFondoInicial(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-2 border border-border text-text-100 text-2xl font-semibold tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[48px]"
                  />
                  <p className="text-[10px] text-text-25 mt-2">
                    Cantidad de efectivo que inicia en caja
                  </p>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-1.5">
                  {[100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setFondoInicial(String(amt))}
                      className="flex-1 py-2.5 rounded-lg bg-surface-3 border border-border text-xs text-text-45 hover:text-text-70 hover:border-border-hover transition-all duration-300 tabular-nums min-h-[44px]"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setConfirmarApertura(true)}
                  disabled={!fondoInicial || parseFloat(fondoInicial) <= 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 min-h-[48px]",
                    fondoInicial && parseFloat(fondoInicial) > 0
                      ? "btn-primary"
                      : "bg-surface-3 text-text-25 cursor-not-allowed"
                  )}
                >
                  <Unlock size={18} />
                  Abrir turno
                </button>
              </div>
            </div>
          </div>
        ) : estadoTurno === "cerrado" ? (
          /* ── TURNO CERRADO: Confirmación final ── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="p-8 rounded-2xl bg-surface-2 border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-status-ok-bg flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-status-ok" />
                </div>
                <h2 className="text-xl font-bold text-text-100 mb-2">
                  Turno cerrado
                </h2>
                <p className="text-sm text-text-45 mb-6">
                  El corte de caja ha sido registrado correctamente.
                </p>

                {/* Resumen del cierre */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-3 mb-6 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-45">Total vendido</span>
                    <span className="font-semibold text-text-100 tabular-nums">
                      {formatMXN(totalVentas)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-45">Efectivo contado</span>
                    <span className="font-semibold text-text-100 tabular-nums">
                      {formatMXN(efectivoRealNum)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between items-center text-sm">
                    <span className="text-text-45">Diferencia</span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        diferenciaText
                      )}
                    >
                      {diferencia >= 0 ? "+" : ""}{formatMXN(diferencia)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleNuevoTurno}
                  className="w-full py-3.5 rounded-xl btn-primary text-sm font-semibold min-h-[48px]"
                >
                  Nuevo turno
                </button>
              </div>
            </div>
          </div>
        ) : estadoTurno === "cerrando" ? (
          /* ── CERRANDO: Verificación de cierre ── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="p-8 rounded-2xl bg-surface-2 border border-border">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                    <Lock size={28} className="text-accent" />
                  </div>
                  <p className="text-xs text-text-45 uppercase tracking-widest mb-2">
                    Verifica antes de cerrar
                  </p>
                </div>

                {/* Resumen del cierre */}
                <div className="space-y-3 mb-6 p-4 rounded-xl bg-surface-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-25 text-[10px] mb-0.5">
                        Fondo inicial
                      </p>
                      <p className="text-text-100 font-semibold tabular-nums text-base">
                        {formatMXN(parseFloat(fondoInicial) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-25 text-[10px] mb-0.5">
                        Vtas. Efectivo
                      </p>
                      <p className="text-text-100 font-semibold tabular-nums text-base">
                        {formatMXN(ventasEfectivo)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-text-25 text-[10px] mb-1">
                      Esperado en caja
                    </p>
                    <p className="text-accent font-bold tabular-nums text-xl">
                      {formatMXN(efectivoEsperado)}
                    </p>
                  </div>

                  <div className={cn("border-t border-border pt-3 rounded-lg p-2", diferenciaBg)}>
                    <p className="text-[10px] mb-1 opacity-70">Contaste:</p>
                    <p className={cn("font-bold tabular-nums text-xl", diferenciaText)}>
                      {formatMXN(efectivoRealNum)}
                    </p>
                    <p className={cn("text-xs font-semibold mt-1", diferenciaText)}>
                      {diferencia === 0
                        ? "✓ Cuadra perfecto"
                        : diferencia > 0
                          ? `Sobra ${formatMXN(diferencia)}`
                          : `Falta ${formatMXN(Math.abs(diferencia))}`}
                    </p>
                  </div>
                </div>

                {/* Detalles */}
                <div className="space-y-2 mb-6 text-sm px-3 py-2 bg-surface-1/50 rounded-lg">
                  <div className="flex justify-between text-xs text-text-45">
                    <span>Propinas</span>
                    <span className="tabular-nums">
                      {formatMXN(propinasTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-45">
                    <span>Descuentos</span>
                    <span className="tabular-nums">
                      {formatMXN(descuentosTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-45">
                    <span>Órdenes</span>
                    <span className="tabular-nums">{MOCK_ORDENES_HOY.length}</span>
                  </div>
                </div>

                {notasCierre && (
                  <div className="mb-6 p-3 rounded-xl bg-status-warn-bg/20 border border-status-warn/20">
                    <p className="text-xs text-text-45 mb-1">Notas:</p>
                    <p className="text-xs text-text-70">{notasCierre}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEstadoTurno("abierto");
                      setConfirmandoCierre(false);
                    }}
                    disabled={procesando}
                    className="flex-1 py-3 rounded-xl btn-ghost text-sm font-medium min-h-[44px]"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setConfirmarCierre(true)}
                    disabled={procesando}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-all duration-300",
                      procesando
                        ? "opacity-70 cursor-wait"
                        : "btn-primary"
                    )}
                  >
                    {procesando ? "Guardando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── TURNO ABIERTO: Vista activa ── */
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Encabezado */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h1 className="text-lg font-bold text-text-100 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-ok animate-pulse" />
                    Turno abierto
                  </h1>
                  <p className="text-xs text-text-25">
                    Fondo: {formatMXN(parseFloat(fondoInicial) || 0)}
                  </p>
                </div>
                <button
                  onClick={() => setEstadoTurno("abierto")}
                  className="p-2.5 rounded-xl text-text-45 hover:text-text-100 hover:bg-surface-3 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total vendido */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">
                      Hoy
                    </span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Total vendido</p>
                  <p className="text-2xl font-bold text-text-100 tabular-nums">
                    {formatMXN(totalVentas)}
                  </p>
                </div>

                {/* Órdenes */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <FileText size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">
                      Total
                    </span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Órdenes</p>
                  <p className="text-2xl font-bold text-text-100 tabular-nums">
                    {MOCK_ORDENES_HOY.length}
                  </p>
                </div>

                {/* Ticket promedio */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">
                      Promedio
                    </span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Ticket</p>
                  <p className="text-2xl font-bold text-text-100 tabular-nums">
                    {formatMXN(
                      MOCK_ORDENES_HOY.length > 0
                        ? totalVentas / MOCK_ORDENES_HOY.length
                        : 0
                    )}
                  </p>
                </div>

                {/* Propinas */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">
                      Extra
                    </span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Propinas</p>
                  <p className="text-2xl font-bold text-accent tabular-nums">
                    {formatMXN(propinasTotal)}
                  </p>
                </div>
              </div>

              {/* Desglose por método de pago */}
              <div className="grid grid-cols-3 gap-4">
                {/* Efectivo */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote size={18} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-100">
                      Efectivo
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-accent tabular-nums mb-3">
                    {formatMXN(ventasEfectivo)}
                  </p>
                  <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{
                        width: `${totalVentas > 0 ? (ventasEfectivo / totalVentas) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-25 mt-2 tabular-nums">
                    {totalVentas > 0
                      ? Math.round((ventasEfectivo / totalVentas) * 100)
                      : 0}%
                  </p>
                </div>

                {/* Tarjeta */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={18} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-100">
                      Tarjeta
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-accent tabular-nums mb-3">
                    {formatMXN(ventasTarjeta)}
                  </p>
                  <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{
                        width: `${totalVentas > 0 ? (ventasTarjeta / totalVentas) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-25 mt-2 tabular-nums">
                    {totalVentas > 0
                      ? Math.round((ventasTarjeta / totalVentas) * 100)
                      : 0}%
                  </p>
                </div>

                {/* Transferencia */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRightLeft size={18} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-100">
                      Transf.
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-accent tabular-nums mb-3">
                    {formatMXN(ventasTransferencia)}
                  </p>
                  <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{
                        width: `${totalVentas > 0 ? (ventasTransferencia / totalVentas) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-25 mt-2 tabular-nums">
                    {totalVentas > 0
                      ? Math.round((ventasTransferencia / totalVentas) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Descuentos y otros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <h3 className="text-sm font-medium text-text-45 mb-2">
                    Descuentos aplicados
                  </h3>
                  <p className="text-2xl font-bold text-status-warn tabular-nums">
                    -{formatMXN(descuentosTotal)}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <h3 className="text-sm font-medium text-text-45 mb-2">
                    Efectivo esperado
                  </h3>
                  <p className="text-2xl font-bold text-accent tabular-nums">
                    {formatMXN(efectivoEsperado)}
                  </p>
                </div>
              </div>

              {/* Órdenes recientes */}
              <div>
                <h2 className="text-sm font-semibold text-text-100 mb-3">
                  Órdenes del turno
                </h2>
                <div className="space-y-2">
                  {MOCK_ORDENES_HOY.map((ord) => {
                    const metodoPagoLabel = {
                      efectivo: "Efectivo",
                      tarjeta: "Tarjeta",
                      transferencia: "Transferencia",
                    }[ord.tipo_pago];
                    return (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-100">
                            {ord.mesa_numero ? `Mesa ${ord.mesa_numero}` : "Para llevar"}
                          </p>
                          <p className="text-xs text-text-25">
                            {metodoPagoLabel} · {new Date(ord.creado_en).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-accent tabular-nums flex-shrink-0">
                          {formatMXN(ord.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón Cerrar turno */}
              <div className="pb-4">
                <button
                  onClick={() => setEstadoTurno("cerrando")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary text-sm font-semibold min-h-[48px]"
                >
                  <Lock size={18} />
                  Iniciar cierre de turno
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Cierre de turno ── */}
      {estadoTurno === "abierto" && !confirmandoCierre && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" style={{ display: confirmandoCierre ? "flex" : "none" }}>
          {/* Placeholder para modal de cierre */}
        </div>
      )}

      {/* ── CONFIRM DIALOGS ── */}
      <ConfirmDialog
        open={confirmarApertura}
        onClose={() => setConfirmarApertura(false)}
        onConfirm={handleAbrirTurno}
        title="Abrir turno"
        description={`¿Abrirs con fondo inicial de ${formatMXN(parseFloat(fondoInicial) || 0)}?`}
        confirmLabel="Abrir"
        loading={procesando}
      />

      <ConfirmDialog
        open={confirmarCierre}
        onClose={() => {
          setConfirmarCierre(false);
          setConfirmandoCierre(false);
          setEstadoTurno("abierto");
        }}
        onConfirm={handleConfirmarCierre}
        title="Cerrar turno"
        description={`Confirma el cierre: efectivo contado ${formatMXN(efectivoRealNum)}, diferencia ${diferencia >= 0 ? "+" : ""}${formatMXN(diferencia)}.`}
        confirmLabel="Cerrar turno"
        variant={diferencia === 0 ? "info" : "warning"}
        loading={procesando}
      />

      {/* Modal historial de cortes */}
      {mostrarHistorial && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-0 rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-100">
                Histórico de cortes (últimos 30 días)
              </h2>
              <button
                onClick={() => setMostrarHistorial(false)}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X size={20} className="text-text-45" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {MOCK_CORTES_HISTORICO.map((corte) => {
                const fecha = new Date(corte.cerrado_en);
                const diferenciaCorte = corte.diferencia;
                const esPositiva = diferenciaCorte > 0;
                const esNegativa = diferenciaCorte < 0;

                return (
                  <div
                    key={corte.id}
                    className="p-4 rounded-xl bg-surface-2 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-text-100">
                          {fecha.toLocaleDateString("es-MX")}
                        </p>
                        <p className="text-xs text-text-25">
                          {fecha.toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          — {corte.ordenes_count} órdenes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-accent tabular-nums">
                          {formatMXN(corte.total_ventas)}
                        </p>
                        {diferenciaCorte === 0 && (
                          <p className="text-xs text-status-ok font-medium">
                            ✓ Cuadre
                          </p>
                        )}
                        {esPositiva && (
                          <p className="text-xs text-status-warn font-medium">
                            +{formatMXN(diferenciaCorte)}
                          </p>
                        )}
                        {esNegativa && (
                          <p className="text-xs text-status-err font-medium">
                            {formatMXN(diferenciaCorte)}
                          </p>
                        )}
                      </div>
                    </div>

                    {corte.notas && (
                      <p className="text-xs text-text-45 p-2 bg-surface-1 rounded italic">
                        "{corte.notas}"
                      </p>
                    )}

                    <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] text-text-25">
                      <div>
                        <p className="opacity-70">Fondo</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(corte.fondo_inicial)}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Efectivo</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(corte.ventas_efectivo)}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Tarjeta</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(corte.ventas_tarjeta)}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Propina</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(corte.propinas)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
