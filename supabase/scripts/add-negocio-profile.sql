-- Migración: Perfil completo del negocio
-- Ejecutado: 2026-03-10
-- Agrega columnas para branding, contacto, fiscal, operación

ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS color_primario TEXT DEFAULT '#C49A3C',
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS sitio_web TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS redes_sociales JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS regimen_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS footer_ticket TEXT DEFAULT '¡Gracias por tu visita!',
  ADD COLUMN IF NOT EXISTS horario JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS propina_sugerida NUMERIC[] DEFAULT ARRAY[10, 15, 20]::NUMERIC[],
  ADD COLUMN IF NOT EXISTS iva_incluido BOOLEAN DEFAULT TRUE;

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'negocios' ORDER BY ordinal_position;
