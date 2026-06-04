import { describe, it, expect } from "vitest";
import {
  MesaSchema,
  OrdenSchema,
  ItemOrdenSchema,
  PagoSchema,
  ProductoSchema,
  UsuarioSchema,
  GastoSchema,
  CorteCajaSchema,
  EstadoOrden,
  TipoPago,
} from "../validators";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

const itemValido = {
  producto_id: UUID,
  nombre: "Latte",
  cantidad: 1,
  precio_unitario: 55,
};

describe("MesaSchema", () => {
  const base = { negocio_id: UUID, numero: 1, capacidad: 4 };

  it("acepta mesa válida y aplica defaults", () => {
    const m = MesaSchema.parse(base);
    expect(m.estado).toBe("disponible");
    expect(m.forma).toBe("cuadrada");
    expect(m.ancho).toBe(80);
    expect(m.rotacion).toBe(0);
  });

  it("rechaza número de mesa cero o negativo", () => {
    expect(MesaSchema.safeParse({ ...base, numero: 0 }).success).toBe(false);
    expect(MesaSchema.safeParse({ ...base, numero: -2 }).success).toBe(false);
  });

  it("limita dimensiones a 50-300 y rotación a 0-359", () => {
    expect(MesaSchema.safeParse({ ...base, ancho: 49 }).success).toBe(false);
    expect(MesaSchema.safeParse({ ...base, alto: 301 }).success).toBe(false);
    expect(MesaSchema.safeParse({ ...base, rotacion: 360 }).success).toBe(false);
    expect(MesaSchema.safeParse({ ...base, rotacion: 359 }).success).toBe(true);
  });
});

describe("OrdenSchema", () => {
  const base = {
    negocio_id: UUID,
    mesa_id: UUID,
    usuario_id: UUID,
    items: [itemValido],
    subtotal: 55,
    impuesto: 8.8,
    total: 63.8,
  };

  it("acepta orden válida con defaults (nueva, mesa, sin descuento)", () => {
    const o = OrdenSchema.parse(base);
    expect(o.estado).toBe("nueva");
    expect(o.origen).toBe("mesa");
    expect(o.descuento).toBe(0);
    expect(o.propina).toBe(0);
  });

  it("rechaza orden sin items", () => {
    expect(OrdenSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });

  it("rechaza totales negativos", () => {
    expect(OrdenSchema.safeParse({ ...base, total: -1 }).success).toBe(false);
    expect(OrdenSchema.safeParse({ ...base, subtotal: -5 }).success).toBe(false);
  });

  it("acepta mesa_id null (para llevar / delivery)", () => {
    expect(OrdenSchema.safeParse({ ...base, mesa_id: null, origen: "para_llevar" }).success).toBe(true);
  });

  it("rechaza estados fuera del enum", () => {
    expect(OrdenSchema.safeParse({ ...base, estado: "pagada" }).success).toBe(false);
    expect(EstadoOrden.options).toContain("completada");
  });
});

describe("ItemOrdenSchema", () => {
  it("rechaza cantidad cero, negativa o fraccionaria", () => {
    expect(ItemOrdenSchema.safeParse({ ...itemValido, cantidad: 0 }).success).toBe(false);
    expect(ItemOrdenSchema.safeParse({ ...itemValido, cantidad: -1 }).success).toBe(false);
    expect(ItemOrdenSchema.safeParse({ ...itemValido, cantidad: 1.5 }).success).toBe(false);
  });

  it("modificadores default a lista vacía", () => {
    expect(ItemOrdenSchema.parse(itemValido).modificadores).toEqual([]);
  });
});

describe("PagoSchema", () => {
  const base = { negocio_id: UUID, orden_id: UUID, monto: 100, tipo_pago: "efectivo" };

  it("acepta pago válido con estado default pendiente", () => {
    expect(PagoSchema.parse(base).estado).toBe("pendiente");
  });

  it("rechaza monto cero o negativo", () => {
    expect(PagoSchema.safeParse({ ...base, monto: 0 }).success).toBe(false);
    expect(PagoSchema.safeParse({ ...base, monto: -50 }).success).toBe(false);
  });

  it("solo acepta tipos de pago del enum", () => {
    expect(PagoSchema.safeParse({ ...base, tipo_pago: "cheque" }).success).toBe(false);
    expect(TipoPago.options).toEqual(["efectivo", "tarjeta", "transferencia", "otro"]);
  });
});

describe("ProductoSchema", () => {
  const base = { negocio_id: UUID, categoria_id: UUID, nombre: "Latte", precio_base: 55 };

  it("acepta producto válido con defaults", () => {
    const p = ProductoSchema.parse(base);
    expect(p.disponible).toBe(true);
    expect(p.ingredientes).toEqual([]);
  });

  it("rechaza nombre vacío o de más de 100 caracteres", () => {
    expect(ProductoSchema.safeParse({ ...base, nombre: "" }).success).toBe(false);
    expect(ProductoSchema.safeParse({ ...base, nombre: "x".repeat(101) }).success).toBe(false);
  });

  it("rechaza precio negativo pero acepta cero", () => {
    expect(ProductoSchema.safeParse({ ...base, precio_base: -10 }).success).toBe(false);
    expect(ProductoSchema.safeParse({ ...base, precio_base: 0 }).success).toBe(true);
  });

  it("imagen_url debe ser URL válida o null", () => {
    expect(ProductoSchema.safeParse({ ...base, imagen_url: "no-es-url" }).success).toBe(false);
    expect(ProductoSchema.safeParse({ ...base, imagen_url: "https://x.com/a.webp" }).success).toBe(true);
    expect(ProductoSchema.safeParse({ ...base, imagen_url: null }).success).toBe(true);
  });
});

describe("UsuarioSchema", () => {
  const base = {
    negocio_id: UUID,
    auth_uid: UUID,
    nombre: "David",
    email: "admin@example.com",
    rol: "admin",
  };

  it("acepta usuario válido", () => {
    expect(UsuarioSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza email inválido y rol fuera del enum", () => {
    expect(UsuarioSchema.safeParse({ ...base, email: "no-email" }).success).toBe(false);
    expect(UsuarioSchema.safeParse({ ...base, rol: "gerente" }).success).toBe(false);
  });

  it("PIN debe ser exactamente de 4 caracteres", () => {
    expect(UsuarioSchema.safeParse({ ...base, pin: "123" }).success).toBe(false);
    expect(UsuarioSchema.safeParse({ ...base, pin: "12345" }).success).toBe(false);
    expect(UsuarioSchema.safeParse({ ...base, pin: "1234" }).success).toBe(true);
  });
});

describe("GastoSchema", () => {
  const base = { negocio_id: UUID, usuario_id: UUID, concepto: "Leche", monto: 250 };

  it("acepta gasto válido con categoría default general", () => {
    expect(GastoSchema.parse(base).categoria).toBe("general");
  });

  it("rechaza monto cero y concepto vacío", () => {
    expect(GastoSchema.safeParse({ ...base, monto: 0 }).success).toBe(false);
    expect(GastoSchema.safeParse({ ...base, concepto: "" }).success).toBe(false);
  });
});

describe("CorteCajaSchema", () => {
  const base = { negocio_id: UUID, usuario_id: UUID };

  it("acepta corte mínimo con defaults en cero", () => {
    const c = CorteCajaSchema.parse(base);
    expect(c.fondo_inicial).toBe(0);
    expect(c.total_ventas).toBe(0);
    expect(c.ordenes_count).toBe(0);
  });

  it("la diferencia puede ser negativa (faltante de caja)", () => {
    expect(CorteCajaSchema.safeParse({ ...base, diferencia: -50 }).success).toBe(true);
  });

  it("rechaza ventas negativas", () => {
    expect(CorteCajaSchema.safeParse({ ...base, ventas_efectivo: -1 }).success).toBe(false);
  });
});
