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
  disponible: { label: "Disponible", numColor: "text-status-ok", pillBg: "bg-status-ok-bg", pillText: "text-status-ok" },
  ocupada: { label: "Ocupada", numColor: "text-status-err", pillBg: "bg-status-err-bg", pillText: "text-status-err" },
  reservada: { label: "Reservada", numColor: "text-status-warn", pillBg: "bg-status-warn-bg", pillText: "text-status-warn" },
  preparando: { label: "Preparando", numColor: "text-text-70", pillBg: "bg-[rgba(255,255,255,0.04)]", pillText: "text-text-70" },
};

export default function MesasPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Mesas</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            {MOCK_MESAS.length} mesas
          </span>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-sm btn-ghost text-[13px]">
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {MOCK_MESAS.map((mesa) => {
          const config = estadoConfig[mesa.estado];
          return (
            <button
              key={mesa.id}
              className="relative p-5 rounded-md bg-surface-2 border border-border text-center transition-all duration-[400ms] ease-smooth hover:-translate-y-0.5 hover:border-border-hover cursor-pointer"
            >
              {/* Numero */}
              <div className={cn("text-[22px] font-bold mb-1 tracking-tight tabular-nums", config.numColor)}>
                {mesa.numero}
              </div>

              {/* Info */}
              <div className="text-[11px] text-text-25 mb-2.5">
                {mesa.ubicacion} · {mesa.capacidad}p
              </div>

              {/* Estado pill */}
              <div className={cn(
                "inline-block text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-sm",
                config.pillBg,
                config.pillText
              )}>
                {config.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
