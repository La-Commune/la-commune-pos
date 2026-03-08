-- ============================================================
-- La Commune POS — Migración v4: Zonas y Layout de Mesas
-- ============================================================
-- Agrega gestión de zonas (antes hardcodeado) y posicionamiento
-- visual de mesas para el floor plan drag & drop.
--
-- Ejecutar después de schema.sql + seeds
-- ============================================================

-- ── 1. Nuevo enum para forma de mesa ──
DO $$ BEGIN
  CREATE TYPE forma_mesa AS ENUM ('redonda', 'cuadrada', 'rectangular');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Tabla zonas ──
CREATE TABLE IF NOT EXISTS zonas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id      UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  orden           INTEGER NOT NULL DEFAULT 0,
  color           TEXT NOT NULL DEFAULT '#94a3b8',
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en    TIMESTAMPTZ,
  UNIQUE(negocio_id, nombre)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_zonas_negocio
  ON zonas(negocio_id) WHERE eliminado_en IS NULL;

-- ── 3. Habilitar RLS en zonas ──
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver zonas de su negocio
CREATE POLICY "zonas_select" ON zonas
  FOR SELECT USING (negocio_id = get_mi_negocio_id());

-- Solo admin puede crear/editar/eliminar zonas
CREATE POLICY "zonas_insert" ON zonas
  FOR INSERT WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "zonas_update" ON zonas
  FOR UPDATE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

CREATE POLICY "zonas_delete" ON zonas
  FOR DELETE USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ── 4. Grants para authenticated ──
GRANT SELECT, INSERT, UPDATE, DELETE ON zonas TO authenticated;

-- ── 5. Nuevas columnas en mesas ──
ALTER TABLE mesas
  ADD COLUMN IF NOT EXISTS zona_id UUID REFERENCES zonas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pos_x REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pos_y REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma forma_mesa NOT NULL DEFAULT 'cuadrada';

-- Índice para buscar mesas por zona
CREATE INDEX IF NOT EXISTS idx_mesas_zona
  ON mesas(zona_id) WHERE eliminado_en IS NULL;

-- ── 6. Seed: crear zonas default desde ubicaciones existentes ──
-- Usa el negocio_id de La Commune
INSERT INTO zonas (negocio_id, nombre, orden, color)
SELECT
  (SELECT id FROM negocios WHERE nombre = 'La Commune' LIMIT 1),
  zona.nombre,
  zona.orden,
  zona.color
FROM (VALUES
  ('Interior',  1, '#8B7355'),
  ('Terraza',   2, '#6B8E6B'),
  ('Barra',     3, '#7B8DAA')
) AS zona(nombre, orden, color)
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE nombre = zona.nombre);

-- ── 7. Migrar mesas existentes: asignar zona_id por ubicacion ──
UPDATE mesas m
SET zona_id = z.id
FROM zonas z
WHERE m.ubicacion = z.nombre
  AND m.zona_id IS NULL
  AND z.negocio_id = m.negocio_id;

-- ── 8. Asignar posiciones default (grid layout) a mesas sin posición ──
-- Distribuye mesas en grid de 3 columnas, 120px spacing
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY zona_id ORDER BY numero) - 1 as idx
  FROM mesas
  WHERE pos_x = 0 AND pos_y = 0 AND eliminado_en IS NULL
)
UPDATE mesas m
SET
  pos_x = 80 + (n.idx % 3) * 140,
  pos_y = 80 + FLOOR(n.idx / 3) * 140
FROM numbered n
WHERE m.id = n.id;

-- ── Verificación ──
SELECT 'zonas' as tabla, count(*) as registros FROM zonas WHERE eliminado_en IS NULL
UNION ALL
SELECT 'mesas con zona', count(*) FROM mesas WHERE zona_id IS NOT NULL AND eliminado_en IS NULL
UNION ALL
SELECT 'mesas sin zona', count(*) FROM mesas WHERE zona_id IS NULL AND eliminado_en IS NULL;
