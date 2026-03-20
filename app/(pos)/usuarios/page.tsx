"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChefHat,
  UserCheck,
  UserX,
  Loader2,
  KeyRound,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { cn } from "@/lib/utils";
import { useUsuarios, subscribeToTable } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { showToast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Rol = "admin" | "barista" | "camarero" | "cocina";

interface Usuario {
  id: string;
  auth_uid: string;
  negocio_id: string;
  nombre: string;
  email: string;
  rol: Rol;
  pin: string | null;
  activo: boolean;
  ultimo_acceso: string | null;
  creado_en: string;
}

const rolConfig: Record<Rol, { label: string; icon: typeof Shield; color: string; bg: string; desc: string }> = {
  admin: { label: "Admin", icon: ShieldAlert, color: "text-accent", bg: "bg-accent-soft", desc: "Acceso total" },
  barista: { label: "Barista", icon: ShieldCheck, color: "text-status-info", bg: "bg-status-info-bg", desc: "Órdenes + Cobros" },
  camarero: { label: "Camarero", icon: Shield, color: "text-status-ok", bg: "bg-status-ok-bg", desc: "Mesas + Órdenes" },
  cocina: { label: "Cocina", icon: ChefHat, color: "text-status-warn", bg: "bg-status-warn-bg", desc: "Solo KDS" },
};

function tiempoRelativo(iso: string | null) {
  if (!iso) return "Nunca";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

function UsuariosPageContent() {
  const user = useAuthStore((s) => s.user);
  const { data: usuarios, loading, refetch } = useUsuarios();

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<Usuario | null>(null);
  const [desactivando, setDesactivando] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);

  // Calcular posición del menú contextual al abrir
  useEffect(() => {
    if (!menuAbierto) { setMenuPos(null); return; }
    const btn = menuBtnRefs.current[menuAbierto];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = 110; // aprox alto del menú
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight;
    setMenuPos({
      top: openUp ? rect.top - menuHeight : rect.bottom + 4,
      left: rect.right - 192, // w-48 = 192px, alinear a la derecha
      openUp,
    });
  }, [menuAbierto]);

  // Realtime
  useEffect(() => {
    const sub = subscribeToTable("usuarios", () => {
      refetch();
    });
    return () => sub.unsubscribe();
  }, [refetch]);

  // Close context menu on outside click
  useEffect(() => {
    if (!menuAbierto) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(null);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuAbierto]);

  const usuariosList = usuarios as unknown as Usuario[];

  const usuariosFiltrados = usuariosList.filter((u) => {
    if (filtroRol !== "todos" && u.rol !== filtroRol) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDesactivar = async () => {
    if (!usuarioADesactivar) return;
    setDesactivando(true);
    try {
      const nuevoEstado = !usuarioADesactivar.activo;
      const res = await authFetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: usuarioADesactivar.id,
          activo: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          nuevoEstado
            ? `${usuarioADesactivar.nombre} activado`
            : `${usuarioADesactivar.nombre} desactivado`,
          "success",
        );
        refetch();
      } else {
        showToast(data.error || "Error al actualizar", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setDesactivando(false);
      setConfirmDesactivar(false);
      setUsuarioADesactivar(null);
    }
  };

  const handleSaveUsuario = async (datos: {
    nombre: string;
    email: string;
    rol: Rol;
    pin: string;
  }) => {
    if (usuarioEditando) {
      // EDIT
      const res = await authFetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: usuarioEditando.id,
          auth_uid: usuarioEditando.auth_uid,
          ...datos,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Usuario actualizado", "success");
        refetch();
        setModalAbierto(false);
        return true;
      } else {
        showToast(data.error || "Error al actualizar", "error");
        return false;
      }
    } else {
      // CREATE
      const res = await authFetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          negocio_id: user?.negocio_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Usuario creado", "success");
        refetch();
        setModalAbierto(false);
        return true;
      } else {
        showToast(data.error || "Error al crear usuario", "error");
        return false;
      }
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Usuarios</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            {usuariosList.filter((u) => u.activo).length} activos
          </span>
        </div>
        <button
          onClick={() => { setUsuarioEditando(null); setModalAbierto(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-25" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
          {(["todos", "admin", "barista", "camarero", "cocina"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-300 min-h-[44px]",
                filtroRol === r ? "bg-surface-4 text-text-100" : "text-text-25 hover:text-text-45",
              )}
            >
              {r === "todos" ? "Todos" : rolConfig[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-text-25" />
        </div>
      )}

      {/* Tabla */}
      {!loading && (
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <div className="rounded-xl border border-border overflow-hidden min-w-[750px]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_minmax(120px,200px)_100px_80px_100px_90px_48px] gap-3 px-5 py-3 bg-surface-2 border-b border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Nombre</span>
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Email</span>
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Rol</span>
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">PIN</span>
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Último acceso</span>
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Estado</span>
              <span />
            </div>
            {/* Rows */}
            {usuariosFiltrados.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-text-25">
                No se encontraron usuarios
              </div>
            )}
            {usuariosFiltrados.map((usuario) => {
              const rol = rolConfig[usuario.rol];
              const RolIcon = rol.icon;
              return (
                <div
                  key={usuario.id}
                  className={cn(
                    "grid grid-cols-[1fr_minmax(120px,200px)_100px_80px_100px_90px_48px] gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors duration-300",
                    !usuario.activo && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-medium text-text-45">
                        {usuario.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-text-100 truncate">{usuario.nombre}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-xs text-text-45 truncate">{usuario.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", rol.bg, rol.color)}>
                      <RolIcon size={11} />{rol.label}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-text-25 font-mono">
                      {usuario.pin ? `${usuario.pin.slice(0, 2)}••` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[11px] text-text-25 tabular-nums">{tiempoRelativo(usuario.ultimo_acceso)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={cn("flex items-center gap-1 text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", usuario.activo ? "bg-status-ok-bg text-status-ok" : "bg-status-err-bg text-status-err")}>
                      {usuario.activo ? <UserCheck size={10} /> : <UserX size={10} />}
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {/* Context menu trigger */}
                  <div className="flex items-center justify-end">
                    <button
                      ref={(el) => { menuBtnRefs.current[usuario.id] = el; }}
                      onClick={() => setMenuAbierto(menuAbierto === usuario.id ? null : usuario.id)}
                      className="p-2 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-2 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context menu flotante (fixed para no cortarse por overflow) */}
      {menuAbierto && menuPos && (() => {
        const usr = usuariosList.find((u) => u.id === menuAbierto);
        if (!usr) return null;
        return (
          <div
            ref={menuRef}
            className="fixed w-48 py-1 bg-surface-3 border border-border rounded-xl shadow-lg z-50"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => {
                setUsuarioEditando(usr);
                setModalAbierto(true);
                setMenuAbierto(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-70 hover:text-text-100 hover:bg-surface-2 transition-all duration-300 min-h-[44px]"
            >
              <Pencil size={13} />Editar
            </button>
            <button
              onClick={() => {
                setUsuarioADesactivar(usr);
                setConfirmDesactivar(true);
                setMenuAbierto(null);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-all duration-300 min-h-[44px]",
                usr.activo
                  ? "text-status-err hover:bg-status-err-bg"
                  : "text-status-ok hover:bg-status-ok-bg",
              )}
            >
              {usr.activo ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
              {usr.activo ? "Desactivar" : "Activar"}
            </button>
          </div>
        );
      })()}

      {/* Modal crear/editar usuario */}
      <Modal
        open={modalAbierto}
        onClose={() => { setModalAbierto(false); setUsuarioEditando(null); }}
        title={usuarioEditando ? "Editar usuario" : "Nuevo usuario"}
      >
        <UsuarioForm
          usuario={usuarioEditando}
          onSave={handleSaveUsuario}
          onCancel={() => { setModalAbierto(false); setUsuarioEditando(null); }}
        />
      </Modal>

      {/* Confirmación de activar/desactivar */}
      <ConfirmDialog
        open={confirmDesactivar}
        onClose={() => { setConfirmDesactivar(false); setUsuarioADesactivar(null); }}
        onConfirm={handleDesactivar}
        title={usuarioADesactivar?.activo ? "Desactivar usuario" : "Activar usuario"}
        description={
          usuarioADesactivar?.activo
            ? `¿Estás seguro de desactivar a "${usuarioADesactivar?.nombre ?? ""}"? El usuario no podrá acceder al sistema.`
            : `¿Reactivar a "${usuarioADesactivar?.nombre ?? ""}"? Podrá volver a iniciar sesión.`
        }
        confirmLabel={usuarioADesactivar?.activo ? "Desactivar" : "Activar"}
        variant={usuarioADesactivar?.activo ? "danger" : "warning"}
      />
    </div>
  );
}

function UsuarioForm({
  usuario,
  onSave,
  onCancel,
}: {
  usuario: Usuario | null;
  onSave: (datos: { nombre: string; email: string; rol: Rol; pin: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? "barista");
  const [pin, setPin] = useState(usuario?.pin ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !email.trim()) {
      setError("Nombre y email son requeridos");
      return;
    }

    if (pin && pin.length !== 4) {
      setError("El PIN debe ser de 4 dígitos");
      return;
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      setError("El PIN debe contener solo números");
      return;
    }

    setGuardando(true);
    const success = await onSave({ nombre: nombre.trim(), email: email.trim(), rol, pin });
    setGuardando(false);
    if (!success) {
      setError("Error al guardar. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Nombre completo *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej: Ana García"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!usuario}
          placeholder="ana@lacommune.mx"
          className={cn(
            "w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]",
            usuario && "opacity-60 cursor-not-allowed",
          )}
        />
        {usuario && (
          <p className="text-xs text-text-25 mt-1">El email no se puede cambiar después de crear el usuario</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
          <KeyRound size={10} className="inline mr-1" />
          PIN (4 dígitos)
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Ej: 1234"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px] font-mono tracking-[0.5em]"
        />
        <p className="text-xs text-text-25 mt-1">Para inicio de sesión rápido. Dejar vacío si no usa PIN.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-2">
          Rol *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(rolConfig) as [Rol, typeof rolConfig.admin][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRol(key)}
                className={cn(
                  "flex items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 text-left min-h-[44px]",
                  rol === key ? "border-accent bg-accent-soft" : "border-border hover:border-border-hover",
                )}
              >
                <Icon size={16} className={rol === key ? "text-accent" : "text-text-25"} />
                <div>
                  <span className={cn("text-xs font-medium block", rol === key ? "text-accent" : "text-text-70")}>
                    {config.label}
                  </span>
                  <span className="text-xs text-text-25">{config.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-xs text-status-err bg-status-err-bg px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 py-3 rounded-xl btn-primary text-[13px] min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {guardando && <Loader2 size={14} className="animate-spin" />}
          {usuario ? "Guardar cambios" : "Crear usuario"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={guardando}
          className="flex-1 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function UsuariosPage() {
  return (
    <ErrorBoundary moduleName="Usuarios">
      <UsuariosPageContent />
    </ErrorBoundary>
  );
}
