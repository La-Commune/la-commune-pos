-- ============================================================
-- A3: Fix search_path en funciones SECURITY DEFINER
-- Fecha: 2026-03-19
-- ============================================================
-- Problema: 7 funciones SECURITY DEFINER no tenían search_path fijo.
-- Se ejecutan como postgres (superuser) pero usaban el search_path
-- del usuario que las llama → vulnerable a schema injection.
--
-- Ataque: un usuario crea un schema con tablas/funciones homónimas,
-- manipula su search_path, y la función SECURITY DEFINER resuelve
-- objetos del schema malicioso con permisos de superusuario.
--
-- Solución: SET search_path = public fuerza a la función a resolver
-- siempre contra el schema public, ignorando el search_path del caller.
-- ============================================================

-- Funciones helper (RLS)
ALTER FUNCTION get_mi_negocio_id() SET search_path = public;
ALTER FUNCTION get_mi_rol() SET search_path = public;

-- Funciones de fidelidad (sellos, tarjetas)
ALTER FUNCTION agregar_sello_a_tarjeta(uuid, uuid, text, text, text, text) SET search_path = public;
ALTER FUNCTION _otorgar_bono_referido(uuid) SET search_path = public;
ALTER FUNCTION deshacer_sello(uuid, uuid) SET search_path = public;
ALTER FUNCTION canjear_tarjeta(uuid, uuid, uuid) SET search_path = public;

-- Función de mesas
ALTER FUNCTION swap_mesa_numeros(uuid, integer, uuid, integer) SET search_path = public;

-- Ya tenían search_path (no necesitan cambio):
-- login_por_pin(text, text) — ya tenía SET search_path = public
-- limpiar_intentos_pin_viejos() — ya tenía SET search_path = public

-- Verificar que todas las SECURITY DEFINER tienen search_path:
-- SELECT proname, proconfig FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.prosecdef = true
-- ORDER BY proname;
