-- ============================================================
-- M1: Fix vista_productos_margen — SECURITY INVOKER
-- Fecha: 2026-03-19
-- ============================================================
-- Problema: La vista ejecutaba como el owner (postgres), bypaseando
-- completamente las políticas RLS. Cualquier usuario autenticado
-- podía ver datos de cualquier negocio a través de esta vista.
--
-- Solución: Recrear con security_invoker = true para que respete
-- las RLS del usuario que hace la query.
-- ============================================================

CREATE OR REPLACE VIEW vista_productos_margen
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.negocio_id,
  p.nombre,
  p.precio_base,
  costo_producto(p.id) AS costo,
  p.precio_base - costo_producto(p.id) AS margen,
  CASE
    WHEN p.precio_base > 0
    THEN ROUND(((p.precio_base - costo_producto(p.id)) / p.precio_base) * 100, 1)
    ELSE 0
  END AS margen_pct
FROM productos p
WHERE p.eliminado_en IS NULL AND p.disponible = TRUE;

-- Verificar que quedó bien:
-- SELECT relname, (SELECT option_value FROM pg_options_to_table(reloptions) WHERE option_name = 'security_invoker')
-- FROM pg_class WHERE relname = 'vista_productos_margen';
