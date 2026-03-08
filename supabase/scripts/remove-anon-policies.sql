-- ============================================================
-- La Commune POS — Eliminar políticas anon inseguras
-- ============================================================
-- Las políticas anon con USING(true) permiten que CUALQUIERA
-- con la anon key lea/escriba todas las tablas sin filtro.
-- Ahora que el login por PIN crea sesión Auth real, estas
-- políticas ya no son necesarias.
-- ============================================================

-- ── Lectura anon (ya no necesaria) ──
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

-- ── Escritura anon (ya no necesaria) ──
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

-- ── Revocar GRANT SELECT de anon en usuarios ──
-- (login_por_pin es SECURITY DEFINER así que no necesita este GRANT)
REVOKE SELECT ON usuarios FROM anon;

-- ── Verificación ──
-- Después de ejecutar esto, las queries como anon deben fallar
-- y solo funcionar con sesión Auth (authenticated).
