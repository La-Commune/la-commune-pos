-- =============================================================
-- Seguridad Fase 1 — Preparación para producción
-- Fecha: 20-Mar-2026
-- =============================================================

-- ============================================================
-- 1. Fijar search_path en 6 funciones (advisors)
-- Estas funciones son SECURITY INVOKER (no DEFINER), pero
-- Supabase recomienda fijar search_path igualmente para
-- prevenir schema injection si cambian a DEFINER en el futuro.
-- ============================================================

ALTER FUNCTION public.actualizar_timestamp() SET search_path = public;
ALTER FUNCTION public.actualizar_ocupada_desde() SET search_path = public;
ALTER FUNCTION public.get_next_folio_orden(uuid) SET search_path = public;
ALTER FUNCTION public.auto_folio_orden() SET search_path = public;
ALTER FUNCTION public.actualizar_metricas_cliente() SET search_path = public;
ALTER FUNCTION public.costo_producto(uuid) SET search_path = public;

-- ============================================================
-- 2. Índices para FKs sin índice (rendimiento en JOINs/DELETEs)
-- Sin índice, PostgreSQL hace sequential scan en cada JOIN.
-- Con pocos datos no importa, pero con meses de órdenes sí.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clientes_id_referidor ON clientes(id_referidor);
CREATE INDEX IF NOT EXISTS idx_historico_ordenes_orden_id ON historico_ordenes(orden_id);
CREATE INDEX IF NOT EXISTS idx_mesas_orden_actual_id ON mesas(orden_actual_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_usuario_id ON movimientos_inventario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_opciones_tamano_producto_id ON opciones_tamano(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario_id ON ordenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_recompensa_id ON tarjetas(recompensa_id);

-- ============================================================
-- 3. Fix gastos_update — auth.uid() se re-evaluaba por cada fila
-- Cambiar a (select auth.uid()) para evaluar una sola vez.
-- ============================================================

DROP POLICY IF EXISTS gastos_update ON gastos;

CREATE POLICY gastos_update ON gastos FOR UPDATE
USING (
  (negocio_id = get_mi_negocio_id())
  AND (
    (get_mi_rol() = 'admin'::rol_usuario)
    OR (usuario_id = (
      SELECT u.id FROM usuarios u
      WHERE u.auth_uid = (select auth.uid())
      LIMIT 1
    ))
  )
);

-- ============================================================
-- 4. intentos_pin — RLS habilitado pero sin policies
-- Solo service_role debe acceder (bypasa RLS automáticamente).
-- Esta policy bloquea authenticated y anon.
-- ============================================================

CREATE POLICY IF NOT EXISTS intentos_pin_deny_all ON intentos_pin
  FOR ALL
  USING (false);
