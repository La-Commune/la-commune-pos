"use client";

import { useState } from "react";
import {
  Heart,
  Search,
  Star,
  Gift,
  TrendingUp,
  Users,
  Award,
  Phone,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useSearch } from "@/hooks/useSearch";
import {
  MOCK_CLIENTES,
  MOCK_STATS_FIDELIDAD,
  MOCK_RECOMPENSAS,
  type MockCliente,
} from "@/lib/mock-data";

// TODO: Integración con Firebase - Reemplazar MOCK_CLIENTES con datos en tiempo real desde Firebase
// Planned flow:
// 1. Conectar con Firestore collection 'clientes'
// 2. Usar hook personalizado (useClientesFirebase) para fetch inicial y realtime listeners
// 3. Migrando MOCK_STATS_FIDELIDAD a Firestore aggregations
// 4. Mantener interfaz visual igual, solo cambiar fuente de datos

const nivelConfig = {
  bronce: { label: "Bronce", color: "text-status-warn", bg: "bg-status-warn-bg", min: 0 },
  plata: { label: "Plata", color: "text-text-45", bg: "bg-surface-3", min: 500 },
  oro: { label: "Oro", color: "text-accent", bg: "bg-accent-soft", min: 1000 },
};

export default function FidelidadPage() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<MockCliente | null>(null);
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);

  // useSearch hook para filtrado eficiente de clientes
  const { query, setQuery, filtered: clientesFiltrados } = useSearch({
    items: MOCK_CLIENTES,
    fields: ["nombre", "telefono"],
  });

  return (
    <ErrorBoundary moduleName="Fidelidad">
      <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      {/* Header — R9: Botón "Nuevo cliente" */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Fidelidad</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            Programa de puntos
          </span>
        </div>
        <button
          onClick={() => setModalNuevoCliente(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
        >
          <UserPlus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Clientes</span>
            <Users size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">{MOCK_STATS_FIDELIDAD.totalClientes}</p>
          <p className="text-[11px] text-text-25">{MOCK_STATS_FIDELIDAD.clientesActivos} activos este mes</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Puntos emitidos</span>
            <Star size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">{MOCK_STATS_FIDELIDAD.puntosEmitidos.toLocaleString("es-MX")}</p>
          <p className="text-[11px] text-text-25">$1 MXN = 1 punto</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Canjes este mes</span>
            <Gift size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">{MOCK_STATS_FIDELIDAD.canjesEsteMes}</p>
          <p className="text-[11px] text-text-25">Recompensas canjeadas</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Retención</span>
            <TrendingUp size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">73%</p>
          <p className="text-[11px] text-status-ok">+5% vs mes anterior</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Lista de clientes */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-25" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {clientesFiltrados.map((cliente) => {
              const nivel = nivelConfig[cliente.nivel];
              return (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSeleccionado(cliente)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl bg-surface-2 border text-left transition-all duration-300 ease-in-out hover:border-border-hover min-h-[44px]",
                    clienteSeleccionado?.id === cliente.id ? "border-accent" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-text-45">
                        {cliente.nombre.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-text-100 truncate">{cliente.nombre}</h3>
                      <p className="text-[11px] text-text-25">{cliente.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", nivel.bg, nivel.color)}>
                        {nivel.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-text-100 tabular-nums">{cliente.puntos.toLocaleString("es-MX")}</p>
                      <p className="text-[10px] text-text-25">puntos</p>
                    </div>
                    <ChevronRight size={14} className="text-text-25" />
                  </div>
                </button>
              );
            })}

            {/* R13: Empty state mejorado */}
            {clientesFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                  <Users size={24} className="text-text-25" />
                </div>
                <p className="text-sm text-text-45 mb-1">Sin resultados</p>
                <p className="text-xs text-text-25 text-center mb-3">No se encontraron clientes</p>
                <button
                  onClick={() => setModalNuevoCliente(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-xs min-h-[44px]"
                >
                  <UserPlus size={14} />
                  Registrar nuevo cliente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Panel de detalle */}
        {clienteSeleccionado ? (
          <div className="flex-shrink-0 bg-surface-2 border-l border-border p-5 overflow-y-auto rounded-2xl" style={{ width: "var(--panel-xl)" }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-medium text-text-45">
                  {clienteSeleccionado.nombre.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <h3 className="text-sm font-medium text-text-100">{clienteSeleccionado.nombre}</h3>
              <p className="text-[11px] text-text-25 flex items-center justify-center gap-1 mt-1">
                <Phone size={10} />{clienteSeleccionado.telefono}
              </p>
              <span className={cn("inline-flex items-center gap-1 mt-2 text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-lg", nivelConfig[clienteSeleccionado.nivel].bg, nivelConfig[clienteSeleccionado.nivel].color)}>
                <Award size={11} />{nivelConfig[clienteSeleccionado.nivel].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <div className="p-3 rounded-xl bg-surface-3 text-center">
                <p className="text-lg font-semibold text-text-100 tabular-nums">{clienteSeleccionado.puntos.toLocaleString("es-MX")}</p>
                <p className="text-[10px] text-text-25 uppercase tracking-widest">Puntos</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-3 text-center">
                <p className="text-lg font-semibold text-text-100 tabular-nums">{clienteSeleccionado.visitas}</p>
                <p className="text-[10px] text-text-25 uppercase tracking-widest">Visitas</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-text-45">Gasto total</span>
                <span className="text-text-100 font-medium tabular-nums">{formatMXN(clienteSeleccionado.gasto_total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-45">Ticket promedio</span>
                <span className="text-text-100 font-medium tabular-nums">{formatMXN(clienteSeleccionado.gasto_total / clienteSeleccionado.visitas)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-45">Última visita</span>
                <span className="text-text-100 font-medium">{new Date(clienteSeleccionado.ultima_visita).toLocaleDateString("es-MX")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-45">Miembro desde</span>
                <span className="text-text-100 font-medium">{new Date(clienteSeleccionado.miembro_desde).toLocaleDateString("es-MX")}</span>
              </div>
            </div>

            {/* Nivel progress — R6: Colores del design system */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Progreso al siguiente nivel</span>
              </div>
              {clienteSeleccionado.nivel !== "oro" ? (
                <>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-accent"
                      style={{
                        width: `${Math.min(100, (clienteSeleccionado.puntos / (clienteSeleccionado.nivel === "bronce" ? 500 : 1000)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-25">
                    {clienteSeleccionado.nivel === "bronce"
                      ? `${500 - clienteSeleccionado.puntos} puntos para Plata`
                      : `${1000 - clienteSeleccionado.puntos} puntos para Oro`}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-accent font-medium">Nivel máximo alcanzado</p>
              )}
            </div>

            {/* Recompensas */}
            <div>
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">Recompensas disponibles</span>
              <div className="space-y-1.5">
                {MOCK_RECOMPENSAS.map((r) => (
                  <div key={r.nombre} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{r.icon}</span>
                      <span className="text-xs text-text-100">{r.nombre}</span>
                    </div>
                    <button
                      disabled={clienteSeleccionado.puntos < r.puntos}
                      className={cn(
                        "text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-300 min-h-[32px]",
                        clienteSeleccionado.puntos >= r.puntos
                          ? "bg-accent-soft text-accent hover:opacity-80"
                          : "bg-surface-2 text-text-25 cursor-not-allowed"
                      )}
                    >
                      {r.puntos} pts
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* R13: Empty state mejorado */
          <div className="flex-shrink-0 flex items-center justify-center bg-surface-2 border-l border-border rounded-2xl" style={{ width: "var(--panel-xl)" }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
                <Heart size={24} className="text-text-25" />
              </div>
              <p className="text-sm text-text-45 mb-1">Selecciona un cliente</p>
              <p className="text-xs text-text-25">Elige de la lista para ver su detalle</p>
            </div>
          </div>
        )}
      </div>

      {/* R9: Modal nuevo cliente */}
      <Modal
        open={modalNuevoCliente}
        onClose={() => setModalNuevoCliente(false)}
        title="Registrar nuevo cliente"
      >
        <NuevoClienteForm
          onSave={() => setModalNuevoCliente(false)}
          onCancel={() => setModalNuevoCliente(false)}
        />
      </Modal>
      </div>
    </ErrorBoundary>
  );
}

/* R9: Form para nuevo cliente */
function NuevoClienteForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-5">
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">Nombre completo *</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Sofía Ramírez" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">Teléfono *</label>
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required placeholder="771-123-4567" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">Email (opcional)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sofia@email.com" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]" />
      </div>
      <p className="text-[11px] text-text-25 italic">El cliente comenzará en nivel Bronce con 0 puntos.</p>
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button type="submit" className="flex-1 py-3 rounded-xl btn-primary text-[13px] min-h-[44px]">Registrar cliente</button>
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]">Cancelar</button>
      </div>
    </form>
  );
}
