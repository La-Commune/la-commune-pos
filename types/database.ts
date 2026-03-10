export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          accion: string
          creado_en: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: string
          ip: string | null
          negocio_id: string
          registro_id: string
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          ip?: string | null
          negocio_id: string
          registro_id: string
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: string
          ip?: string | null
          negocio_id?: string
          registro_id?: string
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_menu: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          eliminado_en: string | null
          id: string
          negocio_id: string
          nombre: string
          orden: number
          tipo: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          tipo?: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_menu_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          actualizado_en: string
          bono_referido_entregado: boolean
          consentimiento_email: boolean | null
          consentimiento_whatsapp: boolean | null
          creado_en: string
          eliminado_en: string | null
          email: string | null
          firebase_id: string | null
          id: string
          id_referidor: string | null
          negocio_id: string
          nivel: string
          nombre: string
          notas: string | null
          pin_hmac: string | null
          puntos: number
          telefono: string | null
          ticket_promedio: number
          total_gastado: number
          total_sellos: number
          total_visitas: number
          ultima_visita: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          bono_referido_entregado?: boolean
          consentimiento_email?: boolean | null
          consentimiento_whatsapp?: boolean | null
          creado_en?: string
          eliminado_en?: string | null
          email?: string | null
          firebase_id?: string | null
          id?: string
          id_referidor?: string | null
          negocio_id: string
          nivel?: string
          nombre: string
          notas?: string | null
          pin_hmac?: string | null
          puntos?: number
          telefono?: string | null
          ticket_promedio?: number
          total_gastado?: number
          total_sellos?: number
          total_visitas?: number
          ultima_visita?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          bono_referido_entregado?: boolean
          consentimiento_email?: boolean | null
          consentimiento_whatsapp?: boolean | null
          creado_en?: string
          eliminado_en?: string | null
          email?: string | null
          firebase_id?: string | null
          id?: string
          id_referidor?: string | null
          negocio_id?: string
          nivel?: string
          nombre?: string
          notas?: string | null
          pin_hmac?: string | null
          puntos?: number
          telefono?: string | null
          ticket_promedio?: number
          total_gastado?: number
          total_sellos?: number
          total_visitas?: number
          ultima_visita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_id_referidor_fkey"
            columns: ["id_referidor"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      config_admin: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          longitud_pin: number
          negocio_id: string
          pin_hmac: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          longitud_pin?: number
          negocio_id: string
          pin_hmac?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          longitud_pin?: number
          negocio_id?: string
          pin_hmac?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_admin_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: true
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sync: {
        Row: {
          id: string
          negocio_id: string
          tabla: string
          ultima_sync: string
        }
        Insert: {
          id?: string
          negocio_id: string
          tabla: string
          ultima_sync?: string
        }
        Update: {
          id?: string
          negocio_id?: string
          tabla?: string
          ultima_sync?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_sync_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      cortes_caja: {
        Row: {
          abierto_en: string
          actualizado_en: string
          cerrado_en: string | null
          creado_en: string
          descuentos: number
          diferencia: number | null
          efectivo_esperado: number
          efectivo_real: number | null
          fondo_inicial: number
          id: string
          negocio_id: string
          notas: string | null
          ordenes_count: number
          propinas: number
          total_ventas: number
          usuario_id: string
          ventas_efectivo: number
          ventas_tarjeta: number
          ventas_transferencia: number
        }
        Insert: {
          abierto_en?: string
          actualizado_en?: string
          cerrado_en?: string | null
          creado_en?: string
          descuentos?: number
          diferencia?: number | null
          efectivo_esperado?: number
          efectivo_real?: number | null
          fondo_inicial?: number
          id?: string
          negocio_id: string
          notas?: string | null
          ordenes_count?: number
          propinas?: number
          total_ventas?: number
          usuario_id: string
          ventas_efectivo?: number
          ventas_tarjeta?: number
          ventas_transferencia?: number
        }
        Update: {
          abierto_en?: string
          actualizado_en?: string
          cerrado_en?: string | null
          creado_en?: string
          descuentos?: number
          diferencia?: number | null
          efectivo_esperado?: number
          efectivo_real?: number | null
          fondo_inicial?: number
          id?: string
          negocio_id?: string
          notas?: string | null
          ordenes_count?: number
          propinas?: number
          total_ventas?: number
          usuario_id?: string
          ventas_efectivo?: number
          ventas_tarjeta?: number
          ventas_transferencia?: number
        }
        Relationships: [
          {
            foreignKeyName: "cortes_caja_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cortes_caja_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_sello: {
        Row: {
          agregado_por: string
          cliente_id: string
          creado_en: string
          id: string
          id_barista: string | null
          negocio_id: string
          notas: string | null
          origen: string
          tamano: string | null
          tarjeta_id: string
          tipo_bebida: string | null
        }
        Insert: {
          agregado_por?: string
          cliente_id: string
          creado_en?: string
          id?: string
          id_barista?: string | null
          negocio_id: string
          notas?: string | null
          origen?: string
          tamano?: string | null
          tarjeta_id: string
          tipo_bebida?: string | null
        }
        Update: {
          agregado_por?: string
          cliente_id?: string
          creado_en?: string
          id?: string
          id_barista?: string | null
          negocio_id?: string
          notas?: string | null
          origen?: string
          tamano?: string | null
          tarjeta_id?: string
          tipo_bebida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_sello_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_sello_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_sello_tarjeta_id_fkey"
            columns: ["tarjeta_id"]
            isOneToOne: false
            referencedRelation: "tarjetas"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          actualizado_en: string
          categoria: string
          concepto: string
          corte_caja_id: string | null
          creado_en: string
          id: string
          monto: number
          negocio_id: string
          notas: string | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          categoria?: string
          concepto: string
          corte_caja_id?: string | null
          creado_en?: string
          id?: string
          monto: number
          negocio_id: string
          notas?: string | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          categoria?: string
          concepto?: string
          corte_caja_id?: string | null
          creado_en?: string
          id?: string
          monto?: number
          negocio_id?: string
          notas?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_corte_caja_id_fkey"
            columns: ["corte_caja_id"]
            isOneToOne: false
            referencedRelation: "cortes_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ordenes: {
        Row: {
          cliente_firebase_id: string | null
          completada_en: string
          creado_en: string
          descuento: number
          id: string
          impuesto: number
          items: Json
          mesa_numero: number | null
          negocio_id: string
          orden_id: string
          origen: Database["public"]["Enums"]["origen_orden"] | null
          propina: number
          subtotal: number
          tipo_pago: Database["public"]["Enums"]["tipo_pago"] | null
          total: number
          usuario_nombre: string | null
        }
        Insert: {
          cliente_firebase_id?: string | null
          completada_en?: string
          creado_en?: string
          descuento?: number
          id?: string
          impuesto?: number
          items?: Json
          mesa_numero?: number | null
          negocio_id: string
          orden_id: string
          origen?: Database["public"]["Enums"]["origen_orden"] | null
          propina?: number
          subtotal?: number
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"] | null
          total?: number
          usuario_nombre?: string | null
        }
        Update: {
          cliente_firebase_id?: string | null
          completada_en?: string
          creado_en?: string
          descuento?: number
          id?: string
          impuesto?: number
          items?: Json
          mesa_numero?: number | null
          negocio_id?: string
          orden_id?: string
          origen?: Database["public"]["Enums"]["origen_orden"] | null
          propina?: number
          subtotal?: number
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"] | null
          total?: number
          usuario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_ordenes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ordenes_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          activo: boolean
          actualizado_en: string
          costo_unitario: number
          creado_en: string
          descripcion: string | null
          eliminado_en: string | null
          id: string
          negocio_id: string
          nombre: string
          proveedor: string | null
          stock_actual: number
          stock_minimo: number
          unidad: Database["public"]["Enums"]["unidad_medida"]
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          costo_unitario?: number
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id: string
          nombre: string
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          unidad?: Database["public"]["Enums"]["unidad_medida"]
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          costo_unitario?: number
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          unidad?: Database["public"]["Enums"]["unidad_medida"]
        }
        Relationships: [
          {
            foreignKeyName: "inventario_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      items_menu: {
        Row: {
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          destacado: boolean
          disponible: boolean
          estacional: boolean
          etiquetas: string[] | null
          id: string
          imagen_url: string | null
          ingredientes: string[] | null
          negocio_id: string
          nombre: string
          nota: string | null
          opcionales: string[] | null
          orden: number
          precio: number | null
          seccion_id: string
          tamanos: Json | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          destacado?: boolean
          disponible?: boolean
          estacional?: boolean
          etiquetas?: string[] | null
          id?: string
          imagen_url?: string | null
          ingredientes?: string[] | null
          negocio_id: string
          nombre: string
          nota?: string | null
          opcionales?: string[] | null
          orden?: number
          precio?: number | null
          seccion_id: string
          tamanos?: Json | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          destacado?: boolean
          disponible?: boolean
          estacional?: boolean
          etiquetas?: string[] | null
          id?: string
          imagen_url?: string | null
          ingredientes?: string[] | null
          negocio_id?: string
          nombre?: string
          nota?: string | null
          opcionales?: string[] | null
          orden?: number
          precio?: number | null
          seccion_id?: string
          tamanos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "items_menu_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_menu_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "secciones_menu"
            referencedColumns: ["id"]
          },
        ]
      }
      items_orden: {
        Row: {
          actualizado_en: string
          cantidad: number
          creado_en: string
          id: string
          modificadores: string[] | null
          negocio_id: string
          nombre: string
          notas: string | null
          orden_id: string
          precio_unitario: number
          producto_id: string
          tamano: string | null
        }
        Insert: {
          actualizado_en?: string
          cantidad?: number
          creado_en?: string
          id?: string
          modificadores?: string[] | null
          negocio_id: string
          nombre: string
          notas?: string | null
          orden_id: string
          precio_unitario: number
          producto_id: string
          tamano?: string | null
        }
        Update: {
          actualizado_en?: string
          cantidad?: number
          creado_en?: string
          id?: string
          modificadores?: string[] | null
          negocio_id?: string
          nombre?: string
          notas?: string | null
          orden_id?: string
          precio_unitario?: number
          producto_id?: string
          tamano?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_orden_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_orden_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_orden_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_orden_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "vista_productos_margen"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          actualizado_en: string
          alto: number | null
          ancho: number | null
          capacidad: number
          creado_en: string
          eliminado_en: string | null
          estado: Database["public"]["Enums"]["estado_mesa"]
          forma: Database["public"]["Enums"]["forma_mesa"]
          id: string
          negocio_id: string
          numero: number
          ocupada_desde: string | null
          orden_actual_id: string | null
          pos_x: number
          pos_y: number
          rotacion: number | null
          ubicacion: string | null
          zona_id: string | null
        }
        Insert: {
          actualizado_en?: string
          alto?: number | null
          ancho?: number | null
          capacidad?: number
          creado_en?: string
          eliminado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_mesa"]
          forma?: Database["public"]["Enums"]["forma_mesa"]
          id?: string
          negocio_id: string
          numero: number
          ocupada_desde?: string | null
          orden_actual_id?: string | null
          pos_x?: number
          pos_y?: number
          rotacion?: number | null
          ubicacion?: string | null
          zona_id?: string | null
        }
        Update: {
          actualizado_en?: string
          alto?: number | null
          ancho?: number | null
          capacidad?: number
          creado_en?: string
          eliminado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_mesa"]
          forma?: Database["public"]["Enums"]["forma_mesa"]
          id?: string
          negocio_id?: string
          numero?: number
          ocupada_desde?: string | null
          orden_actual_id?: string | null
          pos_x?: number
          pos_y?: number
          rotacion?: number | null
          ubicacion?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mesas_orden_actual"
            columns: ["orden_actual_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesas_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      modificadores: {
        Row: {
          actualizado_en: string
          categoria: string
          creado_en: string
          disponible: boolean
          id: string
          negocio_id: string
          nombre: string
          orden: number
          precio_adicional: number
        }
        Insert: {
          actualizado_en?: string
          categoria?: string
          creado_en?: string
          disponible?: boolean
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          precio_adicional?: number
        }
        Update: {
          actualizado_en?: string
          categoria?: string
          creado_en?: string
          disponible?: boolean
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          precio_adicional?: number
        }
        Relationships: [
          {
            foreignKeyName: "modificadores_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          costo_total: number | null
          creado_en: string
          id: string
          inventario_id: string
          negocio_id: string
          notas: string | null
          orden_id: string | null
          referencia: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_inv"]
          usuario_id: string
        }
        Insert: {
          cantidad: number
          costo_total?: number | null
          creado_en?: string
          id?: string
          inventario_id: string
          negocio_id: string
          notas?: string | null
          orden_id?: string | null
          referencia?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_inv"]
          usuario_id: string
        }
        Update: {
          cantidad?: number
          costo_total?: number | null
          creado_en?: string
          id?: string
          inventario_id?: string
          negocio_id?: string
          notas?: string | null
          orden_id?: string | null
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento_inv"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          actualizado_en: string
          codigo_postal_fiscal: string | null
          color_primario: string | null
          creado_en: string
          direccion: string | null
          divisa: string
          eliminado_en: string | null
          email: string | null
          firebase_project_id: string | null
          footer_ticket: string | null
          horario: Json | null
          id: string
          iva_incluido: boolean | null
          logo_url: string | null
          nombre: string
          propina_sugerida: number[] | null
          razon_social: string | null
          redes_sociales: Json | null
          regimen_fiscal: string | null
          rfc: string | null
          sitio_web: string | null
          slogan: string | null
          telefono: string | null
          whatsapp: string | null
          zona_horaria: string
        }
        Insert: {
          actualizado_en?: string
          codigo_postal_fiscal?: string | null
          color_primario?: string | null
          creado_en?: string
          direccion?: string | null
          divisa?: string
          eliminado_en?: string | null
          email?: string | null
          firebase_project_id?: string | null
          footer_ticket?: string | null
          horario?: Json | null
          id?: string
          iva_incluido?: boolean | null
          logo_url?: string | null
          nombre: string
          propina_sugerida?: number[] | null
          razon_social?: string | null
          redes_sociales?: Json | null
          regimen_fiscal?: string | null
          rfc?: string | null
          sitio_web?: string | null
          slogan?: string | null
          telefono?: string | null
          whatsapp?: string | null
          zona_horaria?: string
        }
        Update: {
          actualizado_en?: string
          codigo_postal_fiscal?: string | null
          color_primario?: string | null
          creado_en?: string
          direccion?: string | null
          divisa?: string
          eliminado_en?: string | null
          email?: string | null
          firebase_project_id?: string | null
          footer_ticket?: string | null
          horario?: Json | null
          id?: string
          iva_incluido?: boolean | null
          logo_url?: string | null
          nombre?: string
          propina_sugerida?: number[] | null
          razon_social?: string | null
          redes_sociales?: Json | null
          regimen_fiscal?: string | null
          rfc?: string | null
          sitio_web?: string | null
          slogan?: string | null
          telefono?: string | null
          whatsapp?: string | null
          zona_horaria?: string
        }
        Relationships: []
      }
      opciones_tamano: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          orden: number
          precio_adicional: number
          producto_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          orden?: number
          precio_adicional?: number
          producto_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          orden?: number
          precio_adicional?: number
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opciones_tamano_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opciones_tamano_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "vista_productos_margen"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          actualizado_en: string
          cliente_firebase_id: string | null
          cliente_id: string | null
          creado_en: string
          descuento: number
          eliminado_en: string | null
          estado: Database["public"]["Enums"]["estado_orden"]
          folio: number
          id: string
          impuesto: number
          items: Json
          mesa_id: string | null
          negocio_id: string
          notas: string | null
          origen: Database["public"]["Enums"]["origen_orden"]
          propina: number
          subtotal: number
          total: number
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          cliente_firebase_id?: string | null
          cliente_id?: string | null
          creado_en?: string
          descuento?: number
          eliminado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          folio: number
          id?: string
          impuesto?: number
          items?: Json
          mesa_id?: string | null
          negocio_id: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_orden"]
          propina?: number
          subtotal?: number
          total?: number
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          cliente_firebase_id?: string | null
          cliente_id?: string | null
          creado_en?: string
          descuento?: number
          eliminado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_orden"]
          folio?: number
          id?: string
          impuesto?: number
          items?: Json
          mesa_id?: string | null
          negocio_id?: string
          notas?: string | null
          origen?: Database["public"]["Enums"]["origen_orden"]
          propina?: number
          subtotal?: number
          total?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          actualizado_en: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_pago"]
          id: string
          monto: number
          negocio_id: string
          orden_id: string
          propina: number
          referencia: string | null
          tipo_pago: Database["public"]["Enums"]["tipo_pago"]
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          monto: number
          negocio_id: string
          orden_id: string
          propina?: number
          referencia?: string | null
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"]
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          id?: string
          monto?: number
          negocio_id?: string
          orden_id?: string
          propina?: number
          referencia?: string | null
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          actualizado_en: string
          categoria_id: string
          creado_en: string
          descripcion: string | null
          destacado: boolean | null
          disponible: boolean
          eliminado_en: string | null
          estacional: boolean | null
          etiquetas: string[] | null
          id: string
          imagen_url: string | null
          ingredientes: string[] | null
          negocio_id: string
          nombre: string
          nota: string | null
          opcionales: string[] | null
          orden: number
          precio_base: number
          visible_menu: boolean | null
        }
        Insert: {
          actualizado_en?: string
          categoria_id: string
          creado_en?: string
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean
          eliminado_en?: string | null
          estacional?: boolean | null
          etiquetas?: string[] | null
          id?: string
          imagen_url?: string | null
          ingredientes?: string[] | null
          negocio_id: string
          nombre: string
          nota?: string | null
          opcionales?: string[] | null
          orden?: number
          precio_base?: number
          visible_menu?: boolean | null
        }
        Update: {
          actualizado_en?: string
          categoria_id?: string
          creado_en?: string
          descripcion?: string | null
          destacado?: boolean | null
          disponible?: boolean
          eliminado_en?: string | null
          estacional?: boolean | null
          etiquetas?: string[] | null
          id?: string
          imagen_url?: string | null
          ingredientes?: string[] | null
          negocio_id?: string
          nombre?: string
          nota?: string | null
          opcionales?: string[] | null
          orden?: number
          precio_base?: number
          visible_menu?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_menu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_modificadores: {
        Row: {
          modificador_id: string
          producto_id: string
        }
        Insert: {
          modificador_id: string
          producto_id: string
        }
        Update: {
          modificador_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_modificadores_modificador_id_fkey"
            columns: ["modificador_id"]
            isOneToOne: false
            referencedRelation: "modificadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_modificadores_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_modificadores_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "vista_productos_margen"
            referencedColumns: ["id"]
          },
        ]
      }
      promociones: {
        Row: {
          activo: boolean
          actualizado_en: string
          aplica_a: string | null
          creado_en: string
          descripcion: string | null
          dias_semana: number[] | null
          eliminado_en: string | null
          es_porcentaje: boolean
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          negocio_id: string
          nombre: string
          tipo: string
          valor_descuento: number | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          aplica_a?: string | null
          creado_en?: string
          descripcion?: string | null
          dias_semana?: number[] | null
          eliminado_en?: string | null
          es_porcentaje?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          negocio_id: string
          nombre: string
          tipo?: string
          valor_descuento?: number | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          aplica_a?: string | null
          creado_en?: string
          descripcion?: string | null
          dias_semana?: number[] | null
          eliminado_en?: string | null
          es_porcentaje?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          tipo?: string
          valor_descuento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promociones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas: {
        Row: {
          actualizado_en: string
          cantidad: number
          creado_en: string
          id: string
          inventario_id: string
          producto_id: string
        }
        Insert: {
          actualizado_en?: string
          cantidad: number
          creado_en?: string
          id?: string
          inventario_id: string
          producto_id: string
        }
        Update: {
          actualizado_en?: string
          cantidad?: number
          creado_en?: string
          id?: string
          inventario_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "vista_productos_margen"
            referencedColumns: ["id"]
          },
        ]
      }
      recompensas: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          es_default: boolean
          expira_en: string | null
          id: string
          negocio_id: string
          nombre: string
          sellos_requeridos: number
          tipo: string
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          es_default?: boolean
          expira_en?: string | null
          id?: string
          negocio_id: string
          nombre: string
          sellos_requeridos?: number
          tipo?: string
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          es_default?: boolean
          expira_en?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          sellos_requeridos?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      secciones_menu: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          eliminado_en: string | null
          id: string
          negocio_id: string
          orden: number
          tipo: string
          titulo: string
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id: string
          orden?: number
          tipo?: string
          titulo: string
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          eliminado_en?: string | null
          id?: string
          negocio_id?: string
          orden?: number
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "secciones_menu_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      tarjetas: {
        Row: {
          actualizado_en: string
          canjeada_en: string | null
          cliente_id: string
          completada_en: string | null
          creado_en: string
          estado: string
          id: string
          negocio_id: string
          pin_hash: string | null
          recompensa_id: string
          sellos: number
          sellos_maximos: number
          ultimo_sello_en: string | null
        }
        Insert: {
          actualizado_en?: string
          canjeada_en?: string | null
          cliente_id: string
          completada_en?: string | null
          creado_en?: string
          estado?: string
          id?: string
          negocio_id: string
          pin_hash?: string | null
          recompensa_id: string
          sellos?: number
          sellos_maximos?: number
          ultimo_sello_en?: string | null
        }
        Update: {
          actualizado_en?: string
          canjeada_en?: string | null
          cliente_id?: string
          completada_en?: string | null
          creado_en?: string
          estado?: string
          id?: string
          negocio_id?: string
          pin_hash?: string | null
          recompensa_id?: string
          sellos?: number
          sellos_maximos?: number
          ultimo_sello_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarjetas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarjetas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarjetas_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_kds: {
        Row: {
          actualizado_en: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_ticket"]
          id: string
          items_kds: Json
          negocio_id: string
          orden_id: string
          prioridad: number
          tiempo_fin: string | null
          tiempo_inicio: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          items_kds?: Json
          negocio_id: string
          orden_id: string
          prioridad?: number
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          items_kds?: Json
          negocio_id?: string
          orden_id?: string
          prioridad?: number
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_kds_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_kds_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          actualizado_en: string
          auth_uid: string
          creado_en: string
          eliminado_en: string | null
          email: string
          id: string
          negocio_id: string
          nombre: string
          pin: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          auth_uid: string
          creado_en?: string
          eliminado_en?: string | null
          email: string
          id?: string
          negocio_id: string
          nombre: string
          pin?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          auth_uid?: string
          creado_en?: string
          eliminado_en?: string | null
          email?: string
          id?: string
          negocio_id?: string
          nombre?: string
          pin?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas: {
        Row: {
          activa: boolean
          actualizado_en: string
          color: string
          creado_en: string
          eliminado_en: string | null
          id: string
          negocio_id: string
          nombre: string
          orden: number
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          color?: string
          creado_en?: string
          eliminado_en?: string | null
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          color?: string
          creado_en?: string
          eliminado_en?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "zonas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_productos_margen: {
        Row: {
          costo: number | null
          id: string | null
          margen: number | null
          margen_pct: number | null
          negocio_id: string | null
          nombre: string | null
          precio_base: number | null
        }
        Insert: {
          costo?: never
          id?: string | null
          margen?: never
          margen_pct?: never
          negocio_id?: string | null
          nombre?: string | null
          precio_base?: number | null
        }
        Update: {
          costo?: never
          id?: string | null
          margen?: never
          margen_pct?: never
          negocio_id?: string | null
          nombre?: string | null
          precio_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _otorgar_bono_referido: {
        Args: { p_cliente_referido_id: string }
        Returns: undefined
      }
      agregar_sello_a_tarjeta: {
        Args: {
          p_agregado_por?: string
          p_cliente_id?: string
          p_notas?: string
          p_tamano?: string
          p_tarjeta_id: string
          p_tipo_bebida?: string
        }
        Returns: Json
      }
      canjear_tarjeta: {
        Args: {
          p_cliente_id: string
          p_recompensa_id: string
          p_tarjeta_id: string
        }
        Returns: string
      }
      costo_producto: { Args: { p_producto_id: string }; Returns: number }
      deshacer_sello: {
        Args: { p_evento_id: string; p_tarjeta_id: string }
        Returns: Json
      }
      get_mi_negocio_id: { Args: never; Returns: string }
      get_mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      get_next_folio_orden: { Args: { p_negocio_id: string }; Returns: number }
      login_por_pin: { Args: { pin_input: string }; Returns: Json }
      swap_mesa_numeros: {
        Args: {
          mesa_a_id: string
          mesa_b_id: string
          nuevo_numero_a: number
          nuevo_numero_b: number
        }
        Returns: undefined
      }
    }
    Enums: {
      estado_mesa: "disponible" | "ocupada" | "reservada" | "preparando"
      estado_orden:
        | "nueva"
        | "confirmada"
        | "preparando"
        | "lista"
        | "completada"
        | "cancelada"
      estado_pago: "pendiente" | "completado" | "fallido" | "reembolsado"
      estado_ticket: "nueva" | "preparando" | "lista"
      forma_mesa: "redonda" | "cuadrada" | "rectangular"
      origen_orden: "mesa" | "delivery" | "para_llevar" | "online"
      rol_usuario: "admin" | "barista" | "camarero" | "cocina"
      tipo_movimiento_inv: "entrada" | "salida" | "ajuste" | "devolucion"
      tipo_pago: "efectivo" | "tarjeta" | "transferencia" | "otro"
      unidad_medida: "kg" | "g" | "lt" | "ml" | "pz" | "bolsa" | "caja"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_mesa: ["disponible", "ocupada", "reservada", "preparando"],
      estado_orden: [
        "nueva",
        "confirmada",
        "preparando",
        "lista",
        "completada",
        "cancelada",
      ],
      estado_pago: ["pendiente", "completado", "fallido", "reembolsado"],
      estado_ticket: ["nueva", "preparando", "lista"],
      forma_mesa: ["redonda", "cuadrada", "rectangular"],
      origen_orden: ["mesa", "delivery", "para_llevar", "online"],
      rol_usuario: ["admin", "barista", "camarero", "cocina"],
      tipo_movimiento_inv: ["entrada", "salida", "ajuste", "devolucion"],
      tipo_pago: ["efectivo", "tarjeta", "transferencia", "otro"],
      unidad_medida: ["kg", "g", "lt", "ml", "pz", "bolsa", "caja"],
    },
  },
} as const

// ── Convenience enum aliases ──
export type RolUsuario = Enums<"rol_usuario">
export type EstadoMesa = Enums<"estado_mesa">
export type EstadoOrden = Enums<"estado_orden">
export type TipoPago = Enums<"tipo_pago">
export type EstadoPago = Enums<"estado_pago">
export type OrigenOrden = Enums<"origen_orden">
export type EstadoTicket = Enums<"estado_ticket">
export type FormaMesa = Enums<"forma_mesa">
export type TipoMovimiento = Enums<"tipo_movimiento_inv">
export type UnidadMedida = Enums<"unidad_medida">

// ── Convenience table aliases ──
export type Negocio = Tables<"negocios">
export type Usuario = Tables<"usuarios">
export type Mesa = Tables<"mesas">
export type CategoriaMenu = Tables<"categorias_menu">
export type Producto = Tables<"productos">
export type OpcionTamano = Tables<"opciones_tamano">
export type Orden = Tables<"ordenes">
export type ItemOrden = Tables<"items_orden">
export type TicketKDS = Tables<"tickets_kds">
export type Pago = Tables<"pagos">
export type CorteCaja = Tables<"cortes_caja">
export type Cliente = Tables<"clientes">
export type Promocion = Tables<"promociones">
export type Recompensa = Tables<"recompensas">
export type Tarjeta = Tables<"tarjetas">
export type EventoSello = Tables<"eventos_sello">
export type AuditLog = Tables<"audit_log">
export type Gasto = Tables<"gastos">
export type Inventario = Tables<"inventario">
export type Receta = Tables<"recetas">
export type Modificador = Tables<"modificadores">
export type MovimientoInventario = Tables<"movimientos_inventario">
export type HistoricoOrden = Tables<"historico_ordenes">
export type Zona = Tables<"zonas">

// ── JSONB interfaces ──
export interface ItemOrdenJSON {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  tamano?: string
  modificadores?: string[]
  notas?: string
}

export interface ItemKDSJSON {
  nombre: string
  cantidad: number
  notas?: string
}

// ── Horario del negocio ──
export interface HorarioDia {
  abierto: boolean
  apertura: string  // "08:00"
  cierre: string    // "20:00"
}
export type HorarioSemanal = Record<"lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo", HorarioDia>

// ── Redes sociales ──
export interface RedesSociales {
  instagram?: string
  facebook?: string
  tiktok?: string
  google_maps?: string
}

// ── Joined types (for queries with select joins) ──
export type TicketKDSWithJoin = TicketKDS & {
  ordenes?: { mesa_id: string | null; mesas?: { numero: number } | null } | null
  mesa_numero?: number | null
}
