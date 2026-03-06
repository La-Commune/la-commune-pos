"use client";

import { useState, useMemo } from "react";
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Receipt,
  CheckCircle2,
  X,
  DollarSign,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { MOCK_ORDENES, type OrdenMock } from "@/lib/mock-data";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

const metodoPagoConfig: Record<MetodoPago, { label: string; icon: typeof Banknote }> = {
  efectivo: { label: "Efectivo", icon: Banknote },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  transferencia: { label: "Transferencia", icon: ArrowRightLeft },
};

const quickAmounts = [50, 100, 200, 500, 1000];

export default function CobrosPage() {
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMock | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [propina, setPropina] = useState(0);
  const [propinaCustom, setPropinaCustom] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [cobrado, setCobrado] = useState(false);

  // Órdenes listas para cobrar
  const ordenesCobrables = useMemo(
    () => MOCK_ORDENES.filter((o) => ["lista", "confirmada", "preparando"].includes(o.estado)),
    []
  );

  // Cálculos
  const subtotalConDescuento = ordenSeleccionada
    ? ordenSeleccionada.subtotal * (1 - descuento / 100)
    : 0;
  const impuesto = Math.round(subtotalConDescuento * 0.16 * 100) / 100;
  const totalFinal = subtotalConDescuento + impuesto + propina;
  const monto = parseFloat(montoRecibido) || 0;
  const cambio = metodoPago === "efectivo" ? Math.max(0, monto - totalFinal) : 0;
  const puedeCobar =
    ordenSeleccionada &&
    (metodoPago !== "efectivo" || monto >= totalFinal);

  const resetCobro = () => {
    setMontoRecibido("");
    setPropina(0);
    setPropinaCustom("");
    setDescuento(0);
    setCobrado(false);
  };

  const handleSeleccionarOrden = (orden: OrdenMock) => {
    setOrdenSeleccionada(orden);
    resetCobro();
  };

  const handleCobrar = () => {
    if (!puedeCobar) return;
    setCobrado(true);
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
                "w-full p-4 rounded-xl bg-surface-2 border text-left transition-all duration-[400ms] ease-smooth hover:shadow-lg hover:shadow-black/20",
                ordenSeleccionada?.id === orden.id ? "border-accent" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text-100">
                  {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : orden.origen.replace("_", " ")}
                </span>
                <span className="text-sm font-semibold text-text-100 tabular-nums">
                  {formatMXN(orden.total)}
                </span>
              </div>
              <div className="text-[11px] text-text-25">
                {orden.items.reduce((a, i) => a + i.cantidad, 0)} items · {orden.items.map((i) => i.nombre).slice(0, 2).join(", ")}
                {orden.items.length > 2 && "..."}
              </div>
            </button>
          ))}

          {ordenesCobrables.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <p className="text-text-25 text-xs uppercase tracking-widest">
                Sin órdenes pendientes
              </p>
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Receipt size={32} className="text-text-25 mx-auto mb-3 opacity-30" />
              <p className="text-text-25 text-xs uppercase tracking-widest">
                Selecciona una orden para cobrar
              </p>
            </div>
          </div>
        ) : cobrado ? (
          /* ── Confirmación de cobro ── */
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
                {metodoPagoConfig[metodoPago].label}
                {cambio > 0 && ` · Cambio: ${formatMXN(cambio)}`}
              </p>

              <div className="flex gap-3 justify-center">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-secondary text-[13px]">
                  <Receipt size={14} />
                  Imprimir ticket
                </button>
                <button
                  onClick={() => {
                    setOrdenSeleccionada(null);
                    resetCobro();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-[13px]"
                >
                  Siguiente cobro
                </button>
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
                  </h3>
                  <button
                    onClick={() => {
                      setOrdenSeleccionada(null);
                      resetCobro();
                    }}
                    className="p-1 rounded-lg text-text-25 hover:text-text-45"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-2.5 mb-4">
                  {ordenSeleccionada.items.map((item) => (
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
                    <span className="tabular-nums">{formatMXN(ordenSeleccionada.subtotal)}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-xs text-status-ok">
                      <span>Descuento ({descuento}%)</span>
                      <span className="tabular-nums">
                        -{formatMXN(ordenSeleccionada.subtotal * (descuento / 100))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-text-45">
                    <span>IVA (16%)</span>
                    <span className="tabular-nums">{formatMXN(impuesto)}</span>
                  </div>
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
                </div>
              </div>
            </div>

            {/* Columna derecha: Método de pago y controles */}
            <div className="flex flex-col gap-4">
              {/* Método de pago */}
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
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300",
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

              {/* Monto recibido (solo efectivo) */}
              {metodoPago === "efectivo" && (
                <div>
                  <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                    Monto recibido
                  </span>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-border text-text-100 text-lg font-semibold tabular-nums placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setMontoRecibido(String(amt))}
                        className="flex-1 py-1.5 rounded-lg bg-surface-3 border border-border text-xs text-text-45 hover:text-text-70 hover:border-border-hover transition-all duration-300 tabular-nums"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setMontoRecibido(String(Math.ceil(totalFinal)))}
                      className="flex-1 py-1.5 rounded-lg bg-accent-soft border border-accent text-xs text-accent font-medium transition-all duration-300"
                    >
                      Exacto
                    </button>
                  </div>

                  {monto >= totalFinal && monto > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-status-ok-bg border border-[rgba(107,155,116,0.2)]">
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

              {/* Propina */}
              <div>
                <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2.5">
                  Propina
                </span>
                <div className="flex gap-1.5">
                  {[0, 10, 15, 20].map((pct) => {
                    const amount = pct === 0 ? 0 : Math.round(subtotalConDescuento * (pct / 100) * 100) / 100;
                    return (
                      <button
                        key={pct}
                        onClick={() => {
                          setPropina(amount);
                          setPropinaCustom("");
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-xs font-medium transition-all duration-300",
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
                    className="flex-1 px-2 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-100 tabular-nums placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300 text-center"
                  />
                </div>
              </div>

              {/* Descuento */}
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
                        "flex-1 py-2 rounded-lg border text-xs font-medium transition-all duration-300",
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

              {/* Botón de cobrar */}
              <div className="mt-auto">
                <button
                  onClick={handleCobrar}
                  disabled={!puedeCobar}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all duration-300",
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
    </div>
  );
}
