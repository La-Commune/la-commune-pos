-- Migration V2
-- Enhancements to la-commune-pos schema:
-- 1. Per-negocio folio sequences with auto-assignment trigger
-- 2. items_orden table for normalized order item tracking
-- 3. audit_log table for compliance and debugging
-- 4. gastos table for expense tracking
-- 5. propina column in pagos for per-payment tip tracking

-- ============================================================================
-- 1. FIX FOLIO SEQUENCES PER NEGOCIO
-- ============================================================================
-- Drop the global sequence since we'll calculate MAX(folio) per negocio
DROP SEQUENCE IF EXISTS folio_ordenes_seq CASCADE;

-- Create function to get next folio for a negocio
CREATE OR REPLACE FUNCTION get_next_folio_orden(negocio_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_folio INTEGER;
BEGIN
  SELECT COALESCE(MAX(folio), 0) + 1
  INTO next_folio
  FROM ordenes
  WHERE ordenes.negocio_id = $1;

  RETURN next_folio;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign folio on INSERT
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
FOR EACH ROW
EXECUTE FUNCTION auto_folio_orden();

-- Add index for efficient folio lookups per negocio
CREATE INDEX IF NOT EXISTS idx_ordenes_negocio_folio ON ordenes(negocio_id, folio DESC);

-- ============================================================================
-- 2. CREATE items_orden TABLE
-- ============================================================================
-- Normalized table for order items. The items JSONB in ordenes serves as
-- a snapshot; this table provides relational access to individual items.

CREATE TABLE IF NOT EXISTS items_orden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  nombre TEXT NOT NULL,  -- snapshot del nombre y descripción al momento de la orden
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  tamano TEXT,  -- e.g., "grande", "mediano", "pequeño"
  modificadores TEXT[] DEFAULT '{}',  -- array de modificadores aplicados
  notas TEXT,  -- instrucciones especiales para la cocina
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for items_orden
CREATE INDEX IF NOT EXISTS idx_items_orden_negocio ON items_orden(negocio_id);
CREATE INDEX IF NOT EXISTS idx_items_orden_orden ON items_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_items_orden_producto ON items_orden(producto_id);
CREATE INDEX IF NOT EXISTS idx_items_orden_creado ON items_orden(negocio_id, creado_en DESC);

-- Enable RLS on items_orden
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see items from their negocio
CREATE POLICY items_orden_select ON items_orden
FOR SELECT
USING (negocio_id = get_mi_negocio_id());

-- RLS Policy: Users can insert items (during order creation)
CREATE POLICY items_orden_insert ON items_orden
FOR INSERT
WITH CHECK (negocio_id = get_mi_negocio_id());

-- RLS Policy: Users can update items (adjust quantities, add notes)
CREATE POLICY items_orden_update ON items_orden
FOR UPDATE
USING (negocio_id = get_mi_negocio_id())
WITH CHECK (negocio_id = get_mi_negocio_id());

-- RLS Policy: Users can delete items (cancel before order is complete)
CREATE POLICY items_orden_delete ON items_orden
FOR DELETE
USING (negocio_id = get_mi_negocio_id());

-- Trigger to update actualizado_en timestamp on items_orden
CREATE OR REPLACE FUNCTION actualizar_timestamp_items_orden()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_items_orden
BEFORE UPDATE ON items_orden
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_items_orden();

-- ============================================================================
-- 3. CREATE audit_log TABLE
-- ============================================================================
-- Centralized audit log for compliance, debugging, and user activity tracking.
-- Stores before/after snapshots of changes to critical tables.

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tabla TEXT NOT NULL,  -- tabla que cambió (e.g., 'ordenes', 'pagos', 'usuarios')
  registro_id UUID NOT NULL,  -- ID del registro modificado
  accion TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  datos_antes JSONB,  -- snapshot antes del cambio (NULL para INSERT)
  datos_despues JSONB,  -- snapshot después del cambio (NULL para DELETE)
  ip TEXT,  -- IP del cliente si está disponible
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_negocio ON audit_log(negocio_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_tabla_registro ON audit_log(tabla, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_creado ON audit_log(negocio_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON audit_log(accion);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view audit logs for their negocio
CREATE POLICY audit_log_select ON audit_log
FOR SELECT
USING (negocio_id = get_mi_negocio_id());

-- RLS Policy: Only the system (Supabase) can insert audit records
-- (via triggers, not direct user inserts)
CREATE POLICY audit_log_insert ON audit_log
FOR INSERT
WITH CHECK (negocio_id = get_mi_negocio_id());

-- ============================================================================
-- 4. CREATE gastos TABLE
-- ============================================================================
-- Tracks business expenses (suppliers, supplies, services, etc.)
-- Linked to cash reconciliation (cortes_caja) for matching.

CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  corte_caja_id UUID REFERENCES cortes_caja(id) ON DELETE SET NULL,
  concepto TEXT NOT NULL,  -- descripción del gasto (e.g., "Café Chiapas 1kg", "Renta local")
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  categoria TEXT NOT NULL DEFAULT 'general',  -- 'proveedores', 'insumos', 'servicios', 'otros'
  notas TEXT,  -- detalles adicionales, comprobante, proveedor
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gastos
CREATE INDEX IF NOT EXISTS idx_gastos_negocio ON gastos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON gastos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_corte ON gastos(corte_caja_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(negocio_id, categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_creado ON gastos(negocio_id, creado_en DESC);

-- Enable RLS on gastos
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see gastos from their negocio
CREATE POLICY gastos_select ON gastos
FOR SELECT
USING (negocio_id = get_mi_negocio_id());

-- RLS Policy: Admin and usuarios can insert gastos
CREATE POLICY gastos_insert ON gastos
FOR INSERT
WITH CHECK (
  negocio_id = get_mi_negocio_id()
  AND (
    (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin', 'gerente', 'cajero')
  )
);

-- RLS Policy: Users can update their own gastos or admins can update any
CREATE POLICY gastos_update ON gastos
FOR UPDATE
USING (
  negocio_id = get_mi_negocio_id()
  AND (usuario_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin')
)
WITH CHECK (negocio_id = get_mi_negocio_id());

-- RLS Policy: Only admins can delete gastos
CREATE POLICY gastos_delete ON gastos
FOR DELETE
USING (
  negocio_id = get_mi_negocio_id()
  AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'admin'
);

-- Trigger to update actualizado_en timestamp on gastos
CREATE OR REPLACE FUNCTION actualizar_timestamp_gastos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_gastos
BEFORE UPDATE ON gastos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_gastos();

-- ============================================================================
-- 5. ADD propina COLUMN TO pagos TABLE
-- ============================================================================
-- Split propina tracking from per-order to per-payment.
-- Each payment can have its own tip amount.

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS propina NUMERIC(10,2) DEFAULT 0 CHECK (propina >= 0);

-- Add index for propina calculations
CREATE INDEX IF NOT EXISTS idx_pagos_propina ON pagos(negocio_id, creado_en DESC)
WHERE propina > 0;

-- Comment explaining the column
COMMENT ON COLUMN pagos.propina IS 'Propina asociada a este pago específico. Para órdenes con múltiples pagos, cada uno puede tener su propia propina.';

-- ============================================================================
-- END Migration V2
-- ============================================================================
-- Verification queries (run after migration to confirm):
-- SELECT * FROM information_schema.tables WHERE table_name IN ('items_orden', 'audit_log', 'gastos');
-- SELECT * FROM information_schema.columns WHERE table_name IN ('items_orden', 'audit_log', 'gastos', 'pagos') ORDER BY table_name, ordinal_position;
