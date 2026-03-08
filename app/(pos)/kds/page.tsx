"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useTicketsKDS, updateRecord, subscribeToTable } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatTiempoTranscurrido } from "@/hooks/useTiempoTranscurrido";
import { useUIStore } from "@/store/ui.store";
import { showToast } from "@/components/ui/Toast";

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
  return formatTiempoTranscurrido(iso);
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
function TicketCard({ ticket, onConfirmLista, onRefetch }: { ticket: any; onConfirmLista?: (ticketId: string) => void; onRefetch?: () => void }) {
  const config = estadoConfig[ticket.estado as keyof typeof estadoConfig];
  const Icon = config?.icon ?? AlertTriangle;
  const tiempoPrep = tiempoPreparacion(ticket.tiempo_inicio, ticket.tiempo_fin);
  const esUrgente = ticket.estado === "preparando" && tiempoPrep !== null && tiempoPrep > 10;
  /* R3: loading states */
  const [loading, setLoading] = useState(false);

  // Datos normalizados del join con ordenes
  const mesaNumero = ticket.ordenes?.mesas?.numero ?? ticket.mesa_numero ?? null;
  const origen = ticket.ordenes?.origen ?? ticket.origen ?? "mesa";
  const folio = ticket.ordenes?.folio ?? ticket.folio ?? null;
  const ordenCompletada = ticket.ordenes?.estado === "completada" || ticket.ordenes?.estado === "cancelada";

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      if (action === "iniciar") {
        await updateRecord("tickets_kds", ticket.id, {
          estado: "preparando",
          tiempo_inicio: new Date().toISOString(),
        });
        showToast("Preparación iniciada");
      } else if (action === "regresar") {
        await updateRecord("tickets_kds", ticket.id, {
          estado: "preparando",
          tiempo_fin: null,
        });
        showToast("Ticket regresado a preparación");
      }
      onRefetch?.();
    } catch {
      showToast("Error al actualizar ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLista = () => {
    onConfirmLista?.(ticket.id);
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
          {mesaNumero ? (
            <>
              <MapPin size={18} className="text-text-45" />
              <span className="text-2xl font-bold text-text-100 tracking-tight">
                Mesa {mesaNumero}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag size={18} className="text-text-45" />
              <span className="text-2xl font-bold text-text-100 capitalize tracking-tight">
                {(origen ?? "").replace("_", " ")}
              </span>
            </>
          )}
          {folio && (
            <span className="text-xs text-text-25 tabular-nums font-medium">#{folio}</span>
          )}
        </div>

        {/* Items — R5: más legibles */}
        <div className="space-y-2.5 mb-4">
          {(ticket.items_kds ?? []).map((item: any, idx: number) => (
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
            onClick={handleMarcarLista}
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
        {ticket.estado === "lista" && !ordenCompletada && (
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

function KDSPageContent() {
  const { data: tickets, refetch: refetchTickets } = useTicketsKDS();
  const { kdsDisplayMode } = useUIStore();
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "nueva" | "preparando" | "lista">("todas");
  const [confirmListaId, setConfirmListaId] = useState<string | null>(null);

  /* Timer live: forzar re-render cada 10s para actualizar tiempos */
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  /* Realtime: refetch tickets cuando cambian ordenes o tickets */
  useEffect(() => {
    const subTickets = subscribeToTable("tickets_kds", () => refetchTickets());
    const subOrdenes = subscribeToTable("ordenes", () => refetchTickets());
    return () => {
      subTickets.unsubscribe();
      subOrdenes.unsubscribe();
    };
  }, [refetchTickets]);

  // ── Filtrar tickets cuya orden ya fue completada o cancelada ──
  // En POS profesionales, una vez cobrada la orden el ticket desaparece del KDS
  const ticketsActivos = useMemo(
    () =>
      (tickets as any[]).filter((t) => {
        const estadoOrden = t.ordenes?.estado;
        // Si no hay join data, mostrar (mock mode)
        if (!estadoOrden) return true;
        // Ocultar si la orden ya está completada o cancelada
        return estadoOrden !== "completada" && estadoOrden !== "cancelada";
      }),
    [tickets],
  );

  const conteo = {
    nueva: ticketsActivos.filter((t) => t.estado === "nueva").length,
    preparando: ticketsActivos.filter((t) => t.estado === "preparando").length,
    lista: ticketsActivos.filter((t) => t.estado === "lista").length,
  };

  /* R5: Conteo de urgentes para badge */
  const urgentes = ticketsActivos.filter((t: any) => {
    if (t.estado !== "preparando" || !t.tiempo_inicio) return false;
    const mins = Math.floor((Date.now() - new Date(t.tiempo_inicio).getTime()) / 60000);
    return mins > 10;
  }).length;

  const handleConfirmLista = (ticketId: string) => {
    setConfirmListaId(ticketId);
  };

  const handleConfirmListaAction = async () => {
    if (!confirmListaId) return;
    try {
      // 1. Marcar ticket como lista
      await updateRecord("tickets_kds", confirmListaId, {
        estado: "lista",
        tiempo_fin: new Date().toISOString(),
      });

      // 2. Encontrar la orden vinculada y marcarla como 'lista'
      const ticket = ticketsActivos.find((t: any) => t.id === confirmListaId);
      if (ticket?.orden_id) {
        await updateRecord("ordenes", ticket.orden_id, {
          estado: "lista",
        });
      }

      showToast("Ticket marcado como listo");
      refetchTickets();
    } catch {
      showToast("Error al marcar como listo", "error");
    } finally {
      setConfirmListaId(null);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
        {/* Header — R5: Muestra conteo de urgentes */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-text-100 tracking-tight">Cocina (KDS)</h1>
            <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
              {ticketsActivos.length} ticket{ticketsActivos.length !== 1 ? "s" : ""}
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
            const count = estado === "todas" ? ticketsActivos.length : conteo[estado];
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

        {/* Display area — switches between classic/tiled/split */}
        <div className="flex-1 overflow-hidden">
          {kdsDisplayMode === "classic" ? (
            /* ── Classic: Kanban 3 columns ── */
            <div className="grid grid-cols-3 gap-4 h-full">
              {(["nueva", "preparando", "lista"] as const).map((estado) => {
                const conf = estadoConfig[estado];
                const statusColor = estado === "nueva" ? "bg-status-info" : estado === "preparando" ? "bg-status-warn" : "bg-status-ok";
                const filtered = filtroEstado === "todas" || filtroEstado === estado
                  ? ticketsActivos.filter((t: any) => t.estado === estado)
                  : [];
                return (
                  <div key={estado} className="flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={cn("w-2.5 h-2.5 rounded-full", statusColor)} />
                      <span className="text-xs font-medium text-text-45 uppercase tracking-widest">{conf.label}</span>
                      <span className="text-xs text-text-25 tabular-nums font-medium">{conteo[estado]}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {filtered.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} onConfirmLista={handleConfirmLista} onRefetch={refetchTickets} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : kdsDisplayMode === "tiled" ? (
            /* ── Tiled: Grid compact ── */
            <div className="h-full overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ticketsActivos
                  .filter((t) => filtroEstado === "todas" || t.estado === filtroEstado)
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onConfirmLista={handleConfirmLista} onRefetch={refetchTickets} />
                  ))}
              </div>
            </div>
          ) : (
            /* ── Split: mesa arriba, para llevar abajo ── */
            <div className="grid grid-rows-2 gap-4 h-full">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-status-info" />
                  <span className="text-xs font-medium text-text-45 uppercase tracking-widest">Mesa</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {ticketsActivos
                      .filter((t) => (filtroEstado === "todas" || t.estado === filtroEstado) && (t.ordenes?.mesas?.numero || t.mesa_numero))
                      .map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} onConfirmLista={handleConfirmLista} onRefetch={refetchTickets} />
                      ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-status-warn" />
                  <span className="text-xs font-medium text-text-45 uppercase tracking-widest">Para llevar / Delivery</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {ticketsActivos
                      .filter((t) => (filtroEstado === "todas" || t.estado === filtroEstado) && !(t.ordenes?.mesas?.numero || t.mesa_numero))
                      .map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} onConfirmLista={handleConfirmLista} onRefetch={refetchTickets} />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmListaId !== null}
        onClose={() => setConfirmListaId(null)}
        onConfirm={handleConfirmListaAction}
        title="¿Marcar como listo?"
        description="Este ticket será marcado como listo y aparecerá en el área de entrega."
        confirmLabel="Marcar lista"
        cancelLabel="Cancelar"
        variant="info"
      />
    </>
  );
}

export default function KDSPage() {
  return (
    <ErrorBoundary moduleName="Cocina (KDS)">
      <KDSPageContent />
    </ErrorBoundary>
  );
}
