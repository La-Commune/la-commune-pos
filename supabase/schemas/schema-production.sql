-- ============================================================
-- La Commune — Schema de Producción Completo
-- Generado: 2026-03-22
--
-- Ejecutar en un proyecto Supabase limpio.
-- IMPORTANTE: Reemplazar YOUR_PROJECT_REF con el ref real
-- del proyecto en las funciones notify_push_*.
--
-- Contenido:
--   1. Extensions
--   2. Enums (10)
--   3. Tables (29)
--   4. Functions (19)
--   5. Triggers (25)
--   6. RLS Enable
--   7. RLS Policies (97)
--   8. Indexes (90+)
--   9. Grants
--  10. View
--  11. Storage bucket
--  12. Realtime
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- ═══════════════════════════════════════════════════════════
-- 2. ENUMS (10)
-- ═══════════════════════════════════════════════════════════

CREATE TYPE estado_mesa AS ENUM ('disponible', 'ocupada', 'reservada', 'preparando');
CREATE TYPE estado_orden AS ENUM ('nueva', 'confirmada', 'preparando', 'lista', 'completada', 'cancelada');
CREATE TYPE estado_pago AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');
CREATE TYPE estado_ticket AS ENUM ('nueva', 'preparando', 'lista');
CREATE TYPE forma_mesa AS ENUM ('redonda', 'cuadrada', 'rectangular');
CREATE TYPE origen_orden AS ENUM ('mesa', 'delivery', 'para_llevar', 'online');
CREATE TYPE rol_usuario AS ENUM ('admin', 'barista', 'camarero', 'cocina');
CREATE TYPE tipo_movimiento_inv AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
CREATE TYPE unidad_medida AS ENUM ('kg', 'g', 'lt', 'ml', 'pz', 'bolsa', 'caja');

-- ═══════════════════════════════════════════════════════════
-- 3. TABLES (29)
-- ═══════════════════════════════════════════════════════════

-- negocios
CREATE TABLE negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  rfc TEXT,
  divisa TEXT NOT NULL DEFAULT 'MXN',
  zona_horaria TEXT NOT NULL DEFAULT 'America/Mexico_City',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#C49A3C',
  slogan TEXT,
  email TEXT,
  sitio_web TEXT,
  whatsapp TEXT
);

-- usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  auth_uid UUID UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT,
  rol rol_usuario NOT NULL DEFAULT 'barista',
  pin_hash TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- zonas
CREATE TABLE zonas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#94a3b8',
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  UNIQUE (negocio_id, nombre)
);

-- categorias_menu
CREATE TABLE categorias_menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'food',
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  categoria_id UUID REFERENCES categorias_menu(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC(10,2) NOT NULL DEFAULT 0,
  ingredientes TEXT[] DEFAULT '{}',
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  etiquetas TEXT[] DEFAULT '{}',
  orden INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  visible_menu BOOLEAN DEFAULT TRUE
);

-- opciones_tamano
CREATE TABLE opciones_tamano (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_adicional NUMERIC(10,2) NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

-- modificadores
CREATE TABLE modificadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  precio_adicional NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria TEXT,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- productos_modificadores (junction table)
CREATE TABLE productos_modificadores (
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  modificador_id UUID NOT NULL REFERENCES modificadores(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, modificador_id)
);

-- mesas
CREATE TABLE mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  numero INTEGER NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 4,
  ubicacion TEXT,
  estado estado_mesa NOT NULL DEFAULT 'disponible',
  orden_actual_id UUID,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  zona_id UUID REFERENCES zonas(id),
  pos_x REAL DEFAULT 0,
  pos_y REAL DEFAULT 0,
  forma forma_mesa DEFAULT 'cuadrada',
  ancho INTEGER DEFAULT 80,
  alto INTEGER DEFAULT 80,
  rotacion INTEGER DEFAULT 0,
  ocupada_desde TIMESTAMPTZ
);

-- ordenes
CREATE TABLE ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  mesa_id UUID REFERENCES mesas(id),
  usuario_id UUID REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  folio INTEGER,
  estado estado_orden NOT NULL DEFAULT 'nueva',
  origen origen_orden NOT NULL DEFAULT 'mesa',
  notas TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- items_orden
CREATE TABLE items_orden (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  notas TEXT,
  tamano TEXT,
  modificadores JSONB DEFAULT '[]',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tickets_kds
CREATE TABLE tickets_kds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  orden_id UUID NOT NULL REFERENCES ordenes(id),
  estado estado_ticket NOT NULL DEFAULT 'nueva',
  items JSONB NOT NULL DEFAULT '[]',
  iniciado_en TIMESTAMPTZ,
  completado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pagos
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  orden_id UUID NOT NULL REFERENCES ordenes(id),
  usuario_id UUID REFERENCES usuarios(id),
  monto NUMERIC(10,2) NOT NULL,
  tipo_pago tipo_pago NOT NULL DEFAULT 'efectivo',
  estado estado_pago NOT NULL DEFAULT 'pendiente',
  referencia TEXT,
  propina NUMERIC(10,2) DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cortes_caja
CREATE TABLE cortes_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  abierto_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrado_en TIMESTAMPTZ,
  fondo_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_ventas NUMERIC(10,2) DEFAULT 0,
  total_efectivo NUMERIC(10,2) DEFAULT 0,
  total_tarjeta NUMERIC(10,2) DEFAULT 0,
  total_transferencia NUMERIC(10,2) DEFAULT 0,
  total_propinas NUMERIC(10,2) DEFAULT 0,
  conteo_efectivo NUMERIC(10,2),
  diferencia NUMERIC(10,2),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- gastos
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID REFERENCES usuarios(id),
  corte_caja_id UUID REFERENCES cortes_caja(id),
  concepto TEXT NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  categoria TEXT DEFAULT 'general',
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- historico_ordenes
CREATE TABLE historico_ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  orden_id UUID,
  folio INTEGER,
  total NUMERIC(10,2) NOT NULL,
  tipo_pago tipo_pago,
  items JSONB NOT NULL DEFAULT '[]',
  completada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mesa_numero INTEGER,
  usuario_nombre TEXT,
  cliente_nombre TEXT,
  notas TEXT
);

-- inventario
CREATE TABLE inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  unidad unidad_medida NOT NULL DEFAULT 'pz',
  stock_actual NUMERIC(10,3) NOT NULL DEFAULT 0,
  stock_minimo NUMERIC(10,3) NOT NULL DEFAULT 0,
  costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  proveedor TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- movimientos_inventario
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  inventario_id UUID NOT NULL REFERENCES inventario(id),
  tipo tipo_movimiento_inv NOT NULL,
  cantidad NUMERIC(10,3) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  orden_id UUID REFERENCES ordenes(id),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- recetas
CREATE TABLE recetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES inventario(id),
  cantidad NUMERIC(10,3) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (producto_id, inventario_id)
);

-- promociones
CREATE TABLE promociones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'descuento',
  valor NUMERIC(10,2),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

-- clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  nivel TEXT NOT NULL DEFAULT 'bronce',
  total_visitas INTEGER NOT NULL DEFAULT 0,
  total_gastado NUMERIC(10,2) NOT NULL DEFAULT 0,
  ticket_promedio NUMERIC(10,2) NOT NULL DEFAULT 0,
  ultima_visita TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ,
  id_referidor UUID REFERENCES clientes(id),
  bono_referido_entregado BOOLEAN DEFAULT FALSE,
  consentimiento_whatsapp BOOLEAN,
  consentimiento_email BOOLEAN,
  pin_hmac TEXT,
  notas TEXT,
  total_sellos INTEGER DEFAULT 0,
  auth_uid UUID
);

-- recompensas
CREATE TABLE recompensas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sellos_requeridos INTEGER NOT NULL DEFAULT 5,
  tipo TEXT NOT NULL DEFAULT 'bebida',
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  expira_en TIMESTAMPTZ,
  es_default BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ilustracion TEXT NOT NULL DEFAULT 'flat-white-cenital'
);

-- tarjetas
CREATE TABLE tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  recompensa_id UUID NOT NULL REFERENCES recompensas(id),
  sellos INTEGER NOT NULL DEFAULT 0,
  sellos_maximos INTEGER NOT NULL DEFAULT 5,
  estado TEXT NOT NULL DEFAULT 'activa',
  pin_hash TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_sello_en TIMESTAMPTZ,
  completada_en TIMESTAMPTZ,
  canjeada_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- eventos_sello
CREATE TABLE eventos_sello (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  tarjeta_id UUID NOT NULL REFERENCES tarjetas(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_bebida TEXT,
  tamano TEXT,
  agregado_por TEXT NOT NULL DEFAULT 'system',
  id_barista TEXT,
  notas TEXT,
  origen TEXT NOT NULL DEFAULT 'manual'
);

-- audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  usuario_id UUID REFERENCES usuarios(id),
  accion TEXT NOT NULL,
  tabla TEXT NOT NULL,
  registro_id UUID,
  datos_antes JSONB,
  datos_despues JSONB,
  ip TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- configuracion_sync
CREATE TABLE configuracion_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID NOT NULL REFERENCES negocios(id),
  tabla TEXT NOT NULL,
  ultima_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (negocio_id, tabla)
);

-- intentos_pin
CREATE TABLE intentos_pin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip TEXT NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- push_subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- push_notifications_log
CREATE TABLE push_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  enviadas INTEGER NOT NULL DEFAULT 0,
  fallidas INTEGER NOT NULL DEFAULT 0,
  enviado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 4. FUNCTIONS (19)
-- ═══════════════════════════════════════════════════════════

-- actualizar_timestamp() — trigger, NOT security definer
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$ BEGIN NEW.actualizado_en = NOW(); RETURN NEW; END; $$;

-- get_mi_negocio_id() — SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_mi_negocio_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT negocio_id FROM usuarios WHERE auth_uid = auth.uid() AND eliminado_en IS NULL AND activo = TRUE LIMIT 1; $$;

-- get_mi_rol() — SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_mi_rol()
RETURNS rol_usuario LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT rol FROM usuarios WHERE auth_uid = auth.uid() AND eliminado_en IS NULL AND activo = TRUE LIMIT 1; $$;

-- get_next_folio_orden(p_negocio_id UUID)
CREATE OR REPLACE FUNCTION get_next_folio_orden(p_negocio_id UUID)
RETURNS INTEGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE next_folio INTEGER;
BEGIN
  SELECT COALESCE(MAX(folio), 0) + 1 INTO next_folio
  FROM ordenes WHERE ordenes.negocio_id = p_negocio_id;
  RETURN next_folio;
END; $$;

-- auto_folio_orden() — trigger
CREATE OR REPLACE FUNCTION auto_folio_orden()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := get_next_folio_orden(NEW.negocio_id);
  END IF;
  RETURN NEW;
END; $$;

-- actualizar_ocupada_desde() — trigger
CREATE OR REPLACE FUNCTION actualizar_ocupada_desde()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.estado IN ('ocupada', 'reservada') AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    NEW.ocupada_desde = NOW();
  ELSIF NEW.estado IN ('disponible', 'preparando') AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
    NEW.ocupada_desde = NULL;
  END IF;
  RETURN NEW;
END; $$;

-- actualizar_metricas_cliente() — trigger
CREATE OR REPLACE FUNCTION actualizar_metricas_cliente()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE v_cliente_id UUID;
BEGIN
  IF NEW.estado = 'completado' AND (OLD.estado IS NULL OR OLD.estado != 'completado') THEN
    SELECT cliente_id INTO v_cliente_id FROM ordenes WHERE id = NEW.orden_id;
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
END; $$;

-- costo_producto(p_producto_id UUID)
CREATE OR REPLACE FUNCTION costo_producto(p_producto_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(r.cantidad * i.costo_unitario), 0)::NUMERIC(10,2)
  FROM recetas r
  JOIN inventario i ON i.id = r.inventario_id
  WHERE r.producto_id = p_producto_id
    AND i.eliminado_en IS NULL;
$$;

-- swap_mesa_numeros(...) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION swap_mesa_numeros(mesa_a_id UUID, nuevo_numero_a INTEGER, mesa_b_id UUID, nuevo_numero_b INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE mesas SET numero = 0 WHERE id = mesa_b_id;
  UPDATE mesas SET numero = nuevo_numero_a WHERE id = mesa_a_id;
  UPDATE mesas SET numero = nuevo_numero_b WHERE id = mesa_b_id;
END; $$;

-- hash_pin(pin_raw TEXT) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION hash_pin(pin_raw TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT crypt(pin_raw, gen_salt('bf')); $$;

-- login_por_pin(pin_input TEXT, client_ip TEXT DEFAULT '0.0.0.0') — SECURITY DEFINER
CREATE OR REPLACE FUNCTION login_por_pin(pin_input TEXT, client_ip TEXT DEFAULT '0.0.0.0')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  usr RECORD;
  intento RECORD;
  max_intentos CONSTANT INTEGER := 5;
  bloqueo_minutos CONSTANT INTEGER := 15;
BEGIN
  SELECT * INTO intento FROM intentos_pin WHERE ip = client_ip;
  IF intento.id IS NOT NULL AND intento.bloqueado_hasta IS NOT NULL AND intento.bloqueado_hasta > NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Demasiados intentos. Intenta en ' || bloqueo_minutos || ' minutos.', 'bloqueado_hasta', intento.bloqueado_hasta, 'rate_limited', true);
  END IF;
  IF intento.id IS NOT NULL AND intento.bloqueado_hasta IS NOT NULL AND intento.bloqueado_hasta <= NOW() THEN
    UPDATE intentos_pin SET intentos = 0, bloqueado_hasta = NULL WHERE ip = client_ip;
    intento.intentos := 0; intento.bloqueado_hasta := NULL;
  END IF;
  SELECT id, negocio_id, auth_uid, nombre, rol INTO usr
  FROM usuarios WHERE pin_hash IS NOT NULL AND crypt(pin_input, pin_hash) = pin_hash AND activo = TRUE AND eliminado_en IS NULL LIMIT 1;
  IF usr.id IS NULL THEN
    IF intento.id IS NULL THEN INSERT INTO intentos_pin (ip, intentos) VALUES (client_ip, 1);
    ELSE UPDATE intentos_pin SET intentos = intento.intentos + 1,
      bloqueado_hasta = CASE WHEN intento.intentos + 1 >= max_intentos THEN NOW() + (bloqueo_minutos || ' minutes')::INTERVAL ELSE NULL END
    WHERE ip = client_ip; END IF;
    RETURN json_build_object('success', false, 'error', 'PIN inválido', 'intentos_restantes', GREATEST(max_intentos - COALESCE(intento.intentos, 0) - 1, 0));
  END IF;
  IF intento.id IS NOT NULL THEN DELETE FROM intentos_pin WHERE ip = client_ip; END IF;
  UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = usr.id;
  RETURN json_build_object('success', true, 'id', usr.id, 'negocio_id', usr.negocio_id, 'auth_uid', usr.auth_uid, 'nombre', usr.nombre, 'rol', usr.rol);
END; $$;

-- limpiar_intentos_pin_viejos() — SECURITY DEFINER
CREATE OR REPLACE FUNCTION limpiar_intentos_pin_viejos()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$ BEGIN DELETE FROM intentos_pin WHERE actualizado_en < NOW() - INTERVAL '24 hours'; END; $$;

-- agregar_sello_a_tarjeta(...) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION agregar_sello_a_tarjeta(
  p_tarjeta_id UUID, p_cliente_id UUID DEFAULT NULL, p_agregado_por TEXT DEFAULT 'barista',
  p_tipo_bebida TEXT DEFAULT NULL, p_tamano TEXT DEFAULT NULL, p_notas TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tarjeta RECORD; v_sellos_nuevos INTEGER; v_estado_nuevo TEXT; v_evento_id UUID;
BEGIN
  SELECT * INTO v_tarjeta FROM tarjetas WHERE id = p_tarjeta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Tarjeta no encontrada'); END IF;
  IF v_tarjeta.estado != 'activa' THEN RETURN json_build_object('error', 'Tarjeta no está activa', 'estado', v_tarjeta.estado); END IF;
  IF v_tarjeta.sellos >= v_tarjeta.sellos_maximos THEN RETURN json_build_object('error', 'Tarjeta ya tiene todos los sellos'); END IF;
  v_sellos_nuevos := v_tarjeta.sellos + 1;
  v_estado_nuevo := CASE WHEN v_sellos_nuevos >= v_tarjeta.sellos_maximos THEN 'completada' ELSE 'activa' END;
  UPDATE tarjetas SET sellos = v_sellos_nuevos, estado = v_estado_nuevo, ultimo_sello_en = NOW(),
    completada_en = CASE WHEN v_estado_nuevo = 'completada' THEN NOW() ELSE completada_en END, actualizado_en = NOW()
  WHERE id = p_tarjeta_id;
  IF p_cliente_id IS NOT NULL THEN
    UPDATE clientes SET ultima_visita = NOW(), total_sellos = COALESCE(total_sellos, 0) + 1, total_visitas = COALESCE(total_visitas, 0) + 1, actualizado_en = NOW()
    WHERE id = p_cliente_id;
  END IF;
  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, agregado_por, origen, tipo_bebida, tamano, notas)
  VALUES (v_tarjeta.negocio_id, p_tarjeta_id, COALESCE(p_cliente_id, v_tarjeta.cliente_id), p_agregado_por, 'manual', p_tipo_bebida, p_tamano, p_notas)
  RETURNING id INTO v_evento_id;
  IF v_sellos_nuevos = 1 AND p_cliente_id IS NOT NULL THEN PERFORM _otorgar_bono_referido(p_cliente_id); END IF;
  RETURN json_build_object('sellos', v_sellos_nuevos, 'sellos_maximos', v_tarjeta.sellos_maximos, 'estado', v_estado_nuevo, 'evento_id', v_evento_id);
END; $$;

-- deshacer_sello(p_tarjeta_id UUID, p_evento_id UUID) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION deshacer_sello(p_tarjeta_id UUID, p_evento_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_tarjeta RECORD; v_sellos_nuevos INTEGER;
BEGIN
  SELECT * INTO v_tarjeta FROM tarjetas WHERE id = p_tarjeta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('error', 'Tarjeta no encontrada'); END IF;
  v_sellos_nuevos := GREATEST(0, v_tarjeta.sellos - 1);
  UPDATE tarjetas SET sellos = v_sellos_nuevos,
    estado = CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN 'activa' ELSE estado END,
    completada_en = CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN NULL ELSE completada_en END,
    actualizado_en = NOW()
  WHERE id = p_tarjeta_id;
  UPDATE clientes SET total_sellos = GREATEST(0, COALESCE(total_sellos, 1) - 1), actualizado_en = NOW()
  WHERE id = v_tarjeta.cliente_id;
  DELETE FROM eventos_sello WHERE id = p_evento_id;
  RETURN json_build_object('sellos', v_sellos_nuevos, 'estado',
    CASE WHEN v_tarjeta.estado = 'completada' AND v_sellos_nuevos < v_tarjeta.sellos_maximos THEN 'activa' ELSE v_tarjeta.estado END);
END; $$;

-- canjear_tarjeta(p_tarjeta_id UUID, p_cliente_id UUID, p_recompensa_id UUID) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION canjear_tarjeta(p_tarjeta_id UUID, p_cliente_id UUID, p_recompensa_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_negocio_id UUID; v_nueva_id UUID; v_sellos_req INTEGER;
BEGIN
  SELECT negocio_id INTO v_negocio_id FROM tarjetas WHERE id = p_tarjeta_id;
  UPDATE tarjetas SET estado = 'canjeada', canjeada_en = NOW(), actualizado_en = NOW() WHERE id = p_tarjeta_id;
  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, origen, agregado_por) VALUES (v_negocio_id, p_tarjeta_id, p_cliente_id, 'canje', 'system');
  SELECT sellos_requeridos INTO v_sellos_req FROM recompensas WHERE id = p_recompensa_id;
  INSERT INTO tarjetas (negocio_id, cliente_id, recompensa_id, sellos, sellos_maximos, estado)
  VALUES (v_negocio_id, p_cliente_id, p_recompensa_id, 0, COALESCE(v_sellos_req, 5), 'activa')
  RETURNING id INTO v_nueva_id;
  RETURN v_nueva_id;
END; $$;

-- _otorgar_bono_referido(p_cliente_referido_id UUID) — SECURITY DEFINER
CREATE OR REPLACE FUNCTION _otorgar_bono_referido(p_cliente_referido_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_referidor_id UUID; v_ya_entregado BOOLEAN; v_tarjeta_ref RECORD;
BEGIN
  SELECT id_referidor, bono_referido_entregado INTO v_referidor_id, v_ya_entregado FROM clientes WHERE id = p_cliente_referido_id;
  IF v_referidor_id IS NULL OR v_ya_entregado THEN RETURN; END IF;
  SELECT * INTO v_tarjeta_ref FROM tarjetas WHERE cliente_id = v_referidor_id AND estado = 'activa' ORDER BY creado_en DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND OR v_tarjeta_ref.sellos >= v_tarjeta_ref.sellos_maximos THEN RETURN; END IF;
  UPDATE tarjetas SET sellos = sellos + 1,
    estado = CASE WHEN (sellos + 1) >= sellos_maximos THEN 'completada' ELSE estado END,
    ultimo_sello_en = NOW(),
    completada_en = CASE WHEN (sellos + 1) >= sellos_maximos THEN NOW() ELSE completada_en END,
    actualizado_en = NOW()
  WHERE id = v_tarjeta_ref.id;
  INSERT INTO eventos_sello (negocio_id, tarjeta_id, cliente_id, origen, agregado_por)
  VALUES (v_tarjeta_ref.negocio_id, v_tarjeta_ref.id, v_referidor_id, 'bono_referido', 'system');
  UPDATE clientes SET bono_referido_entregado = TRUE, actualizado_en = NOW() WHERE id = p_cliente_referido_id;
END; $$;

-- get_push_vapid_keys() — SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_push_vapid_keys()
RETURNS TABLE(name TEXT, decrypted_secret TEXT) LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.name, ds.decrypted_secret
  FROM vault.secrets s
  JOIN vault.decrypted_secrets ds ON s.id = ds.id
  WHERE s.name IN ('VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY');
$$;

-- notify_push_eventos_sello() — trigger, SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_push_eventos_sello()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/push-trigger',
    body := jsonb_build_object('type', 'INSERT', 'table', 'eventos_sello', 'schema', 'public', 'record', row_to_json(NEW)::jsonb, 'old_record', null),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push notification failed: %', SQLERRM;
  RETURN NEW;
END; $$;

-- notify_push_tarjetas() — trigger, SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_push_tarjetas()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/push-trigger',
    body := jsonb_build_object('type', TG_OP, 'table', 'tarjetas', 'schema', 'public', 'record', row_to_json(NEW)::jsonb, 'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE null END),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Push notification failed: %', SQLERRM;
  RETURN NEW;
END; $$;

-- ═══════════════════════════════════════════════════════════
-- 5. TRIGGERS (25)
-- ═══════════════════════════════════════════════════════════

-- actualizar_timestamp triggers (18 tables)
CREATE TRIGGER tr_audit_log_timestamp BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_categorias_menu_timestamp BEFORE UPDATE ON categorias_menu FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_clientes_timestamp BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_cortes_caja_timestamp BEFORE UPDATE ON cortes_caja FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_gastos_timestamp BEFORE UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_intentos_pin_timestamp BEFORE UPDATE ON intentos_pin FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_inventario_timestamp BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_items_orden_timestamp BEFORE UPDATE ON items_orden FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_mesas_timestamp BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_modificadores_timestamp BEFORE UPDATE ON modificadores FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_negocios_timestamp BEFORE UPDATE ON negocios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_ordenes_timestamp BEFORE UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_pagos_timestamp BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_productos_timestamp BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_promociones_timestamp BEFORE UPDATE ON promociones FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_push_subscriptions_timestamp BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_recetas_timestamp BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_tickets_kds_timestamp BEFORE UPDATE ON tickets_kds FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER tr_usuarios_timestamp BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Special triggers
CREATE TRIGGER tr_ocupada_desde BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION actualizar_ocupada_desde();
CREATE TRIGGER trigger_auto_folio_orden BEFORE INSERT ON ordenes FOR EACH ROW EXECUTE FUNCTION auto_folio_orden();
CREATE TRIGGER trg_pagos_actualizar_cliente AFTER INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION actualizar_metricas_cliente();
CREATE TRIGGER push_notify_nuevo_sello AFTER INSERT ON eventos_sello FOR EACH ROW EXECUTE FUNCTION notify_push_eventos_sello();
CREATE TRIGGER push_notify_tarjeta_nueva AFTER INSERT ON tarjetas FOR EACH ROW EXECUTE FUNCTION notify_push_tarjetas();
CREATE TRIGGER push_notify_tarjeta_completada AFTER UPDATE ON tarjetas FOR EACH ROW EXECUTE FUNCTION notify_push_tarjetas();

-- ═══════════════════════════════════════════════════════════
-- 6. RLS ENABLE (29 tables)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_sello ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_pin ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones_tamano ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_kds ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 7. RLS POLICIES (97 policies)
-- ═══════════════════════════════════════════════════════════

-- audit_log
CREATE POLICY audit_log_insert ON audit_log FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY audit_log_select ON audit_log FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());

-- categorias_menu
CREATE POLICY anon_categorias_select_public ON categorias_menu FOR SELECT TO anon USING (eliminado_en IS NULL);
CREATE POLICY categorias_delete ON categorias_menu FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY categorias_insert ON categorias_menu FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY categorias_select ON categorias_menu FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY categorias_update ON categorias_menu FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- clientes
CREATE POLICY anon_clientes_insert_restricted ON clientes FOR INSERT TO anon WITH CHECK (activo = true);
CREATE POLICY anon_clientes_select_restricted ON clientes FOR SELECT TO anon USING (eliminado_en IS NULL AND activo = true);
CREATE POLICY anon_clientes_update_restricted ON clientes FOR UPDATE TO anon USING (eliminado_en IS NULL AND activo = true);
CREATE POLICY clientes_delete ON clientes FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY clientes_insert ON clientes FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY clientes_select ON clientes FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY clientes_update ON clientes FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());

-- configuracion_sync
CREATE POLICY sync_select ON configuracion_sync FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY sync_update ON configuracion_sync FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY sync_upsert ON configuracion_sync FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());

-- cortes_caja
CREATE POLICY cortes_insert ON cortes_caja FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY cortes_select ON cortes_caja FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY cortes_update ON cortes_caja FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- eventos_sello
CREATE POLICY anon_eventos_sello_select ON eventos_sello FOR SELECT TO anon USING (true);
CREATE POLICY eventos_sello_all_authenticated ON eventos_sello FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- gastos
CREATE POLICY gastos_delete ON gastos FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY gastos_insert ON gastos FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY gastos_select ON gastos FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY gastos_update ON gastos FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND (get_mi_rol() = 'admin' OR usuario_id = (SELECT u.id FROM usuarios u WHERE u.auth_uid = (SELECT auth.uid()) LIMIT 1)));

-- historico_ordenes
CREATE POLICY historico_insert ON historico_ordenes FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY historico_select ON historico_ordenes FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());

-- intentos_pin
CREATE POLICY intentos_pin_deny_all ON intentos_pin FOR ALL TO public USING (false);

-- inventario
CREATE POLICY inventario_delete ON inventario FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY inventario_insert ON inventario FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY inventario_select ON inventario FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY inventario_update ON inventario FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- items_orden
CREATE POLICY items_orden_delete ON items_orden FOR DELETE TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY items_orden_insert ON items_orden FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY items_orden_select ON items_orden FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY items_orden_update ON items_orden FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());

-- mesas
CREATE POLICY mesas_delete ON mesas FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY mesas_insert ON mesas FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY mesas_select ON mesas FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY mesas_update ON mesas FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());

-- modificadores
CREATE POLICY modificadores_delete ON modificadores FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY modificadores_insert ON modificadores FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY modificadores_select ON modificadores FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY modificadores_update ON modificadores FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- movimientos_inventario
CREATE POLICY mov_inv_insert ON movimientos_inventario FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY mov_inv_select ON movimientos_inventario FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());

-- negocios
CREATE POLICY negocios_select ON negocios FOR SELECT TO public USING (id = get_mi_negocio_id());
CREATE POLICY negocios_update ON negocios FOR UPDATE TO public USING (id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- opciones_tamano
CREATE POLICY anon_tamanos_select_public ON opciones_tamano FOR SELECT TO anon USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = opciones_tamano.producto_id AND p.eliminado_en IS NULL AND p.disponible = true));
CREATE POLICY tamanos_delete ON opciones_tamano FOR DELETE TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = opciones_tamano.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = 'admin');
CREATE POLICY tamanos_insert ON opciones_tamano FOR INSERT TO public WITH CHECK (EXISTS(SELECT 1 FROM productos p WHERE p.id = opciones_tamano.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY tamanos_select ON opciones_tamano FOR SELECT TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = opciones_tamano.producto_id AND p.negocio_id = get_mi_negocio_id()));
CREATE POLICY tamanos_update ON opciones_tamano FOR UPDATE TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = opciones_tamano.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- ordenes
CREATE POLICY ordenes_insert ON ordenes FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY ordenes_select ON ordenes FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY ordenes_update ON ordenes FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());

-- pagos
CREATE POLICY pagos_insert ON pagos FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista','camarero']));
CREATE POLICY pagos_select ON pagos FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY pagos_update ON pagos FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- productos
CREATE POLICY anon_productos_select_public ON productos FOR SELECT TO anon USING (eliminado_en IS NULL);
CREATE POLICY productos_delete ON productos FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY productos_insert ON productos FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY productos_select ON productos FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY productos_update ON productos FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- productos_modificadores
CREATE POLICY prod_mod_delete ON productos_modificadores FOR DELETE TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = productos_modificadores.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY prod_mod_insert ON productos_modificadores FOR INSERT TO public WITH CHECK (EXISTS(SELECT 1 FROM productos p WHERE p.id = productos_modificadores.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY prod_mod_select ON productos_modificadores FOR SELECT TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = productos_modificadores.producto_id AND p.negocio_id = get_mi_negocio_id()));

-- promociones
CREATE POLICY anon_promociones_select_public ON promociones FOR SELECT TO anon USING (eliminado_en IS NULL AND activo = true);
CREATE POLICY promos_delete ON promociones FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY promos_insert ON promociones FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY promos_select ON promociones FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY promos_update ON promociones FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- push_notifications_log
CREATE POLICY push_notifications_log_all_authenticated ON push_notifications_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- push_subscriptions
CREATE POLICY push_subscriptions_all_authenticated ON push_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY push_subscriptions_insert_anon ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY push_subscriptions_select_authenticated ON push_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY push_subscriptions_update_anon ON push_subscriptions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- recetas
CREATE POLICY recetas_delete ON recetas FOR DELETE TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = recetas.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = 'admin');
CREATE POLICY recetas_insert ON recetas FOR INSERT TO public WITH CHECK (EXISTS(SELECT 1 FROM productos p WHERE p.id = recetas.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));
CREATE POLICY recetas_select ON recetas FOR SELECT TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = recetas.producto_id AND p.negocio_id = get_mi_negocio_id()));
CREATE POLICY recetas_update ON recetas FOR UPDATE TO public USING (EXISTS(SELECT 1 FROM productos p WHERE p.id = recetas.producto_id AND p.negocio_id = get_mi_negocio_id()) AND get_mi_rol() = ANY(ARRAY['admin','barista']));

-- recompensas
CREATE POLICY anon_recompensas_select ON recompensas FOR SELECT TO anon USING (activa = true);
CREATE POLICY recompensas_all_authenticated ON recompensas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tarjetas
CREATE POLICY anon_tarjetas_insert ON tarjetas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_tarjetas_select ON tarjetas FOR SELECT TO anon USING (true);
CREATE POLICY tarjetas_all_authenticated ON tarjetas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tickets_kds
CREATE POLICY tickets_insert ON tickets_kds FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id());
CREATE POLICY tickets_select ON tickets_kds FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY tickets_update ON tickets_kds FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id());

-- usuarios
CREATE POLICY usuarios_insert ON usuarios FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY usuarios_select ON usuarios FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY usuarios_update ON usuarios FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- zonas
CREATE POLICY zonas_delete ON zonas FOR DELETE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY zonas_insert ON zonas FOR INSERT TO public WITH CHECK (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');
CREATE POLICY zonas_select ON zonas FOR SELECT TO public USING (negocio_id = get_mi_negocio_id());
CREATE POLICY zonas_update ON zonas FOR UPDATE TO public USING (negocio_id = get_mi_negocio_id() AND get_mi_rol() = 'admin');

-- ═══════════════════════════════════════════════════════════
-- 8. INDEXES (90+)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_audit_accion ON audit_log USING btree (accion);
CREATE INDEX idx_audit_creado ON audit_log USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_audit_negocio ON audit_log USING btree (negocio_id);
CREATE INDEX idx_audit_tabla_registro ON audit_log USING btree (tabla, registro_id);
CREATE INDEX idx_audit_usuario ON audit_log USING btree (usuario_id);
CREATE INDEX idx_categorias_negocio ON categorias_menu USING btree (negocio_id, orden) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_clientes_auth_uid ON clientes USING btree (auth_uid) WHERE (auth_uid IS NOT NULL);
CREATE INDEX idx_clientes_gastado ON clientes USING btree (negocio_id, total_gastado DESC) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_clientes_id_referidor ON clientes USING btree (id_referidor);
CREATE INDEX idx_clientes_negocio ON clientes USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_clientes_nombre ON clientes USING btree (negocio_id, nombre) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_clientes_pin_hmac ON clientes USING btree (negocio_id, pin_hmac) WHERE (pin_hmac IS NOT NULL);
CREATE INDEX idx_clientes_telefono ON clientes USING btree (negocio_id, telefono) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_clientes_telefono_activo ON clientes USING btree (negocio_id, telefono) WHERE (activo = true);
CREATE UNIQUE INDEX configuracion_sync_negocio_id_tabla_key ON configuracion_sync USING btree (negocio_id, tabla);
CREATE INDEX idx_cortes_negocio ON cortes_caja USING btree (negocio_id, abierto_en DESC);
CREATE INDEX idx_cortes_usuario ON cortes_caja USING btree (usuario_id);
CREATE INDEX idx_eventos_cliente ON eventos_sello USING btree (cliente_id, creado_en DESC);
CREATE INDEX idx_eventos_negocio_fecha ON eventos_sello USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_eventos_tarjeta ON eventos_sello USING btree (tarjeta_id);
CREATE INDEX idx_gastos_categoria ON gastos USING btree (negocio_id, categoria);
CREATE INDEX idx_gastos_corte ON gastos USING btree (corte_caja_id);
CREATE INDEX idx_gastos_creado ON gastos USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_gastos_negocio ON gastos USING btree (negocio_id);
CREATE INDEX idx_gastos_usuario ON gastos USING btree (usuario_id);
CREATE INDEX idx_historico_negocio_fecha ON historico_ordenes USING btree (negocio_id, completada_en DESC);
CREATE INDEX idx_historico_ordenes_orden_id ON historico_ordenes USING btree (orden_id);
CREATE INDEX idx_historico_tipo_pago ON historico_ordenes USING btree (negocio_id, tipo_pago);
CREATE INDEX idx_intentos_pin_bloqueado ON intentos_pin USING btree (bloqueado_hasta) WHERE (bloqueado_hasta IS NOT NULL);
CREATE UNIQUE INDEX idx_intentos_pin_ip ON intentos_pin USING btree (ip);
CREATE INDEX idx_inventario_negocio ON inventario USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_inventario_nombre ON inventario USING btree (negocio_id, nombre) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_inventario_stock_bajo ON inventario USING btree (negocio_id) WHERE ((eliminado_en IS NULL) AND (stock_actual <= stock_minimo) AND (activo = true));
CREATE INDEX idx_items_orden_creado ON items_orden USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_items_orden_negocio ON items_orden USING btree (negocio_id);
CREATE INDEX idx_items_orden_orden ON items_orden USING btree (orden_id);
CREATE INDEX idx_items_orden_producto ON items_orden USING btree (producto_id);
CREATE INDEX idx_mesas_estado ON mesas USING btree (negocio_id, estado) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_mesas_negocio ON mesas USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_mesas_orden_actual_id ON mesas USING btree (orden_actual_id);
CREATE INDEX idx_mesas_zona ON mesas USING btree (zona_id) WHERE (eliminado_en IS NULL);
CREATE UNIQUE INDEX mesas_negocio_numero_active_unique ON mesas USING btree (negocio_id, numero) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_modificadores_negocio ON modificadores USING btree (negocio_id, orden);
CREATE INDEX idx_mov_inv_fecha ON movimientos_inventario USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_mov_inv_inventario ON movimientos_inventario USING btree (inventario_id);
CREATE INDEX idx_mov_inv_negocio ON movimientos_inventario USING btree (negocio_id);
CREATE INDEX idx_mov_inv_orden ON movimientos_inventario USING btree (orden_id) WHERE (orden_id IS NOT NULL);
CREATE INDEX idx_mov_inv_tipo ON movimientos_inventario USING btree (negocio_id, tipo);
CREATE INDEX idx_movimientos_inventario_usuario_id ON movimientos_inventario USING btree (usuario_id);
CREATE INDEX idx_opciones_tamano_producto_id ON opciones_tamano USING btree (producto_id);
CREATE INDEX idx_ordenes_cliente_id ON ordenes USING btree (cliente_id) WHERE (cliente_id IS NOT NULL);
CREATE INDEX idx_ordenes_estado ON ordenes USING btree (negocio_id, estado) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_ordenes_fecha ON ordenes USING btree (negocio_id, creado_en DESC) WHERE (eliminado_en IS NULL);
CREATE UNIQUE INDEX idx_ordenes_folio ON ordenes USING btree (negocio_id, folio);
CREATE INDEX idx_ordenes_mesa ON ordenes USING btree (mesa_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_ordenes_negocio ON ordenes USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_ordenes_negocio_folio ON ordenes USING btree (negocio_id, folio DESC);
CREATE INDEX idx_ordenes_usuario_id ON ordenes USING btree (usuario_id);
CREATE INDEX idx_pagos_negocio_fecha ON pagos USING btree (negocio_id, creado_en DESC);
CREATE INDEX idx_pagos_orden ON pagos USING btree (orden_id);
CREATE INDEX idx_pagos_propina ON pagos USING btree (negocio_id, creado_en DESC) WHERE (propina > 0::numeric);
CREATE INDEX idx_pagos_usuario_id ON pagos USING btree (usuario_id);
CREATE INDEX idx_productos_categoria ON productos USING btree (categoria_id, orden) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_productos_disponible ON productos USING btree (negocio_id, disponible) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_productos_negocio ON productos USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE INDEX idx_prod_mod_modificador ON productos_modificadores USING btree (modificador_id);
CREATE INDEX idx_prod_mod_producto ON productos_modificadores USING btree (producto_id);
CREATE INDEX idx_promos_negocio ON promociones USING btree (negocio_id) WHERE ((eliminado_en IS NULL) AND (activo = true));
CREATE INDEX idx_push_notifications_log_cliente_id ON push_notifications_log USING btree (cliente_id);
CREATE INDEX idx_push_notifications_log_created ON push_notifications_log USING btree (created_at DESC);
CREATE INDEX idx_push_notifications_log_enviado_por ON push_notifications_log USING btree (enviado_por);
CREATE INDEX idx_push_notifications_log_tipo ON push_notifications_log USING btree (tipo);
CREATE INDEX idx_push_subscriptions_activa ON push_subscriptions USING btree (activa) WHERE (activa = true);
CREATE INDEX idx_push_subscriptions_cliente_id ON push_subscriptions USING btree (cliente_id);
CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON push_subscriptions USING btree (endpoint);
CREATE INDEX idx_recetas_inventario ON recetas USING btree (inventario_id);
CREATE INDEX idx_recetas_producto ON recetas USING btree (producto_id);
CREATE UNIQUE INDEX recetas_producto_id_inventario_id_key ON recetas USING btree (producto_id, inventario_id);
CREATE UNIQUE INDEX idx_recompensas_default_unico ON recompensas USING btree (negocio_id) WHERE (es_default = true);
CREATE INDEX idx_recompensas_negocio ON recompensas USING btree (negocio_id) WHERE (activa = true);
CREATE INDEX idx_tarjetas_cliente_activa ON tarjetas USING btree (cliente_id) WHERE (estado = 'activa');
CREATE INDEX idx_tarjetas_estado ON tarjetas USING btree (negocio_id, estado);
CREATE INDEX idx_tarjetas_negocio ON tarjetas USING btree (negocio_id);
CREATE INDEX idx_tarjetas_recompensa_id ON tarjetas USING btree (recompensa_id);
CREATE INDEX idx_tickets_estado ON tickets_kds USING btree (negocio_id, estado);
CREATE INDEX idx_tickets_orden ON tickets_kds USING btree (orden_id);
CREATE INDEX idx_usuarios_auth ON usuarios USING btree (auth_uid);
CREATE INDEX idx_usuarios_negocio ON usuarios USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE UNIQUE INDEX usuarios_auth_uid_key ON usuarios USING btree (auth_uid);
CREATE INDEX idx_zonas_negocio ON zonas USING btree (negocio_id) WHERE (eliminado_en IS NULL);
CREATE UNIQUE INDEX zonas_negocio_id_nombre_key ON zonas USING btree (negocio_id, nombre);

-- ═══════════════════════════════════════════════════════════
-- 9. GRANTS
-- ═══════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE ON push_subscriptions TO anon;
GRANT INSERT ON push_notifications_log TO anon;
GRANT INSERT ON clientes TO anon;
GRANT UPDATE ON clientes TO anon;
GRANT INSERT ON tarjetas TO anon;
GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO service_role, anon;
GRANT EXECUTE ON FUNCTION hash_pin(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION agregar_sello_a_tarjeta(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION deshacer_sello(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION canjear_tarjeta(UUID, UUID, UUID) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 10. VIEW
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW vista_productos_margen WITH (security_invoker = true) AS
SELECT p.id, p.nombre, p.precio_base, costo_producto(p.id) AS costo,
  p.precio_base - costo_producto(p.id) AS margen
FROM productos p WHERE p.eliminado_en IS NULL;

-- ═══════════════════════════════════════════════════════════
-- 11. STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/webp','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY logos_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

-- ═══════════════════════════════════════════════════════════
-- 12. REALTIME (15 tables)
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE clientes, cortes_caja, eventos_sello, inventario, items_orden, mesas, movimientos_inventario, ordenes, pagos, productos, recetas, recompensas, tarjetas, tickets_kds, usuarios;

-- ═══════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
-- ═══════════════════════════════════════════════════════════
