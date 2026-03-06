import { z } from "zod";

// ── Enums ──
export const RolUsuario = z.enum(["admin", "barista", "camarero", "cocina"]);
export const EstadoMesa = z.enum(["disponible", "ocupada", "reservada", "preparando"]);
export const EstadoOrden = z.enum([
  "nueva",
  "confirmada",
  "preparando",
  "lista",
  "completada",
  "cancelada",
]);
export const TipoPago = z.enum(["efectivo", "tarjeta", "transferencia", "otro"]);
export const OrigenOrden = z.enum(["mesa", "delivery", "para_llevar", "online"]);

// ── Schemas ──
export const MesaSchema = z.object({
  id: z.string().uuid().optional(),
  numero: z.number().int().positive(),
  capacidad: z.number().int().positive(),
  ubicacion: z.string().optional(),
  estado: EstadoMesa.default("disponible"),
  orden_actual_id: z.string().uuid().nullable().default(null),
});

export const ItemOrdenSchema = z.object({
  producto_id: z.string().uuid(),
  nombre: z.string().min(1),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().nonnegative(),
  tamano: z.string().optional(),
  modificadores: z.array(z.string()).default([]),
  notas: z.string().optional(),
});

export const OrdenSchema = z.object({
  id: z.string().uuid().optional(),
  mesa_id: z.string().uuid().nullable(),
  usuario_id: z.string().uuid(),
  items: z.array(ItemOrdenSchema).min(1),
  subtotal: z.number().nonnegative(),
  impuesto: z.number().nonnegative(),
  total: z.number().nonnegative(),
  estado: EstadoOrden.default("nueva"),
  origen: OrigenOrden.default("mesa"),
  notas: z.string().optional(),
});

export const PagoSchema = z.object({
  id: z.string().uuid().optional(),
  orden_id: z.string().uuid(),
  monto: z.number().positive(),
  tipo_pago: TipoPago,
  referencia: z.string().optional(),
});

// ── Types inferidos ──
export type Mesa = z.infer<typeof MesaSchema>;
export type ItemOrden = z.infer<typeof ItemOrdenSchema>;
export type Orden = z.infer<typeof OrdenSchema>;
export type Pago = z.infer<typeof PagoSchema>;
