-- ============================================================
-- La Commune POS — Seed: Usuario admin (David)
-- Ejecutar DESPUÉS de seeds/01-menu-completo.sql
-- ============================================================
-- Crea el usuario admin con PIN de acceso rápido.
-- auth_uid: el UUID del usuario creado en Supabase Auth
-- ============================================================

-- Insertar usuario admin
-- ⚠️ IMPORTANTE: Cambia estos valores antes de ejecutar en producción
--   - auth_uid: tu UUID real de Supabase Auth
--   - email: tu email real
--   - pin: un PIN seguro (NO uses 1234)
INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol, pin, activo)
SELECT
  (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1),
  'REPLACE_WITH_YOUR_AUTH_UID',              -- ← Tu auth_uid de Supabase Auth
  'Admin',
  'admin@example.com',                       -- ← Tu email real
  'admin',
  '000000',                                  -- ← Cambia por un PIN seguro de 6 dígitos
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@example.com');

-- ── Verificación ──
SELECT 'negocios' as tabla, count(*) as registros FROM negocios
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'categorias', count(*) FROM categorias_menu
UNION ALL SELECT 'productos', count(*) FROM productos
UNION ALL SELECT 'mesas', count(*) FROM mesas
UNION ALL SELECT 'modificadores', count(*) FROM modificadores;
