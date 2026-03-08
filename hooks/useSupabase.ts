"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import type { Database } from "@/types/database";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  MOCK_ORDENES,
  MOCK_TICKETS_KDS,
  type MockCategoria,
  type MockProducto,
  type MockOrden,
  type MockTicketKDS,
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

    setLoading(true);
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
        console.warn(`[Supabase] Error en ${table}:`, err.message);
        // Fallback a mock data si hay error de permisos
        if (err.message.includes("permission denied") || err.code === "42501") {
          console.warn(`[Supabase] Fallback a mock data para ${table}`);
          setData(mockData);
        }
        setError(err.message);
      } else {
        hasFetched.current = true;
        setData(result ?? []);
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
    orderBy: { column: "creado_en", ascending: true },
  });
}

// ── Negocio (nombre del negocio para sidebar, etc.) ──

interface NegocioInfo {
  id: string;
  nombre: string;
}

const MOCK_NEGOCIO: NegocioInfo = { id: "dev-negocio-1", nombre: "La Commune" };

export function useNegocio() {
  const [negocio, setNegocio] = useState<NegocioInfo>(MOCK_NEGOCIO);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const negocioId = useAuthStore((s) => s.user?.negocio_id);

  useEffect(() => {
    if (USE_MOCK || !supabase || !isAuthenticated || !negocioId) return;

    supabase
      .from("negocios")
      .select("id, nombre")
      .eq("id", negocioId)
      .single<NegocioInfo>()
      .then(({ data }) => {
        if (data) setNegocio(data);
      });
  }, [isAuthenticated, negocioId]);

  return negocio;
}

// ── Mutation helpers ──

export async function insertRecord(
  table: TableName,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Insert into ${table}:`, data);
    return { success: true };
  }

  // @ts-expect-error — tipo exacto de insert data se resolverá con `supabase gen types`
  const { error } = await supabase!.from(table).insert(data);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateRecord(
  table: TableName,
  id: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Update ${table} (${id}):`, data);
    return { success: true };
  }

  // @ts-expect-error — tipo exacto de update data se resolverá con `supabase gen types`
  const { error } = await supabase!.from(table).update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteRecord(
  table: TableName,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Delete from ${table}: ${id}`);
    return { success: true };
  }

  // Soft delete
  const { error } = await supabase!
    .from(table)
    // @ts-expect-error — tipo exacto de update data se resolverá con `supabase gen types`
    .update({ eliminado_en: new Date().toISOString() })
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
