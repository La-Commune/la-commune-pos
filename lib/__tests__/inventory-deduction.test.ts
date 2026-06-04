import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock de Supabase con router por tabla ──
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (table: string) => mockFrom(table) },
  USE_MOCK: false,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { deducirInventarioPorOrden } from "../inventory-deduction";
import type { ItemOrdenJSON } from "@/types/database";

/** Builder awaitable con .select().in() / .insert() / .update().eq() */
function tableMock(resolution: Record<string, unknown>) {
  const chain: any = {};
  for (const m of ["select", "in", "insert", "update", "eq"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown) => void) => resolve(resolution);
  return chain;
}

const RECETA_LATTE_LECHE = { producto_id: "prod-latte", inventario_id: "inv-leche", cantidad: 0.25 };
const RECETA_LATTE_CAFE = { producto_id: "prod-latte", inventario_id: "inv-cafe", cantidad: 0.018 };

const INV_LECHE = { id: "inv-leche", nombre: "Leche entera", stock_actual: 10, stock_minimo: 2, unidad: "lt" };
const INV_CAFE = { id: "inv-cafe", nombre: "Café en grano", stock_actual: 1, stock_minimo: 0.5, unidad: "kg" };

const itemLatte = (cantidad: number): ItemOrdenJSON =>
  ({ producto_id: "prod-latte", nombre: "Latte", cantidad, precio_unitario: 55 }) as ItemOrdenJSON;

/** Configura el router de tablas para un escenario feliz */
function setupTables(opts?: {
  recetas?: unknown[];
  inventarios?: unknown[];
  movInsertError?: { message: string } | null;
  invUpdateError?: { message: string } | null;
}) {
  const tables: Record<string, any> = {
    recetas: tableMock({ data: opts?.recetas ?? [RECETA_LATTE_LECHE, RECETA_LATTE_CAFE], error: null }),
    inventario: tableMock({ data: opts?.inventarios ?? [INV_LECHE, INV_CAFE], error: null }),
    movimientos_inventario: tableMock({ data: null, error: opts?.movInsertError ?? null }),
  };
  // inventario se usa para select Y update — el update debe resolver con su propio error
  if (opts?.invUpdateError !== undefined) {
    let calls = 0;
    const selectChain = tables.inventario;
    mockFrom.mockImplementation((t: string) => {
      if (t === "inventario") {
        calls++;
        // 1ª llamada: select inicial; siguientes: updates
        return calls === 1 ? selectChain : tableMock({ data: null, error: opts.invUpdateError });
      }
      return tables[t];
    });
    return tables;
  }
  mockFrom.mockImplementation((t: string) => tables[t]);
  return tables;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deducirInventarioPorOrden", () => {
  it("deduce ingredientes según receta × cantidad del item", async () => {
    const tables = setupTables();
    const r = await deducirInventarioPorOrden([itemLatte(2)], "orden-1", "neg-1", "user-1", "42");

    expect(r.success).toBe(true);
    expect(r.deducted).toBe(2); // leche y café

    // Movimiento de leche: 0.25 × 2 = 0.5
    const movimientos = tables.movimientos_inventario.insert.mock.calls.map((c: any[]) => c[0]);
    const movLeche = movimientos.find((m: any) => m.inventario_id === "inv-leche");
    expect(movLeche.cantidad).toBe(-0.5);
    expect(movLeche.stock_anterior).toBe(10);
    expect(movLeche.stock_nuevo).toBe(9.5);
    expect(movLeche.tipo).toBe("salida");
    expect(movLeche.referencia).toBe("Venta — Orden #42");
  });

  it("agrupa deducciones del mismo ingrediente entre items distintos", async () => {
    const tables = setupTables({
      recetas: [
        RECETA_LATTE_LECHE,
        { producto_id: "prod-capu", inventario_id: "inv-leche", cantidad: 0.2 },
      ],
      inventarios: [INV_LECHE],
    });
    const items = [
      itemLatte(1),
      { producto_id: "prod-capu", nombre: "Cappuccino", cantidad: 1, precio_unitario: 58 } as ItemOrdenJSON,
    ];
    const r = await deducirInventarioPorOrden(items, "orden-1", "neg-1", "user-1");

    // Un solo movimiento para la leche con 0.25 + 0.2 = 0.45
    expect(r.deducted).toBe(1);
    const mov = tables.movimientos_inventario.insert.mock.calls[0][0];
    expect(mov.cantidad).toBeCloseTo(-0.45, 5);
  });

  it("reporta lowStock cuando el stock queda en o bajo el mínimo", async () => {
    setupTables({
      recetas: [{ producto_id: "prod-latte", inventario_id: "inv-cafe", cantidad: 0.6 }],
      inventarios: [INV_CAFE], // stock 1, mínimo 0.5 → 1-0.6 = 0.4 ≤ 0.5
    });
    const r = await deducirInventarioPorOrden([itemLatte(1)], "orden-1", "neg-1", "user-1");
    expect(r.lowStock).toEqual(["Café en grano"]);
  });

  it("el stock nunca queda negativo", async () => {
    const tables = setupTables({
      recetas: [{ producto_id: "prod-latte", inventario_id: "inv-cafe", cantidad: 5 }],
      inventarios: [INV_CAFE], // stock 1, deducción 5 → 0, no -4
    });
    await deducirInventarioPorOrden([itemLatte(1)], "orden-1", "neg-1", "user-1");
    const mov = tables.movimientos_inventario.insert.mock.calls[0][0];
    expect(mov.stock_nuevo).toBe(0);
  });

  it("productos sin receta no generan movimientos", async () => {
    const tables = setupTables({ recetas: [] });
    const r = await deducirInventarioPorOrden([itemLatte(1)], "orden-1", "neg-1", "user-1");
    expect(r.success).toBe(true);
    expect(r.deducted).toBe(0);
    expect(tables.movimientos_inventario.insert).not.toHaveBeenCalled();
  });

  it("error al insertar movimiento no detiene otras deducciones", async () => {
    setupTables({ movInsertError: { message: "constraint" } });
    const r = await deducirInventarioPorOrden([itemLatte(1)], "orden-1", "neg-1", "user-1");
    expect(r.deducted).toBe(0);
    expect(r.errors).toHaveLength(2); // leche y café fallan ambos
    expect(r.errors[0]).toContain("constraint");
  });

  it("usa el ordenId corto como referencia cuando no hay folio", async () => {
    const tables = setupTables();
    await deducirInventarioPorOrden([itemLatte(1)], "abcdef12-3456-7890", "neg-1", "user-1");
    const mov = tables.movimientos_inventario.insert.mock.calls[0][0];
    expect(mov.referencia).toBe("Venta — Orden abcdef12");
  });

  it("falla con success=false si la query de recetas truena", async () => {
    mockFrom.mockImplementation(() => tableMock({ data: null, error: { message: "rls denied" } }));
    const r = await deducirInventarioPorOrden([itemLatte(1)], "orden-1", "neg-1", "user-1");
    expect(r.success).toBe(false);
    expect(r.errors[0]).toContain("rls denied");
  });
});
