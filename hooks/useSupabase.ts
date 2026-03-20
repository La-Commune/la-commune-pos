"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import type { Database, Negocio } from "@/types/database";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  MOCK_ORDENES,
  MOCK_TICKETS_KDS,
  MOCK_INVENTARIO,
  MOCK_MOVIMIENTOS,
  MOCK_RECETAS,
  type MockCategoria,
  type MockProducto,
  type MockOrden,
  type MockTicketKDS,
  type MockInventario,
  type MockMovimientoInventario,
  type MockReceta,
} from "@/lib/mock-data";

// ── Tipos auxiliares ──
type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

// ── Generic hook for Supabase queries with mock fallback ──
function useQuery<T>(
  table: TableName,
  mockData: T[],
  options?: {
    select?: string;
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
  },
) {
  const [data, setData] = useState<T[]>(USE_MOCK ? mockData : []);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState<string | null>(null);
  const filtersKey = JSON.stringify(options?.filters);

  // Escuchar el estado de autenticación del store
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    if (USE_MOCK || !supabase) {
      setData(mockData);
      setLoading(false);
      return;
    }

    // No hacer queries hasta que el usuario esté autenticado
    if (!isAuthenticated) {
      setData(mockData);
      setLoading(false);
      return;
    }

    // Solo mostrar loading en la carga inicial, no en refetch
    if (!hasFetched.current) {
      setLoading(true);
    }
    setError(null);

    try {
      let query = supabase.from(table).select(options?.select ?? "*");

      // Filtrar registros no eliminados (soft delete) — solo en tablas que tienen ese campo
      const tablasConSoftDelete: TableName[] = [
        "negocios", "usuarios", "categorias_menu", "productos",
        "mesas", "ordenes", "promociones", "zonas",
      ];
      if (tablasConSoftDelete.includes(table)) {
        query = query.is("eliminado_en", null);
      }

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value as string);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      const { data: result, error: err } = await query;

      if (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Supabase] Error en ${table}:`, err.message);
        }
        // Fallback a mock data si hay error de permisos
        if (err.message.includes("permission denied") || err.code === "42501") {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[Supabase] Fallback a mock data para ${table}`);
          }
          setData(mockData);
        }
        setError(err.message);
      } else {
        hasFetched.current = true;
        setData((result ?? []) as T[]);
      }
    } catch {
      setError("Error de conexión");
      setData(mockData); // fallback
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    table,
    USE_MOCK,
    isAuthenticated,
    options?.select,
    options?.orderBy?.column,
    filtersKey,
  ]);

  // Disparar fetch cuando cambia la autenticación o los filtros
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── Specific hooks ──

export function useCategorias() {
  return useQuery<MockCategoria>("categorias_menu", MOCK_CATEGORIAS, {
    orderBy: { column: "orden", ascending: true },
  });
}

export function useProductos(categoriaId?: string) {
  const filters = categoriaId ? { categoria_id: categoriaId } : undefined;
  return useQuery<MockProducto>("productos", MOCK_PRODUCTOS, {
    filters,
    orderBy: { column: "orden", ascending: true },
  });
}

export function useOrdenes(estado?: string) {
  const filters = estado ? { estado } : undefined;
  return useQuery<MockOrden>("ordenes", MOCK_ORDENES, {
    select: "*, mesas:mesa_id(numero)",
    filters,
    orderBy: { column: "creado_en", ascending: false },
  });
}

export function useMesas() {
  return useQuery("mesas", [], {
    orderBy: { column: "numero", ascending: true },
  });
}

export function useZonas() {
  return useQuery("zonas", [], {
    orderBy: { column: "orden", ascending: true },
  });
}

export function useTicketsKDS() {
  return useQuery<MockTicketKDS>("tickets_kds", MOCK_TICKETS_KDS, {
    select: "*, ordenes:orden_id(folio, origen, estado, mesa_id, mesas:mesa_id(numero))",
    orderBy: { column: "creado_en", ascending: true },
  });
}

export function useUsuarios() {
  return useQuery("usuarios", [], {
    orderBy: { column: "creado_en", ascending: false },
  });
}

export function useClientes() {
  return useQuery("clientes", [], {
    orderBy: { column: "puntos", ascending: false },
  });
}

export function useInventario() {
  return useQuery<MockInventario>("inventario", MOCK_INVENTARIO, {
    orderBy: { column: "nombre", ascending: true },
  });
}

export function useMovimientosInventario(inventarioId?: string) {
  const filters = inventarioId ? { inventario_id: inventarioId } : undefined;
  return useQuery<MockMovimientoInventario>("movimientos_inventario", MOCK_MOVIMIENTOS, {
    filters,
    orderBy: { column: "creado_en", ascending: false },
  });
}

export function useRecetas(productoId?: string) {
  const filters = productoId ? { producto_id: productoId } : undefined;
  return useQuery<MockReceta>("recetas", MOCK_RECETAS, {
    filters,
  });
}

// ── Negocio (nombre del negocio para sidebar, etc.) ──

interface NegocioInfo {
  id: string;
  nombre: string;
  logo_url: string | null;
  slogan: string | null;
  color_primario: string | null;
}

const MOCK_NEGOCIO: NegocioInfo = { id: "dev-negocio-1", nombre: "La Commune", logo_url: null, slogan: null, color_primario: null };

export function useNegocio() {
  const [negocio, setNegocio] = useState<NegocioInfo>(MOCK_NEGOCIO);
  const [refreshKey, setRefreshKey] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const negocioId = useAuthStore((s) => s.user?.negocio_id);

  useEffect(() => {
    if (USE_MOCK || !supabase || !isAuthenticated || !negocioId) return;

    supabase
      .from("negocios")
      .select("id, nombre, logo_url, slogan, color_primario")
      .eq("id", negocioId)
      .single<NegocioInfo>()
      .then(({ data }) => {
        if (data) setNegocio(data);
      });
  }, [isAuthenticated, negocioId, refreshKey]);

  // Escuchar evento custom para refrescar cuando configuración guarda cambios
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("negocio-updated", handler);
    return () => window.removeEventListener("negocio-updated", handler);
  }, []);

  return negocio;
}

// ── Negocio completo (para página de configuración) ──

export function useNegocioCompleto() {
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const negocioId = useAuthStore((s) => s.user?.negocio_id);

  const fetchNegocio = useCallback(async () => {
    if (USE_MOCK || !supabase || !negocioId) {
      setNegocio({
        id: "dev-negocio-1",
        nombre: "La Commune",
        direccion: "Mineral de la Reforma, Hidalgo",
        telefono: null,
        rfc: null,
        divisa: "MXN",
        zona_horaria: "America/Mexico_City",
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        eliminado_en: null,
        logo_url: null,
        color_primario: "#C49A3C",
        slogan: null,
        email: null,
        sitio_web: null,
        whatsapp: null,
        redes_sociales: {},
        razon_social: null,
        regimen_fiscal: null,
        codigo_postal_fiscal: null,
        footer_ticket: "¡Gracias por tu visita!",
        horario: {},
        propina_sugerida: [10, 15, 20],
        iva_incluido: true,
      } as Negocio);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase
      .from("negocios")
      .select("*")
      .eq("id", negocioId)
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setNegocio(data as Negocio);
    }
    setLoading(false);
  }, [negocioId]);

  useEffect(() => {
    if (isAuthenticated || USE_MOCK) fetchNegocio();
  }, [isAuthenticated, fetchNegocio]);

  const updateNegocio = useCallback(
    async (updates: Partial<Negocio>) => {
      if (USE_MOCK || !supabase || !negocioId) {
        setNegocio((prev) => prev ? { ...prev, ...updates } as Negocio : prev);
        return { success: true };
      }

      const { error: err } = await supabase
        .from("negocios")
        .update(updates as never)
        .eq("id", negocioId);

      if (err) return { success: false, error: err.message };

      setNegocio((prev) => prev ? { ...prev, ...updates } as Negocio : prev);
      return { success: true };
    },
    [negocioId]
  );

  return { negocio, loading, error, updateNegocio, refetch: fetchNegocio };
}

// ── Mutation helpers ──

export async function insertRecord(
  table: TableName,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "development") console.log(`[MOCK] Insert into ${table}:`, data);
    return { success: true };
  }

  // @ts-expect-error — tipo exacto de insert data se resolverá con `supabase gen types`
  const { error } = await supabase!.from(table).insert(data);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Insert que retorna el registro insertado (para obtener id, folio, etc.) */
export async function insertRecordReturning<T = Record<string, unknown>>(
  table: TableName,
  data: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "development") console.log(`[MOCK] Insert+returning into ${table}:`, data);
    const mockRow = { ...data, id: `mock-${Date.now()}` } as T;
    return { success: true, data: mockRow };
  }

  // @ts-expect-error — tipo exacto se resolverá con `supabase gen types`
  const { data: result, error } = await supabase!.from(table).insert(data).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: result as T };
}

export async function updateRecord(
  table: TableName,
  id: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "development") console.log(`[MOCK] Update ${table} (${id}):`, data);
    return { success: true };
  }

  const { error } = await supabase!.from(table).update(data as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteRecord(
  table: TableName,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    if (process.env.NODE_ENV === "development") console.log(`[MOCK] Delete from ${table}: ${id}`);
    return { success: true };
  }

  // Soft delete
  const { error } = await supabase!
    .from(table)
    .update({ eliminado_en: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Offline-aware mutation wrapper ──
export async function offlineAwareMutation(
  action: () => Promise<{ success: boolean; error?: string }>,
  offlineAction?: { type: string; payload: Record<string, unknown> },
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    return action();
  }

  if (!navigator.onLine && offlineAction) {
    // Queue for later sync
    try {
      const { enqueueAction } = await import("@/lib/offline-queue");
      await enqueueAction(
        offlineAction.type as import("@/lib/offline-queue").OfflineActionType,
        offlineAction.payload,
      );
      return { success: true };
    } catch {
      return { success: false, error: "No se pudo guardar para sync offline" };
    }
  }

  return action();
}

// ── Realtime subscription helper ──

interface RealtimePayload {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export function subscribeToTable(
  table: string,
  callback: (payload: RealtimePayload) => void,
) {
  if (USE_MOCK) return { unsubscribe: () => {} };

  const channel = supabase!
    .channel(`${table}-changes`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
        callback({
          eventType: payload.eventType,
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        }),
    )
    .subscribe();

  return {
    unsubscribe: () => supabase!.removeChannel(channel),
  };
}
