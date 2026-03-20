-- ============================================================
-- La Commune — Eliminar políticas anon inseguras
-- ============================================================
-- EJECUTADO EN PRODUCCIÓN: 2026-03-19
--
-- Este script es de REFERENCIA y EMERGENCIA. No debería ser
-- necesario si se usa el schema.sql actualizado (sección 8).
-- Úsalo si necesitas limpiar una BD que se levantó con una
-- versión vieja del schema.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- PARTE 1: Políticas anon del POS (USING(true) en tablas operativas)
-- Ya no necesarias porque el POS usa sesiones Auth reales.
-- ══════════════════════════════════════════════════════════════

-- Lectura anon POS
DROP POLICY IF EXISTS "anon_select_negocios"      ON negocios;
DROP POLICY IF EXISTS "anon_select_usuarios"      ON usuarios;
DROP POLICY IF EXISTS "anon_select_categorias"    ON categorias_menu;
DROP POLICY IF EXISTS "anon_select_productos"     ON productos;
DROP POLICY IF EXISTS "anon_select_tamanos"       ON opciones_tamano;
DROP POLICY IF EXISTS "anon_select_mesas"         ON mesas;
DROP POLICY IF EXISTS "anon_select_ordenes"       ON ordenes;
DROP POLICY IF EXISTS "anon_select_items_orden"   ON items_orden;
DROP POLICY IF EXISTS "anon_select_tickets"       ON tickets_kds;
DROP POLICY IF EXISTS "anon_select_pagos"         ON pagos;
DROP POLICY IF EXISTS "anon_select_modificadores" ON modificadores;
DROP POLICY IF EXISTS "anon_select_prod_mod"      ON productos_modificadores;
DROP POLICY IF EXISTS "anon_select_cortes"        ON cortes_caja;
DROP POLICY IF EXISTS "anon_select_gastos"        ON gastos;
DROP POLICY IF EXISTS "anon_select_clientes"      ON clientes;
DROP POLICY IF EXISTS "anon_select_inventario"    ON inventario;
DROP POLICY IF EXISTS "anon_select_promos"        ON promociones;
DROP POLICY IF EXISTS "anon_select_historico"     ON historico_ordenes;
DROP POLICY IF EXISTS "anon_select_mov_inv"       ON movimientos_inventario;
DROP POLICY IF EXISTS "anon_select_recetas"       ON recetas;

-- Escritura anon POS
DROP POLICY IF EXISTS "anon_insert_ordenes"       ON ordenes;
DROP POLICY IF EXISTS "anon_update_ordenes"       ON ordenes;
DROP POLICY IF EXISTS "anon_insert_items_orden"   ON items_orden;
DROP POLICY IF EXISTS "anon_update_items_orden"   ON items_orden;
DROP POLICY IF EXISTS "anon_update_mesas"         ON mesas;
DROP POLICY IF EXISTS "anon_insert_tickets"       ON tickets_kds;
DROP POLICY IF EXISTS "anon_update_tickets"       ON tickets_kds;
DROP POLICY IF EXISTS "anon_insert_pagos"         ON pagos;
DROP POLICY IF EXISTS "anon_update_usuarios"      ON usuarios;
DROP POLICY IF EXISTS "anon_insert_cortes"        ON cortes_caja;
DROP POLICY IF EXISTS "anon_update_cortes"        ON cortes_caja;
DROP POLICY IF EXISTS "anon_insert_gastos"        ON gastos;
DROP POLICY IF EXISTS "anon_insert_historico"     ON historico_ordenes;
DROP POLICY IF EXISTS "anon_insert_audit"         ON audit_log;
DROP POLICY IF EXISTS "anon_insert_clientes"      ON clientes;
DROP POLICY IF EXISTS "anon_update_clientes"      ON clientes;
DROP POLICY IF EXISTS "anon_insert_mov_inv"       ON movimientos_inventario;
DROP POLICY IF EXISTS "anon_update_inventario"    ON inventario;
DROP POLICY IF EXISTS "anon_insert_recetas"       ON recetas;
DROP POLICY IF EXISTS "anon_update_recetas"       ON recetas;
DROP POLICY IF EXISTS "anon_delete_recetas"       ON recetas;


-- ══════════════════════════════════════════════════════════════
-- PARTE 2: Políticas anon del Frontend con USING(true) inseguras
-- Estas se reemplazan por versiones restrictivas en PARTE 3.
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "categorias_delete_anon"    ON categorias_menu;
DROP POLICY IF EXISTS "categorias_insert_anon"    ON categorias_menu;
DROP POLICY IF EXISTS "categorias_select_anon"    ON categorias_menu;
DROP POLICY IF EXISTS "categorias_update_anon"    ON categorias_menu;

DROP POLICY IF EXISTS "productos_delete_anon"     ON productos;
DROP POLICY IF EXISTS "productos_insert_anon"     ON productos;
DROP POLICY IF EXISTS "productos_select_anon"     ON productos;
DROP POLICY IF EXISTS "productos_update_anon"     ON productos;

DROP POLICY IF EXISTS "tamanos_delete_anon"       ON opciones_tamano;
DROP POLICY IF EXISTS "tamanos_insert_anon"       ON opciones_tamano;
DROP POLICY IF EXISTS "tamanos_select_anon"       ON opciones_tamano;
DROP POLICY IF EXISTS "tamanos_update_anon"       ON opciones_tamano;

DROP POLICY IF EXISTS "clientes_select_anon"      ON clientes;

DROP POLICY IF EXISTS "tarjetas_write_anon"       ON tarjetas;
DROP POLICY IF EXISTS "eventos_sello_write_anon"  ON eventos_sello;
DROP POLICY IF EXISTS "recompensas_write_anon"    ON recompensas;
DROP POLICY IF EXISTS "promociones_select_anon"   ON promociones;


-- ══════════════════════════════════════════════════════════════
-- PARTE 3: Crear políticas anon RESTRICTIVAS para el frontend
-- Solo lo mínimo necesario para la app de fidelidad.
-- ══════════════════════════════════════════════════════════════

-- Menú público (solo lectura — filtrado de disponible/activo se hace en código JS)
CREATE POLICY "anon_productos_select_public"
  ON productos FOR SELECT TO anon
  USING (eliminado_en IS NULL);

CREATE POLICY "anon_categorias_select_public"
  ON categorias_menu FOR SELECT TO anon
  USING (eliminado_en IS NULL);

CREATE POLICY "anon_tamanos_select_public"
  ON opciones_tamano FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM productos p
      WHERE p.id = producto_id
        AND p.eliminado_en IS NULL
        AND p.disponible = TRUE
    )
  );

CREATE POLICY "anon_promociones_select_public"
  ON promociones FOR SELECT TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

-- Clientes (registro y lookup desde app fidelidad)
CREATE POLICY "anon_clientes_select_restricted"
  ON clientes FOR SELECT TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

CREATE POLICY "anon_clientes_insert_restricted"
  ON clientes FOR INSERT TO anon
  WITH CHECK (activo = TRUE);

CREATE POLICY "anon_clientes_update_restricted"
  ON clientes FOR UPDATE TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

-- Tarjetas de fidelidad
CREATE POLICY "anon_tarjetas_select"
  ON tarjetas FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_tarjetas_insert"
  ON tarjetas FOR INSERT TO anon
  WITH CHECK (true);

-- Eventos de sello (solo lectura — inserts vía RPC SECURITY DEFINER)
CREATE POLICY "anon_eventos_sello_select"
  ON eventos_sello FOR SELECT TO anon
  USING (true);

-- Recompensas (solo lectura de activas)
CREATE POLICY "anon_recompensas_select"
  ON recompensas FOR SELECT TO anon
  USING (activa = TRUE);


-- ══════════════════════════════════════════════════════════════
-- PARTE 4: Revocar permisos de login_por_pin
-- ══════════════════════════════════════════════════════════════

REVOKE SELECT ON usuarios FROM anon;
REVOKE EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO service_role;


-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN: después de ejecutar, probar:
--   • POS: login por PIN → crear orden → cobrar (usa authenticated)
--   • Frontend: ver menú público → registrar cliente → crear tarjeta
--   • Desde anon: intentar INSERT en ordenes → debe fallar
--   • Desde anon: intentar SELECT en usuarios → debe fallar
-- ══════════════════════════════════════════════════════════════
