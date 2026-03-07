-- ============================================================
-- La Commune POS — Fix RLS + Seed Data
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- PARTE 1: Insertar datos (si no existen)
-- ══════════════════════════════════════════════════════════════

-- Negocio
INSERT INTO negocios (nombre, direccion, divisa, zona_horaria)
SELECT 'La Commune', 'Mineral de la Reforma, Hidalgo', 'MXN', 'America/Mexico_City'
WHERE NOT EXISTS (SELECT 1 FROM negocios WHERE nombre = 'La Commune');

-- Usuario admin
INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol, pin, activo)
SELECT
  (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1),
  '81850ac4-446a-4558-a787-2d66834aa474',
  'David',
  'deivod_halo@hotmail.com',
  'admin',
  '1234',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'deivod_halo@hotmail.com');

-- Mesa
INSERT INTO mesas (negocio_id, numero, capacidad, ubicacion, estado)
SELECT (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1), 1, 2, 'Barra', 'disponible'
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE numero = 1);

-- Categorias
DO $$
DECLARE
  neg_id UUID := (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1);
BEGIN
  INSERT INTO categorias_menu (negocio_id, nombre, tipo, orden) VALUES
    (neg_id, 'Cafe Caliente', 'drink', 1),
    (neg_id, 'Cafe Frio', 'drink', 2),
    (neg_id, 'Bebidas Especiales', 'drink', 3),
    (neg_id, 'Panaderia', 'food', 4),
    (neg_id, 'Alimentos', 'food', 5),
    (neg_id, 'Postres', 'food', 6),
    (neg_id, 'Extras', 'other', 7)
  ON CONFLICT DO NOTHING;
END $$;


-- ══════════════════════════════════════════════════════════════
-- PARTE 2: Agregar politicas RLS para anon (lectura)
-- El POS usa login por PIN (no Supabase Auth), asi que
-- necesitamos que anon pueda leer las tablas del menu/mesas.
-- ══════════════════════════════════════════════════════════════

-- Categorias: anon puede leer
CREATE POLICY "categorias_anon_select" ON categorias_menu
  FOR SELECT TO anon USING (true);

-- Productos: anon puede leer
CREATE POLICY "productos_anon_select" ON productos
  FOR SELECT TO anon USING (true);

-- Mesas: anon puede leer
CREATE POLICY "mesas_anon_select" ON mesas
  FOR SELECT TO anon USING (true);

-- Ordenes: anon puede leer
CREATE POLICY "ordenes_anon_select" ON ordenes
  FOR SELECT TO anon USING (true);

-- Tickets KDS: anon puede leer
CREATE POLICY "tickets_anon_select" ON tickets_kds
  FOR SELECT TO anon USING (true);

-- Negocios: anon puede leer
CREATE POLICY "negocios_anon_select" ON negocios
  FOR SELECT TO anon USING (true);

-- Usuarios: anon puede leer (necesario para login)
CREATE POLICY "usuarios_anon_select" ON usuarios
  FOR SELECT TO anon USING (true);

-- Pagos: anon puede leer
CREATE POLICY "pagos_anon_select" ON pagos
  FOR SELECT TO anon USING (true);

-- Opciones tamano: anon puede leer
CREATE POLICY "tamanos_anon_select" ON opciones_tamano
  FOR SELECT TO anon USING (true);

-- Tambien permitir INSERT/UPDATE para anon (operaciones del POS)
CREATE POLICY "ordenes_anon_insert" ON ordenes
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ordenes_anon_update" ON ordenes
  FOR UPDATE TO anon USING (true);

CREATE POLICY "mesas_anon_update" ON mesas
  FOR UPDATE TO anon USING (true);

CREATE POLICY "tickets_anon_insert" ON tickets_kds
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "tickets_anon_update" ON tickets_kds
  FOR UPDATE TO anon USING (true);

CREATE POLICY "pagos_anon_insert" ON pagos
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "usuarios_anon_update" ON usuarios
  FOR UPDATE TO anon USING (true);


-- ══════════════════════════════════════════════════════════════
-- PARTE 3: Verificacion
-- ══════════════════════════════════════════════════════════════

SELECT 'negocios' as tabla, count(*) as registros FROM negocios
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'mesas', count(*) FROM mesas
UNION ALL SELECT 'categorias_menu', count(*) FROM categorias_menu
UNION ALL SELECT 'productos', count(*) FROM productos;
