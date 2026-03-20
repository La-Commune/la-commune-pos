-- ============================================================
-- Migración: Tablas de Fidelidad para Frontend (Firebase → Supabase)
-- Fecha: 2026-03-08
-- ============================================================

-- ── 1. Columnas nuevas en clientes ──

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS id_referidor UUID REFERENCES clientes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS bono_referido_entregado BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consentimiento_whatsapp BOOLEAN,
ADD COLUMN IF NOT EXISTS consentimiento_email BOOLEAN,
ADD COLUMN IF NOT EXISTS pin_hmac TEXT,
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS total_sellos INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_clientes_pin_hmac ON clientes(negocio_id, pin_hmac) WHERE pin_hmac IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_telefono_activo ON clientes(negocio_id, telefono) WHERE activo = TRUE;

-- ── 2. Tabla: recompensas ──

CREATE TABLE IF NOT EXISTS recompensas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  sellos_requeridos INTEGER NOT NULL DEFAULT 5 CHECK (sellos_requeridos >= 1 AND sellos_requeridos <= 20),
  tipo            TEXT NOT NULL DEFAULT 'bebida' CHECK (tipo IN ('bebida', 'descuento', 'otro')),
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  expira_en       TIMESTAMPTZ,
  es_default      BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recompensas_negocio ON recompensas(negocio_id) WHERE activa = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_recompensas_default_unico ON recompensas(negocio_id) WHERE es_default = TRUE;

-- ── 3. Tabla: tarjetas ──

CREATE TABLE IF NOT EXISTS tarjetas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id   UUID NOT NULL REFERENCES recompensas(id),
  sellos          INTEGER NOT NULL DEFAULT 0 CHECK (sellos >= 0),
  sellos_maximos  INTEGER NOT NULL DEFAULT 5,
  estado          TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'canjeada', 'expirada')),
  pin_hash        TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_sello_en TIMESTAMPTZ,
  completada_en   TIMESTAMPTZ,
  canjeada_en     TIMESTAMPTZ,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_cliente_activa ON tarjetas(cliente_id) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_tarjetas_negocio ON tarjetas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_estado ON tarjetas(negocio_id, estado);

-- ── 4. Tabla: eventos_sello ──

CREATE TABLE IF NOT EXISTS eventos_sello (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  tarjeta_id      UUID NOT NULL REFERENCES tarjetas(id) ON DELETE CASCADE,
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_bebida     TEXT,
  tamano          TEXT CHECK (tamano IS NULL OR tamano IN ('10oz', '12oz')),
  agregado_por    TEXT NOT NULL DEFAULT 'system' CHECK (agregado_por IN ('barista', 'system')),
  id_barista      TEXT,
  notas           TEXT,
  origen          TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual', 'promo', 'auto', 'canje', 'bono_referido'))
);

CREATE INDEX IF NOT EXISTS idx_eventos_tarjeta ON eventos_sello(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_eventos_cliente ON eventos_sello(cliente_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_negocio_fecha ON eventos_sello(negocio_id, creado_en DESC);

-- ── 5. Tabla: secciones_menu (frontend) ──

CREATE TABLE IF NOT EXISTS secciones_menu (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  tipo            TEXT NOT NULL DEFAULT 'bebida' CHECK (tipo IN ('bebida', 'comida', 'otro')),
  orden           INTEGER NOT NULL DEFAULT 0,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_secciones_menu_negocio ON secciones_menu(negocio_id, orden) WHERE eliminado_en IS NULL AND activa = TRUE;

-- ── 6. Tabla: items_menu (frontend) ──

CREATE TABLE IF NOT EXISTS items_menu (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  seccion_id      UUID NOT NULL REFERENCES secciones_menu(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  precio          NUMERIC(10,2),
  descripcion     TEXT,
  ingredientes    TEXT[] DEFAULT '{}',
  opcionales      TEXT[] DEFAULT '{}',
  nota            TEXT,
  tamanos         JSONB DEFAULT '[]'::jsonb,
  imagen_url      TEXT,
  disponible      BOOLEAN NOT NULL DEFAULT TRUE,
  etiquetas       TEXT[] DEFAULT '{}',
  destacado       BOOLEAN NOT NULL DEFAULT FALSE,
  estacional      BOOLEAN NOT NULL DEFAULT FALSE,
  orden           INTEGER NOT NULL DEFAULT 0,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_menu_seccion ON items_menu(seccion_id, orden);

-- ── 7. Tabla: config_admin ──

CREATE TABLE IF NOT EXISTS config_admin (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  pin_hmac        TEXT,
  longitud_pin    INTEGER NOT NULL DEFAULT 4,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(negocio_id)
);

-- ── 8. RLS Policies ──

ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_sello ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_admin ENABLE ROW LEVEL SECURITY;

-- SELECT público (anon) para todas las tablas de fidelidad
CREATE POLICY recompensas_select_anon ON recompensas FOR SELECT USING (true);
CREATE POLICY tarjetas_select_anon ON tarjetas FOR SELECT USING (true);
CREATE POLICY eventos_sello_select_anon ON eventos_sello FOR SELECT USING (true);
CREATE POLICY secciones_menu_select_anon ON secciones_menu FOR SELECT USING (true);
CREATE POLICY items_menu_select_anon ON items_menu FOR SELECT USING (true);
CREATE POLICY config_admin_select_anon ON config_admin FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE para authenticated (POS admin) y service_role
CREATE POLICY recompensas_all_authenticated ON recompensas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY tarjetas_all_authenticated ON tarjetas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY eventos_sello_all_authenticated ON eventos_sello FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY secciones_menu_all_authenticated ON secciones_menu FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY items_menu_all_authenticated ON items_menu FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY config_admin_all_authenticated ON config_admin FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon INSERT/UPDATE/DELETE (para server actions con service_role que bypasea RLS,
-- pero también para el frontend que usa anon key)
CREATE POLICY recompensas_write_anon ON recompensas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY tarjetas_write_anon ON tarjetas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY eventos_sello_write_anon ON eventos_sello FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY secciones_menu_write_anon ON secciones_menu FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY items_menu_write_anon ON items_menu FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY config_admin_write_anon ON config_admin FOR ALL TO anon USING (true) WITH CHECK (true);

-- GRANTs para authenticated y anon
GRANT SELECT, INSERT, UPDATE, DELETE ON recompensas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tarjetas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON eventos_sello TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON secciones_menu TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON items_menu TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_admin TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON recompensas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tarjetas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON eventos_sello TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON secciones_menu TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON items_menu TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_admin TO anon;

-- ── 9. Funciones PostgreSQL ──

-- Función: agregar_sello_a_tarjeta (transacción atómica)
CREATE OR REPLACE FUNCTION agregar_sello_a_tarjeta(
  p_tarjeta_id UUID,
  p_cliente_id UUID DEFAULT NULL,
  p_agregado_por TEXT DEFAULT 'barista',
  p_tipo_bebida TEXT DEFAULT NULL,
  p_tamano TEXT DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_tarjeta RECORD;
  v_sellos_nuevos INTEGER;
  v_estado_nuevo TEXT;
  v_evento_id UUID;
BEGIN
  -- Lock tarjeta
  SELECT * INTO v_tarjeta FROM tarjetas WHERE id = p_tarjeta_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Tarjeta no encontrada');
  END IF;

  IF v_tarjeta.estado != 'activa' THEN
    RETURN json_build_object('error', 'Tarjeta no está activa', 'estado', v_tarjeta.estado);
  END IF;

  IF v_tarjeta.sellos >= v_tarjeta.sellos_maximos THEN
    RETURN json_build_object('error', 'Tarjeta ya tiene todos los sellos');
  END IF;

  -- Incrementar sellos
  v_sellos_nuevos := v_tarjeta.sellos + 1;
  v_estado_nuevo := CASE WHEN v_sellos_nuevos >= v_tarjeta.sellos_maximos THEN 'completada' ELSE 'activa' END;

  UPDATE tarjetas SET
    sellos = v_sellos_nuevos,
    estado = v_estado_nuevo,
    ultimo_sello_en = NOW(),
    completada_en = CASE WHEN v_estado_nuevo = 'completada' THEN NOW() ELSE completada_en END,
    actualizado_en = NOW()
  WHERE id = p_tarjeta_id;

  -- Actualizar métricas del cliente
  IF p_cliente_id IS NOT NULL THEN
    UPDATE clientes SET
      ultima_visita = NOW(),
      total_sellos = COALESCE(total_sellos, 0) + 1,
      total_visitas = COALESCE(total_visitas, 0) + 1,
      actualizado_en = NOW()
    WHERE id = p_cliente_id;
  END IF;

  -- Crear evento de sello
  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, agregado_por, origen, tipo_bebida, tamano, notas)
  VALUES (v_tarjeta.negocio_id, p_tarjeta_id, COALESCE(p_cliente_id, v_tarjeta.cliente_id), p_agregado_por, 'manual', p_tipo_bebida, p_tamano, p_notas)
  RETURNING id INTO v_evento_id;

  -- Bono referido (primer sello del cliente referido)
  IF v_sellos_nuevos = 1 AND p_cliente_id IS NOT NULL THEN
    PERFORM _otorgar_bono_referido(p_cliente_id);
  END IF;

  RETURN json_build_object(
    'sellos', v_sellos_nuevos,
    'sellos_maximos', v_tarjeta.sellos_maximos,
    'estado', v_estado_nuevo,
    'evento_id', v_evento_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper: bono referido
CREATE OR REPLACE FUNCTION _otorgar_bono_referido(p_cliente_referido_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referidor_id UUID;
  v_ya_entregado BOOLEAN;
  v_tarjeta_ref RECORD;
BEGIN
  SELECT id_referidor, bono_referido_entregado INTO v_referidor_id, v_ya_entregado
  FROM clientes WHERE id = p_cliente_referido_id;

  IF v_referidor_id IS NULL OR v_ya_entregado THEN RETURN; END IF;

  -- Buscar tarjeta activa del referidor
  SELECT * INTO v_tarjeta_ref FROM tarjetas
  WHERE cliente_id = v_referidor_id AND estado = 'activa'
  ORDER BY creado_en DESC LIMIT 1
  FOR UPDATE;

  IF NOT FOUND OR v_tarjeta_ref.sellos >= v_tarjeta_ref.sellos_maximos THEN RETURN; END IF;

  -- Agregar sello bono
  UPDATE tarjetas SET
    sellos = sellos + 1,
    estado = CASE WHEN (sellos + 1) >= sellos_maximos THEN 'completada' ELSE estado END,
    ultimo_sello_en = NOW(),
    completada_en = CASE WHEN (sellos + 1) >= sellos_maximos THEN NOW() ELSE completada_en END,
    actualizado_en = NOW()
  WHERE id = v_tarjeta_ref.id;

  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, origen, agregado_por)
  VALUES (v_tarjeta_ref.negocio_id, v_tarjeta_ref.id, v_referidor_id, 'bono_referido', 'system');

  UPDATE clientes SET bono_referido_entregado = TRUE, actualizado_en = NOW()
  WHERE id = p_cliente_referido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: deshacer_sello
CREATE OR REPLACE FUNCTION deshacer_sello(p_tarjeta_id UUID, p_evento_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tarjeta RECORD;
  v_sellos_nuevos INTEGER;
BEGIN
  SELECT * INTO v_tarjeta FROM tarjetas WHERE id = p_tarjeta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Tarjeta no encontrada'); END IF;

  v_sellos_nuevos := GREATEST(0, v_tarjeta.sellos - 1);

  UPDATE tarjetas SET
    sellos = v_sellos_nuevos,
    estado = CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN 'activa' ELSE estado END,
    completada_en = CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN NULL ELSE completada_en END,
    actualizado_en = NOW()
  WHERE id = p_tarjeta_id;

  -- Actualizar métricas cliente
  UPDATE clientes SET
    total_sellos = GREATEST(0, COALESCE(total_sellos, 1) - 1),
    actualizado_en = NOW()
  WHERE id = v_tarjeta.cliente_id;

  DELETE FROM eventos_sello WHERE id = p_evento_id;

  RETURN json_build_object('sellos', v_sellos_nuevos, 'estado',
    CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN 'activa' ELSE v_tarjeta.estado END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: canjear_tarjeta
CREATE OR REPLACE FUNCTION canjear_tarjeta(p_tarjeta_id UUID, p_cliente_id UUID, p_recompensa_id UUID)
RETURNS UUID AS $$
DECLARE
  v_negocio_id UUID;
  v_nueva_id UUID;
  v_sellos_req INTEGER;
BEGIN
  SELECT negocio_id INTO v_negocio_id FROM tarjetas WHERE id = p_tarjeta_id;

  -- Marcar como canjeada
  UPDATE tarjetas SET estado = 'canjeada', canjeada_en = NOW(), actualizado_en = NOW()
  WHERE id = p_tarjeta_id;

  -- Evento de canje
  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, origen, agregado_por)
  VALUES (v_negocio_id, p_tarjeta_id, p_cliente_id, 'canje', 'system');

  -- Leer sellos requeridos de la recompensa
  SELECT sellos_requeridos INTO v_sellos_req FROM recompensas WHERE id = p_recompensa_id;

  -- Crear tarjeta nueva
  INSERT INTO tarjetas (negocio_id, cliente_id, recompensa_id, sellos, sellos_maximos, estado)
  VALUES (v_negocio_id, p_cliente_id, p_recompensa_id, 0, COALESCE(v_sellos_req, 5), 'activa')
  RETURNING id INTO v_nueva_id;

  RETURN v_nueva_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 10. Seed: Recompensa default ──

INSERT INTO recompensas (negocio_id, nombre, descripcion, sellos_requeridos, tipo, activa, es_default)
VALUES ('78c5824a-c564-4055-bb07-8ded54b93092', 'Bebida Gratis', 'Completa 5 sellos y obtén una bebida gratis', 5, 'bebida', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ── 11. Seed: Config admin ──

INSERT INTO config_admin (negocio_id, pin_hmac, longitud_pin)
VALUES ('78c5824a-c564-4055-bb07-8ded54b93092', NULL, 4)
ON CONFLICT (negocio_id) DO NOTHING;

-- ── 12. Realtime ──

ALTER PUBLICATION supabase_realtime ADD TABLE tarjetas;
ALTER PUBLICATION supabase_realtime ADD TABLE eventos_sello;
ALTER PUBLICATION supabase_realtime ADD TABLE recompensas;
