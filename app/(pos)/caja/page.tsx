"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { insertRecordReturning, updateRecord, subscribeToTable } from "@/hooks/useSupabase";
import { showToast } from "@/components/ui/Toast";

// ── TIPOS ──

type EstadoTurno = "cargando" | "sin_turno" | "abierto" | "cerrando" | "cerrado";

interface CorteCaja {
  id: string;
  negocio_id: string;
  usuario_id: string;
  fondo_inicial: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  total_ventas: number;
  propinas: number;
  descuentos: number;
  efectivo_esperado: number;
  efectivo_real: number | null;
  diferencia: number | null;
  ordenes_count: number;
  notas: string | null;
  abierto_en: string;
  cerrado_en: string | null;
}

interface PagoTurno {
  monto: number;
  tipo_pago: string;
  propina: number;
  ordenes: { descuento: number } | null;
}

export default function CajaPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── ESTADO PRINCIPAL ──
  const [estadoTurno, setEstadoTurno] = useState<EstadoTurno>("cargando");
  const [turnoActivo, setTurnoActivo] = useState<CorteCaja | null>(null);
  const [fondoInicial, setFondoInicial] = useState<string>("");
  const [efectivoReal, setEfectivoReal] = useState<string>("");
  const [notasCierre, setNotasCierre] = useState<string>("");
  const [procesando, setProcesando] = useState(false);

  // ── DATOS TURNO ──
  const [pagosTurno, setPagosTurno] = useState<PagoTurno[]>([]);
  const [ordenesCompletadas, setOrdenesCompletadas] = useState<number>(0);

  // ── HISTORIAL ──
  const [cortesHistorial, setCortesHistorial] = useState<CorteCaja[]>([]);

  // ── CONFIRMACIONES ──
  const [confirmarApertura, setConfirmarApertura] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // ── CARGAR TURNO ACTIVO ──
  const cargarTurnoActivo = useCallback(async () => {
    if (USE_MOCK || !supabase || !isAuthenticated || !user) {
      setEstadoTurno("sin_turno");
      return;
    }

    try {
      // Buscar corte abierto (sin cerrado_en)
      const { data: corteAbierto, error } = await supabase
        .from("cortes_caja")
        .select("*")
        .eq("negocio_id", user.negocio_id)
        .is("cerrado_en", null)
        .order("abierto_en", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (corteAbierto && !error) {
        const corte = corteAbierto as unknown as CorteCaja;
        setTurnoActivo(corte);
        setFondoInicial(String(corte.fondo_inicial));
        setEstadoTurno("abierto");
      } else {
        setEstadoTurno("sin_turno");
      }
    } catch {
      // No hay turno abierto (PGRST116 = no rows)
      setEstadoTurno("sin_turno");
    }
  }, [isAuthenticated, user]);

  // ── CARGAR PAGOS DEL TURNO ──
  const cargarPagosTurno = useCallback(async () => {
    if (USE_MOCK || !supabase || !turnoActivo) return;

    try {
      // Pagos de ordenes completadas desde que se abrió el turno
      const { data: pagos } = await supabase
        .from("pagos")
        .select("monto, tipo_pago, propina, ordenes:orden_id(descuento)")
        .eq("negocio_id", turnoActivo.negocio_id)
        .eq("estado", "completado")
        .gte("creado_en", turnoActivo.abierto_en);

      if (pagos) {
        setPagosTurno(pagos as unknown as PagoTurno[]);
      }

      // Contar ordenes completadas del turno
      const { count } = await supabase
        .from("ordenes")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", turnoActivo.negocio_id)
        .eq("estado", "completada")
        .gte("creado_en", turnoActivo.abierto_en);

      setOrdenesCompletadas(count ?? 0);
    } catch {
      console.warn("[Caja] Error cargando pagos del turno");
    }
  }, [turnoActivo]);

  // ── CARGAR HISTORIAL ──
  const cargarHistorial = useCallback(async () => {
    if (USE_MOCK || !supabase || !user) return;

    try {
      const { data } = await supabase
        .from("cortes_caja")
        .select("*")
        .eq("negocio_id", user.negocio_id)
        .not("cerrado_en", "is", null)
        .order("cerrado_en", { ascending: false })
        .limit(30);

      if (data) setCortesHistorial(data as CorteCaja[]);
    } catch {
      console.warn("[Caja] Error cargando historial");
    }
  }, [user]);

  // ── EFFECTS ──
  useEffect(() => {
    cargarTurnoActivo();
  }, [cargarTurnoActivo]);

  useEffect(() => {
    if (turnoActivo) cargarPagosTurno();
  }, [turnoActivo, cargarPagosTurno]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // ── REALTIME: refetch pagos cuando hay nuevos cobros ──
  useEffect(() => {
    if (!turnoActivo) return;
    const subPagos = subscribeToTable("pagos", () => cargarPagosTurno());
    const subOrdenes = subscribeToTable("ordenes", () => cargarPagosTurno());
    return () => {
      subPagos.unsubscribe();
      subOrdenes.unsubscribe();
    };
  }, [turnoActivo, cargarPagosTurno]);

  // ── CÁLCULOS: Turno abierto ──
  const ventasEfectivo = useMemo(
    () => pagosTurno.reduce((acc, p) => acc + (p.tipo_pago === "efectivo" ? Number(p.monto) : 0), 0),
    [pagosTurno],
  );
  const ventasTarjeta = useMemo(
    () => pagosTurno.reduce((acc, p) => acc + (p.tipo_pago === "tarjeta" ? Number(p.monto) : 0), 0),
    [pagosTurno],
  );
  const ventasTransferencia = useMemo(
    () => pagosTurno.reduce((acc, p) => acc + (p.tipo_pago === "transferencia" ? Number(p.monto) : 0), 0),
    [pagosTurno],
  );
  const totalVentas = ventasEfectivo + ventasTarjeta + ventasTransferencia;
  const propinasTotal = useMemo(
    () => pagosTurno.reduce((acc, p) => acc + Number(p.propina || 0), 0),
    [pagosTurno],
  );
  const descuentosTotal = useMemo(
    () => pagosTurno.reduce((acc, p) => acc + Number((p.ordenes as any)?.descuento || 0), 0),
    [pagosTurno],
  );
  const fondoInicialNum = turnoActivo ? Number(turnoActivo.fondo_inicial) : (parseFloat(fondoInicial) || 0);
  const efectivoEsperado = fondoInicialNum + ventasEfectivo;

  // ── CÁLCULOS: Cierre ──
  const efectivoRealNum = parseFloat(efectivoReal) || 0;
  const diferencia = efectivoRealNum - efectivoEsperado;

  // ── HANDLERS: Apertura de turno ──
  const handleAbrirTurno = async () => {
    if (!user) return;
    setProcesando(true);

    const res = await insertRecordReturning<CorteCaja>("cortes_caja", {
      negocio_id: user.negocio_id,
      usuario_id: user.id,
      fondo_inicial: parseFloat(fondoInicial) || 0,
      abierto_en: new Date().toISOString(),
    });

    if (res.success && res.data) {
      setTurnoActivo(res.data);
      setEstadoTurno("abierto");
      showToast("Turno abierto", "success");
    } else {
      showToast(`Error al abrir turno: ${res.error}`, "error");
    }

    setProcesando(false);
    setConfirmarApertura(false);
  };

  // ── HANDLERS: Cierre de turno ──
  const handleIniciarCierre = () => {
    if (!efectivoReal || efectivoRealNum === 0) return;
    setEstadoTurno("cerrando");
  };

  const handleConfirmarCierre = async () => {
    if (!turnoActivo) return;
    setProcesando(true);

    const res = await updateRecord("cortes_caja", turnoActivo.id, {
      ventas_efectivo: ventasEfectivo,
      ventas_tarjeta: ventasTarjeta,
      ventas_transferencia: ventasTransferencia,
      total_ventas: totalVentas,
      propinas: propinasTotal,
      descuentos: descuentosTotal,
      efectivo_esperado: efectivoEsperado,
      efectivo_real: efectivoRealNum,
      diferencia,
      ordenes_count: ordenesCompletadas,
      notas: notasCierre || null,
      cerrado_en: new Date().toISOString(),
    });

    if (res.success) {
      showToast("Turno cerrado correctamente", "success");
      setEstadoTurno("cerrado");
      cargarHistorial();
    } else {
      showToast(`Error al cerrar turno: ${res.error}`, "error");
    }

    setProcesando(false);
    setConfirmarCierre(false);
  };

  const handleNuevoTurno = () => {
    setEstadoTurno("sin_turno");
    setTurnoActivo(null);
    setFondoInicial("");
    setEfectivoReal("");
    setNotasCierre("");
    setPagosTurno([]);
    setOrdenesCompletadas(0);
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

  // ── LOADING ──
  if (estadoTurno === "cargando") {
    return (
      <div className="flex h-[calc(100vh-3.5rem-4rem)] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

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
              {cortesHistorial.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cortesHistorial.map((corte) => {
            const fecha = new Date(corte.cerrado_en!);
            const diferenciaCorte = Number(corte.diferencia) || 0;
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
                  {formatMXN(Number(corte.total_ventas))} · {corte.ordenes_count} órdenes
                </div>
              </button>
            );
          })}

          {cortesHistorial.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar size={24} className="text-text-25 mb-2" />
              <p className="text-xs text-text-25 text-center">Sin cortes anteriores</p>
            </div>
          )}
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
                        {formatMXN(fondoInicialNum)}
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
                    <span className="tabular-nums">{ordenesCompletadas}</span>
                  </div>
                </div>

                {/* Notas de cierre */}
                <div className="mb-6">
                  <label className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notasCierre}
                    onChange={(e) => setNotasCierre(e.target.value)}
                    placeholder="Observaciones del turno..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-100 placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEstadoTurno("abierto")}
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
                    Fondo: {formatMXN(fondoInicialNum)}
                    {turnoActivo && (
                      <span className="ml-2">
                        · Abierto {new Date(turnoActivo.abierto_en).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total vendido */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">Hoy</span>
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
                    <span className="text-[10px] text-text-25 font-medium">Total</span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Órdenes</p>
                  <p className="text-2xl font-bold text-text-100 tabular-nums">
                    {ordenesCompletadas}
                  </p>
                </div>

                {/* Ticket promedio */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">Promedio</span>
                  </div>
                  <p className="text-sm text-text-45 mb-1">Ticket</p>
                  <p className="text-2xl font-bold text-text-100 tabular-nums">
                    {formatMXN(ordenesCompletadas > 0 ? totalVentas / ordenesCompletadas : 0)}
                  </p>
                </div>

                {/* Propinas */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp size={18} className="text-accent" />
                    <span className="text-[10px] text-text-25 font-medium">Extra</span>
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
                    <h3 className="text-sm font-medium text-text-100">Efectivo</h3>
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
                    {totalVentas > 0 ? Math.round((ventasEfectivo / totalVentas) * 100) : 0}%
                  </p>
                </div>

                {/* Tarjeta */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={18} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-100">Tarjeta</h3>
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
                    {totalVentas > 0 ? Math.round((ventasTarjeta / totalVentas) * 100) : 0}%
                  </p>
                </div>

                {/* Transferencia */}
                <div className="p-5 rounded-xl bg-surface-2 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRightLeft size={18} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-100">Transf.</h3>
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
                    {totalVentas > 0 ? Math.round((ventasTransferencia / totalVentas) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Descuentos y efectivo esperado */}
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

              {/* Sección de cierre */}
              <div className="p-5 rounded-xl bg-surface-2 border border-border">
                <h2 className="text-sm font-semibold text-text-100 mb-3">
                  Cerrar turno
                </h2>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                      Efectivo contado
                    </label>
                    <input
                      type="number"
                      value={efectivoReal}
                      onChange={(e) => setEfectivoReal(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-surface-3 border border-border text-text-100 text-lg font-semibold tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[48px]"
                    />
                  </div>
                  <button
                    onClick={handleIniciarCierre}
                    disabled={!efectivoReal || efectivoRealNum === 0}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 min-h-[48px]",
                      efectivoReal && efectivoRealNum > 0
                        ? "btn-primary"
                        : "bg-surface-3 text-text-25 cursor-not-allowed"
                    )}
                  >
                    <Lock size={16} />
                    Cerrar
                  </button>
                </div>
                {efectivoReal && efectivoRealNum > 0 && (
                  <div className={cn("mt-3 p-3 rounded-xl border", diferenciaBg, diferencia === 0 ? "border-status-ok/20" : diferencia > 0 ? "border-status-warn/20" : "border-status-err/20")}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-medium", diferenciaText)}>
                        {diferencia === 0 ? "✓ Cuadra" : diferencia > 0 ? "Sobra" : "Falta"}
                      </span>
                      <span className={cn("text-lg font-semibold tabular-nums", diferenciaText)}>
                        {diferencia >= 0 ? "+" : ""}{formatMXN(diferencia)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CONFIRM DIALOGS ── */}
      <ConfirmDialog
        open={confirmarApertura}
        onClose={() => setConfirmarApertura(false)}
        onConfirm={handleAbrirTurno}
        title="Abrir turno"
        description={`¿Abrir con fondo inicial de ${formatMXN(parseFloat(fondoInicial) || 0)}?`}
        confirmLabel="Abrir"
        loading={procesando}
      />

      <ConfirmDialog
        open={confirmarCierre}
        onClose={() => {
          setConfirmarCierre(false);
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
                Histórico de cortes (últimos 30)
              </h2>
              <button
                onClick={() => setMostrarHistorial(false)}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} className="text-text-45" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {cortesHistorial.map((corte) => {
                const fecha = new Date(corte.cerrado_en!);
                const diferenciaCorte = Number(corte.diferencia) || 0;
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
                          {formatMXN(Number(corte.total_ventas))}
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
                        &ldquo;{corte.notas}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] text-text-25">
                      <div>
                        <p className="opacity-70">Fondo</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(Number(corte.fondo_inicial))}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Efectivo</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(Number(corte.ventas_efectivo))}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Tarjeta</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(Number(corte.ventas_tarjeta))}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-70">Propina</p>
                        <p className="font-medium text-text-70">
                          {formatMXN(Number(corte.propinas))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {cortesHistorial.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-45">Sin cortes registrados aún</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
