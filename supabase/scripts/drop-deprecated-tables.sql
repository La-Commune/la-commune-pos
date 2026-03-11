-- ══════════════════════════════════════════════════════════════
-- Drop Deprecated Tables
-- Fecha: 2026-03-10
-- Tablas: items_menu, secciones_menu, config_admin
-- Motivo: Reemplazadas por productos, categorias_menu, y usuarios
-- ══════════════════════════════════════════════════════════════

-- items_menu depende de secciones_menu (FK seccion_id), eliminar primero
DROP TABLE IF EXISTS items_menu CASCADE;
DROP TABLE IF EXISTS secciones_menu CASCADE;
DROP TABLE IF EXISTS config_admin CASCADE;
