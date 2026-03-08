// Tipos auto-generados de Supabase (placeholder)
// Reemplazar con `npx supabase gen types typescript` cuando el proyecto esté configurado

// ── Tipos reutilizables para JSONB ──
export interface ItemOrdenJSON {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  tamano?: string;
  modificadores?: string[];
  notas?: string;
}

export interface ItemKDSJSON {
  nombre: string;
  cantidad: number;
  notas?: string;
}

// ── Enums ──
export type RolUsuario = "admin" | "barista" | "camarero" | "cocina";
export type EstadoMesa = "disponible" | "ocupada" | "reservada" | "preparando";
export type EstadoOrden = "nueva" | "confirmada" | "preparando" | "lista" | "completada" | "cancelada";
export type TipoPago = "efectivo" | "tarjeta" | "transferencia" | "otro";
export type EstadoPago = "pendiente" | "completado" | "fallido" | "reembolsado";
export type OrigenOrden = "mesa" | "delivery" | "para_llevar" | "online";
export type EstadoTicket = "nueva" | "preparando" | "lista";

// ── Tabla helper para tipado Supabase ──
interface TableDef<R, I = Omit<R, "id" | "creado_en" | "actualizado_en">, U = Partial<I>> {
  Row: R;
  Insert: I;
  Update: U;
}

export interface Database {
  public: {
    Tables: {
      negocios: TableDef<{
        id: string;
        nombre: string;
        direccion: string | null;
        telefono: string | null;
        rfc: string | null;
        divisa: string;
        zona_horaria: string;
        firebase_project_id: string | null;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      usuarios: TableDef<{
        id: string;
        negocio_id: string;
        auth_uid: string;
        nombre: string;
        email: string;
        rol: RolUsuario;
        pin: string | null;
        activo: boolean;
        ultimo_acceso: string | null;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      categorias_menu: TableDef<{
        id: string;
        negocio_id: string;
        nombre: string;
        tipo: "drink" | "food" | "other";
        orden: number;
        activo: boolean;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      productos: TableDef<{
        id: string;
        negocio_id: string;
        categoria_id: string;
        nombre: string;
        descripcion: string | null;
        precio_base: number;
        ingredientes: string[];
        disponible: boolean;
        etiquetas: string[];
        imagen_url: string | null;
        orden: number;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      opciones_tamano: TableDef<{
        id: string;
        producto_id: string;
        nombre: string;
        precio_adicional: number;
        orden: number;
        creado_en: string;
      }, Omit<{
        id: string;
        producto_id: string;
        nombre: string;
        precio_adicional: number;
        orden: number;
        creado_en: string;
      }, "id" | "creado_en">>;
      modificadores: TableDef<{
        id: string;
        negocio_id: string;
        nombre: string;
        precio_adicional: number;
        categoria: string;
        disponible: boolean;
        orden: number;
        creado_en: string;
        actualizado_en: string;
      }>;
      productos_modificadores: TableDef<{
        producto_id: string;
        modificador_id: string;
      }, {
        producto_id: string;
        modificador_id: string;
      }>;
      zonas: TableDef<{
        id: string;
        negocio_id: string;
        nombre: string;
        orden: number;
        color: string;
        activa: boolean;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      mesas: TableDef<{
        id: string;
        negocio_id: string;
        numero: number;
        capacidad: number;
        ubicacion: string | null;
        estado: EstadoMesa;
        orden_actual_id: string | null;
        zona_id: string | null;
        pos_x: number;
        pos_y: number;
        forma: "redonda" | "cuadrada" | "rectangular";
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      ordenes: TableDef<{
        id: string;
        negocio_id: string;
        folio: number;
        mesa_id: string | null;
        usuario_id: string;
        items: ItemOrdenJSON[];
        subtotal: number;
        impuesto: number;
        descuento: number;
        propina: number;
        total: number;
        estado: EstadoOrden;
        origen: OrigenOrden;
        notas: string | null;
        cliente_firebase_id: string | null;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      tickets_kds: TableDef<{
        id: string;
        negocio_id: string;
        orden_id: string;
        items_kds: ItemKDSJSON[];
        estado: EstadoTicket;
        prioridad: number;
        tiempo_inicio: string | null;
        tiempo_fin: string | null;
        creado_en: string;
        actualizado_en: string;
      }>;
      pagos: TableDef<{
        id: string;
        negocio_id: string;
        orden_id: string;
        monto: number;
        tipo_pago: TipoPago;
        estado: EstadoPago;
        referencia: string | null;
        creado_en: string;
        actualizado_en: string;
      }>;
      promociones: TableDef<{
        id: string;
        negocio_id: string;
        nombre: string;
        descripcion: string | null;
        tipo: string;
        valor_descuento: number | null;
        es_porcentaje: boolean;
        aplica_a: string | null;
        fecha_inicio: string | null;
        fecha_fin: string | null;
        dias_semana: number[];
        activo: boolean;
        creado_en: string;
        actualizado_en: string;
        eliminado_en: string | null;
      }>;
      cortes_caja: TableDef<{
        id: string;
        negocio_id: string;
        usuario_id: string;
        fondo_inicial: number;
        ventas_efectivo: number;
        ventas_tarjeta: number;
        ventas_transferencia: number;
        total_ventas: number;
        propinas: number;
        descuentos: number;
        efectivo_esperado: number;
        efectivo_real: number | null;
        diferencia: number | null;
        ordenes_count: number;
        notas: string | null;
        abierto_en: string;
        cerrado_en: string | null;
        creado_en: string;
        actualizado_en: string;
      }>;
      historico_ordenes: TableDef<{
        id: string;
        negocio_id: string;
        orden_id: string;
        folio: number | null;
        mesa_numero: number | null;
        usuario_nombre: string | null;
        items: ItemOrdenJSON[];
        subtotal: number;
        impuesto: number;
        descuento: number;
        propina: number;
        total: number;
        tipo_pago: TipoPago | null;
        origen: OrigenOrden | null;
        cliente_firebase_id: string | null;
        completada_en: string;
        creado_en: string;
      }, Omit<{
        id: string;
        negocio_id: string;
        orden_id: string;
        folio: number | null;
        mesa_numero: number | null;
        usuario_nombre: string | null;
        items: ItemOrdenJSON[];
        subtotal: number;
        impuesto: number;
        descuento: number;
        propina: number;
        total: number;
        tipo_pago: TipoPago | null;
        origen: OrigenOrden | null;
        cliente_firebase_id: string | null;
        completada_en: string;
        creado_en: string;
      }, "id" | "creado_en">>;
      configuracion_sync: TableDef<{
        id: string;
        negocio_id: string;
        tabla: string;
        ultima_sync: string;
      }, Omit<{
        id: string;
        negocio_id: string;
        tabla: string;
        ultima_sync: string;
      }, "id">>;
    };
    Views: Record<string, never>;
    Functions: {
      get_mi_negocio_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_mi_rol: {
        Args: Record<string, never>;
        Returns: RolUsuario;
      };
      login_por_pin: {
        Args: { pin_input: string };
        Returns: {
          success: boolean;
          error?: string;
          id?: string;
          negocio_id?: string;
          auth_uid?: string;
          nombre?: string;
          email?: string;
          rol?: string;
        };
      };
    };
    Enums: {
      rol_usuario: RolUsuario;
      estado_mesa: EstadoMesa;
      estado_orden: EstadoOrden;
      tipo_pago: TipoPago;
      estado_pago: EstadoPago;
      origen_orden: OrigenOrden;
      estado_ticket: EstadoTicket;
    };
  };
}

// ── Shortcuts para acceso directo a Row types ──
export type NegocioRow = Database["public"]["Tables"]["negocios"]["Row"];
export type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
export type CategoriaRow = Database["public"]["Tables"]["categorias_menu"]["Row"];
export type ProductoRow = Database["public"]["Tables"]["productos"]["Row"];
export type TamanoRow = Database["public"]["Tables"]["opciones_tamano"]["Row"];
export type ModificadorRow = Database["public"]["Tables"]["modificadores"]["Row"];
export type MesaRow = Database["public"]["Tables"]["mesas"]["Row"];
export type OrdenRow = Database["public"]["Tables"]["ordenes"]["Row"];
export type TicketKDSRow = Database["public"]["Tables"]["tickets_kds"]["Row"];
export type PagoRow = Database["public"]["Tables"]["pagos"]["Row"];
export type PromocionRow = Database["public"]["Tables"]["promociones"]["Row"];
export type CorteCajaRow = Database["public"]["Tables"]["cortes_caja"]["Row"];
export type HistoricoOrdenRow = Database["public"]["Tables"]["historico_ordenes"]["Row"];
