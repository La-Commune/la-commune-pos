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
          nombre: string;
          email: string;
          rol: "admin" | "barista" | "camarero" | "cocina";
          auth_uid: string;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
          eliminado_en: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["usuarios"]["Row"], "id" | "creado_en" | "actualizado_en">;
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Insert"]>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      rol_usuario: "admin" | "barista" | "camarero" | "cocina";
      estado_mesa: "disponible" | "ocupada" | "reservada" | "preparando";
      estado_orden: "nueva" | "confirmada" | "preparando" | "lista" | "completada" | "cancelada";
      tipo_pago: "efectivo" | "tarjeta" | "transferencia" | "otro";
      origen_orden: "mesa" | "delivery" | "para_llevar" | "online";
    };
  };
}
