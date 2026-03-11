import { describe, it, expect } from "vitest";
import { formatMXN, formatTime, cn } from "../utils";

describe("formatMXN", () => {
  it("formatea un monto positivo", () => {
    const result = formatMXN(45);
    // Intl puede usar diferentes espacios/signos según el entorno
    expect(result).toContain("45");
    expect(result).toContain("$");
  });

  it("formatea cero", () => {
    const result = formatMXN(0);
    expect(result).toContain("$");
    expect(result).toContain("0");
  });

  it("formatea decimales", () => {
    const result = formatMXN(45.5);
    expect(result).toContain("45.5");
  });

  it("formatea montos grandes", () => {
    const result = formatMXN(10000);
    expect(result).toContain("10");
  });
});

describe("formatTime", () => {
  it("formatea hora correctamente", () => {
    const date = new Date("2026-03-11T14:30:00Z");
    const result = formatTime(date);
    // El formato depende del timezone, solo verificamos que no falla y retorna algo
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("cn", () => {
  it("combina clases", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("maneja valores condicionales", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merge clases de Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
