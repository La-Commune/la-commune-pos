"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
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
  disponible: { label: "Disponible", color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
  ocupada: { label: "Ocupada", color: "#F87171", bg: "rgba(248,113,113,0.08)" },
  reservada: { label: "Reservada", color: "#FACC15", bg: "rgba(250,204,21,0.08)" },
  preparando: { label: "Preparando", color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
};

type Ubicacion = "Todas" | "Interior" | "Terraza" | "Barra";

export default function MesasPage() {
  const [filtroUbicacion, setFiltroUbicacion] = useState<Ubicacion>("Todas");
  const ubicaciones: Ubicacion[] = ["Todas", "Interior", "Terraza", "Barra"];

  const mesasFiltradas = filtroUbicacion === "Todas"
    ? MOCK_MESAS
    : MOCK_MESAS.filter((m) => m.ubicacion === filtroUbicacion);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-text-100 tracking-tight">Mesas</h1>
          <p className="text-sm text-text-45 mt-0.5">{MOCK_MESAS.length} mesas configuradas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-[13px]">
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-6 p-1 bg-surface-2 rounded-lg w-fit">
        {ubicaciones.map((ubi) => (
          <button
            key={ubi}
            onClick={() => setFiltroUbicacion(ubi)}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              filtroUbicacion === ubi
                ? "bg-surface-4 text-text-100 shadow-sm"
                : "text-text-45 hover:text-text-70"
            )}
          >
            {ubi}
          </button>
        ))}
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesasFiltradas.map((mesa) => {
          const config = estadoConfig[mesa.estado];
          return (
            <button
              key={mesa.id}
              className="relative p-5 rounded-xl bg-surface-2 border border-border text-center transition-all duration-300 hover:-translate-y-1 hover:border-border-hover hover:shadow-md cursor-pointer"
            >
              {/* Top color indicator */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full"
                style={{ backgroundColor: config.color }}
              />

              {/* Number */}
              <div
                className="text-3xl font-bold mb-2 tracking-tight tabular-nums"
                style={{ color: config.color }}
              >
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

              {/* Status pill */}
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                {config.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
        {(Object.entries(estadoConfig) as [string, typeof estadoConfig.disponible][]).map(([key, config]) => {
          const count = MOCK_MESAS.filter((m) => m.estado === key).length;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-xs text-text-70">
                {config.label}: <span className="font-semibold text-text-100">{count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
