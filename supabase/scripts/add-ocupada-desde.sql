-- Agregar campo ocupada_desde a mesas
-- Se llena automáticamente cuando el estado cambia a 'ocupada' o 'reservada'
-- Se pone NULL cuando vuelve a 'disponible' o 'preparando'

ALTER TABLE mesas ADD COLUMN IF NOT EXISTS ocupada_desde TIMESTAMPTZ;

-- Trigger: auto-actualizar ocupada_desde cuando cambia el estado
CREATE OR REPLACE FUNCTION actualizar_ocupada_desde()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambia a ocupada o reservada, poner timestamp
  IF NEW.estado IN ('ocupada', 'reservada') AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    NEW.ocupada_desde = NOW();
  -- Si cambia a disponible o preparando, limpiar
  ELSIF NEW.estado IN ('disponible', 'preparando') AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    NEW.ocupada_desde = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ocupada_desde ON mesas;
CREATE TRIGGER tr_ocupada_desde
  BEFORE UPDATE OF estado ON mesas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_ocupada_desde();

-- Poner timestamp a mesas que ya están ocupadas
UPDATE mesas SET ocupada_desde = NOW() WHERE estado IN ('ocupada', 'reservada') AND ocupada_desde IS NULL;

-- Grant para authenticated
GRANT SELECT, UPDATE ON mesas TO authenticated;
