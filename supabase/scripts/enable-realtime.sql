-- Activar Realtime en tablas clave del POS
-- Ejecutado: 2026-03-08 (original 5 tablas)
-- Actualizado: 2026-03-10 (agregado usuarios, productos, items_orden)
--
-- Nota: Si alguna tabla ya está en la publicación, Postgres lanza error.
-- Ejecutar solo los ALTER que falten, o usar DO block:

DO $$
DECLARE
  _tables text[] := ARRAY[
    'ordenes', 'mesas', 'tickets_kds', 'pagos', 'cortes_caja',
    'usuarios', 'productos', 'items_orden'
  ];
  _t text;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = _t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', _t);
      RAISE NOTICE 'Added % to supabase_realtime', _t;
    ELSE
      RAISE NOTICE '% already in supabase_realtime — skipped', _t;
    END IF;
  END LOOP;
END $$;
