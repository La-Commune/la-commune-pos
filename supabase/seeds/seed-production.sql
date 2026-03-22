-- ============================================================
-- La Commune — Seed de Producción
-- Generado: 2026-03-22
--
-- Datos mínimos para arrancar un ambiente productivo:
--   1 negocio, 2 categorías, 6 productos, 8 mesas,
--   1 recompensa default
--
-- NOTA: No incluye usuarios — se crean manualmente vía
-- Supabase Auth + INSERT en tabla usuarios con pin_hash.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. NEGOCIO
-- ═══════════════════════════════════════════════════════════════

INSERT INTO negocios (id, nombre, direccion, telefono, divisa, zona_horaria, color_primario)
VALUES (
  'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a',
  'La Commune',
  'Mineral de la Reforma, Hidalgo',
  '',
  'MXN',
  'America/Mexico_City',
  '#C49A3C'
);

-- ═══════════════════════════════════════════════════════════════
-- 2. CATEGORÍAS DEL MENÚ
-- ═══════════════════════════════════════════════════════════════

INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
  ('1aa87c1d-ac25-4ea0-b482-221c95bd0613', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 'Café',      'drink', 0),
  ('826604a0-0de5-4536-8de3-e738542c71ff', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 'Panadería', 'food',  1);

-- ═══════════════════════════════════════════════════════════════
-- 3. PRODUCTOS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, orden, visible_menu) VALUES
  ('00840ab9-4d40-467f-ab40-b5e75550bd6f', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '1aa87c1d-ac25-4ea0-b482-221c95bd0613',
   'Latte', 'Espresso · Leche vaporizada', 40.00, '{espresso,leche}', true, 0, true),

  ('b504514c-170f-41a0-90cd-6cbc0477a072', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '1aa87c1d-ac25-4ea0-b482-221c95bd0613',
   'Cappuccino', 'Cremoso — Espresso · Leche vaporizada · Espuma de leche', 40.00, '{espresso,leche,espuma}', true, 1, true),

  ('f30d604a-0006-479a-b219-cea495b86d74', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '1aa87c1d-ac25-4ea0-b482-221c95bd0613',
   'Flat White', 'Intenso — Espresso · Leche vaporizada. Más café, menos espuma', 40.00, '{espresso,leche}', true, 2, true),

  ('b14c85c2-946f-433c-b754-8a4710b897e7', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '1aa87c1d-ac25-4ea0-b482-221c95bd0613',
   'Moka', 'Dulce — Espresso · Chocolate · Cocoa · Leche · Vainilla', 45.00, '{espresso,chocolate,cocoa,leche,vainilla}', true, 3, true),

  ('7700efbe-9b53-459d-b7b6-d22ff9615230', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '1aa87c1d-ac25-4ea0-b482-221c95bd0613',
   'Americano', 'Espresso · Agua caliente. Espresso servido primero', 30.00, '{espresso,agua}', true, 4, true),

  ('368b6a81-31d0-4898-b8aa-ded9c20233d8', 'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a', '826604a0-0de5-4536-8de3-e738542c71ff',
   'Rol de canela glaseado', 'Dulce — Mantequilla · Canela · Azúcar', 25.00, '{mantequilla,canela,azúcar}', false, 0, true);

-- ═══════════════════════════════════════════════════════════════
-- 4. MESAS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO mesas (negocio_id, numero, capacidad, ubicacion) VALUES
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 1, 2, 'Interior'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 2, 4, 'Interior'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 3, 4, 'Interior'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 4, 6, 'Terraza'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 5, 2, 'Terraza'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 6, 4, 'Terraza'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 7, 8, 'Interior'),
  ('d0c62af8-12ed-49e1-9a58-526dd2ab6d6a', 8, 2, 'Barra');

-- ═══════════════════════════════════════════════════════════════
-- 5. RECOMPENSA DEFAULT (programa de fidelidad)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO recompensas (negocio_id, nombre, descripcion, sellos_requeridos, tipo, activa, es_default, ilustracion)
VALUES (
  'd0c62af8-12ed-49e1-9a58-526dd2ab6d6a',
  'Bebida de cortesía',
  'Después de 5 visitas, la siguiente bebida es gratis.',
  5, 'bebida', true, true, 'flat-white-cenital'
);

-- ═══════════════════════════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════════════════════════
-- Para crear el usuario admin:
--   1. Crear usuario en Supabase Auth (Dashboard → Authentication)
--   2. INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol, pin_hash)
--      VALUES ('d0c62af8-...', '<auth-uid>', 'Nombre', 'email', 'admin', hash_pin('1234'));
-- ============================================================
