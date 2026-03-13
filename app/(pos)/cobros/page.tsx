"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Receipt,
  CheckCircle2,
  X,
  DollarSign,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Zap,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { useOrdenes, insertRecord, updateRecord, subscribeToTable } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { showToast } from "@/components/ui/Toast";
import { deducirInventarioPorOrden } from "@/lib/inventory-deduction";
import TicketDigital, { type TicketData, type TicketItem, type TicketPago } from "@/components/ui/TicketDigital";
import type { Orden, OrdenWithMesa, ItemOrdenJSON } from "@/types/database";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

interface PagoSplit {
  id: string;
  metodo: MetodoPago;
  monto: number;
  montoRecibido?: number;
}

const metodoPagoConfig: Record<MetodoPago, { label: string; icon: typeof Banknote }> = {
  efectivo: { label: "Efectivo", icon: Banknote },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  transferencia: { label: "Transferencia", icon: ArrowRightLeft },
};

const quickAmounts = [50, 100, 200, 500, 1000];

export default function CobrosPage() {
  const searchParams = useSearchParams();
  const { data: ordenes, refetch: refetchOrdenes } = useOrdenes();
  const user = useAuthStore((s) => s.user);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [propina, setPropina] = useState(0);
  const [propinaCustom, setPropinaCustom] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [cobrado, setCobrado] = useState(false);
  /* R7: Paso de verificación */
  const [verificando, setVerificando] = useState(false);
  /* R3: Loading state */
  const [procesando, setProcesando] = useState(false);
  /* Split payments */
  const [dividirPago, setDividirPago] = useState(false);
  const [splits, setSplits] = useState<PagoSplit[]>([
    { id: "1", metodo: "efectivo", monto: 0 }
  ]);
  /* Ticket digital */
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  // ── Realtime: refetch cuando cambian ordenes o mesas ──
  useEffect(() => {
    const subOrdenes = subscribeToTable("ordenes", () => refetchOrdenes());
    const subMesas = subscribeToTable("mesas", () => refetchOrdenes());
    return () => {
      subOrdenes.unsubscribe();
      subMesas.unsubscribe();
    };
  }, [refetchOrdenes]);

  // Normalizar mesa_numero desde join
  const ordenesNormalizadas = useMemo(
    () =>
      (ordenes as unknown as OrdenWithMesa[]).map((o) => ({
        ...o,
        mesa_numero: o.mesas?.numero ?? o.mesa_numero ?? null,
      })),
    [ordenes],
  );

  // Órdenes listas para cobrar
  const ordenesCobrables = useMemo(
    () => ordenesNormalizadas.filter((o) => ["lista", "confirmada", "preparando"].includes(o.estado)),
    [ordenesNormalizadas],
  );

  /* R11: Deep-link — recibir orden desde query param */
  useEffect(() => {
    const ordenParam = searchParams.get("orden");
    if (ordenParam) {
      const orden = ordenesCobrables.find((o) => o.id === ordenParam);
      if (orden) setOrdenSeleccionada(orden);
    }
  }, [searchParams, ordenesCobrables]);

  // Sincronizar orden seleccionada cuando llegan updates realtime
  useEffect(() => {
    if (!ordenSeleccionada) return;
    const updated = ordenesNormalizadas.find((o) => o.id === ordenSeleccionada.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(ordenSeleccionada)) {
      setOrdenSeleccionada(updated);
    }
  }, [ordenesNormalizadas, ordenSeleccionada]);

  // Cálculos — precios ya incluyen IVA
  // total de la orden = suma directa de items (IVA incluido)
  const totalOrden = ordenSeleccionada ? ordenSeleccionada.total : 0;
  const montoDescuento = Math.round(totalOrden * (descuento / 100) * 100) / 100;
  const totalConDescuento = totalOrden - montoDescuento;
  const totalFinal = totalConDescuento + propina;
  // Desglose fiscal (hacia atrás)
  const baseGravable = Math.round((totalConDescuento / 1.16) * 100) / 100;
  const ivaDesglosado = Math.round((totalConDescuento - baseGravable) * 100) / 100;
  const monto = parseFloat(montoRecibido) || 0;
  const cambio = metodoPago === "efectivo" ? Math.max(0, monto - totalFinal) : 0;

  // Split payments calculations
  const totalSplits = splits.reduce((sum, s) => sum + s.monto, 0);
  const remainingSplit = Math.max(0, totalFinal - totalSplits);
  const splitsValid = dividirPago ? totalSplits === totalFinal : true;

  // Get efectivo split for change calculation
  const efectivoSplit = splits.find(s => s.metodo === "efectivo");
  const montoRecibidoEfectivo = efectivoSplit?.montoRecibido || 0;
  const cambioSplit = efectivoSplit ? Math.max(0, montoRecibidoEfectivo - (efectivoSplit.monto)) : 0;

  const puedeCobar = ordenSeleccionada && (
    dividirPago
      ? splitsValid
      : (metodoPago !== "efectivo" || monto >= totalFinal)
  );

  const resetCobro = () => {
    setMontoRecibido("");
    setPropina(0);
    setPropinaCustom("");
    setDescuento(0);
    setCobrado(false);
    setVerificando(false);
    setProcesando(false);
    setDividirPago(false);
    setSplits([{ id: "1", metodo: "efectivo", monto: 0 }]);
  };

  const handleSeleccionarOrden = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    resetCobro();
  };

  const handleAddSplit = () => {
    if (splits.length >= 3) return;
    const newId = String(Math.max(...splits.map(s => parseInt(s.id, 10)), 0) + 1);
    setSplits([...splits, { id: newId, metodo: "tarjeta", monto: 0 }]);
  };

  const handleRemoveSplit = (id: string) => {
    if (splits.length === 1) return;
    setSplits(splits.filter(s => s.id !== id));
  };

  const handleUpdateSplit = (id: string, updates: Partial<PagoSplit>) => {
    setSplits(splits.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  /* R7: Paso 1 — mostrar verificación */
  const handleIniciarCobro = () => {
    if (!puedeCobar) return;
    setVerificando(true);
  };

  /* R7: Paso 2 — confirmar cobro con loading → Supabase */
  const handleConfirmarCobro = async () => {
    if (!ordenSeleccionada || !user) return;
    setProcesando(true);

    try {
      const negocioId = user.negocio_id;

      // 1. Insertar pago(s) en tabla `pagos`
      if (dividirPago) {
        // Split payments — un registro por cada método
        for (const split of splits) {
          if (split.monto <= 0) continue;
          const res = await insertRecord("pagos", {
            negocio_id: negocioId,
            orden_id: ordenSeleccionada.id,
            monto: split.monto,
            tipo_pago: split.metodo,
            estado: "completado",
            propina: 0, // propina va en el primer split o en la orden
          });
          if (!res.success) {
            showToast(`Error al registrar pago: ${res.error}`, "error");
            setProcesando(false);
            return;
          }
        }
        // Propina como pago extra si hay
        if (propina > 0) {
          await insertRecord("pagos", {
            negocio_id: negocioId,
            orden_id: ordenSeleccionada.id,
            monto: 0,
            tipo_pago: splits[0].metodo,
            estado: "completado",
            propina,
          });
        }
      } else {
        // Pago único
        const res = await insertRecord("pagos", {
          negocio_id: negocioId,
          orden_id: ordenSeleccionada.id,
          monto: totalConDescuento,
          tipo_pago: metodoPago,
          estado: "completado",
          propina,
        });
        if (!res.success) {
          showToast(`Error al registrar pago: ${res.error}`, "error");
          setProcesando(false);
          return;
        }
      }

      // 2. Actualizar orden → estado 'completada' + descuento + propina
      const resOrden = await updateRecord("ordenes", ordenSeleccionada.id, {
        estado: "completada",
        descuento: montoDescuento,
        propina,
      });

      if (!resOrden.success) {
        showToast(`Error al actualizar orden: ${resOrden.error}`, "error");
        setProcesando(false);
        return;
      }

      // 3. Liberar mesa (si la orden tiene mesa vinculada)
      if (ordenSeleccionada.mesa_id) {
        await updateRecord("mesas", ordenSeleccionada.mesa_id, {
          estado: "disponible",
          orden_actual_id: null,
          ocupada_desde: null,
        });
      }

      // 4. Auto-deducir inventario según recetas
      const items = (ordenSeleccionada.items ?? []) as ItemOrdenJSON[];
      if (items.length > 0) {
        const invResult = await deducirInventarioPorOrden(
          items,
          ordenSeleccionada.id,
          negocioId,
          user.id,
          ordenSeleccionada.folio,
        );
        if (invResult.lowStock.length > 0) {
          showToast(`Stock bajo: ${invResult.lowStock.join(", ")}`, "info");
        }
        if (invResult.errors.length > 0 && process.env.NODE_ENV === "development") {
          console.log("[Inventario] Errores de deducción:", invResult.errors);
        }
      }

      // 5. Generar datos del ticket digital
      const itemsOrden = (ordenSeleccionada.items ?? []) as ItemOrdenJSON[];
      const ticketItems: TicketItem[] = itemsOrden.map((item, idx) => ({
        id: item.producto_id || `item-${idx}`,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        tamano: item.tamano,
        notas: item.notas,
      }));

      const ticketPagos: TicketPago[] = dividirPago
        ? splits.filter(s => s.monto > 0).map(s => ({ metodo: s.metodo, monto: s.monto }))
        : [{ metodo: metodoPago, monto: totalConDescuento }];

      setTicketData({
        folio: ordenSeleccionada.folio,
        fecha: new Date(),
        mesaNumero: ordenSeleccionada.mesa_numero ?? null,
        origen: ordenSeleccionada.origen,
        items: ticketItems,
        subtotal: totalOrden,
        descuento: montoDescuento,
        descuentoPct: descuento,
        propina,
        totalFinal,
        pagos: ticketPagos,
        cambio: dividirPago ? cambioSplit : cambio,
        atendidoPor: user.nombre || "Staff",
        negocioNombre: "La Commune",
        negocioDireccion: "Mineral de la Reforma, Hidalgo",
      });

      showToast("Cobro completado", "success");
      setProcesando(false);
      setVerificando(false);
      setCobrado(true);
    } catch {
      showToast("Error de conexión al procesar cobro", "error");
      setProcesando(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)]" style={{ gap: "var(--density-gap)" }}>
      {/* ── Lista de órdenes por cobrar ── */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: "var(--panel-md)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
            Órdenes por cobrar
          </h2>
          <span className="text-[11px] text-text-25 tabular-nums">{ordenesCobrables.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {ordenesCobrables.map((orden) => (
            <button
              key={orden.id}
              onClick={() => handleSeleccionarOrden(orden)}
              className={cn(
                "w-full p-4 rounded-xl bg-surface-2 border text-left transition-all duration-[400ms] ease-smooth hover:shadow-lg hover:shadow-black/20 min-h-[44px]",
                ordenSeleccionada?.id === orden.id ? "border-accent" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text-100">
                  {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : orden.origen.replace("_", " ")}
                  {orden.folio && <span className="ml-1.5 text-[10px] text-text-25 font-normal">#{orden.folio}</span>}
                </span>
                <span className="text-sm font-semibold text-text-100 tabular-nums">
                  {formatMXN(orden.total)}
                </span>
              </div>
              <div className="text-[11px] text-text-25">
                {(orden.items as unknown as ItemOrdenJSON[]).reduce((a: number, i: ItemOrdenJSON) => a + i.cantidad, 0)} items · {(orden.items as unknown as ItemOrdenJSON[]).map((i: ItemOrdenJSON) => i.nombre).slice(0, 2).join(", ")}
                {(orden.items as unknown as ItemOrdenJSON[]).length > 2 && "..."}
              </div>
            </button>
          ))}

          {/* R13: Empty state mejorado */}
          {ordenesCobrables.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                <Receipt size={24} className="text-text-25" />
              </div>
              <p className="text-sm text-text-45 mb-1">Sin órdenes pendientes</p>
              <p className="text-xs text-text-25 text-center">Las órdenes listas aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel de cobro ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Cobros</h1>
        </div>

        {!ordenSeleccionada ? (
          /* R13: Empty state mejorado */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                <Receipt size={28} className="text-text-25" />
              </div>
              <p className="text-sm text-text-45 mb-1">Selecciona una orden para cobrar</p>
              <p className="text-xs text-text-25">Elige de la lista de órdenes a la izquierda</p>
            </div>
          </div>
        ) : cobrado ? (
          /* ── Confirmación de cobro exitoso ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-status-ok-bg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-status-ok" />
              </div>
              <h2 className="text-lg font-medium text-text-100 mb-2">Cobro completado</h2>
              <p className="text-sm text-text-45 mb-1">
                {ordenSeleccionada.mesa_numero
                  ? `Mesa ${ordenSeleccionada.mesa_numero}`
                  : ordenSeleccionada.origen.replace("_", " ")}
                {" — "}
                {formatMXN(totalFinal)}
              </p>
              <p className="text-xs text-text-25 mb-6">
                {dividirPago ? (
                  <span>
                    {splits.map((s, i) => (
                      <span key={s.id}>
                        {metodoPagoConfig[s.metodo].label}: {formatMXN(s.monto)}
                        {i < splits.length - 1 && " · "}
                      </span>
                    ))}
                  </span>
                ) : (
                  <>
                    {metodoPagoConfig[metodoPago].label}
                    {cambio > 0 && ` · Cambio: ${formatMXN(cambio)}`}
                  </>
                )}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setMostrarTicket(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl btn-secondary text-[13px] min-h-[44px]"
                >
                  <Receipt size={14} />
                  Ver ticket
                </button>
                <button
                  onClick={() => {
                    setOrdenSeleccionada(null);
                    resetCobro();
                    setTicketData(null);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl btn-primary text-[13px] min-h-[44px]"
                >
                  Siguiente cobro
                </button>
              </div>
            </div>
          </div>
        ) : verificando ? (
          /* ── R7: Pantalla de verificación con el cliente ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="p-8 rounded-2xl bg-surface-2 border border-border text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck size={28} className="text-accent" />
                </div>

                <p className="text-xs text-text-45 uppercase tracking-widest mb-4">Confirme con el cliente</p>

                {/* Total GRANDE */}
                <p className="text-4xl font-bold text-text-100 tabular-nums mb-2">
                  {formatMXN(totalFinal)}
                </p>

                {/* Detalles */}
                <div className="space-y-1.5 mb-6 text-sm text-text-45">
                  <p>
                    {ordenSeleccionada.mesa_numero
                      ? `Mesa ${ordenSeleccionada.mesa_numero}`
                      : ordenSeleccionada.origen.replace("_", " ")}
                    {ordenSeleccionada.folio && ` · #${ordenSeleccionada.folio}`}
                    {" · "}{(ordenSeleccionada.items ?? []).reduce((a: number, i: any) => a + i.cantidad, 0)} items
                  </p>

                  {/* Métodos de pago */}
                  {dividirPago ? (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
                      {splits.map((split) => (
                        <p key={split.id} className="flex items-center justify-center gap-2">
                          {(() => {
                            const Icon = metodoPagoConfig[split.metodo].icon;
                            return <Icon size={16} />;
                          })()}
                          {metodoPagoConfig[split.metodo].label}: {formatMXN(split.monto)}
                        </p>
                      ))}
                      {efectivoSplit && cambioSplit > 0 && (
                        <p className="text-status-ok font-medium">
                          Cambio: {formatMXN(cambioSplit)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="flex items-center justify-center gap-2">
                      {(() => {
                        const Icon = metodoPagoConfig[metodoPago].icon;
                        return <Icon size={16} />;
                      })()}
                      {metodoPagoConfig[metodoPago].label}
                    </p>
                  )}

                  {cambio > 0 && !dividirPago && (
                    <p className="text-status-ok font-medium">
                      Cambio: {formatMXN(cambio)}
                    </p>
                  )}
                  {propina > 0 && (
                    <p>Propina: {formatMXN(propina)}</p>
                  )}
                  {descuento > 0 && (
                    <p>Descuento: {descuento}%</p>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setVerificando(false)}
                    disabled={procesando}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl btn-ghost text-[13px] font-medium min-h-[48px]"
                  >
                    <ArrowLeft size={16} />
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmarCobro}
                    disabled={procesando}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary text-[13px] font-semibold min-h-[48px]",
                      procesando && "opacity-70 cursor-wait"
                    )}
                  >
                    {procesando ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirmar cobro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Formulario de cobro ── */
          <div className="flex-1 grid grid-cols-2 gap-6">
            {/* Columna izquierda: Detalle de la orden */}
            <div className="flex flex-col">
              <div className="p-5 rounded-xl bg-surface-2 border border-border flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-100">
                    {ordenSeleccionada.mesa_numero
                      ? `Mesa ${ordenSeleccionada.mesa_numero}`
                      : ordenSeleccionada.origen.replace("_", " ")}
                    {ordenSeleccionada.folio && <span className="ml-2 text-[11px] text-text-25 font-normal">#{ordenSeleccionada.folio}</span>}
                  </h3>
                  {/* R1: Target táctil de 44px */}
                  <button
                    onClick={() => {
                      setOrdenSeleccionada(null);
                      resetCobro();
                    }}
                    className="p-2.5 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-3 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-2.5 mb-4">
                  {(ordenSeleccionada.items ?? []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-accent tabular-nums w-5 text-center">
                          {item.cantidad}x
                        </span>
                        <span className="text-xs text-text-100">{item.nombre}</span>
                      </div>
                      <span className="text-xs text-text-70 tabular-nums">
                        {formatMXN(item.precio_unitario * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-text-45">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatMXN(totalOrden)}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-xs text-status-ok">
                      <span>Descuento ({descuento}%)</span>
                      <span className="tabular-nums">
                        -{formatMXN(montoDescuento)}
                      </span>
                    </div>
                  )}
                  {propina > 0 && (
                    <div className="flex justify-between text-xs text-accent">
                      <span>Propina</span>
                      <span className="tabular-nums">{formatMXN(propina)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-text-100 pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="tabular-nums">{formatMXN(totalFinal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-25">
                    <span>IVA incluido</span>
                    <span className="tabular-nums">{formatMXN(ivaDesglosado)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Método de pago y controles */}
            <div className="flex flex-col gap-4">
              {/* Dividir pago toggle */}
              <div>
                <button
                  onClick={() => {
                    setDividirPago(!dividirPago);
                    if (!dividirPago) {
                      setSplits([{ id: "1", metodo: "efectivo", monto: 0 }]);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 min-h-[44px]",
                    dividirPago
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-text-45 hover:border-border-hover"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} />
                    <span className="text-sm font-medium">Dividir pago</span>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-md border transition-all duration-300",
                    dividirPago ? "bg-accent border-accent" : "border-border"
                  )} />
                </button>
              </div>

              {/* Método de pago — R1: min-h-[44px] */}
              {!dividirPago && (
                <div>
                  <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                    Método de pago
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(metodoPagoConfig) as [MetodoPago, typeof metodoPagoConfig.efectivo][]).map(
                      ([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setMetodoPago(key)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-300 min-h-[44px]",
                              metodoPago === key
                                ? "border-accent bg-accent-soft text-accent"
                                : "border-border text-text-45 hover:border-border-hover"
                            )}
                          >
                            <Icon size={20} />
                            <span className="text-xs font-medium">{config.label}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Split payments form */}
              {dividirPago && (
                <div>
                  <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                    Formas de pago
                  </span>
                  <div className="space-y-2.5">
                    {splits.map((split, idx) => (
                      <div key={split.id} className="flex items-end gap-2">
                        {/* Método selector */}
                        <div className="flex gap-1.5">
                          {(Object.entries(metodoPagoConfig) as [MetodoPago, typeof metodoPagoConfig.efectivo][]).map(
                            ([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <button
                                  key={key}
                                  onClick={() => handleUpdateSplit(split.id, { metodo: key })}
                                  className={cn(
                                    "flex items-center justify-center p-2.5 rounded-lg border transition-all duration-300 min-h-[44px] min-w-[44px]",
                                    split.metodo === key
                                      ? "border-accent bg-accent-soft text-accent"
                                      : "border-border text-text-45 hover:border-border-hover"
                                  )}
                                  title={config.label}
                                >
                                  <Icon size={16} />
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* Monto input */}
                        <input
                          type="number"
                          value={split.monto || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val >= 0) {
                              handleUpdateSplit(split.id, { monto: Math.min(val, totalFinal) });
                            }
                          }}
                          min="0"
                          max={totalFinal}
                          placeholder="Monto"
                          className="flex-1 px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-text-100 text-sm font-medium tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
                        />

                        {/* Remove button */}
                        {splits.length > 1 && (
                          <button
                            onClick={() => handleRemoveSplit(split.id)}
                            className="p-2.5 rounded-lg text-text-25 hover:text-text-45 hover:bg-surface-3 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add split button */}
                    {splits.length < 3 && (
                      <button
                        onClick={handleAddSplit}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-text-45 hover:border-border-hover hover:text-text-70 transition-all duration-300 text-sm min-h-[44px]"
                      >
                        <Plus size={16} />
                        Agregar método
                      </button>
                    )}

                    {/* Remaining amount */}
                    <div className="p-3 rounded-lg bg-surface-3 border border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-45">Por cobrar</span>
                        <span className={cn(
                          "font-medium tabular-nums",
                          remainingSplit > 0 ? "text-status-warning" : "text-status-ok"
                        )}>
                          {formatMXN(remainingSplit)}
                        </span>
                      </div>
                    </div>

                    {/* Efectivo split monto recibido */}
                    {efectivoSplit && (
                      <div>
                        <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                          Monto recibido (efectivo)
                        </span>
                        <input
                          type="number"
                          value={efectivoSplit.montoRecibido || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val >= 0) {
                              handleUpdateSplit(efectivoSplit.id, { montoRecibido: val });
                            }
                          }}
                          min="0"
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-lg font-semibold tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
                        />
                        {montoRecibidoEfectivo >= efectivoSplit.monto && efectivoSplit.monto > 0 && (
                          <div className="mt-3 p-3 rounded-xl bg-status-ok-bg border border-status-ok/20">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-status-ok font-medium">Cambio</span>
                              <span className="text-lg font-semibold text-status-ok tabular-nums">
                                {formatMXN(cambioSplit)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Monto recibido (solo efectivo, sin split) */}
              {!dividirPago && metodoPago === "efectivo" && (
                <div>
                  <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                    Monto recibido
                  </span>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseFloat(val) >= 0) setMontoRecibido(val);
                    }}
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-lg font-semibold tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
                  />
                  {/* R1: Quick amounts con py-3 y min-h-[44px] */}
                  <div className="flex gap-1.5 mt-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setMontoRecibido(String(amt))}
                        className="flex-1 py-3 rounded-xl bg-surface-3 border border-border text-xs text-text-45 hover:text-text-70 hover:border-border-hover transition-all duration-300 tabular-nums min-h-[44px]"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setMontoRecibido(String(Math.ceil(totalFinal)))}
                      className="flex-1 py-3 rounded-xl bg-accent-soft border border-accent text-xs text-accent font-medium transition-all duration-300 min-h-[44px]"
                    >
                      Exacto
                    </button>
                  </div>

                  {monto >= totalFinal && monto > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-status-ok-bg border border-status-ok/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-status-ok font-medium">Cambio</span>
                        <span className="text-lg font-semibold text-status-ok tabular-nums">
                          {formatMXN(cambio)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Propina — R1: min-h-[44px] */}
              <div>
                <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                  Propina
                </span>
                <div className="flex gap-1.5">
                  {[0, 10, 15, 20].map((pct) => {
                    const amount = pct === 0 ? 0 : Math.round(totalConDescuento * (pct / 100) * 100) / 100;
                    return (
                      <button
                        key={pct}
                        onClick={() => {
                          setPropina(amount);
                          setPropinaCustom("");
                        }}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all duration-300 min-h-[44px]",
                          propina === amount && propinaCustom === ""
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-border text-text-45 hover:border-border-hover"
                        )}
                      >
                        {pct === 0 ? "Sin" : `${pct}%`}
                      </button>
                    );
                  })}
                  <input
                    type="number"
                    value={propinaCustom}
                    onChange={(e) => {
                      setPropinaCustom(e.target.value);
                      setPropina(parseFloat(e.target.value) || 0);
                    }}
                    placeholder="Otra"
                    className="flex-1 px-2 py-2.5 rounded-xl bg-surface-2 border border-border text-xs text-text-100 tabular-nums placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 text-center min-h-[44px]"
                  />
                </div>
              </div>

              {/* Descuento — R1: min-h-[44px] */}
              <div>
                <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                  Descuento
                </span>
                <div className="flex gap-1.5">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDescuento(pct)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all duration-300 min-h-[44px]",
                        descuento === pct
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-text-45 hover:border-border-hover"
                      )}
                    >
                      {pct === 0 ? "Sin" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* R7: Botón inicia flujo de verificación en vez de cobrar directo — R1: min-h-[48px] */}
              <div className="mt-auto">
                <button
                  onClick={handleIniciarCobro}
                  disabled={!puedeCobar}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all duration-300 min-h-[48px]",
                    puedeCobar
                      ? "btn-primary"
                      : "bg-surface-3 text-text-25 cursor-not-allowed"
                  )}
                >
                  <DollarSign size={18} />
                  Cobrar {formatMXN(totalFinal)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Ticket Digital Modal ── */}
      {mostrarTicket && ticketData && (
        <TicketDigital
          ticket={ticketData}
          onClose={() => setMostrarTicket(false)}
        />
      )}
    </div>
  );
}
