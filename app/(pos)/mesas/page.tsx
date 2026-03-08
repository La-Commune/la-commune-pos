"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMesas } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

/* R6: Colores migrados al design system */
const estadoConfig = {
  disponible: { label: "Disponible", cssVar: "--ok", tailwind: "text-status-ok", bg: "bg-status-ok-bg" },
  ocupada: { label: "Ocupada", cssVar: "--err", tailwind: "text-status-err", bg: "bg-status-err-bg" },
  reservada: { label: "Reservada", cssVar: "--warn", tailwind: "text-status-warn", bg: "bg-status-warn-bg" },
  preparando: { label: "Preparando", cssVar: "--info", tailwind: "text-status-info", bg: "bg-status-info-bg" },
};

type EstadoMesa = keyof typeof estadoConfig;
type Ubicacion = "Todas" | "Interior" | "Terraza" | "Barra";

function MesasPageContent() {
  const router = useRouter();
  const { data: mesas, loading, error } = useMesas();
  const [filtroUbicacion, setFiltroUbicacion] = useState<Ubicacion>("Todas");
  const [confirmFreeMesaId, setConfirmFreeMesaId] = useState<string | null>(null);
  const [confirmFreeMesaNum, setConfirmFreeMesaNum] = useState<number | null>(null);
  const ubicaciones: Ubicacion[] = ["Todas", "Interior", "Terraza", "Barra"];

  const mesasFiltradas = filtroUbicacion === "Todas"
    ? mesas
    : mesas.filter((m: any) => m.ubicacion === filtroUbicacion);

  /* R11: Deep-link — click en mesa navega a órdenes con mesa pre-seleccionada */
  const handleClickMesa = (mesa: any) => {
    // If mesa is occupied with an active order, show confirmation to prevent accidental navigation
    if (mesa.estado === "ocupada") {
      setConfirmFreeMesaId(mesa.id);
      setConfirmFreeMesaNum(mesa.numero);
    } else {
      router.push(`/ordenes?mesa=${mesa.numero}`);
    }
  };

  const handleConfirmFreeMesa = () => {
    // TODO: In real implementation, check if there's an active order before allowing state change
    if (confirmFreeMesaNum) {
      router.push(`/ordenes?mesa=${confirmFreeMesaNum}`);
    }
    setConfirmFreeMesaId(null);
    setConfirmFreeMesaNum(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-text-100 tracking-tight">Mesas</h1>
          <p className="text-sm text-text-45 mt-0.5">
            {loading ? "Cargando..." : `${mesas.length} mesas configuradas`}
          </p>
          {error && <p className="text-xs text-status-err mt-1">{error}</p>}
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]">
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      {/* Filter tabs — R1: min-h-[44px] */}
      <div className="flex items-center gap-1.5 mb-6 p-1 bg-surface-2 rounded-xl w-fit">
        {ubicaciones.map((ubi) => (
          <button
            key={ubi}
            onClick={() => setFiltroUbicacion(ubi)}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px]",
              filtroUbicacion === ubi
                ? "bg-surface-4 text-text-100 shadow-sm"
                : "text-text-45 hover:text-text-70"
            )}
          >
            {ubi}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-text-45" />
        </div>
      )}

      {/* Grid de mesas — R6: clases Tailwind del design system */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mesasFiltradas.map((mesa: any) => {
            const config = estadoConfig[mesa.estado as EstadoMesa] ?? estadoConfig.disponible;
            return (
              <button
                key={mesa.id}
                onClick={() => handleClickMesa(mesa)}
                className="relative p-5 rounded-xl bg-surface-2 border border-border text-center transition-all duration-300 hover:-translate-y-1 hover:border-border-hover hover:shadow-md cursor-pointer min-h-[44px]"
              >
                {/* R6: Top color indicator con CSS var */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full"
                  style={{ backgroundColor: `var(${config.cssVar})` }}
                />

                {/* Number — R6: color del design system */}
                <div className={cn("text-3xl font-bold mb-2 tracking-tight tabular-nums", config.tailwind)}>
                  {mesa.numero}
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-center gap-1.5 text-text-45 mb-3">
                  <Users size={12} />
                  <span className="text-[11px]">{mesa.capacidad} personas</span>
                </div>

                {/* Location */}
                <div className="text-[10px] text-text-25 mb-3 uppercase tracking-wider">
                  {mesa.ubicacion}
                </div>

                {/* R6: Status pill con clases del design system */}
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full",
                  config.bg,
                  config.tailwind
                )}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `var(${config.cssVar})` }} />
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && mesas.length === 0 && (
        <div className="text-center py-20 text-text-45">
          <p className="text-sm">No hay mesas configuradas</p>
          <p className="text-xs mt-1">Agrega tu primera mesa para empezar</p>
        </div>
      )}

      {/* Status summary — R6: clases del design system */}
      {!loading && mesas.length > 0 && (
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
          {(Object.entries(estadoConfig) as [string, typeof estadoConfig.disponible][]).map(([key, config]) => {
            const count = mesas.filter((m: any) => m.estado === key).length;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `var(${config.cssVar})` }} />
                <span className="text-xs text-text-70">
                  {config.label}: <span className="font-semibold text-text-100">{count}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

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
