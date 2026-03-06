"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, USE_MOCK } from "@/lib/supabase";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  MOCK_ORDENES,
  MOCK_MESAS,
  MOCK_TICKETS_KDS,
  type Categoria,
  type Producto,
  type OrdenMock,
  type TicketKDS,
} from "@/lib/mock-data";

// ── Generic hook for Supabase queries with mock fallback ──
function useQuery<T>(
  table: string,
  mockData: T[],
  options?: {
    select?: string;
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const [data, setData] = useState<T[]>(mockData);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (USE_MOCK) {
      setData(mockData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase!.from(table as any).select(options?.select ?? "*");

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value as string) as any;
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        }) as any;
      }

      const { data: result, error: err } = await query;

      if (err) {
        setError(err.message);
        setData(mockData); // fallback to mock
      } else {
        setData((result as T[]) ?? mockData);
      }
    } catch {
      setError("Error de conexión");
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [table, mockData, options?.select, options?.orderBy?.column]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Specific hooks ──

export function useCategorias() {
  return useQuery<Categoria>("categorias", MOCK_CATEGORIAS, {
    orderBy: { column: "orden", ascending: true },
  });
}

export function useProductos(categoriaId?: string) {
  const filters = categoriaId ? { categoria_id: categoriaId } : undefined;
  return useQuery<Producto>("productos", MOCK_PRODUCTOS, {
    filters,
    orderBy: { column: "orden", ascending: true },
  });
}

export function useOrdenes(estado?: string) {
  const filters = estado ? { estado } : undefined;
  return useQuery<OrdenMock>("ordenes", MOCK_ORDENES, {
    filters,
    orderBy: { column: "creado_en", ascending: false },
  });
}

export function useMesas() {
  return useQuery("mesas", MOCK_MESAS, {
    orderBy: { column: "numero", ascending: true },
  });
}

export function useTicketsKDS() {
  return useQuery<TicketKDS>("tickets_kds", MOCK_TICKETS_KDS, {
    orderBy: { column: "creado_en", ascending: true },
  });
}

// ── Mutation helpers ──

export async function insertRecord<T extends Record<string, unknown>>(
  table: string,
  data: T
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Insert into ${table}:`, data);
    return { success: true };
  }

  const { error } = await supabase!.from(table as any).insert(data as any);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateRecord<T extends Record<string, unknown>>(
  table: string,
  id: string,
  data: T
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Update ${table} (${id}):`, data);
    return { success: true };
  }

  // @ts-expect-error — tipos placeholder, se resolverá con `supabase gen types`
  const { error } = await supabase!.from(table).update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteRecord(
  table: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK) {
    console.log(`[MOCK] Delete from ${table}: ${id}`);
    return { success: true };
  }

  // Soft delete
  // @ts-expect-error — tipos placeholder, se resolverá con `supabase gen types`
  const { error } = await supabase!.from(table).update({ eliminado_en: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Realtime subscription helper ──

export function subscribeToTable(
  table: string,
  callback: (payload: { eventType: string; new: unknown; old: unknown }) => void
) {
  if (USE_MOCK) return { unsubscribe: () => {} };

  const channel = supabase!
    .channel(`${table}-changes`)
    .on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table },
      (payload: any) => callback(payload)
    )
    .subscribe();

  return {
    unsubscribe: () => supabase!.removeChannel(channel),
  };
}
