"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Loader2,
  LayoutGrid,
  Map,
  Settings2,
  Pencil,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMesas, useZonas, insertRecord, updateRecord, deleteRecord } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesasStore } from "@/store/mesas.store";
import { useZonasStore } from "@/store/zonas.store";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FloorPlanCanvas from "@/components/mesas/FloorPlanCanvas";
import ZonaManager from "@/components/mesas/ZonaManager";
import MesaFormModal from "@/components/mesas/MesaFormModal";
import { showToast } from "@/components/ui/Toast";
import type { Mesa, Zona } from "@/lib/validators";

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
  const { mesas, setMesas, editMode, setEditMode } = useMesasStore();
  const { zonas, setZonas, selectedZonaId, selectZona } = useZonasStore();

  // ── Local state ──
  const [vista, setVista] = useState<Vista>("grid");
  const [zonaManagerOpen, setZonaManagerOpen] = useState(false);
  const [mesaFormOpen, setMesaFormOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [confirmFreeMesaId, setConfirmFreeMesaId] = useState<string | null>(null);
  const [confirmFreeMesaNum, setConfirmFreeMesaNum] = useState<number | null>(null);

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

  // ── Handlers ──
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

  const handleEditMesa = useCallback((mesa: Mesa) => {
    setEditingMesa(mesa);
    setMesaFormOpen(true);
  }, []);

  const handleAddMesa = useCallback(() => {
    setEditingMesa(null);
    setMesaFormOpen(true);
  }, []);

  // ── Mover mesa (drag & drop) → optimistic + persist ──
  const handleMoveMesa = useCallback(
    async (mesaId: string, pos_x: number, pos_y: number) => {
      // Optimistic update
      useMesasStore.getState().updateMesa(mesaId, { pos_x, pos_y });
      // Persist
      const { success, error: err } = await updateRecord("mesas", mesaId, { pos_x, pos_y });
      if (!success) {
        console.warn("[Mesas] Error guardando posición:", err);
        showToast("Error guardando posición", "error");
      }
    },
    []
  );

  // ── Guardar mesa (crear o editar) ──
  const handleSaveMesa = useCallback(
    async (mesa: Partial<Mesa>): Promise<boolean> => {
      const negocioId = user?.negocio_id ?? "";

      if (editingMesa?.id) {
        // ── EDITAR ──
        const updates = {
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          zona_id: mesa.zona_id,
          forma: mesa.forma,
          pos_x: mesa.pos_x,
          pos_y: mesa.pos_y,
        };
        // Optimistic
        useMesasStore.getState().updateMesa(editingMesa.id, updates);
        // Persist
        const { success, error: err } = await updateRecord("mesas", editingMesa.id, updates);
        if (!success) {
          showToast(`Error actualizando mesa: ${err}`, "error");
          return false;
        }
        return true;
      } else {
        // ── CREAR ──
        const newMesa = {
          negocio_id: negocioId,
          numero: mesa.numero ?? 0,
          capacidad: mesa.capacidad ?? 4,
          estado: "disponible" as const,
          zona_id: mesa.zona_id ?? selectedZonaId,
          pos_x: mesa.pos_x ?? 80,
          pos_y: mesa.pos_y ?? 80,
          forma: mesa.forma ?? "cuadrada",
        };
        const { success, error: err } = await insertRecord("mesas", newMesa);
        if (!success) {
          showToast(`Error creando mesa: ${err}`, "error");
          return false;
        }
        // Refetch para obtener el ID real de Supabase
        refetchMesas();
        return true;
      }
    },
    [editingMesa, user?.negocio_id, selectedZonaId, refetchMesas]
  );

  // ── Eliminar mesa (soft delete) ──
  const handleDeleteMesa = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic
      useMesasStore.getState().removeMesa(id);
      // Persist
      const { success, error: err } = await deleteRecord("mesas", id);
      if (!success) {
        showToast(`Error eliminando mesa: ${err}`, "error");
        refetchMesas(); // revertir
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
        // ── EDITAR ──
        const updates = { nombre: zona.nombre, color: zona.color, orden: zona.orden };
        useZonasStore.getState().updateZona(zona.id, updates);
        const { success, error: err } = await updateRecord("zonas", zona.id, updates);
        if (!success) {
          showToast(`Error actualizando zona: ${err}`, "error");
          return false;
        }
        return true;
      } else {
        // ── CREAR ──
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
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-100 tracking-tight">Mesas</h1>
          <p className="text-sm text-text-45 mt-0.5">
            {loading ? "Cargando..." : `${mesas.length} mesas configuradas`}
          </p>
          {error && <p className="text-xs text-status-err mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Vista toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-surface-2 rounded-lg">
            <button
              onClick={() => setVista("grid")}
              className={cn(
                "p-2 rounded-md transition-all",
                vista === "grid"
                  ? "bg-surface-4 text-text-100 shadow-sm"
                  : "text-text-45 hover:text-text-70"
              )}
              title="Vista Grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setVista("plano")}
              className={cn(
                "p-2 rounded-md transition-all",
                vista === "plano"
                  ? "bg-surface-4 text-text-100 shadow-sm"
                  : "text-text-45 hover:text-text-70"
              )}
              title="Vista Plano"
            >
              <Map size={16} />
            </button>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <>
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all min-h-[40px]",
                  editMode
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text-70 hover:bg-surface-3"
                )}
              >
                {editMode ? <Check size={14} /> : <Pencil size={14} />}
                {editMode ? "Listo" : "Editar"}
              </button>

              <button
                onClick={() => setZonaManagerOpen(true)}
                className="p-2 rounded-lg bg-surface-2 text-text-70 hover:bg-surface-3 transition-colors min-h-[40px]"
                title="Gestionar zonas"
              >
                <Settings2 size={16} />
              </button>

              <button
                onClick={handleAddMesa}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-primary text-[12px] min-h-[40px]"
              >
                <Plus size={15} />
                Nueva mesa
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Zona filter tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 p-1 bg-surface-2 rounded-xl w-fit overflow-x-auto">
        <button
          onClick={() => selectZona(null)}
          className={cn(
            "px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[40px]",
            selectedZonaId === null
              ? "bg-surface-4 text-text-100 shadow-sm"
              : "text-text-45 hover:text-text-70"
          )}
        >
          Todas
        </button>
        {zonas.map((zona) => (
          <button
            key={zona.id}
            onClick={() => selectZona(zona.id ?? null)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[40px]",
              selectedZonaId === zona.id
                ? "bg-surface-4 text-text-100 shadow-sm"
                : "text-text-45 hover:text-text-70"
            )}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: zona.color ?? "#94a3b8" }}
            />
            {zona.nombre}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-text-45" />
        </div>
      )}

      {/* ── Vista: Grid ── */}
      {!loading && vista === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMesas.map((mesa) => {
            const config =
              ESTADO_MESA_CONFIG[mesa.estado as EstadoMesaKey] ??
              ESTADO_MESA_CONFIG.disponible;
            return (
              <button
                key={mesa.id}
                onClick={() =>
                  editMode && isAdmin ? handleEditMesa(mesa) : handleClickMesa(mesa)
                }
                className={cn(
                  "relative p-5 rounded-xl bg-surface-2 border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer min-h-[44px]",
                  editMode && isAdmin
                    ? "border-accent/40 hover:border-accent"
                    : "border-border hover:border-border-hover"
                )}
              >
                {/* Edit indicator */}
                {editMode && isAdmin && (
                  <div className="absolute top-2 right-2 p-1 rounded-md bg-accent/10 text-accent">
                    <Pencil size={12} />
                  </div>
                )}

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
          mesas={filteredMesas}
          zona={currentZona}
          editMode={editMode && isAdmin}
          onMoveMesa={handleMoveMesa}
          onEditMesa={handleEditMesa}
          onClickMesa={handleClickMesa}
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
        onSave={handleSaveMesa}
        onDelete={handleDeleteMesa}
      />

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
