// Tipos auto-generados de Supabase (placeholder)
// Reemplazar con `npx supabase gen types typescript` cuando el proyecto esté configurado

export interface Database {
  public: {
    Tables: {
      negocios: {
        Row: {
          id: string;
          nombre: string;
          divisa: string;
          zona_horaria: string;
          firebase_project_id: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["negocios"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["negocios"]["Insert"]>;
      };
      usuarios: {
        Row: {
          id: string;
          negocio_id: string;
          auth_uid: string;
          nombre: string;
          email: string;
          rol: "admin" | "barista" | "camarero" | "cocina";
          pin: string | null;
          activo: boolean;
          ultimo_acceso: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["usuarios"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Insert"]>;
      };
      categorias_menu: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          tipo: "drink" | "food" | "other";
          orden: number;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["categorias_menu"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["categorias_menu"]["Insert"]>;
      };
      productos: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["productos"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["productos"]["Insert"]>;
      };
      opciones_tamano: {
        Row: {
          id: string;
          producto_id: string;
          nombre: string;
          precio_adicional: number;
          orden: number;
          creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["opciones_tamano"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["opciones_tamano"]["Insert"]>;
      };
      mesas: {
        Row: {
          id: string;
          negocio_id: string;
          numero: number;
          capacidad: number;
          ubicacion: string | null;
          estado: "disponible" | "ocupada" | "reservada" | "preparando";
          orden_actual_id: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["mesas"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["mesas"]["Insert"]>;
      };
      ordenes: {
        Row: {
          id: string;
          negocio_id: string;
          mesa_id: string | null;
          usuario_id: string;
          items: Record<string, unknown>[];
          subtotal: number;
          impuesto: number;
          descuento: number;
          propina: number;
          total: number;
          estado: "nueva" | "confirmada" | "preparando" | "lista" | "completada" | "cancelada";
          origen: "mesa" | "delivery" | "para_llevar" | "online";
          notas: string | null;
          cliente_firebase_id: string | null;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["ordenes"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["ordenes"]["Insert"]>;
      };
      tickets_kds: {
        Row: {
          id: string;
          negocio_id: string;
          orden_id: string;
          items_kds: Record<string, unknown>[];
          estado: "nueva" | "preparando" | "lista";
          prioridad: number;
          tiempo_inicio: string | null;
          tiempo_fin: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tickets_kds"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["tickets_kds"]["Insert"]>;
      };
      pagos: {
        Row: {
          id: string;
          negocio_id: string;
          orden_id: string;
          monto: number;
          tipo_pago: "efectivo" | "tarjeta" | "transferencia" | "otro";
          estado: "pendiente" | "completado" | "fallido" | "reembolsado";
          referencia: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pagos"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["pagos"]["Insert"]>;
      };
      promociones: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["promociones"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["promociones"]["Insert"]>;
      };
      historico_ordenes: {
        Row: {
          id: string;
          negocio_id: string;
          orden_id: string;
          mesa_numero: number | null;
          usuario_nombre: string | null;
          items: Record<string, unknown>[];
          subtotal: number;
          impuesto: number;
          descuento: number;
          propina: number;
          total: number;
          tipo_pago: "efectivo" | "tarjeta" | "transferencia" | "otro" | null;
          origen: "mesa" | "delivery" | "para_llevar" | "online" | null;
          cliente_firebase_id: string | null;
          completada_en: string;
          creado_en: string;
        };
        Insert: Omit<Database["public"]["Tables"]["historico_ordenes"]["Row"], "id" | "creado_en">;
        Update: Partial<Database["public"]["Tables"]["historico_ordenes"]["Insert"]>;
      };
      configuracion_sync: {
        Row: {
          id: string;
          negocio_id: string;
          tabla: string;
          ultima_sync: string;
        };
        Insert: Omit<Database["public"]["Tables"]["configuracion_sync"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["configuracion_sync"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_mi_negocio_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_mi_rol: {
        Args: Record<string, never>;
        Returns: "admin" | "barista" | "camarero" | "cocina";
      };
    };
    Enums: {
      rol_usuario: "admin" | "barista" | "camarero" | "cocina";
      estado_mesa: "disponible" | "ocupada" | "reservada" | "preparando";
      estado_orden: "nueva" | "confirmada" | "preparando" | "lista" | "completada" | "cancelada";
      tipo_pago: "efectivo" | "tarjeta" | "transferencia" | "otro";
      estado_pago: "pendiente" | "completado" | "fallido" | "reembolsado";
      origen_orden: "mesa" | "delivery" | "para_llevar" | "online";
      estado_ticket: "nueva" | "preparando" | "lista";
    };
  };
}
