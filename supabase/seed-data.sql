-- ============================================================
-- La Commune POS — Seed de datos iniciales
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================
-- INSTRUCCIONES:
-- 1. Primero obtener el negocio_id:
--    SELECT id FROM negocios WHERE nombre = 'La Commune';
-- 2. Reemplazar TODAS las ocurrencias de __NEGOCIO_ID__ con ese UUID
-- 3. Ejecutar este script completo
-- ============================================================

-- Variable: reemplazar con tu negocio_id real
-- Ejemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- ── CATEGORIAS DEL MENU ──
INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden, activo) VALUES
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Cafe Caliente', 'drink', 0, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Cafe Frio', 'drink', 1, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Te & Infusiones', 'drink', 2, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Bebidas Especiales', 'drink', 3, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Panaderia', 'food', 4, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Alimentos', 'food', 5, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Postres', 'food', 6, true),
  (gen_random_uuid(), '__NEGOCIO_ID__', 'Extras', 'other', 7, true);

-- Ahora necesitamos los IDs generados para las categorias
-- Ejecutar esto para ver los IDs:
-- SELECT id, nombre FROM categorias_menu WHERE negocio_id = '__NEGOCIO_ID__' ORDER BY orden;

-- ── PRODUCTOS ──
-- Usamos subconsultas para obtener el categoria_id por nombre

-- Cafe Caliente
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Americano', 'Espresso con agua caliente', 45.00, ARRAY['espresso', 'agua'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Latte', 'Espresso con leche vaporizada', 55.00, ARRAY['espresso', 'leche'], true, ARRAY['popular'], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Cappuccino', 'Espresso, leche vaporizada y espuma', 55.00, ARRAY['espresso', 'leche', 'espuma'], true, ARRAY[]::text[], 2),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Mocha', 'Espresso con chocolate y leche', 65.00, ARRAY['espresso', 'chocolate', 'leche'], true, ARRAY[]::text[], 3),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Espresso Doble', 'Doble shot de espresso', 40.00, ARRAY['espresso'], true, ARRAY[]::text[], 4),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Caliente' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Cortado', 'Espresso con un toque de leche', 45.00, ARRAY['espresso', 'leche'], false, ARRAY[]::text[], 5);

-- Cafe Frio
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Frio' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Cold Brew', 'Cafe infusionado en frio 16h', 60.00, ARRAY['cafe'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Frio' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Iced Latte', 'Latte frio con hielo', 60.00, ARRAY['espresso', 'leche', 'hielo'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Frio' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Frappe Mocha', 'Cafe frio mezclado con chocolate y hielo', 75.00, ARRAY['espresso', 'chocolate', 'leche', 'hielo'], true, ARRAY[]::text[], 2),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Cafe Frio' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Affogato', 'Helado de vainilla con espresso', 70.00, ARRAY['espresso', 'helado'], true, ARRAY['nuevo'], 3);

-- Te & Infusiones
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Te & Infusiones' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Matcha Latte', 'Matcha japones con leche', 65.00, ARRAY['matcha', 'leche'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Te & Infusiones' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Chai Latte', 'Te con especias y leche', 55.00, ARRAY['te chai', 'leche', 'especias'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Te & Infusiones' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Te Verde', 'Te verde organico', 35.00, ARRAY['te verde'], true, ARRAY[]::text[], 2);

-- Bebidas Especiales
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Bebidas Especiales' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Horchata Latte', 'Latte con horchata artesanal', 70.00, ARRAY['espresso', 'horchata', 'canela'], true, ARRAY['nuevo', 'especial'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Bebidas Especiales' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Mazapan Latte', 'Latte con mazapan y canela', 70.00, ARRAY['espresso', 'leche', 'mazapan', 'canela'], true, ARRAY['especial'], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Bebidas Especiales' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Lavender Latte', 'Latte con jarabe de lavanda', 70.00, ARRAY['espresso', 'leche', 'lavanda'], true, ARRAY[]::text[], 2);

-- Panaderia
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Panaderia' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Croissant', 'Croissant de mantequilla', 45.00, ARRAY['harina', 'mantequilla'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Panaderia' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Pan de Chocolate', 'Pain au chocolat', 50.00, ARRAY['harina', 'chocolate', 'mantequilla'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Panaderia' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Muffin de Arandano', NULL, 40.00, ARRAY['harina', 'arandano'], true, ARRAY[]::text[], 2),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Panaderia' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Banana Bread', 'Rebanada de pan de platano', 45.00, ARRAY['platano', 'harina', 'nuez'], true, ARRAY[]::text[], 3),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Panaderia' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Galleta de Avena', NULL, 30.00, ARRAY['avena', 'mantequilla'], false, ARRAY[]::text[], 4);

-- Alimentos
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Alimentos' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Panini Caprese', 'Mozzarella, tomate, albahaca y pesto', 95.00, ARRAY['pan', 'mozzarella', 'tomate', 'albahaca', 'pesto'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Alimentos' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Avocado Toast', 'Pan artesanal con aguacate y huevo', 85.00, ARRAY['pan', 'aguacate', 'huevo'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Alimentos' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Bowl de Acai', 'Acai con granola y fruta fresca', 90.00, ARRAY['acai', 'granola', 'fresa', 'platano'], true, ARRAY['nuevo'], 2),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Alimentos' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Ensalada Cesar', 'Lechuga, pollo, crutones, parmesano', 95.00, ARRAY['lechuga', 'pollo', 'crutones', 'parmesano'], true, ARRAY[]::text[], 3);

-- Postres
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Postres' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Cheesecake', 'New York style', 75.00, ARRAY['queso crema', 'galleta'], true, ARRAY['popular'], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Postres' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Brownie', 'Brownie de chocolate con nuez', 55.00, ARRAY['chocolate', 'nuez'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Postres' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Tiramisu', 'Tiramisu clasico italiano', 80.00, ARRAY['mascarpone', 'cafe', 'galleta'], true, ARRAY['especial'], 2);

-- Extras
INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Extras' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Shot Extra', 'Shot adicional de espresso', 15.00, ARRAY['espresso'], true, ARRAY[]::text[], 0),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Extras' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Leche de Almendra', 'Sustituto de leche', 15.00, ARRAY['almendra'], true, ARRAY[]::text[], 1),
  ('__NEGOCIO_ID__', (SELECT id FROM categorias_menu WHERE nombre = 'Extras' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1),
   'Leche de Avena', 'Sustituto de leche', 15.00, ARRAY['avena'], true, ARRAY[]::text[], 2);

-- ── OPCIONES DE TAMANO ──
INSERT INTO opciones_tamano (producto_id, nombre, precio_adicional, orden) VALUES
  -- Americano
  ((SELECT id FROM productos WHERE nombre = 'Americano' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '10 oz', 0, 0),
  ((SELECT id FROM productos WHERE nombre = 'Americano' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '12 oz', 10, 1),
  ((SELECT id FROM productos WHERE nombre = 'Americano' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '16 oz', 20, 2),
  -- Latte
  ((SELECT id FROM productos WHERE nombre = 'Latte' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '12 oz', 0, 0),
  ((SELECT id FROM productos WHERE nombre = 'Latte' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '16 oz', 15, 1),
  -- Cappuccino
  ((SELECT id FROM productos WHERE nombre = 'Cappuccino' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '10 oz', 0, 0),
  ((SELECT id FROM productos WHERE nombre = 'Cappuccino' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '12 oz', 10, 1),
  -- Cold Brew
  ((SELECT id FROM productos WHERE nombre = 'Cold Brew' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '12 oz', 0, 0),
  ((SELECT id FROM productos WHERE nombre = 'Cold Brew' AND negocio_id = '__NEGOCIO_ID__' LIMIT 1), '16 oz', 15, 1);

-- ============================================================
-- VERIFICACION: Ejecutar despues del seed para confirmar
-- ============================================================
-- SELECT 'categorias' as tabla, count(*) FROM categorias_menu WHERE negocio_id = '__NEGOCIO_ID__'
-- UNION ALL
-- SELECT 'productos', count(*) FROM productos WHERE negocio_id = '__NEGOCIO_ID__'
-- UNION ALL
-- SELECT 'opciones_tamano', count(*) FROM opciones_tamano WHERE producto_id IN (SELECT id FROM productos WHERE negocio_id = '__NEGOCIO_ID__')
-- UNION ALL
-- SELECT 'mesas', count(*) FROM mesas WHERE negocio_id = '__NEGOCIO_ID__';
