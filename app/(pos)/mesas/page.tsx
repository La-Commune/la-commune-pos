"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Loader2,
  LayoutGrid,
  Map,
  Settings2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMesas, useZonas, insertRecord, updateRecord, deleteRecord } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesasStore } from "@/store/mesas.store";
import { useZonasStore } from "@/store/zonas.store";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MesaTimer, { getMins, getLevel, UMBRAL_WARN } from "@/components/mesas/MesaTimer";
import FloorPlanCanvas from "@/components/mesas/FloorPlanCanvas";
import ZonaManager from "@/components/mesas/ZonaManager";
import MesaFormModal from "@/components/mesas/MesaFormModal";
import MesaContextMenu from "@/components/mesas/MesaContextMenu";
import { showToast } from "@/components/ui/Toast";
import type { Mesa, Zona } from "@/types/database";

type Vista = "grid" | "plano";
type EstadoMesaKey = keyof typeof ESTADO_MESA_CONFIG;

function MesasPageContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === "admin";

  // ── Data fetching ──
  const { data: mesasData, loading, error, refetch: refetchMesas } = useMesas();
  const { data: zonasData, refetch: refetchZonas } = useZonas();

  // ── Stores ──
  const { mesas, setMesas } = useMesasStore();
  const { zonas, setZonas, selectedZonaId, selectZona } = useZonasStore();

  // ── Local state ──
  const [vista, setVista] = useState<Vista>("grid");
  const [zonaManagerOpen, setZonaManagerOpen] = useState(false);
  const [mesaFormOpen, setMesaFormOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [confirmFreeMesaId, setConfirmFreeMesaId] = useState<string | null>(null);
  const [confirmFreeMesaNum, setConfirmFreeMesaNum] = useState<number | null>(null);
  const [confirmDeleteMesa, setConfirmDeleteMesa] = useState<Mesa | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mesa: Mesa;
    position: { x: number; y: number };
  } | null>(null);

  // Long-press support
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMesaRef = useRef<Mesa | null>(null);

  // ── Sync fetched data → stores ──
  useEffect(() => {
    if (mesasData?.length) setMesas(mesasData);
  }, [mesasData, setMesas]);

  useEffect(() => {
    if (zonasData?.length) setZonas(zonasData);
  }, [zonasData, setZonas]);

  // ── Derived ──
  const filteredMesas =
    selectedZonaId === null
      ? mesas
      : mesas.filter((m) => m.zona_id === selectedZonaId);

  const currentZona = zonas.find((z) => z.id === selectedZonaId) ?? null;

  // Mesas estancadas (>60min ocupadas/reservadas) en las mesas filtradas
  const staleMesas = filteredMesas.filter(
    (m) =>
      m.ocupada_desde &&
      (m.estado === "ocupada" || m.estado === "reservada") &&
      getLevel(getMins(m.ocupada_desde)) === "err"
  );

  // ── Click handler: siempre navega a órdenes ──
  const handleClickMesa = useCallback(
    (mesa: Mesa) => {
      if (mesa.estado === "ocupada") {
        setConfirmFreeMesaId(mesa.id ?? null);
        setConfirmFreeMesaNum(mesa.numero);
      } else {
        router.push(`/ordenes?mesa=${mesa.numero}`);
      }
    },
    [router]
  );

  const handleConfirmFreeMesa = () => {
    if (confirmFreeMesaNum) {
      router.push(`/ordenes?mesa=${confirmFreeMesaNum}`);
    }
    setConfirmFreeMesaId(null);
    setConfirmFreeMesaNum(null);
  };

  // ── Context menu (right-click / long-press) — admin only ──
  const handleContextMenu = useCallback(
    (mesa: Mesa, x: number, y: number) => {
      if (!isAdmin) return;
      setContextMenu({ mesa, position: { x, y } });
    },
    [isAdmin]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent, mesa: Mesa) => {
      if (!isAdmin) return;
      e.preventDefault();
      e.stopPropagation();
      handleContextMenu(mesa, e.clientX, e.clientY);
    },
    [isAdmin, handleContextMenu]
  );

  // Long-press: start timer on touch, cancel on move/end
  const handleTouchStart = useCallback(
    (mesa: Mesa, e: React.TouchEvent) => {
      if (!isAdmin) return;
      longPressMesaRef.current = mesa;
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      longPressTimerRef.current = setTimeout(() => {
        handleContextMenu(mesa, x, y);
        longPressMesaRef.current = null;
      }, 500);
    },
    [isAdmin, handleContextMenu]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ── Edit / Add mesa ──
  const handleEditMesa = useCallback((mesa: Mesa) => {
    setEditingMesa(mesa);
    setMesaFormOpen(true);
  }, []);

  const handleAddMesa = useCallback(() => {
    setEditingMesa(null);
    setMesaFormOpen(true);
  }, []);

  // ── Go to orders from context menu ──
  const handleGoToOrders = useCallback(
    (mesa: Mesa) => {
      router.push(`/ordenes?mesa=${mesa.numero}`);
    },
    [router]
  );

  // ── Liberar mesa manualmente (context menu) ──
  const handleFreeMesa = useCallback(
    async (mesa: Mesa) => {
      if (!mesa.id) return;
      // Optimistic update
      useMesasStore.getState().updateMesa(mesa.id, {
        estado: "disponible",
        orden_actual_id: null,
        ocupada_desde: null,
      });
      const { success, error: err } = await updateRecord("mesas", mesa.id, {
        estado: "disponible",
        orden_actual_id: null,
        ocupada_desde: null,
      });
      if (success) {
        showToast(`Mesa ${mesa.numero} liberada`, "success");
      } else {
        console.warn("[Mesas] Error liberando mesa:", err);
        showToast("Error liberando mesa", "error");
        refetchMesas();
      }
    },
    [refetchMesas]
  );

  // ── Mover mesa (drag & drop) → optimistic + persist ──
  const handleMoveMesa = useCallback(
    async (mesaId: string, pos_x: number, pos_y: number) => {
      useMesasStore.getState().updateMesa(mesaId, { pos_x, pos_y });
      const { success, error: err } = await updateRecord("mesas", mesaId, { pos_x, pos_y });
      if (!success) {
        console.warn("[Mesas] Error guardando posición:", err);
        showToast("Error guardando posición", "error");
      }
    },
    []
  );

  // ── Resize mesa → optimistic + debounced persist ──
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleResizeMesa = useCallback(
    (mesaId: string, ancho: number, alto: number) => {
      // Optimistic instant
      useMesasStore.getState().updateMesa(mesaId, { ancho, alto });
      // Debounce persist (resize fires many events)
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(async () => {
        const { success, error: err } = await updateRecord("mesas", mesaId, { ancho, alto });
        if (!success) {
          console.warn("[Mesas] Error guardando tamaño:", err);
        }
      }, 300);
    },
    []
  );

  // ── Rotate mesa → optimistic + debounced persist ──
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRotateMesa = useCallback(
    (mesaId: string, rotacion: number) => {
      useMesasStore.getState().updateMesa(mesaId, { rotacion });
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = setTimeout(async () => {
        const { success, error: err } = await updateRecord("mesas", mesaId, { rotacion });
        if (!success) {
          console.warn("[Mesas] Error guardando rotación:", err);
        }
      }, 300);
    },
    []
  );

  // ── Guardar mesa (crear o editar) ──
  const handleSaveMesa = useCallback(
    async (mesa: Partial<Mesa>): Promise<boolean> => {
      const negocioId = user?.negocio_id ?? "";

      if (editingMesa?.id) {
        const updates = {
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          zona_id: mesa.zona_id,
          forma: mesa.forma as 'cuadrada' | 'redonda' | undefined,
          pos_x: mesa.pos_x,
          pos_y: mesa.pos_y,
          ancho: mesa.ancho ?? undefined,
          alto: mesa.alto ?? undefined,
          rotacion: mesa.rotacion ?? undefined,
        };
        useMesasStore.getState().updateMesa(editingMesa.id, updates);
        const { success, error: err } = await updateRecord("mesas", editingMesa.id, updates);
        if (!success) {
          showToast(`Error actualizando mesa: ${err}`, "error");
          return false;
        }
        return true;
      } else {
        const newMesa = {
          negocio_id: negocioId,
          numero: mesa.numero ?? 0,
          capacidad: mesa.capacidad ?? 4,
          estado: "disponible" as const,
          zona_id: mesa.zona_id ?? selectedZonaId,
          pos_x: mesa.pos_x ?? 80,
          pos_y: mesa.pos_y ?? 80,
          forma: (mesa.forma as 'cuadrada' | 'redonda') ?? "cuadrada",
          ancho: mesa.ancho ?? 80,
          alto: mesa.alto ?? 80,
          rotacion: mesa.rotacion ?? 0,
        };
        const { success, error: err } = await insertRecord("mesas", newMesa);
        if (!success) {
          showToast(`Error creando mesa: ${err}`, "error");
          return false;
        }
        refetchMesas();
        return true;
      }
    },
    [editingMesa, user?.negocio_id, selectedZonaId, refetchMesas]
  );

  // ── Duplicar mesa ──
  const handleDuplicateMesa = useCallback(
    async (mesa: Mesa) => {
      const negocioId = user?.negocio_id ?? "";
      // Encontrar el próximo número disponible
      const maxNum = Math.max(0, ...mesas.map((m) => m.numero));
      const newMesa = {
        negocio_id: negocioId,
        numero: maxNum + 1,
        capacidad: mesa.capacidad,
        estado: "disponible" as const,
        zona_id: mesa.zona_id,
        pos_x: (mesa.pos_x ?? 80) + 30,
        pos_y: (mesa.pos_y ?? 80) + 30,
        forma: mesa.forma ?? "cuadrada",
        ancho: mesa.ancho ?? 80,
        alto: mesa.alto ?? 80,
        rotacion: mesa.rotacion ?? 0,
      };
      const { success, error: err } = await insertRecord("mesas", newMesa);
      if (!success) {
        showToast(`Error duplicando mesa: ${err}`, "error");
        return;
      }
      showToast(`Mesa ${newMesa.numero} creada (copia de mesa ${mesa.numero})`, "success");
      refetchMesas();
    },
    [user?.negocio_id, mesas, refetchMesas]
  );

  // ── Swap números de mesa (RPC atómico) ──
  const handleSwapMesas = useCallback(
    async (mesaAId: string, numA: number, mesaBId: string, numB: number): Promise<boolean> => {
      // Optimistic: actualizar store inmediatamente
      useMesasStore.getState().updateMesa(mesaAId, { numero: numA });
      useMesasStore.getState().updateMesa(mesaBId, { numero: numB });

      // Llamar RPC
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) {
        showToast("Supabase no configurado", "error");
        return false;
      }

      const { error: err } = await (supabase!.rpc as any)("swap_mesa_numeros", {
        mesa_a_id: mesaAId,
        nuevo_numero_a: numA,
        mesa_b_id: mesaBId,
        nuevo_numero_b: numB,
      });

      if (err) {
        showToast(`Error intercambiando: ${err.message}`, "error");
        refetchMesas(); // revertir
        return false;
      }

      refetchMesas();
      return true;
    },
    [refetchMesas]
  );

  // ── Eliminar mesa (soft delete) con confirmación ──
  const handleRequestDeleteMesa = useCallback((mesa: Mesa) => {
    setConfirmDeleteMesa(mesa);
  }, []);

  const handleConfirmDeleteMesa = useCallback(async () => {
    if (!confirmDeleteMesa?.id) return;
    useMesasStore.getState().removeMesa(confirmDeleteMesa.id);
    const { success, error: err } = await deleteRecord("mesas", confirmDeleteMesa.id);
    if (!success) {
      showToast(`Error eliminando mesa: ${err}`, "error");
      refetchMesas();
    } else {
      showToast(`Mesa ${confirmDeleteMesa.numero} eliminada`, "success");
    }
    setConfirmDeleteMesa(null);
  }, [confirmDeleteMesa, refetchMesas]);

  // ── Eliminar mesa directa (from MesaFormModal) ──
  const handleDeleteMesa = useCallback(
    async (id: string): Promise<boolean> => {
      useMesasStore.getState().removeMesa(id);
      const { success, error: err } = await deleteRecord("mesas", id);
      if (!success) {
        showToast(`Error eliminando mesa: ${err}`, "error");
        refetchMesas();
        return false;
      }
      return true;
    },
    [refetchMesas]
  );

  // ── Guardar zona (crear o editar) ──
  const handleSaveZona = useCallback(
    async (zona: Partial<Zona> & { nombre: string }): Promise<boolean> => {
      const negocioId = user?.negocio_id ?? "";

      if (zona.id) {
        const updates = { nombre: zona.nombre, color: zona.color, orden: zona.orden };
        useZonasStore.getState().updateZona(zona.id, updates);
        const { success, error: err } = await updateRecord("zonas", zona.id, updates);
        if (!success) {
          showToast(`Error actualizando zona: ${err}`, "error");
          return false;
        }
        return true;
      } else {
        const newZona = {
          negocio_id: negocioId,
          nombre: zona.nombre,
          orden: zona.orden ?? zonas.length,
          color: zona.color ?? "#94a3b8",
          activa: true,
        };
        const { success, error: err } = await insertRecord("zonas", newZona);
        if (!success) {
          showToast(`Error creando zona: ${err}`, "error");
          return false;
        }
        refetchZonas();
        return true;
      }
    },
    [user?.negocio_id, zonas.length, refetchZonas]
  );

  // ── Eliminar zona (soft delete) ──
  const handleDeleteZona = useCallback(
    async (id: string): Promise<boolean> => {
      useZonasStore.getState().removeZona(id);
      const { success, error: err } = await deleteRecord("zonas", id);
      if (!success) {
        showToast(`Error eliminando zona: ${err}`, "error");
        refetchZonas();
        return false;
      }
      return true;
    },
    [refetchZonas]
  );

  return (
    <div>
      {/* ── Row 1: Title + admin actions ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-100 tracking-tight">Mesas</h1>
          <p className="text-sm text-text-45 mt-0.5">
            {loading
              ? "Cargando..."
              : selectedZonaId
                ? `${filteredMesas.length} mesas en ${currentZona?.nombre ?? "zona"}`
                : `${mesas.length} mesas configuradas`}
          </p>
          {error && <p className="text-xs text-status-err mt-1">{error}</p>}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMesa}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-[12px] min-h-[40px]"
            >
              <Plus size={15} />
              Nueva mesa
            </button>
            <button
              onClick={() => setZonaManagerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 text-text-70 hover:bg-surface-3 transition-colors text-[12px] min-h-[40px]"
            >
              <Settings2 size={14} />
              Zonas
            </button>
          </div>
        )}
      </div>

      {/* ── Row 2: Zona tabs (izq) + vista toggle (der) ── */}
      <div className="flex items-center justify-between mb-5">
        {/* Zona tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-xl overflow-x-auto">
          {/* "Todas" solo en Grid — en Plano no tiene sentido mezclar zonas */}
          {vista === "grid" && (
            <button
              onClick={() => selectZona(null)}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[36px]",
                selectedZonaId === null
                  ? "bg-surface-4 text-text-100 shadow-sm"
                  : "text-text-45 hover:text-text-70"
              )}
            >
              Todas
            </button>
          )}
          {zonas.map((zona) => {
            const isActive = selectedZonaId === zona.id;
            const count = mesas.filter((m) => m.zona_id === zona.id).length;
            return (
              <button
                key={zona.id}
                onClick={() => selectZona(zona.id ?? null)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[36px]",
                  isActive
                    ? "bg-surface-4 text-text-100 shadow-sm"
                    : "text-text-45 hover:text-text-70"
                )}
                style={isActive ? { borderBottom: `2px solid ${zona.color ?? "#94a3b8"}` } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: zona.color ?? "#94a3b8" }}
                />
                {zona.nombre}
                <span className="text-[10px] text-text-25 ml-0.5">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Vista toggle con labels */}
        <div className="flex items-center gap-0.5 p-1 bg-surface-2 rounded-lg shrink-0 ml-3">
          <button
            onClick={() => setVista("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              vista === "grid"
                ? "bg-surface-4 text-text-100 shadow-sm"
                : "text-text-45 hover:text-text-70"
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            onClick={() => {
              // Al cambiar a Plano, forzar una zona si está en "Todas"
              if (selectedZonaId === null && zonas.length > 0) {
                selectZona(zonas[0].id ?? null);
              }
              setVista("plano");
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              vista === "plano"
                ? "bg-surface-4 text-text-100 shadow-sm"
                : "text-text-45 hover:text-text-70"
            )}
          >
            <Map size={14} />
            Plano
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-text-45" />
        </div>
      )}

      {/* ── Banner: mesas estancadas ── */}
      {!loading && staleMesas.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--err) 10%, var(--surface-1))",
            color: "var(--err)",
            border: "1px solid color-mix(in srgb, var(--err) 25%, transparent)",
          }}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>{staleMesas.length}</strong>{" "}
            {staleMesas.length === 1 ? "mesa lleva" : "mesas llevan"} más de 1 hora
            ocupada{staleMesas.length > 1 ? "s" : ""} — revisar mesas{" "}
            <strong>{staleMesas.map((m) => m.numero).join(", ")}</strong>
          </span>
        </div>
      )}

      {/* ── Vista: Grid ── */}
      {!loading && vista === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMesas.map((mesa) => {
            const config =
              ESTADO_MESA_CONFIG[mesa.estado as EstadoMesaKey] ??
              ESTADO_MESA_CONFIG.disponible;
            const isStale = mesa.ocupada_desde &&
              (mesa.estado === "ocupada" || mesa.estado === "reservada") &&
              getLevel(getMins(mesa.ocupada_desde)) === "err";
            return (
              <button
                key={mesa.id}
                onClick={() => handleClickMesa(mesa as Mesa)}
                onContextMenu={(e) => handleRightClick(e, mesa as Mesa)}
                onTouchStart={(e) => handleTouchStart(mesa as Mesa, e)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                className={cn(
                  "relative p-5 rounded-xl bg-surface-2 border border-border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer min-h-[44px]",
                  "hover:border-border-hover",
                  isStale && "mesa-stale-pulse border-status-err"
                )}
              >
                {/* Top color indicator */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full"
                  style={{ backgroundColor: `var(${config.cssVar})` }}
                />

                {/* Number */}
                <div
                  className={cn(
                    "text-3xl font-bold mb-2 tracking-tight tabular-nums",
                    config.tailwind
                  )}
                >
                  {mesa.numero}
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-center gap-1.5 text-text-45 mb-3">
                  <Users size={12} />
                  <span className="text-[11px]">{mesa.capacidad} personas</span>
                </div>

                {/* Timer — solo cuando ocupada/reservada */}
                {mesa.ocupada_desde &&
                  (mesa.estado === "ocupada" || mesa.estado === "reservada") && (
                    <div className="mb-2">
                      <MesaTimer ocupadaDesde={mesa.ocupada_desde} variant="badge" />
                    </div>
                  )}

                {/* Zona label */}
                {selectedZonaId === null && (
                  <div className="text-[10px] text-text-25 mb-3 uppercase tracking-wider">
                    {zonas.find((z) => z.id === mesa.zona_id)?.nombre ??
                      mesa.ubicacion ??
                      "Sin zona"}
                  </div>
                )}

                {/* Status pill */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full",
                    config.bg,
                    config.tailwind
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: `var(${config.cssVar})` }}
                  />
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Vista: Floor Plan ── */}
      {!loading && vista === "plano" && (
        <FloorPlanCanvas
          mesas={filteredMesas as Mesa[]}
          zona={currentZona}
          isAdmin={isAdmin ?? false}
          onMoveMesa={handleMoveMesa}
          onEditMesa={handleEditMesa}
          onClickMesa={handleClickMesa}
          onContextMenu={handleContextMenu}
          onResizeMesa={handleResizeMesa}
          onRotateMesa={handleRotateMesa}
          onAddMesa={handleAddMesa}
        />
      )}

      {/* ── Empty state ── */}
      {!loading && mesas.length === 0 && (
        <div className="text-center py-20 text-text-45">
          <p className="text-sm">No hay mesas configuradas</p>
          {isAdmin && (
            <button
              onClick={handleAddMesa}
              className="mt-2 text-xs text-accent hover:underline"
            >
              + Agrega tu primera mesa
            </button>
          )}
        </div>
      )}

      {/* ── Status summary ── */}
      {!loading && mesas.length > 0 && (
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
          {(
            Object.entries(ESTADO_MESA_CONFIG) as [
              string,
              (typeof ESTADO_MESA_CONFIG)[EstadoMesaKey],
            ][]
          ).map(([key, config]) => {
            const count = mesas.filter((m) => m.estado === key).length;
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: `var(${config.cssVar})` }}
                />
                <span className="text-xs text-text-70">
                  {config.label}:{" "}
                  <span className="font-semibold text-text-100">{count}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Context Menu ── */}
      {contextMenu && (
        <MesaContextMenu
          mesa={contextMenu.mesa}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onEdit={handleEditMesa}
          onDuplicate={handleDuplicateMesa}
          onDelete={handleRequestDeleteMesa}
          onGoToOrders={handleGoToOrders}
          onFreeMesa={handleFreeMesa}
        />
      )}

      {/* ── Modals ── */}
      <ZonaManager
        open={zonaManagerOpen}
        onClose={() => setZonaManagerOpen(false)}
        negocioId={user?.negocio_id ?? ""}
        onSave={handleSaveZona}
        onDelete={handleDeleteZona}
      />

      <MesaFormModal
        open={mesaFormOpen}
        onClose={() => {
          setMesaFormOpen(false);
          setEditingMesa(null);
        }}
        mesa={editingMesa}
        negocioId={user?.negocio_id ?? ""}
        mesas={mesas as Mesa[]}
        onSave={handleSaveMesa}
        onSwap={handleSwapMesas}
        onDelete={handleDeleteMesa}
      />

      {/* Confirm: occupied mesa */}
      <ConfirmDialog
        open={confirmFreeMesaId !== null}
        onClose={() => {
          setConfirmFreeMesaId(null);
          setConfirmFreeMesaNum(null);
        }}
        onConfirm={handleConfirmFreeMesa}
        title="¿Continuar con mesa ocupada?"
        description={`La mesa ${confirmFreeMesaNum} está actualmente ocupada. ¿Deseas continuar?`}
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        variant="warning"
      />

      {/* Confirm: delete mesa */}
      <ConfirmDialog
        open={confirmDeleteMesa !== null}
        onClose={() => setConfirmDeleteMesa(null)}
        onConfirm={handleConfirmDeleteMesa}
        title={`¿Eliminar Mesa ${confirmDeleteMesa?.numero}?`}
        description="Esta acción no se puede deshacer. La mesa será eliminada permanentemente."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

export default function MesasPage() {
  return (
    <ErrorBoundary moduleName="Mesas">
      <MesasPageContent />
    </ErrorBoundary>
  );
}
