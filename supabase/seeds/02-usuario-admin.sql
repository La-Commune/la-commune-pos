-- ============================================================
-- La Commune POS — Seed: Usuario admin (David)
-- Ejecutar DESPUÉS de seeds/01-menu-completo.sql
-- ============================================================
-- Crea el usuario admin con PIN de acceso rápido.
-- auth_uid: el UUID del usuario creado en Supabase Auth
-- ============================================================

-- Insertar usuario admin
INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol, pin, activo)
SELECT
  (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1),
  '81850ac4-446a-4558-a787-2d66834aa474',   -- ← Tu auth_uid de Supabase Auth
  'David',
  'deivod_halo@hotmail.com',
  'admin',
  '1234',                                     -- ← Tu PIN de acceso rápido
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'deivod_halo@hotmail.com');

-- ── Verificación ──
SELECT 'negocios' as tabla, count(*) as registros FROM negocios
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'categorias', count(*) FROM categorias_menu
UNION ALL SELECT 'productos', count(*) FROM productos
UNION ALL SELECT 'mesas', count(*) FROM mesas
UNION ALL SELECT 'modificadores', count(*) FROM modificadores;
