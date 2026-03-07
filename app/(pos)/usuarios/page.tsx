"use client";

import { useState, useEffect, useRef } from "react";
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
  Mail,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Rol = "admin" | "barista" | "camarero" | "cocina";

interface UsuarioMock {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  ultimo_acceso: string | null;
}

const MOCK_USUARIOS: UsuarioMock[] = [
  { id: "u-1", nombre: "David Lara", email: "david@lacommune.mx", rol: "admin", activo: true, ultimo_acceso: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "u-2", nombre: "Ana García", email: "ana@lacommune.mx", rol: "barista", activo: true, ultimo_acceso: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "u-3", nombre: "Carlos Mendoza", email: "carlos@lacommune.mx", rol: "camarero", activo: true, ultimo_acceso: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "u-4", nombre: "María López", email: "maria@lacommune.mx", rol: "cocina", activo: true, ultimo_acceso: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: "u-5", nombre: "Pedro Ruiz", email: "pedro@lacommune.mx", rol: "barista", activo: false, ultimo_acceso: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "u-6", nombre: "Laura Sánchez", email: "laura@lacommune.mx", rol: "camarero", activo: true, ultimo_acceso: new Date(Date.now() - 24 * 3600000).toISOString() },
];

const rolConfig: Record<Rol, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  admin: { label: "Admin", icon: ShieldAlert, color: "text-accent", bg: "bg-accent-soft" },
  barista: { label: "Barista", icon: ShieldCheck, color: "text-status-info", bg: "bg-status-info-bg" },
  camarero: { label: "Camarero", icon: Shield, color: "text-status-ok", bg: "bg-status-ok-bg" },
  cocina: { label: "Cocina", icon: ChefHat, color: "text-status-warn", bg: "bg-status-warn-bg" },
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

export default function UsuariosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioMock | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  /* R2: Estado para confirmación de desactivar */
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<UsuarioMock | null>(null);

  /* R12: Ref para detectar click fuera del context menu */
  const menuRef = useRef<HTMLDivElement>(null);

  /* R12: Cerrar context menu al hacer click fuera */
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

  const usuariosFiltrados = MOCK_USUARIOS.filter((u) => {
    if (filtroRol !== "todos" && u.rol !== filtroRol) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-100 tracking-tight">Usuarios</h1>
          <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
            {MOCK_USUARIOS.filter((u) => u.activo).length} activos
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
                filtroRol === r ? "bg-surface-4 text-text-100" : "text-text-25 hover:text-text-45"
              )}
            >
              {r === "todos" ? "Todos" : rolConfig[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* R10: Tabla responsive — usa tabla semántica con min-widths en vez de grid fijo */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="rounded-xl border border-border overflow-hidden min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_minmax(120px,200px)_100px_100px_90px_48px] gap-3 px-5 py-3 bg-surface-2 border-b border-border">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Nombre</span>
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Email</span>
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Rol</span>
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Último acceso</span>
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest">Estado</span>
            <span />
          </div>
          {/* Rows */}
          {usuariosFiltrados.map((usuario) => {
            const rol = rolConfig[usuario.rol];
            const RolIcon = rol.icon;
            return (
              <div key={usuario.id} className="grid grid-cols-[1fr_minmax(120px,200px)_100px_100px_90px_48px] gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-medium text-text-45">{usuario.nombre.split(" ").map((n) => n[0]).join("")}</span>
                  </div>
                  <span className="text-xs font-medium text-text-100 truncate">{usuario.nombre}</span>
                </div>
                <div className="flex items-center min-w-0">
                  <span className="text-xs text-text-45 truncate">{usuario.email}</span>
                </div>
                <div className="flex items-center">
                  <span className={cn("flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", rol.bg, rol.color)}>
                    <RolIcon size={11} />{rol.label}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-[11px] text-text-25 tabular-nums">{tiempoRelativo(usuario.ultimo_acceso)}</span>
                </div>
                <div className="flex items-center">
                  <span className={cn("flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg", usuario.activo ? "bg-status-ok-bg text-status-ok" : "bg-status-err-bg text-status-err")}>
                    {usuario.activo ? <UserCheck size={10} /> : <UserX size={10} />}
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {/* R12: Context menu con ref para cerrar al click fuera */}
                <div className="flex items-center justify-end relative" ref={menuAbierto === usuario.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuAbierto(menuAbierto === usuario.id ? null : usuario.id)}
                    className="p-2 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-2 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuAbierto === usuario.id && (
                    <div className="absolute right-0 top-12 w-44 py-1 bg-surface-3 border border-border rounded-xl shadow-lg z-10">
                      <button
                        onClick={() => { setUsuarioEditando(usuario); setModalAbierto(true); setMenuAbierto(null); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-70 hover:text-text-100 hover:bg-surface-2 transition-all duration-300 min-h-[44px]"
                      >
                        <Pencil size={13} />Editar
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-70 hover:text-text-100 hover:bg-surface-2 transition-all duration-300 min-h-[44px]">
                        <Mail size={13} />Restablecer clave
                      </button>
                      {/* R2: Desactivar con confirmación */}
                      <button
                        onClick={() => {
                          setUsuarioADesactivar(usuario);
                          setConfirmDesactivar(true);
                          setMenuAbierto(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-status-err hover:bg-status-err-bg transition-all duration-300 min-h-[44px]"
                      >
                        <Trash2 size={13} />Desactivar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal crear/editar usuario */}
      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={usuarioEditando ? "Editar usuario" : "Nuevo usuario"}>
        <UsuarioForm usuario={usuarioEditando} onSave={() => setModalAbierto(false)} onCancel={() => setModalAbierto(false)} />
      </Modal>

      {/* R2: Confirmación de desactivar usuario */}
      <ConfirmDialog
        open={confirmDesactivar}
        onClose={() => { setConfirmDesactivar(false); setUsuarioADesactivar(null); }}
        onConfirm={() => {
          // TODO: Desactivar en Supabase
          console.log("Desactivar usuario:", usuarioADesactivar?.id);
          setUsuarioADesactivar(null);
        }}
        title="Desactivar usuario"
        description={`¿Estás seguro de desactivar a "${usuarioADesactivar?.nombre ?? ""}"? El usuario no podrá acceder al sistema.`}
        confirmLabel="Desactivar"
        variant="danger"
      />
    </div>
  );
}

function UsuarioForm({ usuario, onSave, onCancel }: { usuario: UsuarioMock | null; onSave: () => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? "barista");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-5">
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">Nombre completo *</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Ana García" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">Email *</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ana@lacommune.mx" className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Rol *</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(rolConfig) as [Rol, typeof rolConfig.admin][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button key={key} type="button" onClick={() => setRol(key)} className={cn("flex items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 text-left min-h-[44px]", rol === key ? "border-accent bg-accent-soft" : "border-border hover:border-border-hover")}>
                <Icon size={16} className={rol === key ? "text-accent" : "text-text-25"} />
                <div>
                  <span className={cn("text-xs font-medium block", rol === key ? "text-accent" : "text-text-70")}>{config.label}</span>
                  <span className="text-[10px] text-text-25">
                    {key === "admin" && "Acceso total"}{key === "barista" && "Órdenes + Cobros"}{key === "camarero" && "Mesas + Órdenes"}{key === "cocina" && "Solo KDS"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {!usuario && <p className="text-[11px] text-text-25 italic">Se enviará un email con la contraseña temporal al usuario.</p>}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button type="submit" className="flex-1 py-3 rounded-xl btn-primary text-[13px] min-h-[44px]">{usuario ? "Guardar cambios" : "Crear usuario"}</button>
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]">Cancelar</button>
      </div>
    </form>
  );
}
