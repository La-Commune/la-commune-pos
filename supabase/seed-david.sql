-- ============================================================
-- La Commune POS — Setup inicial para David
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── PASO 1: Verificar que el negocio existe ──
-- (El schema.sql ya insertó el negocio, verificamos)
SELECT id, nombre FROM negocios LIMIT 1;
-- ☝️ Copia el UUID que aparezca. Si no hay ninguno, ejecuta:
-- INSERT INTO negocios (nombre, direccion, divisa, zona_horaria)
-- VALUES ('La Commune', 'Mineral de la Reforma, Hidalgo', 'MXN', 'America/Mexico_City');


-- ── PASO 2: Insertar tu usuario admin ──
-- Reemplaza 'UUID_DEL_NEGOCIO' con el ID del paso 1
-- Tu auth_uid ya lo tenemos: 81850ac4-446a-4558-a787-2d66834aa474
-- Cambia el PIN si quieres uno diferente a 1234

INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol, pin, activo)
VALUES (
  (SELECT id FROM negocios LIMIT 1),   -- auto-detecta el negocio
  '81850ac4-446a-4558-a787-2d66834aa474',
  'David',
  'deivod_halo@hotmail.com',
  'admin',
  '1234',                               -- ← Tu PIN de acceso rápido
  TRUE
);


-- ── PASO 3: Crear función RPC para login por PIN ──
-- Esta función permite buscar usuario por PIN sin necesitar auth session
-- (necesaria porque desde la pantalla de login no hay sesión aún)

CREATE OR REPLACE FUNCTION login_por_pin(pin_input TEXT)
RETURNS JSON AS $$
DECLARE
  usr RECORD;
BEGIN
  -- Buscar usuario activo con ese PIN
  SELECT id, negocio_id, auth_uid, nombre, email, rol
  INTO usr
  FROM usuarios
  WHERE pin = pin_input
    AND activo = TRUE
    AND eliminado_en IS NULL
  LIMIT 1;

  IF usr.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'PIN inválido');
  END IF;

  -- Actualizar último acceso
  UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = usr.id;

  RETURN json_build_object(
    'success', true,
    'id', usr.id,
    'negocio_id', usr.negocio_id,
    'auth_uid', usr.auth_uid,
    'nombre', usr.nombre,
    'email', usr.email,
    'rol', usr.rol
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que usuarios no autenticados (anon) puedan llamar esta función
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT) TO authenticated;


-- ── PASO 4: Insertar mesas iniciales ──
-- (Para que dejes de ver mocks en la vista de mesas)

INSERT INTO mesas (negocio_id, numero, capacidad, ubicacion, estado) VALUES
  ((SELECT id FROM negocios LIMIT 1), 1, 2, 'Barra', 'disponible');


-- ── PASO 5: Insertar categorías del menú ──

INSERT INTO categorias_menu (negocio_id, nombre, tipo, orden) VALUES
  ((SELECT id FROM negocios LIMIT 1), 'Café Caliente', 'drink', 1),
  ((SELECT id FROM negocios LIMIT 1), 'Café Frío', 'drink', 2),
  ((SELECT id FROM negocios LIMIT 1), 'Bebidas Especiales', 'drink', 3),
  ((SELECT id FROM negocios LIMIT 1), 'Panadería', 'food', 4),
  ((SELECT id FROM negocios LIMIT 1), 'Alimentos', 'food', 5),
  ((SELECT id FROM negocios LIMIT 1), 'Postres', 'food', 6),
  ((SELECT id FROM negocios LIMIT 1), 'Extras', 'other', 7);


-- ── VERIFICACIÓN ──
-- Ejecuta esto al final para confirmar que todo quedó bien:
SELECT 'negocios' as tabla, count(*) as registros FROM negocios
UNION ALL
SELECT 'usuarios', count(*) FROM usuarios
UNION ALL
SELECT 'mesas', count(*) FROM mesas
UNION ALL
SELECT 'categorias_menu', count(*) FROM categorias_menu;
