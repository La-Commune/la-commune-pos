import { describe, it, expect } from "vitest";
import {
  splitInicial,
  calcularTotalesCobro,
  calcularEstadoSplits,
  addSplit,
  removeSplit,
  updateSplit,
  calcularCambio,
  puedeCobrar,
  MAX_SPLITS,
  type PagoSplit,
} from "../split-payments";

describe("calcularTotalesCobro", () => {
  it("sin descuento ni propina, el total final es el de la orden", () => {
    const t = calcularTotalesCobro(232, 0, 0);
    expect(t.montoDescuento).toBe(0);
    expect(t.totalConDescuento).toBe(232);
    expect(t.totalFinal).toBe(232);
  });

  it("desglosa IVA hacia atrás (precios ya incluyen 16%)", () => {
    const t = calcularTotalesCobro(116, 0, 0);
    expect(t.baseGravable).toBe(100);
    expect(t.ivaDesglosado).toBe(16);
  });

  it("aplica descuento porcentual con redondeo a centavos", () => {
    const t = calcularTotalesCobro(100, 10, 0);
    expect(t.montoDescuento).toBe(10);
    expect(t.totalConDescuento).toBe(90);
  });

  it("la propina se suma después del descuento y no afecta el desglose fiscal", () => {
    const t = calcularTotalesCobro(116, 0, 20);
    expect(t.totalFinal).toBe(136);
    expect(t.baseGravable).toBe(100);
    expect(t.ivaDesglosado).toBe(16);
  });

  it("descuento con centavos redondea correctamente", () => {
    const t = calcularTotalesCobro(99.99, 15, 0);
    expect(t.montoDescuento).toBe(15);
    expect(t.totalConDescuento).toBeCloseTo(84.99, 2);
  });

  it("orden en cero produce todo en cero", () => {
    const t = calcularTotalesCobro(0, 10, 0);
    expect(t.totalFinal).toBe(0);
    expect(t.baseGravable).toBe(0);
    expect(t.ivaDesglosado).toBe(0);
  });
});

describe("calcularEstadoSplits", () => {
  const splits = (defs: Array<Partial<PagoSplit>>): PagoSplit[] =>
    defs.map((d, i) => ({ id: String(i + 1), metodo: "efectivo", monto: 0, ...d }));

  it("suma los montos y calcula lo restante", () => {
    const s = splits([{ monto: 100 }, { metodo: "tarjeta", monto: 50 }]);
    const e = calcularEstadoSplits(s, 200);
    expect(e.totalSplits).toBe(150);
    expect(e.remainingSplit).toBe(50);
    expect(e.splitsValid).toBe(false);
  });

  it("es válido cuando los splits cuadran exacto con el total", () => {
    const s = splits([{ monto: 120 }, { metodo: "tarjeta", monto: 80 }]);
    const e = calcularEstadoSplits(s, 200);
    expect(e.splitsValid).toBe(true);
    expect(e.remainingSplit).toBe(0);
  });

  it("no es válido si los splits exceden el total", () => {
    const s = splits([{ monto: 150 }, { metodo: "tarjeta", monto: 100 }]);
    const e = calcularEstadoSplits(s, 200);
    expect(e.splitsValid).toBe(false);
    expect(e.remainingSplit).toBe(0); // nunca negativo
  });

  it("calcula cambio solo sobre el split de efectivo", () => {
    const s = splits([
      { monto: 100, montoRecibido: 150 },
      { metodo: "tarjeta", monto: 100 },
    ]);
    const e = calcularEstadoSplits(s, 200);
    expect(e.cambioSplit).toBe(50);
  });

  it("cambio es cero si no hay split de efectivo", () => {
    const s = splits([{ metodo: "tarjeta", monto: 200 }]);
    const e = calcularEstadoSplits(s, 200);
    expect(e.cambioSplit).toBe(0);
  });

  it("cambio nunca es negativo aunque falte efectivo por recibir", () => {
    const s = splits([{ monto: 100, montoRecibido: 60 }]);
    const e = calcularEstadoSplits(s, 100);
    expect(e.cambioSplit).toBe(0);
  });
});

describe("addSplit / removeSplit / updateSplit", () => {
  it("agrega un split con id incremental y método tarjeta", () => {
    const result = addSplit(splitInicial());
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ id: "2", metodo: "tarjeta", monto: 0 });
  });

  it(`no agrega más de ${MAX_SPLITS} splits`, () => {
    let s = splitInicial();
    s = addSplit(s);
    s = addSplit(s);
    expect(s).toHaveLength(MAX_SPLITS);
    expect(addSplit(s)).toBe(s); // sin cambios
  });

  it("genera ids únicos aunque se hayan borrado splits intermedios", () => {
    let s = addSplit(addSplit(splitInicial())); // ids 1,2,3
    s = removeSplit(s, "2"); // quedan 1,3
    s = addSplit(s); // nuevo id debe ser 4, no 2 duplicado... (max+1)
    expect(s.map((x) => x.id)).toEqual(["1", "3", "4"]);
  });

  it("nunca deja la lista vacía al remover", () => {
    const s = splitInicial();
    expect(removeSplit(s, "1")).toBe(s);
  });

  it("remueve por id", () => {
    const s = addSplit(splitInicial());
    const result = removeSplit(s, "1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("actualiza solo el split indicado sin mutar el original", () => {
    const s = addSplit(splitInicial());
    const result = updateSplit(s, "2", { monto: 75 });
    expect(result[1].monto).toBe(75);
    expect(result[0].monto).toBe(0);
    expect(s[1].monto).toBe(0); // original intacto
  });
});

describe("calcularCambio", () => {
  it("efectivo: cambio = recibido - total", () => {
    expect(calcularCambio("efectivo", 500, 350)).toBe(150);
  });

  it("efectivo: nunca negativo", () => {
    expect(calcularCambio("efectivo", 100, 350)).toBe(0);
  });

  it("tarjeta y transferencia: siempre cero", () => {
    expect(calcularCambio("tarjeta", 500, 350)).toBe(0);
    expect(calcularCambio("transferencia", 500, 350)).toBe(0);
  });
});

describe("puedeCobrar", () => {
  const base = {
    haySeleccion: true,
    dividirPago: false,
    splitsValid: true,
    metodoPago: "efectivo" as const,
    montoRecibido: 0,
    totalFinal: 100,
  };

  it("falso sin orden seleccionada", () => {
    expect(puedeCobrar({ ...base, haySeleccion: false, montoRecibido: 200 })).toBe(false);
  });

  it("efectivo requiere monto recibido >= total", () => {
    expect(puedeCobrar({ ...base, montoRecibido: 99.99 })).toBe(false);
    expect(puedeCobrar({ ...base, montoRecibido: 100 })).toBe(true);
  });

  it("tarjeta no requiere monto recibido", () => {
    expect(puedeCobrar({ ...base, metodoPago: "tarjeta" })).toBe(true);
  });

  it("split: depende de que los splits cuadren", () => {
    expect(puedeCobrar({ ...base, dividirPago: true, splitsValid: false })).toBe(false);
    expect(puedeCobrar({ ...base, dividirPago: true, splitsValid: true })).toBe(true);
  });
});
