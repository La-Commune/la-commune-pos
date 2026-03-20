-- ============================================================
-- La Commune POS — Esquema Completo v2
-- Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Este archivo consolida:
--   • schema.sql (tablas base)
--   • migration-v2 (folios por negocio, items_orden, audit_log, gastos, propina en pagos)
--   • migration-v3 (clientes, inventario, movimientos_inventario, recetas, vista margen)
-- ============================================================


-- ┌─────────────────────────────────────┐
-- │  1. EXTENSIONES                      │
-- └─────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ┌─────────────────────────────────────┐
-- │  2. ENUMS                            │
-- └─────────────────────────────────────┘

CREATE TYPE rol_usuario       AS ENUM ('admin', 'barista', 'camarero', 'cocina');
CREATE TYPE estado_mesa       AS ENUM ('disponible', 'ocupada', 'reservada', 'preparando');
CREATE TYPE estado_orden      AS ENUM ('nueva', 'confirmada', 'preparando', 'lista', 'completada', 'cancelada');
CREATE TYPE tipo_pago         AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
CREATE TYPE estado_pago       AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');
CREATE TYPE origen_orden      AS ENUM ('mesa', 'delivery', 'para_llevar', 'online');
CREATE TYPE estado_ticket     AS ENUM ('nueva', 'preparando', 'lista');
CREATE TYPE unidad_medida     AS ENUM ('kg', 'g', 'lt', 'ml', 'pz', 'bolsa', 'caja');
CREATE TYPE tipo_movimiento_inv AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');


-- ┌─────────────────────────────────────┐
-- │  3. TABLAS                           │
-- └─────────────────────────────────────┘

-- ── Negocios ──
CREATE TABLE negocios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  telefono    TEXT,
  rfc         TEXT,
  divisa      TEXT NOT NULL DEFAULT 'MXN',
  zona_horaria TEXT NOT NULL DEFAULT 'America/Mexico_City',
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
  pin         TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- ── Clientes ──
CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  telefono        TEXT,
  email           TEXT,
  total_visitas   INTEGER NOT NULL DEFAULT 0,
  total_gastado   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ticket_promedio NUMERIC(10,2) NOT NULL DEFAULT 0,
  puntos          INTEGER NOT NULL DEFAULT 0,
  nivel           TEXT NOT NULL DEFAULT 'bronce',   -- bronce, plata, oro
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultima_visita   TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en    TIMESTAMPTZ
);

-- ── Categorías del menú ──
CREATE TABLE categorias_menu (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'drink',
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
  nombre      TEXT NOT NULL,
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
  ubicacion   TEXT,
  estado      estado_mesa NOT NULL DEFAULT 'disponible',
  orden_actual_id UUID,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  UNIQUE(negocio_id, numero)
);

-- ── Modificadores de producto ──
CREATE TABLE modificadores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  precio_adicional NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria   TEXT NOT NULL DEFAULT 'general',
  disponible  BOOLEAN NOT NULL DEFAULT TRUE,
  orden       INTEGER NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Relación productos ↔ modificadores ──
CREATE TABLE productos_modificadores (
  producto_id   UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  modificador_id UUID NOT NULL REFERENCES modificadores(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, modificador_id)
);

-- ── Órdenes ──
CREATE TABLE ordenes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  folio       INTEGER NOT NULL,             -- auto-asignado por trigger (por negocio)
  mesa_id     UUID REFERENCES mesas(id) ON DELETE SET NULL,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,  -- cliente vinculado (si aplica)
  items       JSONB NOT NULL DEFAULT '[]',  -- snapshot rápido (la tabla items_orden es la fuente de verdad)
  subtotal    NUMERIC(10,2) NOT NULL DEFAULT 0,
  impuesto    NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento   NUMERIC(10,2) NOT NULL DEFAULT 0,
  propina     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado      estado_orden NOT NULL DEFAULT 'nueva',
  origen      origen_orden NOT NULL DEFAULT 'mesa',
  notas       TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- FK circular mesas.orden_actual_id → ordenes.id
ALTER TABLE mesas
  ADD CONSTRAINT fk_mesas_orden_actual
  FOREIGN KEY (orden_actual_id) REFERENCES ordenes(id) ON DELETE SET NULL;

-- ── Items de orden (normalizado) ──
CREATE TABLE items_orden (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  orden_id        UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id     UUID NOT NULL REFERENCES productos(id),
  nombre          TEXT NOT NULL,
  cantidad        INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  tamano          TEXT,
  modificadores   TEXT[] DEFAULT '{}',
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  propina     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (propina >= 0),
  referencia  TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Promociones ──
CREATE TABLE promociones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  tipo        TEXT NOT NULL DEFAULT 'descuento',
  valor_descuento NUMERIC(10,2),
  es_porcentaje BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_a    TEXT,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin   TIMESTAMPTZ,
  dias_semana INTEGER[] DEFAULT '{}',
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
  completada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Cortes de caja ──
CREATE TABLE cortes_caja (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  fondo_inicial   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ventas_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ventas_tarjeta  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ventas_transferencia NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_ventas    NUMERIC(10,2) NOT NULL DEFAULT 0,
  propinas        NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuentos      NUMERIC(10,2) NOT NULL DEFAULT 0,
  efectivo_esperado NUMERIC(10,2) NOT NULL DEFAULT 0,
  efectivo_real   NUMERIC(10,2),
  diferencia      NUMERIC(10,2),
  ordenes_count   INTEGER NOT NULL DEFAULT 0,
  notas           TEXT,
  abierto_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrado_en      TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Gastos ──
CREATE TABLE gastos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  corte_caja_id   UUID REFERENCES cortes_caja(id) ON DELETE SET NULL,
  concepto        TEXT NOT NULL,
  monto           NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  categoria       TEXT NOT NULL DEFAULT 'general',
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Log ──
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tabla           TEXT NOT NULL,
  registro_id     UUID NOT NULL,
  accion          TEXT NOT NULL,
  datos_antes     JSONB,
  datos_despues   JSONB,
  ip              TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Inventario ──
CREATE TABLE inventario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  unidad          unidad_medida NOT NULL DEFAULT 'pz',
  stock_actual    NUMERIC(10,3) NOT NULL DEFAULT 0,
  stock_minimo    NUMERIC(10,3) NOT NULL DEFAULT 0,
  costo_unitario  NUMERIC(10,2) NOT NULL DEFAULT 0,
  proveedor       TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en    TIMESTAMPTZ
);

-- ── Movimientos de inventario ──
CREATE TABLE movimientos_inventario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  inventario_id   UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id),
  tipo            tipo_movimiento_inv NOT NULL,
  cantidad        NUMERIC(10,3) NOT NULL,
  stock_anterior  NUMERIC(10,3) NOT NULL,
  stock_nuevo     NUMERIC(10,3) NOT NULL,
  costo_total     NUMERIC(10,2),
  referencia      TEXT,
  orden_id        UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  motivo          TEXT,
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Recetas (costo por producto) ──
CREATE TABLE recetas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  inventario_id   UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  cantidad        NUMERIC(10,3) NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(producto_id, inventario_id)
);

-- ── Configuración de sync ──
CREATE TABLE configuracion_sync (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id  UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  tabla       TEXT NOT NULL,
  ultima_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(negocio_id, tabla)
);

-- ── Intentos de PIN (rate limiting a nivel BD) ──
CREATE TABLE intentos_pin (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip              TEXT NOT NULL,
  intentos        INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ┌─────────────────────────────────────┐
-- │  4. ÍNDICES                          │
-- └─────────────────────────────────────┘

-- Usuarios
CREATE INDEX idx_usuarios_negocio ON usuarios(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_usuarios_auth ON usuarios(auth_uid);

-- Clientes
CREATE INDEX idx_clientes_negocio ON clientes(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_clientes_telefono ON clientes(negocio_id, telefono) WHERE eliminado_en IS NULL;
CREATE INDEX idx_clientes_nombre ON clientes(negocio_id, nombre) WHERE eliminado_en IS NULL;
CREATE INDEX idx_clientes_gastado ON clientes(negocio_id, total_gastado DESC) WHERE eliminado_en IS NULL;

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
CREATE INDEX idx_ordenes_cliente_id ON ordenes(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE UNIQUE INDEX idx_ordenes_folio ON ordenes(negocio_id, folio);
CREATE INDEX idx_ordenes_negocio_folio ON ordenes(negocio_id, folio DESC);

-- Items Orden
CREATE INDEX idx_items_orden_negocio ON items_orden(negocio_id);
CREATE INDEX idx_items_orden_orden ON items_orden(orden_id);
CREATE INDEX idx_items_orden_producto ON items_orden(producto_id);
CREATE INDEX idx_items_orden_creado ON items_orden(negocio_id, creado_en DESC);

-- Tickets KDS
CREATE INDEX idx_tickets_orden ON tickets_kds(orden_id);
CREATE INDEX idx_tickets_estado ON tickets_kds(negocio_id, estado);

-- Pagos
CREATE INDEX idx_pagos_orden ON pagos(orden_id);
CREATE INDEX idx_pagos_negocio_fecha ON pagos(negocio_id, creado_en DESC);
CREATE INDEX idx_pagos_propina ON pagos(negocio_id, creado_en DESC) WHERE propina > 0;

-- Promociones
CREATE INDEX idx_promos_negocio ON promociones(negocio_id) WHERE eliminado_en IS NULL AND activo = TRUE;

-- Modificadores
CREATE INDEX idx_modificadores_negocio ON modificadores(negocio_id, orden);
CREATE INDEX idx_prod_mod_producto ON productos_modificadores(producto_id);

-- Cortes de caja
CREATE INDEX idx_cortes_negocio ON cortes_caja(negocio_id, abierto_en DESC);
CREATE INDEX idx_cortes_usuario ON cortes_caja(usuario_id);

-- Gastos
CREATE INDEX idx_gastos_negocio ON gastos(negocio_id);
CREATE INDEX idx_gastos_usuario ON gastos(usuario_id);
CREATE INDEX idx_gastos_corte ON gastos(corte_caja_id);
CREATE INDEX idx_gastos_categoria ON gastos(negocio_id, categoria);
CREATE INDEX idx_gastos_creado ON gastos(negocio_id, creado_en DESC);

-- Audit Log
CREATE INDEX idx_audit_negocio ON audit_log(negocio_id);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_tabla_registro ON audit_log(tabla, registro_id);
CREATE INDEX idx_audit_creado ON audit_log(negocio_id, creado_en DESC);
CREATE INDEX idx_audit_accion ON audit_log(accion);

-- Inventario
CREATE INDEX idx_inventario_negocio ON inventario(negocio_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_inventario_stock_bajo ON inventario(negocio_id)
  WHERE eliminado_en IS NULL AND stock_actual <= stock_minimo AND activo = TRUE;
CREATE INDEX idx_inventario_nombre ON inventario(negocio_id, nombre) WHERE eliminado_en IS NULL;

-- Movimientos Inventario
CREATE INDEX idx_mov_inv_negocio ON movimientos_inventario(negocio_id);
CREATE INDEX idx_mov_inv_inventario ON movimientos_inventario(inventario_id);
CREATE INDEX idx_mov_inv_fecha ON movimientos_inventario(negocio_id, creado_en DESC);
CREATE INDEX idx_mov_inv_tipo ON movimientos_inventario(negocio_id, tipo);
CREATE INDEX idx_mov_inv_orden ON movimientos_inventario(orden_id) WHERE orden_id IS NOT NULL;

-- Recetas
CREATE INDEX idx_recetas_producto ON recetas(producto_id);
CREATE INDEX idx_recetas_inventario ON recetas(inventario_id);

-- Histórico
CREATE INDEX idx_historico_negocio_fecha ON historico_ordenes(negocio_id, completada_en DESC);
CREATE INDEX idx_historico_tipo_pago ON historico_ordenes(negocio_id, tipo_pago);

-- Intentos PIN
CREATE UNIQUE INDEX idx_intentos_pin_ip ON intentos_pin(ip);
CREATE INDEX idx_intentos_pin_bloqueado ON intentos_pin(bloqueado_hasta)
  WHERE bloqueado_hasta IS NOT NULL;


-- ┌─────────────────────────────────────┐
-- │  5. FUNCIONES Y TRIGGERS            │
-- └─────────────────────────────────────┘

-- ── actualizar_timestamp() — usado por todos los triggers de updated_at ──
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers actualizado_en
CREATE TRIGGER trg_negocios_updated BEFORE UPDATE ON negocios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON categorias_menu FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_mesas_updated BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_ordenes_updated BEFORE UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_items_orden_updated BEFORE UPDATE ON items_orden FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets_kds FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_pagos_updated BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON promociones FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_modificadores_updated BEFORE UPDATE ON modificadores FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_cortes_updated BEFORE UPDATE ON cortes_caja FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_gastos_updated BEFORE UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_inventario_updated BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_recetas_updated BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_intentos_pin_updated BEFORE UPDATE ON intentos_pin FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ── Folio auto-incremental por negocio ──
CREATE OR REPLACE FUNCTION get_next_folio_orden(p_negocio_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_folio INTEGER;
BEGIN
  SELECT COALESCE(MAX(folio), 0) + 1
  INTO next_folio
  FROM ordenes
  WHERE ordenes.negocio_id = p_negocio_id;
  RETURN next_folio;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_folio_orden()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := get_next_folio_orden(NEW.negocio_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_folio_orden
BEFORE INSERT ON ordenes
FOR EACH ROW EXECUTE FUNCTION auto_folio_orden();

-- ── Actualizar métricas del cliente al completar pago ──
CREATE OR REPLACE FUNCTION actualizar_metricas_cliente()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  IF NEW.estado = 'completado' AND (OLD.estado IS NULL OR OLD.estado != 'completado') THEN
    SELECT cliente_id INTO v_cliente_id
    FROM ordenes WHERE id = NEW.orden_id;

    IF v_cliente_id IS NOT NULL THEN
      UPDATE clientes SET
        total_visitas = total_visitas + 1,
        total_gastado = total_gastado + NEW.monto,
        ticket_promedio = (total_gastado + NEW.monto) / (total_visitas + 1),
        ultima_visita = NOW(),
        nivel = CASE
          WHEN (total_visitas + 1) >= 31 THEN 'oro'
          WHEN (total_visitas + 1) >= 11 THEN 'plata'
          ELSE 'bronce'
        END
      WHERE id = v_cliente_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pagos_actualizar_cliente
AFTER INSERT OR UPDATE ON pagos
FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_cliente();

-- ── Costo de producción por producto ──
CREATE OR REPLACE FUNCTION costo_producto(p_producto_id UUID)
RETURNS NUMERIC(10,2) AS $$
  SELECT COALESCE(SUM(r.cantidad * i.costo_unitario), 0)::NUMERIC(10,2)
  FROM recetas r
  JOIN inventario i ON i.id = r.inventario_id
  WHERE r.producto_id = p_producto_id
    AND i.eliminado_en IS NULL;
$$ LANGUAGE sql STABLE;

-- ── Vista: Productos con costo y margen ──
-- security_invoker = true → respeta RLS del usuario que consulta (no bypasea como SECURITY DEFINER)
CREATE OR REPLACE VIEW vista_productos_margen
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.negocio_id,
  p.nombre,
  p.precio_base,
  costo_producto(p.id) AS costo,
  p.precio_base - costo_producto(p.id) AS margen,
  CASE
    WHEN p.precio_base > 0
    THEN ROUND(((p.precio_base - costo_producto(p.id)) / p.precio_base) * 100, 1)
    ELSE 0
  END AS margen_pct
FROM productos p
WHERE p.eliminado_en IS NULL AND p.disponible = TRUE;


-- ┌─────────────────────────────────────┐
-- │  6. ROW LEVEL SECURITY (RLS)        │
-- └─────────────────────────────────────┘

-- Habilitar RLS en todas las tablas
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones_tamano ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_kds ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_pin ENABLE ROW LEVEL SECURITY;
-- (intentos_pin no necesita políticas — solo la función SECURITY DEFINER accede)

-- ── Funciones helper ──
CREATE OR REPLACE FUNCTION get_mi_negocio_id()
RETURNS UUID AS $$
  SELECT negocio_id FROM usuarios
  WHERE auth_uid = auth.uid()
  AND eliminado_en IS NULL
  AND activo = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_mi_rol()
RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios
  WHERE auth_uid = auth.uid()
  AND eliminado_en IS NULL
  AND activo = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── NEGOCIOS ──
CREATE POLICY "negocios_select" ON negocios
  FOR SELECT USING (id = get_mi_negocio_id());
CREATE POLICY "negocios_update" ON negocios
  FOR UPDATE USING (id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── USUARIOS ──
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── CLIENTES ──
CREATE POLICY "clientes_select" ON clientes
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "clientes_insert" ON clientes
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY "clientes_update" ON clientes
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "clientes_delete" ON clientes
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

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
CREATE POLICY "mesas_delete" ON mesas
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── ÓRDENES ──
CREATE POLICY "ordenes_select" ON ordenes
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "ordenes_insert" ON ordenes
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY "ordenes_update" ON ordenes
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());

-- ── ITEMS ORDEN ──
CREATE POLICY "items_orden_select" ON items_orden
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "items_orden_insert" ON items_orden
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY "items_orden_update" ON items_orden
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "items_orden_delete" ON items_orden
  FOR DELETE USING (negocio_id = get_mi_negocio_id());

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

-- ── MODIFICADORES ──
CREATE POLICY "modificadores_select" ON modificadores
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "modificadores_insert" ON modificadores
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));
CREATE POLICY "modificadores_update" ON modificadores
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));
CREATE POLICY "modificadores_delete" ON modificadores
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── PRODUCTOS_MODIFICADORES ──
CREATE POLICY "prod_mod_select" ON productos_modificadores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
  );
CREATE POLICY "prod_mod_insert" ON productos_modificadores
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );
CREATE POLICY "prod_mod_delete" ON productos_modificadores
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );

-- ── CORTES DE CAJA ──
CREATE POLICY "cortes_select" ON cortes_caja
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "cortes_insert" ON cortes_caja
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));
CREATE POLICY "cortes_update" ON cortes_caja
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

-- ── GASTOS ──
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (
    negocio_id = get_mi_negocio_id()
    AND get_mi_rol() IN ('admin', 'barista')
  );
CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE USING (
    negocio_id = get_mi_negocio_id()
    AND (get_mi_rol() = 'admin' OR usuario_id = (SELECT id FROM usuarios WHERE auth_uid = auth.uid() LIMIT 1))
  );
CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE USING (
    negocio_id = get_mi_negocio_id()
    AND get_mi_rol() = 'admin'
  );

-- ── AUDIT LOG ──
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());

-- ── INVENTARIO ──
CREATE POLICY "inventario_select" ON inventario
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "inventario_insert" ON inventario
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));
CREATE POLICY "inventario_update" ON inventario
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));
CREATE POLICY "inventario_delete" ON inventario
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── MOVIMIENTOS INVENTARIO ──
CREATE POLICY "mov_inv_select" ON movimientos_inventario
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "mov_inv_insert" ON movimientos_inventario
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() IN ('admin', 'barista'));

-- ── RECETAS ──
CREATE POLICY "recetas_select" ON recetas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
  );
CREATE POLICY "recetas_insert" ON recetas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );
CREATE POLICY "recetas_update" ON recetas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() IN ('admin', 'barista')
  );
CREATE POLICY "recetas_delete" ON recetas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM productos p WHERE p.id = producto_id AND p.negocio_id = get_mi_negocio_id())
    AND get_mi_rol() = 'admin'
  );

-- ── CONFIGURACIÓN SYNC ──
CREATE POLICY "sync_select" ON configuracion_sync
  FOR SELECT USING (negocio_id = get_mi_negocio_id());
CREATE POLICY "sync_upsert" ON configuracion_sync
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY "sync_update" ON configuracion_sync
  FOR UPDATE USING (negocio_id = get_mi_negocio_id());


-- ┌─────────────────────────────────────┐
-- │  7. LOGIN POR PIN (RPC)             │
-- └─────────────────────────────────────┘
-- El POS usa login por PIN (no Supabase Auth directo).
-- Esta función incluye rate limiting por IP a nivel de BD.
-- Bloquea después de 5 intentos fallidos durante 15 minutos.

-- Eliminar versión vieja sin rate limiting (si existe)
DROP FUNCTION IF EXISTS login_por_pin(TEXT);

CREATE OR REPLACE FUNCTION login_por_pin(pin_input TEXT, client_ip TEXT DEFAULT '0.0.0.0')
RETURNS JSON AS $$
DECLARE
  usr RECORD;
  intento RECORD;
  max_intentos CONSTANT INTEGER := 5;
  bloqueo_minutos CONSTANT INTEGER := 15;
BEGIN
  -- ── 1. Verificar rate limit por IP ──
  SELECT * INTO intento
  FROM intentos_pin
  WHERE ip = client_ip;

  -- Si está bloqueado y el bloqueo no ha expirado
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

  -- Si el bloqueo ya expiró, resetear contador
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

  -- ── 2. Buscar usuario por PIN ──
  SELECT id, negocio_id, auth_uid, nombre, rol
  INTO usr
  FROM usuarios
  WHERE pin = pin_input
    AND activo = TRUE
    AND eliminado_en IS NULL
  LIMIT 1;

  -- ── 3. PIN incorrecto → registrar intento fallido ──
  IF usr.id IS NULL THEN
    IF intento.id IS NULL THEN
      INSERT INTO intentos_pin (ip, intentos)
      VALUES (client_ip, 1);
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

  -- ── 4. PIN correcto → limpiar intentos y retornar datos mínimos ──
  IF intento.id IS NOT NULL THEN
    DELETE FROM intentos_pin WHERE ip = client_ip;
  END IF;

  UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = usr.id;

  -- auth_uid se necesita internamente para derivar password, pero NO email
  RETURN json_build_object(
    'success', true,
    'id', usr.id,
    'negocio_id', usr.negocio_id,
    'auth_uid', usr.auth_uid,
    'nombre', usr.nombre,
    'rol', usr.rol
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función de limpieza de intentos viejos (ejecutar con cron o manualmente)
CREATE OR REPLACE FUNCTION limpiar_intentos_pin_viejos()
RETURNS void AS $$
BEGIN
  DELETE FROM intentos_pin
  WHERE actualizado_en < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- IMPORTANTE: service_role necesita acceso porque /api/auth/pin y verifyAdminPin lo usan
REVOKE EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO service_role;


-- ┌─────────────────────────────────────┐
-- │  8. POLÍTICAS ANON (Frontend)       │
-- └─────────────────────────────────────┘
-- El POS usa sesiones Auth reales (authenticated) — NO necesita políticas anon.
-- Solo el frontend de fidelidad necesita acceso anon, y solo lo mínimo:
--   • Lectura pública del menú (productos, categorías, tamaños, promos)
--   • CRUD limitado de clientes (registro, lookup, actualización)
--   • Lectura + creación de tarjetas de fidelidad
--   • Lectura de eventos de sello y recompensas
--
-- NUNCA usar USING(true) en políticas de escritura anon.
-- Ejecutado en producción: 2026-03-19

-- ── Menú público (solo lectura) ──
-- No filtramos por disponible/activo en RLS porque:
-- 1. El menú público filtra en código JS (getFullMenu sin forAdmin)
-- 2. El admin del frontend necesita ver TODO (getFullMenu con forAdmin: true)
-- 3. Ambos usan anon key desde el cliente
CREATE POLICY "anon_productos_select_public"
  ON productos FOR SELECT TO anon
  USING (eliminado_en IS NULL);

CREATE POLICY "anon_categorias_select_public"
  ON categorias_menu FOR SELECT TO anon
  USING (eliminado_en IS NULL);

CREATE POLICY "anon_tamanos_select_public"
  ON opciones_tamano FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM productos p
      WHERE p.id = producto_id
        AND p.eliminado_en IS NULL
        AND p.disponible = TRUE
    )
  );

CREATE POLICY "anon_promociones_select_public"
  ON promociones FOR SELECT TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

-- ── Clientes (registro y lookup desde app fidelidad) ──
CREATE POLICY "anon_clientes_select_restricted"
  ON clientes FOR SELECT TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

CREATE POLICY "anon_clientes_insert_restricted"
  ON clientes FOR INSERT TO anon
  WITH CHECK (activo = TRUE);

CREATE POLICY "anon_clientes_update_restricted"
  ON clientes FOR UPDATE TO anon
  USING (eliminado_en IS NULL AND activo = TRUE);

-- ── Tarjetas de fidelidad ──
CREATE POLICY "anon_tarjetas_select"
  ON tarjetas FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_tarjetas_insert"
  ON tarjetas FOR INSERT TO anon
  WITH CHECK (true);

-- ── Eventos de sello (solo lectura — inserts vía RPC SECURITY DEFINER) ──
CREATE POLICY "anon_eventos_sello_select"
  ON eventos_sello FOR SELECT TO anon
  USING (true);

-- ── Recompensas (solo lectura de activas) ──
CREATE POLICY "anon_recompensas_select"
  ON recompensas FOR SELECT TO anon
  USING (activa = TRUE);


-- ┌─────────────────────────────────────┐
-- │  9. SUPABASE REALTIME               │
-- └─────────────────────────────────────┘
-- Descomentar o ejecutar desde Dashboard → Database → Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tickets_kds;
-- ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
-- ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE inventario;
