"use client";

import { useState } from "react";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  RotateCcw,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_TICKETS_KDS, type TicketKDS } from "@/lib/mock-data";

const estadoConfig = {
  nueva: {
    label: "Nueva",
    bg: "bg-status-info-bg",
    text: "text-status-info",
    icon: AlertTriangle,
  },
  preparando: {
    label: "Preparando",
    bg: "bg-status-warn-bg",
    text: "text-status-warn",
    icon: ChefHat,
  },
  lista: {
    label: "Lista",
    bg: "bg-status-ok-bg",
    text: "text-status-ok",
    icon: CheckCircle2,
  },
};

function tiempoTranscurrido(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "< 1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function tiempoPreparacion(inicio: string | null, fin: string | null) {
  if (!inicio) return null;
  const end = fin ? new Date(fin).getTime() : Date.now();
  return Math.floor((end - new Date(inicio).getTime()) / 60000);
}

function TicketCard({ ticket }: { ticket: TicketKDS }) {
  const config = estadoConfig[ticket.estado];
  const Icon = config.icon;
  const tiempoPrep = tiempoPreparacion(ticket.tiempo_inicio, ticket.tiempo_fin);
  const esUrgente = ticket.estado === "preparando" && tiempoPrep !== null && tiempoPrep > 10;

  return (
    <div
      className={cn(
        "rounded-xl bg-surface-2 border overflow-hidden transition-all duration-[400ms] ease-smooth hover:shadow-lg hover:shadow-black/20",
        esUrgente ? "border-status-err shadow-md shadow-status-err/20" : "border-border",
        "hover:border-border-hover"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-2.5", config.bg)}>
        <div className="flex items-center gap-2">
          <Icon size={14} className={config.text} />
          <span className={cn("text-[11px] font-medium uppercase tracking-wider", config.text)}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {esUrgente && (
            <span className="text-[10px] font-bold text-status-err uppercase tracking-wider animate-pulse">
              Urgente
            </span>
          )}
          <span className="text-[11px] text-text-25 tabular-nums flex items-center gap-1">
            <Clock size={11} />
            {tiempoTranscurrido(ticket.creado_en)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          {ticket.mesa_numero ? (
            <>
              <MapPin size={12} className="text-text-25" />
              <span className="text-sm font-medium text-text-100">
                Mesa {ticket.mesa_numero}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag size={12} className="text-text-25" />
              <span className="text-sm font-medium text-text-100 capitalize">
                {ticket.origen.replace("_", " ")}
              </span>
            </>
          )}
        </div>

        <div className="space-y-2 mb-3">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-xs font-semibold text-accent tabular-nums w-5 text-center mt-0.5">
                {item.cantidad}x
              </span>
              <div>
                <span className="text-xs text-text-100">{item.nombre}</span>
                {item.notas && (
                  <p className="text-[10px] text-status-warn italic mt-0.5">
                    {item.notas}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {tiempoPrep !== null && (
          <div className={cn(
            "text-[11px] tabular-nums flex items-center gap-1",
            esUrgente ? "text-status-err font-medium" : "text-text-25"
          )}>
            <Clock size={11} />
            {tiempoPrep}m en preparación
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3">
        {ticket.estado === "nueva" && (
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg btn-primary text-xs">
            <Play size={12} />
            Iniciar preparación
          </button>
        )}
        {ticket.estado === "preparando" && (
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-300" style={{ background: "var(--ok)", color: "var(--surface-0)" }}>
            <Check size={12} />
            Marcar lista
          </button>
        )}
        {ticket.estado === "lista" && (
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg btn-ghost text-xs">
            <RotateCcw size={12} />
            Regresar a preparación
          </button>
        )}
      </div>
    </div>
  );
}

export default function KDSPage() {
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "nueva" | "preparando" | "lista">("todas");

  const conteo = {
    nueva: MOCK_TICKETS_KDS.filter((t) => t.estado === "nueva").length,
    preparando: MOCK_TICKETS_KDS.filter((t) => t.estado === "preparando").length,
    lista: MOCK_TICKETS_KDS.filter((t) => t.estado === "lista").length,
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Cocina (KDS)</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            {MOCK_TICKETS_KDS.length} ticket{MOCK_TICKETS_KDS.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 mb-5 bg-surface-2 p-1 rounded-xl w-fit">
        {(["todas", "nueva", "preparando", "lista"] as const).map((estado) => {
          const count = estado === "todas" ? MOCK_TICKETS_KDS.length : conteo[estado];
          const conf = estado !== "todas" ? estadoConfig[estado] : null;
          return (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300",
                filtroEstado === estado
                  ? "bg-surface-4 text-text-100"
                  : "text-text-25 hover:text-text-45"
              )}
            >
              <span>{estado === "todas" ? "Todas" : conf?.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-lg tabular-nums",
                filtroEstado === estado ? "bg-accent-soft text-accent" : "bg-surface-3 text-text-25"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Columna: Nuevas */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full bg-status-info" />
              <span className="text-[11px] font-medium text-text-45 uppercase tracking-widest">Nuevas</span>
              <span className="text-[10px] text-text-25 tabular-nums">{conteo.nueva}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(filtroEstado === "todas" || filtroEstado === "nueva"
                ? MOCK_TICKETS_KDS.filter((t) => t.estado === "nueva")
                : []
              ).map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>

          {/* Columna: Preparando */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full bg-status-warn" />
              <span className="text-[11px] font-medium text-text-45 uppercase tracking-widest">Preparando</span>
              <span className="text-[10px] text-text-25 tabular-nums">{conteo.preparando}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(filtroEstado === "todas" || filtroEstado === "preparando"
                ? MOCK_TICKETS_KDS.filter((t) => t.estado === "preparando")
                : []
              ).map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>

          {/* Columna: Listas */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full bg-status-ok" />
              <span className="text-[11px] font-medium text-text-45 uppercase tracking-widest">Listas</span>
              <span className="text-[10px] text-text-25 tabular-nums">{conteo.lista}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(filtroEstado === "todas" || filtroEstado === "lista"
                ? MOCK_TICKETS_KDS.filter((t) => t.estado === "lista")
                : []
              ).map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
