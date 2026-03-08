-- ============================================================
-- La Commune POS — Grants para roles de Supabase
-- Ejecutar UNA VEZ después de schema.sql
-- ============================================================
--
-- ¿Qué es esto?
-- Supabase usa PostgreSQL con dos roles especiales:
--
--   • anon       — El rol "anónimo". Es el que usa cualquier request
--                   que llega al API de Supabase SIN un token de sesión.
--                   Ejemplo: cuando la app hace el login por PIN,
--                   todavía no hay usuario logueado, así que va como anon.
--                   La función login_por_pin ya tiene acceso porque es
--                   SECURITY DEFINER, pero las tablas normales NO.
--
--   • authenticated — El rol para usuarios que YA tienen una sesión
--                      activa (después de signInWithPassword o similar).
--                      Es el que usará tu app para TODAS las queries
--                      normales: leer mesas, productos, crear órdenes, etc.
--
-- ¿Por qué se necesitan GRANTs si ya tenemos RLS?
-- RLS (Row Level Security) decide QUÉ FILAS puede ver/editar un usuario.
-- Pero GRANT decide si el rol tiene permiso de ACCEDER A LA TABLA en
-- primer lugar. Sin GRANT, ni siquiera llega a evaluar las políticas RLS.
-- Es como tener un filtro en la puerta (RLS) pero la puerta está cerrada (sin GRANT).
--
-- Orden de ejecución:
--   1. schema.sql (tablas + RLS)
--   2. seeds/01-menu-completo.sql
--   3. seeds/02-usuario-admin.sql
--   4. scripts/grants-roles.sql  ← ESTE ARCHIVO
-- ============================================================

-- ── Authenticated: acceso completo (RLS filtra por negocio) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── Anon: sin acceso a tablas ──
-- login_por_pin() es SECURITY DEFINER y no necesita grants.
-- El endpoint /api/auth/pin usa service role server-side.
-- REVOKE SELECT ON usuarios FROM anon;  -- ya ejecutado

-- ── Default privileges para tablas futuras ──
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
