"use client";

// IVA rate for Mexico
const IVA_RATE = 0.16;

export interface DesgloseIVA {
  total: number;
  baseGravable: number;
  iva: number;
}

/** Calculate IVA breakdown from a total that already includes IVA (Mexican tax law) */
export function calcularIVA(totalConIVA: number): DesgloseIVA {
  const baseGravable = Math.round((totalConIVA / (1 + IVA_RATE)) * 100) / 100;
  const iva = Math.round((totalConIVA - baseGravable) * 100) / 100;
  return { total: totalConIVA, baseGravable, iva };
}

/** Calculate total from cart items */
export function calcularTotalCarrito(items: Array<{ precio_unitario: number; cantidad: number }>): number {
  return items.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
}

/** Apply discount percentage and return new amounts */
export function aplicarDescuento(total: number, porcentajeDescuento: number): { montoDescuento: number; totalConDescuento: number } {
  const montoDescuento = Math.round(total * (porcentajeDescuento / 100) * 100) / 100;
  return { montoDescuento, totalConDescuento: total - montoDescuento };
}

/** Calculate tip amount from percentage */
export function calcularPropina(base: number, porcentaje: number): number {
  return Math.round(base * (porcentaje / 100) * 100) / 100;
}

/** Full cobro calculation */
export function calcularCobro(params: {
  totalOrden: number;
  descuentoPct: number;
  propina: number;
  montoRecibido: number;
  metodoPago: string;
}) {
  const { montoDescuento, totalConDescuento } = aplicarDescuento(params.totalOrden, params.descuentoPct);
  const totalFinal = totalConDescuento + params.propina;
  const desglose = calcularIVA(totalConDescuento);
  const cambio = params.metodoPago === "efectivo" ? Math.max(0, params.montoRecibido - totalFinal) : 0;
  const puedeCobar = params.metodoPago !== "efectivo" || params.montoRecibido >= totalFinal;

  return {
    montoDescuento,
    totalConDescuento,
    totalFinal,
    ...desglose,
    cambio,
    puedeCobar,
  };
}
