"use client";

import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  Mail,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { useClientes, insertRecordReturning, updateRecord, subscribeToTable } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useSearch } from "@/hooks/useSearch";

interface Cliente {
  id: string;
  negocio_id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  total_visitas: number;
  total_gastado: number;
  ticket_promedio: number;
  puntos: number;
  nivel: string;
  activo: boolean;
  ultima_visita: string | null;
  creado_en: string;
}

const nivelConfig: Record<string, { label: string; color: string; bg: string; min: number }> = {
  bronce: { label: "Bronce", color: "text-status-warn", bg: "bg-status-warn-bg", min: 0 },
  plata: { label: "Plata", color: "text-text-45", bg: "bg-surface-3", min: 500 },
  oro: { label: "Oro", color: "text-accent", bg: "bg-accent-soft", min: 1000 },
};

const RECOMPENSAS = [
  { nombre: "Café gratis", puntos: 200, icon: "☕" },
  { nombre: "Postre gratis", puntos: 400, icon: "🍰" },
  { nombre: "10% descuento", puntos: 150, icon: "%" },
  { nombre: "Bebida especial", puntos: 300, icon: "🧋" },
];

function FidelidadPageContent() {
  const user = useAuthStore((s) => s.user);
  const { data: clientes, loading, refetch } = useClientes();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [modalEditarCliente, setModalEditarCliente] = useState(false);
  const [modalCanjear, setModalCanjear] = useState<{ nombre: string; puntos: number } | null>(null);
  const [canjeando, setCanjando] = useState(false);

  const clientesList = clientes as unknown as Cliente[];

  // Búsqueda
  const { query, setQuery, filtered: clientesFiltrados } = useSearch({
    items: clientesList,
    fields: ["nombre", "telefono"],
  });

  // Realtime
  useEffect(() => {
    const sub = subscribeToTable("clientes", () => refetch());
    return () => sub.unsubscribe();
  }, [refetch]);

  // Sync selected client with realtime data
  useEffect(() => {
    if (clienteSeleccionado) {
      const updated = clientesList.find((c) => c.id === clienteSeleccionado.id);
      if (updated) setClienteSeleccionado(updated);
    }
  }, [clientesList]);

  // KPIs calculados de datos reales
  const stats = useMemo(() => {
    const activos = clientesList.filter((c) => c.activo);
    const totalPuntos = clientesList.reduce((sum, c) => sum + c.puntos, 0);
    return {
      totalClientes: clientesList.length,
      clientesActivos: activos.length,
      puntosEmitidos: totalPuntos,
    };
  }, [clientesList]);

  // Canjear recompensa
  const handleCanjear = async () => {
    if (!clienteSeleccionado || !modalCanjear) return;
    setCanjando(true);
    try {
      const nuevosPuntos = clienteSeleccionado.puntos - modalCanjear.puntos;
      const { success } = await updateRecord("clientes", clienteSeleccionado.id, {
        puntos: nuevosPuntos,
        actualizado_en: new Date().toISOString(),
      });
      if (success) {
        showToast(`${modalCanjear.nombre} canjeado para ${clienteSeleccionado.nombre}`, "success");
        refetch();
      } else {
        showToast("Error al canjear recompensa", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setCanjando(false);
      setModalCanjear(null);
    }
  };

  // Guardar nuevo cliente
  const handleSaveCliente = async (datos: { nombre: string; telefono: string; email: string }) => {
    const res = await insertRecordReturning<Cliente>("clientes", {
      negocio_id: user?.negocio_id,
      nombre: datos.nombre,
      telefono: datos.telefono || null,
      email: datos.email || null,
      puntos: 0,
      nivel: "bronce",
      total_visitas: 0,
      total_gastado: 0,
      ticket_promedio: 0,
      activo: true,
    });
    if (res.success) {
      showToast("Cliente registrado", "success");
      refetch();
      setModalNuevoCliente(false);
      return true;
    } else {
      showToast(res.error || "Error al registrar", "error");
      return false;
    }
  };

  // Editar cliente
  const handleEditCliente = async (datos: { nombre: string; telefono: string; email: string }) => {
    if (!clienteSeleccionado) return false;
    const { success } = await updateRecord("clientes", clienteSeleccionado.id, {
      nombre: datos.nombre,
      telefono: datos.telefono || null,
      email: datos.email || null,
      actualizado_en: new Date().toISOString(),
    });
    if (success) {
      showToast("Cliente actualizado", "success");
      refetch();
      setModalEditarCliente(false);
      return true;
    } else {
      showToast("Error al actualizar", "error");
      return false;
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      {/* Header */}
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Clientes</span>
            <Users size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">{stats.totalClientes}</p>
          <p className="text-[11px] text-text-25">{stats.clientesActivos} activos</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Puntos en circulación</span>
            <Star size={14} className="text-text-25 opacity-40" />
          </div>
          <p className="text-xl font-semibold text-text-100 tabular-nums">{stats.puntosEmitidos.toLocaleString("es-MX")}</p>
          <p className="text-[11px] text-text-25">$1 MXN = 1 punto</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Niveles</span>
            <Award size={14} className="text-text-25 opacity-40" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {(["oro", "plata", "bronce"] as const).map((n) => {
              const count = clientesList.filter((c) => c.nivel === n).length;
              const conf = nivelConfig[n];
              return (
                <span key={n} className={cn("text-xs font-medium px-2 py-0.5 rounded-lg", conf.bg, conf.color)}>
                  {count} {conf.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-text-25" />
        </div>
      ) : (
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
              {clientesFiltrados.map((cliente: any) => {
                const nivel = nivelConfig[cliente.nivel] ?? nivelConfig.bronce;
                return (
                  <button
                    key={cliente.id}
                    onClick={() => setClienteSeleccionado(cliente)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl bg-surface-2 border text-left transition-all duration-300 ease-in-out hover:border-border-hover min-h-[44px]",
                      clienteSeleccionado?.id === cliente.id ? "border-accent" : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-text-45">
                          {cliente.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-medium text-text-100 truncate">{cliente.nombre}</h3>
                        <p className="text-[11px] text-text-25">{cliente.telefono ?? "Sin teléfono"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={cn("text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", nivel.bg, nivel.color)}>
                        {nivel.label}
                      </span>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-text-100 tabular-nums">{cliente.puntos.toLocaleString("es-MX")}</p>
                        <p className="text-xs text-text-25">puntos</p>
                      </div>
                      <ChevronRight size={14} className="text-text-25" />
                    </div>
                  </button>
                );
              })}

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
                    {clienteSeleccionado.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-100">{clienteSeleccionado.nombre}</h3>
                {clienteSeleccionado.telefono && (
                  <p className="text-[11px] text-text-25 flex items-center justify-center gap-1 mt-1">
                    <Phone size={10} />{clienteSeleccionado.telefono}
                  </p>
                )}
                {clienteSeleccionado.email && (
                  <p className="text-[11px] text-text-25 flex items-center justify-center gap-1 mt-0.5">
                    <Mail size={10} />{clienteSeleccionado.email}
                  </p>
                )}
                <span className={cn(
                  "inline-flex items-center gap-1 mt-2 text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-lg",
                  (nivelConfig[clienteSeleccionado.nivel] ?? nivelConfig.bronce).bg,
                  (nivelConfig[clienteSeleccionado.nivel] ?? nivelConfig.bronce).color,
                )}>
                  <Award size={11} />{(nivelConfig[clienteSeleccionado.nivel] ?? nivelConfig.bronce).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="p-3 rounded-xl bg-surface-3 text-center">
                  <p className="text-lg font-semibold text-text-100 tabular-nums">{clienteSeleccionado.puntos.toLocaleString("es-MX")}</p>
                  <p className="text-xs text-text-25 uppercase tracking-widest">Puntos</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-3 text-center">
                  <p className="text-lg font-semibold text-text-100 tabular-nums">{clienteSeleccionado.total_visitas}</p>
                  <p className="text-xs text-text-25 uppercase tracking-widest">Visitas</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-45">Gasto total</span>
                  <span className="text-text-100 font-medium tabular-nums">{formatMXN(clienteSeleccionado.total_gastado)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-45">Ticket promedio</span>
                  <span className="text-text-100 font-medium tabular-nums">{formatMXN(clienteSeleccionado.ticket_promedio)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-45">Última visita</span>
                  <span className="text-text-100 font-medium">
                    {clienteSeleccionado.ultima_visita
                      ? new Date(clienteSeleccionado.ultima_visita).toLocaleDateString("es-MX")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-45">Miembro desde</span>
                  <span className="text-text-100 font-medium">{new Date(clienteSeleccionado.creado_en).toLocaleDateString("es-MX")}</span>
                </div>
              </div>

              {/* Progreso de nivel */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Progreso al siguiente nivel</span>
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
                    <p className="text-xs text-text-25">
                      {clienteSeleccionado.nivel === "bronce"
                        ? `${Math.max(0, 500 - clienteSeleccionado.puntos)} puntos para Plata`
                        : `${Math.max(0, 1000 - clienteSeleccionado.puntos)} puntos para Oro`}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-accent font-medium">Nivel máximo alcanzado</p>
                )}
              </div>

              {/* Recompensas */}
              <div className="mb-5">
                <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Recompensas disponibles</span>
                <div className="space-y-1.5">
                  {RECOMPENSAS.map((r) => (
                    <div key={r.nombre} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{r.icon}</span>
                        <span className="text-xs text-text-100">{r.nombre}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (clienteSeleccionado.puntos >= r.puntos) {
                            setModalCanjear(r);
                          }
                        }}
                        disabled={clienteSeleccionado.puntos < r.puntos}
                        className={cn(
                          "text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all duration-300 min-h-[32px]",
                          clienteSeleccionado.puntos >= r.puntos
                            ? "bg-accent-soft text-accent hover:opacity-80"
                            : "bg-surface-2 text-text-25 cursor-not-allowed",
                        )}
                      >
                        {r.puntos} pts
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <button
                onClick={() => setModalEditarCliente(true)}
                className="w-full py-2.5 rounded-xl btn-ghost text-xs min-h-[44px]"
              >
                Editar datos del cliente
              </button>
            </div>
          ) : (
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
      )}

      {/* Modal nuevo cliente */}
      <Modal open={modalNuevoCliente} onClose={() => setModalNuevoCliente(false)} title="Registrar nuevo cliente">
        <ClienteForm
          onSave={handleSaveCliente}
          onCancel={() => setModalNuevoCliente(false)}
        />
      </Modal>

      {/* Modal editar cliente */}
      <Modal open={modalEditarCliente} onClose={() => setModalEditarCliente(false)} title="Editar cliente">
        <ClienteForm
          cliente={clienteSeleccionado}
          onSave={handleEditCliente}
          onCancel={() => setModalEditarCliente(false)}
        />
      </Modal>

      {/* Confirm canje */}
      {modalCanjear && (
        <Modal open={true} onClose={() => setModalCanjear(null)} title="Confirmar canje">
          <div className="space-y-4">
            <p className="text-sm text-text-70">
              ¿Canjear <strong>{modalCanjear.nombre}</strong> por <strong>{modalCanjear.puntos} puntos</strong> para{" "}
              <strong>{clienteSeleccionado?.nombre}</strong>?
            </p>
            <p className="text-xs text-text-25">
              Puntos actuales: {clienteSeleccionado?.puntos.toLocaleString("es-MX")} →{" "}
              {((clienteSeleccionado?.puntos ?? 0) - modalCanjear.puntos).toLocaleString("es-MX")}
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button
                onClick={handleCanjear}
                disabled={canjeando}
                className="flex-1 py-3 rounded-xl btn-primary text-[13px] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {canjeando && <Loader2 size={14} className="animate-spin" />}
                Confirmar canje
              </button>
              <button
                onClick={() => setModalCanjear(null)}
                disabled={canjeando}
                className="flex-1 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ClienteForm({
  cliente,
  onSave,
  onCancel,
}: {
  cliente?: Cliente | null;
  onSave: (datos: { nombre: string; telefono: string; email: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    await onSave({ nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim() });
    setGuardando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">Nombre completo *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej: Sofía Ramírez"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">Teléfono</label>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="771-123-4567"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">Email (opcional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sofia@email.com"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
        />
      </div>
      {!cliente && <p className="text-[11px] text-text-25 italic">El cliente comenzará en nivel Bronce con 0 puntos.</p>}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 py-3 rounded-xl btn-primary text-[13px] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {guardando && <Loader2 size={14} className="animate-spin" />}
          {cliente ? "Guardar cambios" : "Registrar cliente"}
        </button>
        <button type="button" onClick={onCancel} disabled={guardando} className="flex-1 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function FidelidadPage() {
  return (
    <ErrorBoundary moduleName="Fidelidad">
      <FidelidadPageContent />
    </ErrorBoundary>
  );
}
