import { z } from "zod";

// ── Enums (alineados 1:1 con schema.sql) ──
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
export const EstadoPago = z.enum(["pendiente", "completado", "fallido", "reembolsado"]);
export const OrigenOrden = z.enum(["mesa", "delivery", "para_llevar", "online"]);
export const EstadoTicket = z.enum(["nueva", "preparando", "lista"]);
export const TipoCategoria = z.enum(["drink", "food", "other"]);

// ── Schemas ──

export const MesaSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
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
  negocio_id: z.string().uuid(),
  mesa_id: z.string().uuid().nullable(),
  usuario_id: z.string().uuid(),
  items: z.array(ItemOrdenSchema).min(1),
  subtotal: z.number().nonnegative(),
  impuesto: z.number().nonnegative(),
  descuento: z.number().nonnegative().default(0),
  propina: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  estado: EstadoOrden.default("nueva"),
  origen: OrigenOrden.default("mesa"),
  notas: z.string().optional(),
  cliente_firebase_id: z.string().nullable().optional(),
});

export const PagoSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  orden_id: z.string().uuid(),
  monto: z.number().positive(),
  tipo_pago: TipoPago,
  estado: EstadoPago.default("pendiente"),
  referencia: z.string().optional(),
});

export const CategoriaSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: TipoCategoria.default("drink"),
  orden: z.number().int().nonnegative().default(0),
  activo: z.boolean().default(true),
});

export const TamanoSchema = z.object({
  id: z.string().uuid().optional(),
  producto_id: z.string().uuid(),
  nombre: z.string().min(1, "Nombre del tamaño requerido"),
  precio_adicional: z.number().nonnegative().default(0),
  orden: z.number().int().nonnegative().default(0),
});

export const ProductoSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  categoria_id: z.string().uuid(),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  descripcion: z.string().nullable().optional(),
  precio_base: z.number().nonnegative("El precio debe ser positivo"),
  ingredientes: z.array(z.string()).default([]),
  disponible: z.boolean().default(true),
  etiquetas: z.array(z.string()).default([]),
  imagen_url: z.string().url().nullable().optional(),
  orden: z.number().int().nonnegative().default(0),
});

export const UsuarioSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  auth_uid: z.string().uuid(),
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  rol: RolUsuario,
  pin: z.string().length(4, "PIN debe ser de 4 dígitos").optional(),
  activo: z.boolean().default(true),
  ultimo_acceso: z.string().datetime().nullable().optional(),
});

export const ItemKDSSchema = z.object({
  nombre: z.string(),
  cantidad: z.number().int().positive(),
  notas: z.string().optional(),
});

export const TicketKDSSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  orden_id: z.string().uuid(),
  items_kds: z.array(ItemKDSSchema).min(1),
  estado: EstadoTicket.default("nueva"),
  prioridad: z.number().int().nonnegative().default(0),
  tiempo_inicio: z.string().datetime().nullable().optional(),
  tiempo_fin: z.string().datetime().nullable().optional(),
});

export const PromocionSchema = z.object({
  id: z.string().uuid().optional(),
  negocio_id: z.string().uuid(),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  tipo: z.string().default("descuento"),
  valor_descuento: z.number().nonnegative().optional(),
  es_porcentaje: z.boolean().default(false),
  aplica_a: z.string().optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
  dias_semana: z.array(z.number().int().min(0).max(6)).default([]),
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
export type ItemKDS = z.infer<typeof ItemKDSSchema>;
export type TicketKDS = z.infer<typeof TicketKDSSchema>;
export type Promocion = z.infer<typeof PromocionSchema>;
