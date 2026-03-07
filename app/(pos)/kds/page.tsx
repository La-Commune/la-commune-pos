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
  Loader2,
  Volume2,
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

/* R5: Color del timer según tiempo transcurrido */
function timerColor(mins: number | null) {
  if (mins === null) return "text-text-25";
  if (mins <= 5) return "text-status-ok";
  if (mins <= 10) return "text-status-warn";
  return "text-status-err";
}

/* R5: Rediseño completo del ticket KDS para legibilidad a distancia */
function TicketCard({ ticket, onAction }: { ticket: TicketKDS; onAction?: (action: string) => void }) {
  const config = estadoConfig[ticket.estado];
  const Icon = config.icon;
  const tiempoPrep = tiempoPreparacion(ticket.tiempo_inicio, ticket.tiempo_fin);
  const esUrgente = ticket.estado === "preparando" && tiempoPrep !== null && tiempoPrep > 10;
  /* R3: loading states */
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    // TODO: Actualizar en Supabase
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    onAction?.(action);
  };

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-[400ms] ease-smooth hover:shadow-lg hover:shadow-black/20",
        /* R5: Urgente usa fondo completo, no solo borde */
        esUrgente
          ? "bg-status-err/10 border-2 border-status-err shadow-md shadow-status-err/20"
          : "bg-surface-2 border border-border hover:border-border-hover"
      )}
    >
      {/* Header — R5: más prominente */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3",
        esUrgente ? "bg-status-err/20" : config.bg
      )}>
        <div className="flex items-center gap-2.5">
          <Icon size={18} className={esUrgente ? "text-status-err" : config.text} />
          <span className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            esUrgente ? "text-status-err" : config.text
          )}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {esUrgente && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-status-err uppercase tracking-wider animate-pulse">
              <Volume2 size={14} />
              Urgente
            </span>
          )}
          <span className="text-xs text-text-45 tabular-nums flex items-center gap-1.5">
            <Clock size={13} />
            {tiempoTranscurrido(ticket.creado_en)}
          </span>
        </div>
      </div>

      {/* Body — R5: texto más grande para lectura a distancia */}
      <div className="p-4">
        {/* R5: Número de mesa GRANDE */}
        <div className="flex items-center gap-2.5 mb-4">
          {ticket.mesa_numero ? (
            <>
              <MapPin size={18} className="text-text-45" />
              <span className="text-2xl font-bold text-text-100 tracking-tight">
                Mesa {ticket.mesa_numero}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag size={18} className="text-text-45" />
              <span className="text-2xl font-bold text-text-100 capitalize tracking-tight">
                {ticket.origen.replace("_", " ")}
              </span>
            </>
          )}
        </div>

        {/* Items — R5: más legibles */}
        <div className="space-y-2.5 mb-4">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-sm font-bold text-accent tabular-nums w-7 text-center mt-0.5 bg-accent-soft rounded-md py-0.5">
                {item.cantidad}x
              </span>
              <div>
                <span className="text-sm font-medium text-text-100">{item.nombre}</span>
                {item.notas && (
                  <p className="text-xs text-status-warn italic mt-0.5 font-medium">
                    {item.notas}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* R5: Timer GRANDE con colores dinámicos */}
        {tiempoPrep !== null && (
          <div className={cn(
            "flex items-center gap-2 p-2.5 rounded-xl",
            esUrgente ? "bg-status-err/10" : "bg-surface-3"
          )}>
            <Clock size={18} className={timerColor(tiempoPrep)} />
            <span className={cn(
              "text-lg font-bold tabular-nums",
              timerColor(tiempoPrep)
            )}>
              {tiempoPrep}m
            </span>
            <span className="text-xs text-text-45">en preparación</span>
          </div>
        )}
      </div>

      {/* Actions — R1: targets de 44px mínimo, R3: loading states */}
      <div className="px-4 pb-4">
        {ticket.estado === "nueva" && (
          <button
            onClick={() => handleAction("iniciar")}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl btn-primary text-sm font-semibold min-h-[48px] transition-all duration-300",
              loading && "opacity-70 cursor-wait"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Play size={18} />
                Iniciar preparación
              </>
            )}
          </button>
        )}
        {ticket.estado === "preparando" && (
          <button
            onClick={() => handleAction("lista")}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] transition-all duration-300",
              loading ? "opacity-70 cursor-wait" : ""
            )}
            style={{ background: "var(--ok)", color: "var(--surface-0)" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Marcando...
              </>
            ) : (
              <>
                <Check size={18} />
                Marcar lista
              </>
            )}
          </button>
        )}
        {ticket.estado === "lista" && (
          <button
            onClick={() => handleAction("regresar")}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-3 rounded-xl btn-ghost text-sm font-medium min-h-[44px]",
              loading && "opacity-70 cursor-wait"
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <RotateCcw size={16} />
                Regresar a preparación
              </>
            )}
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

  /* R5: Conteo de urgentes para badge */
  const urgentes = MOCK_TICKETS_KDS.filter((t) => {
    if (t.estado !== "preparando" || !t.tiempo_inicio) return false;
    const mins = Math.floor((Date.now() - new Date(t.tiempo_inicio).getTime()) / 60000);
    return mins > 10;
  }).length;

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      {/* Header — R5: Muestra conteo de urgentes */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Cocina (KDS)</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            {MOCK_TICKETS_KDS.length} ticket{MOCK_TICKETS_KDS.length !== 1 ? "s" : ""}
          </span>
          {urgentes > 0 && (
            <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-status-err/10 text-status-err border border-status-err/20 animate-pulse">
              {urgentes} urgente{urgentes > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Filtros — R1: min-h-[44px] */}
      <div className="flex items-center gap-1 mb-5 bg-surface-2 p-1 rounded-xl w-fit">
        {(["todas", "nueva", "preparando", "lista"] as const).map((estado) => {
          const count = estado === "todas" ? MOCK_TICKETS_KDS.length : conteo[estado];
          const conf = estado !== "todas" ? estadoConfig[estado] : null;
          return (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 min-h-[44px]",
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
              <div className="w-2.5 h-2.5 rounded-full bg-status-info" />
              <span className="text-xs font-medium text-text-45 uppercase tracking-widest">Nuevas</span>
              <span className="text-xs text-text-25 tabular-nums font-medium">{conteo.nueva}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
              <div className="w-2.5 h-2.5 rounded-full bg-status-warn" />
              <span className="text-xs font-medium text-text-45 uppercase tracking-widest">Preparando</span>
              <span className="text-xs text-text-25 tabular-nums font-medium">{conteo.preparando}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
              <div className="w-2.5 h-2.5 rounded-full bg-status-ok" />
              <span className="text-xs font-medium text-text-45 uppercase tracking-widest">Listas</span>
              <span className="text-xs text-text-25 tabular-nums font-medium">{conteo.lista}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
