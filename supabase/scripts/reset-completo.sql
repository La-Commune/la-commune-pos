-- ============================================================
-- La Commune POS — Reset completo de la base de datos
-- ⚠️  DESTRUYE TODOS LOS DATOS — solo usar en desarrollo
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Después de ejecutar esto, corre schema-v2.sql para recrear todo.
-- ============================================================

-- Eliminar todo el schema público
DROP SCHEMA public CASCADE;

-- Recrearlo vacío
CREATE SCHEMA public;

-- Restaurar permisos necesarios para Supabase
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- ============================================================
-- Listo. Ahora ejecuta en este orden:
-- 1. schema-v2.sql     → estructura (tablas, RLS, triggers)
-- 2. seed.sql           → menú completo (categorías, productos, mesas, modificadores)
-- 3. seed-david.sql     → tu usuario admin + función login PIN + políticas anon
-- ============================================================
