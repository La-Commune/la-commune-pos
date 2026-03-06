"use client";

import { LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_MESAS = [
  { id: "1", numero: 1, capacidad: 2, estado: "disponible" as const, ubicacion: "Interior", orden_actual_id: null },
  { id: "2", numero: 2, capacidad: 4, estado: "ocupada" as const, ubicacion: "Interior", orden_actual_id: "ord-1" },
  { id: "3", numero: 3, capacidad: 4, estado: "preparando" as const, ubicacion: "Interior", orden_actual_id: "ord-2" },
  { id: "4", numero: 4, capacidad: 6, estado: "disponible" as const, ubicacion: "Terraza", orden_actual_id: null },
  { id: "5", numero: 5, capacidad: 2, estado: "reservada" as const, ubicacion: "Terraza", orden_actual_id: null },
  { id: "6", numero: 6, capacidad: 4, estado: "ocupada" as const, ubicacion: "Terraza", orden_actual_id: "ord-3" },
  { id: "7", numero: 7, capacidad: 8, estado: "disponible" as const, ubicacion: "Interior", orden_actual_id: null },
  { id: "8", numero: 8, capacidad: 2, estado: "disponible" as const, ubicacion: "Barra", orden_actual_id: null },
];

const estadoConfig = {
  disponible: { label: "Disponible", color: "bg-status-ok", bgColor: "bg-status-ok-bg", border: "border-status-ok/20" },
  ocupada: { label: "Ocupada", color: "bg-status-err", bgColor: "bg-status-err-bg", border: "border-status-err/20" },
  reservada: { label: "Reservada", color: "bg-status-warn", bgColor: "bg-status-warn-bg", border: "border-status-warn/20" },
  preparando: { label: "Preparando", color: "bg-status-info", bgColor: "bg-status-info-bg", border: "border-status-info/20" },
};

export default function MesasPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutGrid size={24} className="text-accent" />
          <h1 className="text-2xl font-display text-text-100">Mesas</h1>
          <span className="text-sm text-text-45 ml-2">
            {MOCK_MESAS.length} mesas
          </span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-md btn-primary text-sm">
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-4 mb-6">
        {Object.entries(estadoConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-text-70">
            <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
            {config.label}
          </div>
        ))}
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {MOCK_MESAS.map((mesa) => {
          const config = estadoConfig[mesa.estado];
          return (
            <button
              key={mesa.id}
              className={cn(
                "relative p-5 rounded-lg border text-left transition-all duration-150",
                "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                "bg-surface-1",
                config.border
              )}
            >
              {/* Status dot */}
              <div
                className={cn(
                  "absolute top-3 right-3 w-2.5 h-2.5 rounded-full",
                  config.color
                )}
              />

              {/* Numero */}
              <div className="text-3xl font-display text-text-100 mb-2">
                {mesa.numero}
              </div>

              {/* Info */}
              <div className="text-xs text-text-45 space-y-0.5">
                <p>{mesa.ubicacion}</p>
                <p>{mesa.capacidad} personas</p>
              </div>

              {/* Estado label */}
              <div className="mt-3 text-xs font-medium text-text-70">
                {config.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
