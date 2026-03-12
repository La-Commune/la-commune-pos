-- ============================================================
-- Inventory Fixes — Ejecutar en Supabase SQL Editor
-- Fecha: 2026-03-12
-- ============================================================

-- 1. Agregar columna "motivo" a movimientos_inventario
--    (usada para clasificar mermas: caducidad, accidente, etc.)
ALTER TABLE movimientos_inventario
  ADD COLUMN IF NOT EXISTS motivo TEXT;

-- 2. Eliminar políticas anon sobrantes en tablas de inventario
--    (el estándar del proyecto es: solo authenticated accede,
--     las policies con get_mi_negocio_id() + filtro por rol
--     ya existen en schema.sql)
DROP POLICY IF EXISTS "anon_select_inventario"  ON inventario;
DROP POLICY IF EXISTS "anon_update_inventario"  ON inventario;
DROP POLICY IF EXISTS "anon_insert_mov_inv"     ON movimientos_inventario;
DROP POLICY IF EXISTS "anon_select_mov_inv"     ON movimientos_inventario;
DROP POLICY IF EXISTS "anon_select_recetas"     ON recetas;
DROP POLICY IF EXISTS "anon_insert_recetas"     ON recetas;
DROP POLICY IF EXISTS "anon_update_recetas"     ON recetas;
DROP POLICY IF EXISTS "anon_delete_recetas"     ON recetas;

-- 3. Habilitar realtime en tablas de inventario (si no está)
--    Descomentar y ejecutar si el realtime no está habilitado:
ALTER PUBLICATION supabase_realtime ADD TABLE inventario;
ALTER PUBLICATION supabase_realtime ADD TABLE movimientos_inventario;
ALTER PUBLICATION supabase_realtime ADD TABLE recetas;

-- ============================================================
-- Verificación: ejecutar después para confirmar
-- ============================================================
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'movimientos_inventario' ORDER BY ordinal_position;

SELECT policyname, tablename FROM pg_policies
  WHERE tablename IN ('recetas', 'movimientos_inventario', 'inventario')
  ORDER BY tablename, policyname;
