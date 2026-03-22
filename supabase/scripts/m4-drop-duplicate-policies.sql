-- =============================================================
-- M4: Eliminar políticas RLS duplicadas/redundantes
-- Fecha: 19-Mar-2026
-- =============================================================
-- Problema: Tres tablas de fidelidad (eventos_sello, recompensas, tarjetas)
-- tenían políticas SELECT con rol "public" que eran redundantes porque ya
-- existían políticas ALL para "authenticated" y SELECT para "anon".
--
-- En PostgreSQL, las políticas PERMISSIVE se combinan con OR.
-- Esto causaba:
--   - Evaluación innecesaria (rendimiento)
--   - Confusión al auditar permisos
--   - En recompensas: la policy public con USING(true) anulaba el filtro
--     activa=true de la policy anon, exponiendo recompensas inactivas
--
-- Políticas eliminadas:
--   1. eventos_sello_select_anon  (public, SELECT, true) — redundante
--   2. recompensas_select_anon    (public, SELECT, true) — anulaba filtro
--   3. tarjetas_select_anon       (public, SELECT, true) — redundante
--
-- Políticas que permanecen:
--   eventos_sello:  ALL authenticated + SELECT anon
--   recompensas:    ALL authenticated + SELECT anon (activa=true)
--   tarjetas:       ALL authenticated + SELECT anon + INSERT anon
-- =============================================================

DROP POLICY IF EXISTS eventos_sello_select_anon ON eventos_sello;
DROP POLICY IF EXISTS recompensas_select_anon ON recompensas;
DROP POLICY IF EXISTS tarjetas_select_anon ON tarjetas;
