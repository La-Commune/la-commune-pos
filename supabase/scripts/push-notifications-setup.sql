-- =============================================================
-- Push Notifications — Setup completo
-- Fecha: 20-Mar-2026
-- =============================================================
-- Este script documenta todo lo ejecutado en Supabase para
-- implementar push notifications en La Commune.
-- NO ejecutar de nuevo — ya fue aplicado como migraciones.
-- =============================================================

-- ============================================================
-- 1. Tabla push_subscriptions (suscripciones Web Push)
-- ============================================================

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_cliente_id ON push_subscriptions(cliente_id);
CREATE INDEX idx_push_subscriptions_activa ON push_subscriptions(activa) WHERE activa = true;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_insert_anon ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY push_subscriptions_update_anon ON push_subscriptions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY push_subscriptions_select_authenticated ON push_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY push_subscriptions_all_authenticated ON push_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. Tabla push_notifications_log (log de envíos)
-- ============================================================

CREATE TABLE push_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  enviadas int NOT NULL DEFAULT 0,
  fallidas int NOT NULL DEFAULT 0,
  enviado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_notifications_log_tipo ON push_notifications_log(tipo);
CREATE INDEX idx_push_notifications_log_created ON push_notifications_log(created_at DESC);

ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_notifications_log_all_authenticated ON push_notifications_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 3. Función para leer VAPID keys del Vault
-- ============================================================

CREATE OR REPLACE FUNCTION get_push_vapid_keys()
RETURNS TABLE(name text, decrypted_secret text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.name, ds.decrypted_secret
  FROM vault.secrets s
  JOIN vault.decrypted_secrets ds ON s.id = ds.id
  WHERE s.name IN ('VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY');
$$;

REVOKE ALL ON FUNCTION get_push_vapid_keys() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_push_vapid_keys() TO service_role;

-- ============================================================
-- 4. Triggers con pg_net para activar Edge Function push-trigger
-- ============================================================

-- Trigger: nuevo sello agregado
CREATE OR REPLACE FUNCTION notify_push_eventos_sello()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ntfmubmmykpzbltbeujv.supabase.co/functions/v1/push-trigger',
    body := jsonb_build_object(
      'type', 'INSERT', 'table', 'eventos_sello', 'schema', 'public',
      'record', row_to_json(NEW)::jsonb, 'old_record', null
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_notify_nuevo_sello
  AFTER INSERT ON eventos_sello FOR EACH ROW
  EXECUTE FUNCTION notify_push_eventos_sello();

-- Trigger: nueva tarjeta / tarjeta completada
CREATE OR REPLACE FUNCTION notify_push_tarjetas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ntfmubmmykpzbltbeujv.supabase.co/functions/v1/push-trigger',
    body := jsonb_build_object(
      'type', TG_OP, 'table', 'tarjetas', 'schema', 'public',
      'record', row_to_json(NEW)::jsonb,
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE null END
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_notify_tarjeta_nueva
  AFTER INSERT ON tarjetas FOR EACH ROW
  EXECUTE FUNCTION notify_push_tarjetas();

CREATE TRIGGER push_notify_tarjeta_completada
  AFTER UPDATE ON tarjetas FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'completada')
  EXECUTE FUNCTION notify_push_tarjetas();

-- ============================================================
-- 5. VAPID keys en Vault (ya almacenadas)
-- ============================================================
-- Public:  BBMJ5-sSaUDBaahfvYjF2jg8L4Gs9XTDTRQO7fpwklQliWCIMDyD0fjs_IVdLZSNgVm2D3q3efNL94glOAqVrWA
-- Private: [almacenada en Vault, no exponer]
--
-- Para el frontend (.env.local):
-- NEXT_PUBLIC_VAPID_PUBLIC_KEY=BBMJ5-sSaUDBaahfvYjF2jg8L4Gs9XTDTRQO7fpwklQliWCIMDyD0fjs_IVdLZSNgVm2D3q3efNL94glOAqVrWA
