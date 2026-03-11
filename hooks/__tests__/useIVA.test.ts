import { describe, it, expect } from "vitest";
import {
  calcularIVA,
  calcularTotalCarrito,
  aplicarDescuento,
  calcularPropina,
  calcularCobro,
} from "../useIVA";

describe("calcularIVA", () => {
  it("desglosa correctamente IVA de un total con IVA incluido", () => {
    const result = calcularIVA(116);
    expect(result.total).toBe(116);
    expect(result.baseGravable).toBe(100);
    expect(result.iva).toBe(16);
  });

  it("maneja $0", () => {
    const result = calcularIVA(0);
    expect(result.total).toBe(0);
    expect(result.baseGravable).toBe(0);
    expect(result.iva).toBe(0);
  });

  it("desglosa montos no exactos (ej. $45 cafe)", () => {
    const result = calcularIVA(45);
    // 45 / 1.16 = 38.7931...
    expect(result.baseGravable).toBeCloseTo(38.79, 2);
    expect(result.iva).toBeCloseTo(6.21, 2);
    expect(result.baseGravable + result.iva).toBeCloseTo(45, 2);
  });

  it("maneja montos grandes", () => {
    const result = calcularIVA(10000);
    expect(result.baseGravable + result.iva).toBeCloseTo(10000, 2);
  });
});

describe("calcularTotalCarrito", () => {
  it("suma items correctamente", () => {
    const items = [
      { precio_unitario: 45, cantidad: 2 },
      { precio_unitario: 65, cantidad: 1 },
    ];
    expect(calcularTotalCarrito(items)).toBe(155);
  });

  it("retorna 0 con carrito vacío", () => {
    expect(calcularTotalCarrito([])).toBe(0);
  });

  it("maneja cantidad mayor a 1", () => {
    const items = [{ precio_unitario: 50, cantidad: 5 }];
    expect(calcularTotalCarrito(items)).toBe(250);
  });
});

describe("aplicarDescuento", () => {
  it("aplica 10% de descuento", () => {
    const result = aplicarDescuento(100, 10);
    expect(result.montoDescuento).toBe(10);
    expect(result.totalConDescuento).toBe(90);
  });

  it("aplica 0% de descuento", () => {
    const result = aplicarDescuento(100, 0);
    expect(result.montoDescuento).toBe(0);
    expect(result.totalConDescuento).toBe(100);
  });

  it("aplica 100% de descuento", () => {
    const result = aplicarDescuento(200, 100);
    expect(result.montoDescuento).toBe(200);
    expect(result.totalConDescuento).toBe(0);
  });
});

describe("calcularPropina", () => {
  it("calcula 15% de propina", () => {
    expect(calcularPropina(100, 15)).toBe(15);
  });

  it("calcula 0% de propina", () => {
    expect(calcularPropina(100, 0)).toBe(0);
  });

  it("redondea a 2 decimales", () => {
    const result = calcularPropina(33, 10);
    expect(result).toBe(3.3);
  });
});

describe("calcularCobro", () => {
  it("calcula cobro completo con efectivo", () => {
    const result = calcularCobro({
      totalOrden: 200,
      descuentoPct: 10,
      propina: 20,
      montoRecibido: 250,
      metodoPago: "efectivo",
    });

    expect(result.montoDescuento).toBe(20);
    expect(result.totalConDescuento).toBe(180);
    expect(result.totalFinal).toBe(200); // 180 + 20 propina
    expect(result.cambio).toBe(50); // 250 - 200
    expect(result.puedeCobar).toBe(true);
  });

  it("no permite cobrar si monto recibido es insuficiente (efectivo)", () => {
    const result = calcularCobro({
      totalOrden: 200,
      descuentoPct: 0,
      propina: 0,
      montoRecibido: 100,
      metodoPago: "efectivo",
    });

    expect(result.puedeCobar).toBe(false);
    expect(result.cambio).toBe(0);
  });

  it("siempre permite cobrar con tarjeta", () => {
    const result = calcularCobro({
      totalOrden: 200,
      descuentoPct: 0,
      propina: 0,
      montoRecibido: 0,
      metodoPago: "tarjeta",
    });

    expect(result.puedeCobar).toBe(true);
    expect(result.cambio).toBe(0);
  });

  it("incluye desglose IVA correcto", () => {
    const result = calcularCobro({
      totalOrden: 116,
      descuentoPct: 0,
      propina: 0,
      montoRecibido: 200,
      metodoPago: "efectivo",
    });

    expect(result.baseGravable).toBe(100);
    expect(result.iva).toBe(16);
  });
});
