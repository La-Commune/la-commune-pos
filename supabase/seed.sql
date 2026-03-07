-- ============================================================
-- La Commune POS — Seed: Menú completo + Mesas + Modificadores
-- Ejecutar DESPUÉS de schema.sql y DESPUÉS de crear el negocio
-- ============================================================
-- INSTRUCCIONES:
-- 1. Ejecuta schema.sql primero
-- 2. Copia el UUID del negocio que se creó automáticamente
-- 3. Reemplaza 'UUID_DEL_NEGOCIO' abajo con ese UUID
-- 4. Ejecuta este archivo en Supabase Dashboard → SQL Editor
-- ============================================================

-- Variable temporal para el negocio
-- Reemplaza este UUID con el real de tu negocio
DO $$
DECLARE
  v_negocio UUID;

  -- Categorías
  cat_cafe_caliente UUID;
  cat_cafe_frio UUID;
  cat_te UUID;
  cat_especiales UUID;
  cat_panaderia UUID;
  cat_alimentos UUID;
  cat_postres UUID;
  cat_extras UUID;

  -- Productos (para asociar tamaños y modificadores)
  prod_americano UUID;
  prod_latte UUID;
  prod_cappuccino UUID;
  prod_mocha UUID;
  prod_espresso_doble UUID;
  prod_cortado UUID;
  prod_cold_brew UUID;
  prod_iced_latte UUID;
  prod_frappe_mocha UUID;
  prod_affogato UUID;
  prod_matcha UUID;
  prod_chai UUID;
  prod_te_verde UUID;
  prod_horchata UUID;
  prod_mazapan UUID;
  prod_lavender UUID;
  prod_croissant UUID;
  prod_pan_choco UUID;
  prod_muffin UUID;
  prod_banana UUID;
  prod_galleta UUID;
  prod_panini UUID;
  prod_avocado UUID;
  prod_acai UUID;
  prod_ensalada UUID;
  prod_cheesecake UUID;
  prod_brownie UUID;
  prod_tiramisu UUID;
  prod_shot UUID;
  prod_leche_almendra UUID;
  prod_leche_avena UUID;

  -- Modificadores
  mod_extra_shot UUID;
  mod_sin_azucar UUID;
  mod_leche_almendra UUID;
  mod_leche_avena UUID;
  mod_leche_coco UUID;
  mod_deslactosada UUID;
  mod_doble_crema UUID;
  mod_jarabe_vainilla UUID;
  mod_jarabe_caramelo UUID;
  mod_chocolate_extra UUID;

BEGIN
  -- ── Obtener el negocio (el primero que exista) ──
  SELECT id INTO v_negocio FROM negocios LIMIT 1;

  IF v_negocio IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún negocio. Ejecuta schema.sql primero.';
  END IF;

  -- ════════════════════════════════════════════
  -- CATEGORÍAS DEL MENÚ
  -- ════════════════════════════════════════════

  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Café Caliente', 'drink', 0) RETURNING id INTO cat_cafe_caliente;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Café Frío', 'drink', 1) RETURNING id INTO cat_cafe_frio;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Té & Infusiones', 'drink', 2) RETURNING id INTO cat_te;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Bebidas Especiales', 'drink', 3) RETURNING id INTO cat_especiales;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Panadería', 'food', 4) RETURNING id INTO cat_panaderia;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Alimentos', 'food', 5) RETURNING id INTO cat_alimentos;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Postres', 'food', 6) RETURNING id INTO cat_postres;
  INSERT INTO categorias_menu (id, negocio_id, nombre, tipo, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Extras', 'other', 7) RETURNING id INTO cat_extras;

  -- ════════════════════════════════════════════
  -- PRODUCTOS
  -- Precios en MXN con IVA incluido (ley mexicana)
  -- Redondeados a múltiplos de $5
  -- ════════════════════════════════════════════

  -- ── Café Caliente ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Americano', 'Espresso con agua caliente', 45, ARRAY['espresso','agua'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_americano;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Latte', 'Espresso con leche vaporizada', 55, ARRAY['espresso','leche'], TRUE, ARRAY['popular'], 1)
    RETURNING id INTO prod_latte;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Cappuccino', 'Espresso, leche vaporizada y espuma', 55, ARRAY['espresso','leche','espuma'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_cappuccino;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Mocha', 'Espresso con chocolate y leche', 65, ARRAY['espresso','chocolate','leche'], TRUE, ARRAY[]::TEXT[], 3)
    RETURNING id INTO prod_mocha;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Espresso Doble', 'Doble shot de espresso', 40, ARRAY['espresso'], TRUE, ARRAY[]::TEXT[], 4)
    RETURNING id INTO prod_espresso_doble;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_caliente, 'Cortado', 'Espresso con un toque de leche', 45, ARRAY['espresso','leche'], TRUE, ARRAY[]::TEXT[], 5)
    RETURNING id INTO prod_cortado;

  -- ── Café Frío ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_frio, 'Cold Brew', 'Café infusionado en frío 16h', 60, ARRAY['café'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_cold_brew;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_frio, 'Iced Latte', 'Latte frío con hielo', 60, ARRAY['espresso','leche','hielo'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_iced_latte;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_frio, 'Frappé Mocha', 'Café frío mezclado con chocolate y hielo', 75, ARRAY['espresso','chocolate','leche','hielo'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_frappe_mocha;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_cafe_frio, 'Affogato', 'Helado de vainilla con espresso', 70, ARRAY['espresso','helado'], TRUE, ARRAY['nuevo'], 3)
    RETURNING id INTO prod_affogato;

  -- ── Té & Infusiones ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_te, 'Matcha Latte', 'Matcha japonés con leche', 65, ARRAY['matcha','leche'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_matcha;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_te, 'Chai Latte', 'Té con especias y leche', 55, ARRAY['té chai','leche','especias'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_chai;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_te, 'Té Verde', 'Té verde orgánico', 35, ARRAY['té verde'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_te_verde;

  -- ── Bebidas Especiales ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_especiales, 'Horchata Latte', 'Latte con horchata artesanal', 70, ARRAY['espresso','horchata','canela'], TRUE, ARRAY['nuevo','especial'], 0)
    RETURNING id INTO prod_horchata;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_especiales, 'Mazapán Latte', 'Latte con mazapán y canela', 70, ARRAY['espresso','leche','mazapán','canela'], TRUE, ARRAY['especial'], 1)
    RETURNING id INTO prod_mazapan;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_especiales, 'Lavender Latte', 'Latte con jarabe de lavanda', 70, ARRAY['espresso','leche','lavanda'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_lavender;

  -- ── Panadería ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_panaderia, 'Croissant', 'Croissant de mantequilla', 45, ARRAY['harina','mantequilla'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_croissant;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_panaderia, 'Pan de Chocolate', 'Pain au chocolat', 50, ARRAY['harina','chocolate','mantequilla'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_pan_choco;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_panaderia, 'Muffin de Arándano', NULL, 40, ARRAY['harina','arándano'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_muffin;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_panaderia, 'Banana Bread', 'Rebanada de pan de plátano', 45, ARRAY['plátano','harina','nuez'], TRUE, ARRAY[]::TEXT[], 3)
    RETURNING id INTO prod_banana;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_panaderia, 'Galleta de Avena', NULL, 30, ARRAY['avena','mantequilla'], TRUE, ARRAY[]::TEXT[], 4)
    RETURNING id INTO prod_galleta;

  -- ── Alimentos ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_alimentos, 'Panini Caprese', 'Mozzarella, tomate, albahaca y pesto', 95, ARRAY['pan','mozzarella','tomate','albahaca','pesto'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_panini;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_alimentos, 'Avocado Toast', 'Pan artesanal con aguacate y huevo', 85, ARRAY['pan','aguacate','huevo'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_avocado;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_alimentos, 'Bowl de Açaí', 'Açaí con granola y fruta fresca', 90, ARRAY['açaí','granola','fresa','plátano'], TRUE, ARRAY['nuevo'], 2)
    RETURNING id INTO prod_acai;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_alimentos, 'Ensalada César', 'Lechuga, pollo, crutones, parmesano', 95, ARRAY['lechuga','pollo','crutones','parmesano'], TRUE, ARRAY[]::TEXT[], 3)
    RETURNING id INTO prod_ensalada;

  -- ── Postres ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_postres, 'Cheesecake', 'New York style', 75, ARRAY['queso crema','galleta'], TRUE, ARRAY['popular'], 0)
    RETURNING id INTO prod_cheesecake;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_postres, 'Brownie', 'Brownie de chocolate con nuez', 55, ARRAY['chocolate','nuez'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_brownie;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_postres, 'Tiramisú', 'Tiramisú clásico italiano', 80, ARRAY['mascarpone','café','galleta'], TRUE, ARRAY['especial'], 2)
    RETURNING id INTO prod_tiramisu;

  -- ── Extras ──

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_extras, 'Shot Extra', 'Shot adicional de espresso', 15, ARRAY['espresso'], TRUE, ARRAY[]::TEXT[], 0)
    RETURNING id INTO prod_shot;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_extras, 'Leche de Almendra', 'Sustituto de leche', 15, ARRAY['almendra'], TRUE, ARRAY[]::TEXT[], 1)
    RETURNING id INTO prod_leche_almendra;

  INSERT INTO productos (id, negocio_id, categoria_id, nombre, descripcion, precio_base, ingredientes, disponible, etiquetas, orden) VALUES
    (uuid_generate_v4(), v_negocio, cat_extras, 'Leche de Avena', 'Sustituto de leche', 15, ARRAY['avena'], TRUE, ARRAY[]::TEXT[], 2)
    RETURNING id INTO prod_leche_avena;


  -- ════════════════════════════════════════════
  -- OPCIONES DE TAMAÑO
  -- precio_adicional sobre el precio_base
  -- ════════════════════════════════════════════

  -- Americano: 10oz (base), 12oz (+$10), 16oz (+$20)
  INSERT INTO opciones_tamano (producto_id, nombre, precio_adicional, orden) VALUES
    (prod_americano, '10 oz', 0,  0),
    (prod_americano, '12 oz', 10, 1),
    (prod_americano, '16 oz', 20, 2);

  -- Latte: 12oz (base), 16oz (+$15)
  INSERT INTO opciones_tamano (producto_id, nombre, precio_adicional, orden) VALUES
    (prod_latte, '12 oz', 0,  0),
    (prod_latte, '16 oz', 15, 1);

  -- Cappuccino: 10oz (base), 12oz (+$10)
  INSERT INTO opciones_tamano (producto_id, nombre, precio_adicional, orden) VALUES
    (prod_cappuccino, '10 oz', 0,  0),
    (prod_cappuccino, '12 oz', 10, 1);

  -- Cold Brew: 12oz (base), 16oz (+$15)
  INSERT INTO opciones_tamano (producto_id, nombre, precio_adicional, orden) VALUES
    (prod_cold_brew, '12 oz', 0,  0),
    (prod_cold_brew, '16 oz', 15, 1);


  -- ════════════════════════════════════════════
  -- MODIFICADORES
  -- Extras que se pueden agregar a bebidas
  -- ════════════════════════════════════════════

  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Extra shot',       15, 'extras',  TRUE, 0) RETURNING id INTO mod_extra_shot;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Sin azúcar',        0, 'azúcar',  TRUE, 1) RETURNING id INTO mod_sin_azucar;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Leche de almendra', 15, 'leche',  TRUE, 2) RETURNING id INTO mod_leche_almendra;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Leche de avena',    15, 'leche',  TRUE, 3) RETURNING id INTO mod_leche_avena;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Leche de coco',     15, 'leche',  TRUE, 4) RETURNING id INTO mod_leche_coco;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Deslactosada',      10, 'leche',  TRUE, 5) RETURNING id INTO mod_deslactosada;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Doble crema',        0, 'extras', TRUE, 6) RETURNING id INTO mod_doble_crema;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Jarabe de vainilla', 10, 'jarabe', TRUE, 7) RETURNING id INTO mod_jarabe_vainilla;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Jarabe de caramelo', 10, 'jarabe', TRUE, 8) RETURNING id INTO mod_jarabe_caramelo;
  INSERT INTO modificadores (id, negocio_id, nombre, precio_adicional, categoria, disponible, orden) VALUES
    (uuid_generate_v4(), v_negocio, 'Chocolate extra',    10, 'extras', TRUE, 9) RETURNING id INTO mod_chocolate_extra;


  -- ════════════════════════════════════════════
  -- PRODUCTOS ↔ MODIFICADORES
  -- Qué modificadores aplican a qué productos
  -- ════════════════════════════════════════════

  -- Café Caliente — todos los modificadores aplican
  INSERT INTO productos_modificadores (producto_id, modificador_id) VALUES
    (prod_americano,      mod_extra_shot),
    (prod_americano,      mod_sin_azucar),
    (prod_latte,          mod_extra_shot),
    (prod_latte,          mod_sin_azucar),
    (prod_latte,          mod_leche_almendra),
    (prod_latte,          mod_leche_avena),
    (prod_latte,          mod_leche_coco),
    (prod_latte,          mod_deslactosada),
    (prod_latte,          mod_jarabe_vainilla),
    (prod_latte,          mod_jarabe_caramelo),
    (prod_cappuccino,     mod_extra_shot),
    (prod_cappuccino,     mod_sin_azucar),
    (prod_cappuccino,     mod_leche_almendra),
    (prod_cappuccino,     mod_leche_avena),
    (prod_cappuccino,     mod_deslactosada),
    (prod_cappuccino,     mod_doble_crema),
    (prod_mocha,          mod_extra_shot),
    (prod_mocha,          mod_sin_azucar),
    (prod_mocha,          mod_leche_almendra),
    (prod_mocha,          mod_leche_avena),
    (prod_mocha,          mod_chocolate_extra),
    (prod_espresso_doble, mod_sin_azucar),
    (prod_cortado,        mod_extra_shot),
    (prod_cortado,        mod_leche_almendra),
    (prod_cortado,        mod_leche_avena),
    (prod_cortado,        mod_deslactosada);

  -- Café Frío
  INSERT INTO productos_modificadores (producto_id, modificador_id) VALUES
    (prod_cold_brew,     mod_extra_shot),
    (prod_cold_brew,     mod_sin_azucar),
    (prod_cold_brew,     mod_jarabe_vainilla),
    (prod_cold_brew,     mod_jarabe_caramelo),
    (prod_iced_latte,    mod_extra_shot),
    (prod_iced_latte,    mod_leche_almendra),
    (prod_iced_latte,    mod_leche_avena),
    (prod_iced_latte,    mod_leche_coco),
    (prod_iced_latte,    mod_jarabe_vainilla),
    (prod_iced_latte,    mod_jarabe_caramelo),
    (prod_frappe_mocha,  mod_extra_shot),
    (prod_frappe_mocha,  mod_chocolate_extra),
    (prod_frappe_mocha,  mod_doble_crema);

  -- Té & Infusiones
  INSERT INTO productos_modificadores (producto_id, modificador_id) VALUES
    (prod_matcha,    mod_leche_almendra),
    (prod_matcha,    mod_leche_avena),
    (prod_matcha,    mod_leche_coco),
    (prod_matcha,    mod_sin_azucar),
    (prod_chai,      mod_leche_almendra),
    (prod_chai,      mod_leche_avena),
    (prod_chai,      mod_sin_azucar),
    (prod_chai,      mod_extra_shot);

  -- Bebidas Especiales
  INSERT INTO productos_modificadores (producto_id, modificador_id) VALUES
    (prod_horchata,  mod_extra_shot),
    (prod_horchata,  mod_sin_azucar),
    (prod_mazapan,   mod_extra_shot),
    (prod_mazapan,   mod_leche_almendra),
    (prod_mazapan,   mod_leche_avena),
    (prod_lavender,  mod_extra_shot),
    (prod_lavender,  mod_leche_almendra),
    (prod_lavender,  mod_leche_avena),
    (prod_lavender,  mod_sin_azucar);


  -- ════════════════════════════════════════════
  -- MESAS
  -- ════════════════════════════════════════════

  INSERT INTO mesas (negocio_id, numero, capacidad, ubicacion, estado) VALUES
    (v_negocio, 1, 2, 'Interior',  'disponible'),
    (v_negocio, 2, 4, 'Interior',  'disponible'),
    (v_negocio, 3, 4, 'Interior',  'disponible'),
    (v_negocio, 4, 6, 'Terraza',   'disponible'),
    (v_negocio, 5, 2, 'Terraza',   'disponible'),
    (v_negocio, 6, 4, 'Terraza',   'disponible'),
    (v_negocio, 7, 8, 'Interior',  'disponible'),
    (v_negocio, 8, 2, 'Barra',     'disponible');

  RAISE NOTICE '✅ Seed completado: 8 categorías, 31 productos, 10 tamaños, 10 modificadores, 8 mesas';

END $$;
