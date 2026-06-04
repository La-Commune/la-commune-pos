// ── Lógica pura de cobros y pagos divididos (split payments) ──
// Extraída de app/(pos)/cobros/page.tsx para poder testearla de forma aislada.

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

export interface PagoSplit {
  id: string;
  metodo: MetodoPago;
  monto: number;
  montoRecibido?: number;
}

export const MAX_SPLITS = 3;

/** Split inicial por default al activar "dividir pago" */
export function splitInicial(): PagoSplit[] {
  return [{ id: "1", metodo: "efectivo", monto: 0 }];
}

/** Totales de la orden — precios ya incluyen IVA (16%) */
export interface TotalesCobro {
  montoDescuento: number;
  totalConDescuento: number;
  totalFinal: number;
  baseGravable: number;
  ivaDesglosado: number;
}

export function calcularTotalesCobro(
  totalOrden: number,
  descuentoPct: number,
  propina: number
): TotalesCobro {
  const montoDescuento = Math.round(totalOrden * (descuentoPct / 100) * 100) / 100;
  const totalConDescuento = totalOrden - montoDescuento;
  const totalFinal = totalConDescuento + propina;
  // Desglose fiscal (hacia atrás): base = total / 1.16
  const baseGravable = Math.round((totalConDescuento / 1.16) * 100) / 100;
  const ivaDesglosado = Math.round((totalConDescuento - baseGravable) * 100) / 100;
  return { montoDescuento, totalConDescuento, totalFinal, baseGravable, ivaDesglosado };
}

/** Estado calculado de los splits contra el total a cobrar */
export interface EstadoSplits {
  totalSplits: number;
  remainingSplit: number;
  splitsValid: boolean;
  cambioSplit: number;
}

export function calcularEstadoSplits(
  splits: PagoSplit[],
  totalFinal: number
): EstadoSplits {
  const totalSplits = splits.reduce((sum, s) => sum + s.monto, 0);
  const remainingSplit = Math.max(0, totalFinal - totalSplits);
  const splitsValid = totalSplits === totalFinal;

  const efectivoSplit = splits.find((s) => s.metodo === "efectivo");
  const montoRecibidoEfectivo = efectivoSplit?.montoRecibido || 0;
  const cambioSplit = efectivoSplit
    ? Math.max(0, montoRecibidoEfectivo - efectivoSplit.monto)
    : 0;

  return { totalSplits, remainingSplit, splitsValid, cambioSplit };
}

/** Agrega un split nuevo (máx MAX_SPLITS). El nuevo default es tarjeta. */
export function addSplit(splits: PagoSplit[]): PagoSplit[] {
  if (splits.length >= MAX_SPLITS) return splits;
  const newId = String(Math.max(...splits.map((s) => parseInt(s.id, 10)), 0) + 1);
  return [...splits, { id: newId, metodo: "tarjeta", monto: 0 }];
}

/** Quita un split por id — nunca deja la lista vacía */
export function removeSplit(splits: PagoSplit[], id: string): PagoSplit[] {
  if (splits.length === 1) return splits;
  return splits.filter((s) => s.id !== id);
}

/** Actualiza un split por id */
export function updateSplit(
  splits: PagoSplit[],
  id: string,
  updates: Partial<PagoSplit>
): PagoSplit[] {
  return splits.map((s) => (s.id === id ? { ...s, ...updates } : s));
}

/** Cambio a entregar en pago único en efectivo */
export function calcularCambio(
  metodo: MetodoPago,
  montoRecibido: number,
  totalFinal: number
): number {
  return metodo === "efectivo" ? Math.max(0, montoRecibido - totalFinal) : 0;
}

/** Valida si se puede proceder al cobro */
export function puedeCobrar(params: {
  haySeleccion: boolean;
  dividirPago: boolean;
  splitsValid: boolean;
  metodoPago: MetodoPago;
  montoRecibido: number;
  totalFinal: number;
}): boolean {
  const { haySeleccion, dividirPago, splitsValid, metodoPago, montoRecibido, totalFinal } = params;
  if (!haySeleccion) return false;
  return dividirPago
    ? splitsValid
    : metodoPago !== "efectivo" || montoRecibido >= totalFinal;
}
