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

export const CategoriaSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1, "Nombre requerido"),
  color: z.string().optional(),
  icono: z.string().optional(),
  orden: z.number().int().nonnegative().default(0),
  activa: z.boolean().default(true),
});

export const TamanoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "Nombre del tamaño requerido"),
  precio_adicional: z.number().nonnegative().default(0),
});

export const ProductoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  descripcion: z.string().nullable().optional(),
  precio_base: z.number().nonnegative("El precio debe ser positivo"),
  categoria_id: z.string().uuid(),
  disponible: z.boolean().default(true),
  ingredientes: z.array(z.string()).default([]),
  etiquetas: z.array(z.string()).default([]),
  tamanos: z.array(TamanoSchema).default([]),
  imagen_url: z.string().url().nullable().optional(),
  orden: z.number().int().nonnegative().default(0),
});

export const UsuarioSchema = z.object({
  id: z.string().uuid().optional(),
  authUid: z.string(),
  negocioId: z.string().uuid(),
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  rol: RolUsuario,
  activo: z.boolean().default(true),
});

// ── Types inferidos ──
export type Mesa = z.infer<typeof MesaSchema>;
export type ItemOrden = z.infer<typeof ItemOrdenSchema>;
export type Orden = z.infer<typeof OrdenSchema>;
export type Pago = z.infer<typeof PagoSchema>;
export type Categoria = z.infer<typeof CategoriaSchema>;
export type Tamano = z.infer<typeof TamanoSchema>;
export type Producto = z.infer<typeof ProductoSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>;
