-- ============================================================
-- La Commune POS — Esquema completo de Base de Datos
-- Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ┌─────────────────────────────────────┐
-- │  1. EXTENSIONES                      │
-- └─────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ┌─────────────────────────────────────┐
-- │  2. ENUMS                            │
-- └─────────────────────────────────────┘

CREATE TYPE rol_usuario AS ENUM ('admin', 'barista', 'camarero', 'cocina');
CREATE TYPE estado_mesa AS ENUM ('disponible', 'ocupada', 'reservada', 'preparando');
CREATE TYPE estado_orden AS ENUM ('nueva', 'confirmada', 'preparando', 'lista', 'completada', 'cancelada');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
CREATE TYPE estado_pago AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');
CREATE TYPE origen_orden AS ENUM ('mesa', 'delivery', 'para_llevar', 'online');
CREATE TYPE estado_ticket AS ENUM ('nueva', 'preparando', 'lista');

-- ┌─────────────────────────────────────┐
-- │  3. TABLAS                           │
-- └─────────────────────────────────────┘

-- ── Negocios ──
CREATE TABLE negocios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  divisa      TEXT NOT NULL DEFAULT 'MXN',
  zona_horaria TEXT NOT NULL DEFAULT 'America/Mexico_City',
  firebase_project_id TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Usuarios (staff) ──
CREATE TABLE usuarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  auth_uid    UUID NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL,
  rol         rol_usuario NOT NULL DEFAULT 'barista',
  pin         TEXT,                    -- PIN de 4 dígitos para acceso rápido
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,           -- último login/actividad
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Categorías del menú ──
CREATE TABLE categorias_menu (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'drink',  -- drink, food, other
  orden       INTEGER NOT NULL DEFAULT 0,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Productos ──
CREATE TABLE productos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias_menu(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC(10,2) NOT NULL DEFAULT 0,
  ingredientes TEXT[],
  disponible  BOOLEAN NOT NULL DEFAULT TRUE,
  etiquetas   TEXT[] DEFAULT '{}',
  imagen_url  TEXT,
  orden       INTEGER NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Opciones de tamaño por producto ──
CREATE TABLE opciones_tamano (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,       -- "10 oz", "12 oz", "16 oz"
  precio_adicional NUMERIC(10,2) NOT NULL DEFAULT 0,
  orden       INTEGER NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Mesas ──
CREATE TABLE mesas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  numero      INTEGER NOT NULL,
  capacidad   INTEGER NOT NULL DEFAULT 4,
  ubicacion   TEXT,                -- Interior, Terraza, Barra
  estado      estado_mesa NOT NULL DEFAULT 'disponible',
  orden_actual_id UUID,            -- referencia circular, se agrega FK después
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  UNIQUE(negocio_id, numero)
);

-- ── Órdenes ──
CREATE TABLE ordenes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  mesa_id     UUID REFERENCES mesas(id) ON DELETE SET NULL,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id),
  items       JSONB NOT NULL DEFAULT '[]',
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuesto    NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento   NUMERIC(10,2) NOT NULL DEFAULT 0,
  propina     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado      estado_orden NOT NULL DEFAULT 'nueva',
  origen      origen_orden NOT NULL DEFAULT 'mesa',
  notas       TEXT,
  cliente_firebase_id TEXT,        -- ref al customer de Firebase (fidelidad)
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- FK circular mesas.orden_actual_id → ordenes.id
ALTER TABLE mesas
  ADD CONSTRAINT fk_mesas_orden_actual
  FOREIGN KEY (orden_actual_id) REFERENCES ordenes(id) ON DELETE SET NULL;

-- ── Tickets KDS (Cocina) ──
CREATE TABLE tickets_kds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  orden_id    UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  items_kds   JSONB NOT NULL DEFAULT '[]',
  estado      estado_ticket NOT NULL DEFAULT 'nueva',
  prioridad   INTEGER NOT NULL DEFAULT 0,
  tiempo_inicio TIMESTAMPTZ,
  tiempo_fin  TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Pagos ──
CREATE TABLE pagos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  orden_id    UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  monto       NUMERIC(10,2) NOT NULL,
  tipo_pago   tipo_pago NOT NULL DEFAULT 'efectivo',
  estado      estado_pago NOT NULL DEFAULT 'pendiente',
  referencia  TEXT,                -- num de transacción, folio, etc.
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Promociones (locales del POS) ──
CREATE TABLE promociones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  tipo        TEXT NOT NULL DEFAULT 'descuento',  -- 2x1, descuento, gratis, otro
  valor_descuento NUMERIC(10,2),   -- monto o porcentaje
  es_porcentaje BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_a    TEXT,                -- "Lattes", "Todo el menú", etc.
  fecha_inicio TIMESTAMPTZ,
  fecha_fin   TIMESTAMPTZ,
  dias_semana INTEGER[] DEFAULT '{}',  -- 0=Dom..6=Sab, vacío=todos
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Histórico de órdenes (denormalizado para reportes) ──
CREATE TABLE historico_ordenes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  orden_id    UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  mesa_numero INTEGER,
  usuario_nombre TEXT,
  items       JSONB NOT NULL DEFAULT '[]',
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuesto    NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento   NUMERIC(10,2) NOT NULL DEFAULT 0,
  propina     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo_pago   tipo_pago,
  origen      origen_orden,
  cliente_firebase_id TEXT,
  completada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Configuración de sync ──
CREATE TABLE configuracion_sync (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  tabla       TEXT NOT NULL,
  ultima_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(negocio_id, tabla)
);


-- ┌─────────────────────────────────────┐
-- │  4. ÍNDICES                          │
-- └─────────────────────────────────────┘

-- Usuarios
CREATE INDEX idx_usuarios_negocio ON usuarios(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_usuarios_auth ON usuarios(auth_uid);

-- Categorías
CREATE INDEX idx_categorias_negocio ON categorias_menu(negocio_id, orden) WHERE eliminado_en IS NULL;

-- Productos
CREATE INDEX idx_productos_categoria ON productos(categoria_id, orden) WHERE eliminado_en IS NULL;
CREATE INDEX idx_productos_negocio ON productos(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_productos_disponible ON productos(negocio_id, disponible) WHERE eliminado_en IS NULL;

-- Mesas
CREATE INDEX idx_mesas_negocio ON mesas(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_mesas_estado ON mesas(negocio_id, estado) WHERE eliminado_en IS NULL;

-- Órdenes
CREATE INDEX idx_ordenes_negocio ON ordenes(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_ordenes_mesa ON ordenes(mesa_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_ordenes_estado ON ordenes(negocio_id, estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_ordenes_fecha ON ordenes(negocio_id, creado_en DESC) WHERE eliminado_en IS NULL;
CREATE INDEX idx_ordenes_cliente ON ordenes(cliente_firebase_id) WHERE cliente_firebase_id IS NOT NULL;

-- Tickets KDS
CREATE INDEX idx_tickets_orden ON tickets_kds(orden_id);
CREATE INDEX idx_tickets_estado ON tickets_kds(negocio_id, estado);

-- Pagos
CREATE INDEX idx_pagos_orden ON pagos(orden_id);
CREATE INDEX idx_pagos_negocio_fecha ON pagos(negocio_id, creado_en DESC);

-- Promociones
CREATE INDEX idx_promos_negocio ON promociones(negocio_id) WHERE eliminado_en IS NULL AND activo = TRUE;

-- Histórico
CREATE INDEX idx_historico_negocio_fecha ON historico_ordenes(negocio_id, completada_en DESC);
CREATE INDEX idx_historico_tipo_pago ON historico_ordenes(negocio_id, tipo_pago);


-- ┌─────────────────────────────────────┐
-- │  5. FUNCIÓN updated_at automático    │
-- └─────────────────────────────────────┘

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizado_en
CREATE TRIGGER trg_negocios_updated BEFORE UPDATE ON negocios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON categorias_menu FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_mesas_updated BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_ordenes_updated BEFORE UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets_kds FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_pagos_updated BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON promociones FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();


-- ┌─────────────────────────────────────┐
-- │  6. ROW LEVEL SECURITY (RLS)         │
-- └─────────────────────────────────────┘

-- Habilitar RLS en todas las tablas
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones_tamano ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_kds ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sync ENABLE ROW LEVEL SECURITY;

-- ── Función helper: obtener negocio_id del usuario autenticado ──
CREATE OR REPLACE FUNCTION get_mi_negocio_id()
RETURNS UUID AS $$
  SELECT negocio_id FROM usuarios
  WHERE auth_uid = auth.uid()
  AND eliminado_en IS NULL
  AND activo = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Función helper: obtener rol del usuario autenticado ──
CREATE OR REPLACE FUNCTION get_mi_rol()
RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios
  WHERE auth_uid = auth.uid()
  AND eliminado_en IS NULL
  AND activo = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── NEGOCIOS ──
-- Solo lectura para usuarios del negocio
CREATE POLICY "negocios_select" ON negocios
  FOR SELECT USING (id = get_mi_negocio_id());

-- Solo admin puede actualizar
CREATE POLICY "negocios_update" ON negocios
  FOR UPDATE USING (id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── USUARIOS ──
-- Ver usuarios del mismo negocio
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

-- Solo admin puede crear/editar usuarios
CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── CATEGORÍAS MENÚ ──
CREATE POLICY "categorias_select" ON categorias_menu
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "categorias_insert" ON categorias_menu
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

CREATE POLICY "categorias_update" ON categorias_menu
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

CREATE POLICY "categorias_delete" ON categorias_menu
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── PRODUCTOS ──
CREATE POLICY "productos_select" ON productos
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "productos_insert" ON productos
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

CREATE POLICY "productos_update" ON productos
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

CREATE POLICY "productos_delete" ON productos
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── OPCIONES TAMAÑO ──
CREATE POLICY "tamanos_select" ON opciones_tamano
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
  );

CREATE POLICY "tamanos_insert" ON opciones_tamano
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );

CREATE POLICY "tamanos_update" ON opciones_tamano
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );

CREATE POLICY "tamanos_delete" ON opciones_tamano
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() = 'admin'
  );

-- ── MESAS ──
CREATE POLICY "mesas_select" ON mesas
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "mesas_insert" ON mesas
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "mesas_update" ON mesas
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());
  -- Todos los roles pueden cambiar estado de mesa

CREATE POLICY "mesas_delete" ON mesas
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── ÓRDENES ──
CREATE POLICY "ordenes_select" ON ordenes
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "ordenes_insert" ON ordenes
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());
  -- Cualquier rol puede crear órdenes

CREATE POLICY "ordenes_update" ON ordenes
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());

-- ── TICKETS KDS ──
CREATE POLICY "tickets_select" ON tickets_kds
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "tickets_insert" ON tickets_kds
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());

CREATE POLICY "tickets_update" ON tickets_kds
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());

-- ── PAGOS ──
CREATE POLICY "pagos_select" ON pagos
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "pagos_insert" ON pagos
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista', 'camarero'));

CREATE POLICY "pagos_update" ON pagos
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

-- ── PROMOCIONES ──
CREATE POLICY "promos_select" ON promociones
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "promos_insert" ON promociones
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "promos_update" ON promociones
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "promos_delete" ON promociones
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── HISTÓRICO ÓRDENES ──
CREATE POLICY "historico_select" ON historico_ordenes
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "historico_insert" ON historico_ordenes
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());

-- ── CONFIGURACIÓN SYNC ──
CREATE POLICY "sync_select" ON configuracion_sync
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

CREATE POLICY "sync_upsert" ON configuracion_sync
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());

CREATE POLICY "sync_update" ON configuracion_sync
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());


-- ┌─────────────────────────────────────┐
-- │  7. SUPABASE REALTIME                │
-- └─────────────────────────────────────┘

-- Habilitar Realtime en tablas críticas
-- (Ejecutar en Supabase Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tickets_kds;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pagos;

-- NOTA: Las líneas anteriores están comentadas porque Supabase
-- requiere habilitarlas desde el Dashboard o con permisos de superuser.
-- Ve a: Database → Replication → supabase_realtime → agrega las 4 tablas.


-- ┌─────────────────────────────────────┐
-- │  8. SEED — Datos iniciales           │
-- └─────────────────────────────────────┘

-- Crear el negocio "La Commune"
INSERT INTO negocios (nombre, divisa, zona_horaria)
VALUES ('La Commune', 'MXN', 'America/Mexico_City');

-- NOTA: Después de crear el negocio, copia su UUID y:
-- 1. Crea un usuario en Supabase Auth (Authentication → Users → Add user)
-- 2. Inserta el primer usuario admin:
--
-- INSERT INTO usuarios (negocio_id, auth_uid, nombre, email, rol)
-- VALUES (
--   'UUID_DEL_NEGOCIO',
--   'UUID_DEL_AUTH_USER',
--   'David',
--   'tu@email.com',
--   'admin'
-- );
