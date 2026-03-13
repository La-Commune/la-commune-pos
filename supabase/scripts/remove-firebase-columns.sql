-- ============================================================
-- Remove Legacy Firebase Columns
-- Fecha: 12 marzo 2026
-- Descripción: Elimina columnas e índices legacy de Firebase
--   que ya no se usan desde la migración completa a Supabase.
-- ============================================================

-- 1. Drop indexes first
DROP INDEX IF EXISTS idx_clientes_firebase;
DROP INDEX IF EXISTS idx_clientes_firebase_unique;
DROP INDEX IF EXISTS idx_ordenes_cliente_firebase;

-- 2. Drop columns
ALTER TABLE negocios DROP COLUMN IF EXISTS firebase_project_id;
ALTER TABLE clientes DROP COLUMN IF EXISTS firebase_id;
ALTER TABLE ordenes DROP COLUMN IF EXISTS cliente_firebase_id;
ALTER TABLE historico_ordenes DROP COLUMN IF EXISTS cliente_firebase_id;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Firebase legacy columns removed successfully.';
  RAISE NOTICE 'Dropped: negocios.firebase_project_id, clientes.firebase_id, ordenes.cliente_firebase_id, historico_ordenes.cliente_firebase_id';
  RAISE NOTICE 'Dropped indexes: idx_clientes_firebase, idx_clientes_firebase_unique, idx_ordenes_cliente_firebase';
END $$;
