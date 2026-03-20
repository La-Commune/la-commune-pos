-- ============================================================
-- M2: PIN almacenado en texto plano → bcrypt hash
-- Fecha: 2026-03-19
-- ============================================================
-- Problema: La columna `pin` en `usuarios` guardaba el PIN en
-- texto plano ("1234"). Si alguien accedía a la tabla (bug RLS,
-- backup filtrado, admin curioso), veía todos los PINes.
--
-- Solución: Hashear con bcrypt (pgcrypto) → irreversible, con salt,
-- lento por diseño (anti brute-force).
-- ============================================================

-- Paso 1: Agregar columna pin_hash
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Paso 2: Migrar PINes existentes a bcrypt
UPDATE usuarios
SET pin_hash = crypt(pin, gen_salt('bf'))
WHERE pin IS NOT NULL AND pin_hash IS NULL;

-- Paso 3: Actualizar login_por_pin para comparar con crypt()
CREATE OR REPLACE FUNCTION login_por_pin(pin_input TEXT, client_ip TEXT DEFAULT '0.0.0.0')
RETURNS JSON AS $$
DECLARE
  usr RECORD;
  intento RECORD;
  max_intentos CONSTANT INTEGER := 5;
  bloqueo_minutos CONSTANT INTEGER := 15;
BEGIN
  SELECT * INTO intento FROM intentos_pin WHERE ip = client_ip;

  IF intento.id IS NOT NULL
    AND intento.bloqueado_hasta IS NOT NULL
    AND intento.bloqueado_hasta > NOW()
  THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Demasiados intentos. Intenta en ' || bloqueo_minutos || ' minutos.',
      'bloqueado_hasta', intento.bloqueado_hasta,
      'rate_limited', true
    );
  END IF;

  IF intento.id IS NOT NULL
    AND intento.bloqueado_hasta IS NOT NULL
    AND intento.bloqueado_hasta <= NOW()
  THEN
    UPDATE intentos_pin
    SET intentos = 0, bloqueado_hasta = NULL
    WHERE ip = client_ip;
    intento.intentos := 0;
    intento.bloqueado_hasta := NULL;
  END IF;

  -- Comparar con bcrypt: crypt(input, stored_hash) = stored_hash
  SELECT id, negocio_id, auth_uid, nombre, rol
  INTO usr
  FROM usuarios
  WHERE pin_hash IS NOT NULL
    AND crypt(pin_input, pin_hash) = pin_hash
    AND activo = TRUE
    AND eliminado_en IS NULL
  LIMIT 1;

  IF usr.id IS NULL THEN
    IF intento.id IS NULL THEN
      INSERT INTO intentos_pin (ip, intentos) VALUES (client_ip, 1);
    ELSE
      UPDATE intentos_pin
      SET intentos = intento.intentos + 1,
          bloqueado_hasta = CASE
            WHEN intento.intentos + 1 >= max_intentos
            THEN NOW() + (bloqueo_minutos || ' minutes')::INTERVAL
            ELSE NULL
          END
      WHERE ip = client_ip;
    END IF;

    RETURN json_build_object(
      'success', false,
      'error', 'PIN inválido',
      'intentos_restantes', GREATEST(max_intentos - COALESCE(intento.intentos, 0) - 1, 0)
    );
  END IF;

  IF intento.id IS NOT NULL THEN
    DELETE FROM intentos_pin WHERE ip = client_ip;
  END IF;

  UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = usr.id;

  RETURN json_build_object(
    'success', true,
    'id', usr.id,
    'negocio_id', usr.negocio_id,
    'auth_uid', usr.auth_uid,
    'nombre', usr.nombre,
    'rol', usr.rol
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Paso 4: Función helper para hashear PIN desde API routes
CREATE OR REPLACE FUNCTION hash_pin(pin_raw TEXT)
RETURNS TEXT AS $$
  SELECT crypt(pin_raw, gen_salt('bf'));
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION hash_pin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hash_pin(TEXT) TO service_role;

-- Paso 5: Eliminar columna texto plano
ALTER TABLE usuarios DROP COLUMN IF EXISTS pin;

-- Verificar:
-- SELECT nombre, CASE WHEN pin_hash IS NOT NULL THEN 'HASHED' ELSE 'NULL' END FROM usuarios;
