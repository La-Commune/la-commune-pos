"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Coffee,
  UtensilsCrossed,
  Package,
  X,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProductoForm from "@/components/menu/ProductoForm";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  type Producto,
} from "@/lib/mock-data";

const tipoIcon = {
  drink: Coffee,
  food: UtensilsCrossed,
  other: Package,
};

export default function MenuPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<string | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  /* R2: Estado para confirmación de eliminar */
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

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
    // Delay to avoid closing immediately on the same click
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuAbierto]);

  const productosFiltrados = useMemo(() => {
    let lista = MOCK_PRODUCTOS;

    if (categoriaActiva !== "todas") {
      lista = lista.filter((p) => p.categoria_id === categoriaActiva);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.etiquetas.some((e) => e.toLowerCase().includes(q))
      );
    }

    if (soloDisponibles) {
      lista = lista.filter((p) => p.disponible);
    }

    return lista;
  }, [categoriaActiva, busqueda, soloDisponibles]);

  const categoriaNombre = (id: string) =>
    MOCK_CATEGORIAS.find((c) => c.id === id)?.nombre ?? "";

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)]" style={{ gap: "var(--density-gap)" }}>
      {/* ── Sidebar de Categorías ── */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: "var(--panel-sm)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
            Categorías
          </h2>
          {/* R1: Target táctil */}
          <button className="p-2.5 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-2 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-0.5 flex-1 overflow-y-auto">
          <button
            onClick={() => setCategoriaActiva("todas")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-all duration-300 min-h-[44px]",
              categoriaActiva === "todas"
                ? "bg-accent-soft text-accent font-medium"
                : "text-text-45 hover:text-text-70 hover:bg-surface-2"
            )}
          >
            <span>Todas</span>
            <span className="text-[11px] text-text-25 tabular-nums">
              {MOCK_PRODUCTOS.length}
            </span>
          </button>

          {MOCK_CATEGORIAS.map((cat) => {
            const Icon = tipoIcon[cat.tipo];
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-all duration-300 min-h-[44px]",
                  categoriaActiva === cat.id
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-text-45 hover:text-text-70 hover:bg-surface-2"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={14}
                    className={cn(
                      "flex-shrink-0",
                      categoriaActiva === cat.id ? "opacity-60" : "opacity-30"
                    )}
                  />
                  <span className="truncate">{cat.nombre}</span>
                </div>
                <span className="text-[11px] text-text-25 tabular-nums flex-shrink-0">
                  {cat._count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-text-100 tracking-tight">Menú</h1>
            <span className="text-xs font-medium px-3.5 py-1 rounded-full border border-border text-text-45">
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => {
              setProductoEditando(null);
              setModalAbierto(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-25" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-300 min-h-[44px]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-25 hover:text-text-45"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSoloDisponibles(!soloDisponibles)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all duration-300 min-h-[44px]",
              soloDisponibles
                ? "border-accent text-accent bg-accent-soft"
                : "border-border text-text-25 hover:text-text-45 hover:border-border-hover"
            )}
          >
            {soloDisponibles ? <Eye size={14} /> : <EyeOff size={14} />}
            Solo disponibles
          </button>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                onClick={() => setProductoDetalle(producto)}
                className={cn(
                  "relative p-4 rounded-xl bg-surface-2 border border-border transition-all duration-[400ms] ease-smooth hover:-translate-y-0.5 hover:border-border-hover hover:shadow-lg hover:shadow-black/20 cursor-pointer group",
                  !producto.disponible && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-medium text-text-100 leading-tight pr-2">
                    {producto.nombre}
                  </h3>
                  <span className="text-sm font-semibold text-text-100 tabular-nums flex-shrink-0">
                    {formatMXN(producto.precio_base)}
                  </span>
                </div>

                {producto.descripcion && (
                  <p className="text-[11px] text-text-25 mb-2.5 line-clamp-1">
                    {producto.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-text-25 px-2 py-0.5 rounded-lg bg-surface-3">
                    {categoriaNombre(producto.categoria_id)}
                  </span>
                  {producto.tamanos && producto.tamanos.length > 0 && (
                    <span className="text-[10px] text-text-25 px-2 py-0.5 rounded-lg bg-surface-3">
                      {producto.tamanos.length} tamaños
                    </span>
                  )}
                  {producto.etiquetas.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg",
                        tag === "popular" && "bg-status-ok-bg text-status-ok",
                        tag === "nuevo" && "bg-status-info-bg text-status-info",
                        tag === "especial" && "bg-accent-soft text-accent"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                  {!producto.disponible && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg bg-status-err-bg text-status-err">
                      No disponible
                    </span>
                  )}
                </div>

                {/* R1: Target táctil más grande para MoreHorizontal, R12: ref para cerrar al click fuera */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" ref={menuAbierto === producto.id ? menuRef : undefined}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAbierto(menuAbierto === producto.id ? null : producto.id);
                    }}
                    className="p-2.5 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-3 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {menuAbierto === producto.id && (
                    <div className="absolute right-0 top-12 w-40 py-1 bg-surface-3 border border-border rounded-xl shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductoEditando(producto);
                          setModalAbierto(true);
                          setMenuAbierto(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-70 hover:text-text-100 hover:bg-surface-4 transition-all duration-300 min-h-[44px]"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAbierto(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-text-70 hover:text-text-100 hover:bg-surface-4 transition-all duration-300 min-h-[44px]"
                      >
                        {producto.disponible ? <EyeOff size={13} /> : <Eye size={13} />}
                        {producto.disponible ? "Desactivar" : "Activar"}
                      </button>
                      {/* R2: Eliminar con confirmación */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductoAEliminar(producto);
                          setConfirmEliminar(true);
                          setMenuAbierto(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-status-err hover:bg-status-err-bg transition-all duration-300 min-h-[44px]"
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* R13: Empty state mejorado */}
          {productosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                <Coffee size={24} className="text-text-25" />
              </div>
              <p className="text-sm text-text-45 mb-1">No se encontraron productos</p>
              <p className="text-xs text-text-25">Prueba con otros filtros o búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel de Detalle ── */}
      {productoDetalle && (
        <div className="flex-shrink-0 bg-surface-2 border-l border-border p-5 overflow-y-auto" style={{ width: "var(--panel-xl)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
              Detalle
            </h2>
            <button
              onClick={() => setProductoDetalle(null)}
              className="p-2.5 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-3 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>

          <h3 className="text-base font-medium text-text-100 mb-1">
            {productoDetalle.nombre}
          </h3>
          <p className="text-lg font-semibold text-text-100 tabular-nums mb-3">
            {formatMXN(productoDetalle.precio_base)}
          </p>

          {productoDetalle.descripcion && (
            <p className="text-xs text-text-45 mb-4 leading-relaxed">
              {productoDetalle.descripcion}
            </p>
          )}

          <div className="mb-4">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-1.5">
              Categoría
            </span>
            <span className="text-xs text-text-70">
              {categoriaNombre(productoDetalle.categoria_id)}
            </span>
          </div>

          {productoDetalle.tamanos && productoDetalle.tamanos.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Tamaños
              </span>
              <div className="space-y-1">
                {productoDetalle.tamanos.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-surface-3"
                  >
                    <span className="text-xs text-text-70">{t.nombre}</span>
                    <span className="text-xs text-text-45 tabular-nums">
                      {t.precio_adicional > 0 ? `+${formatMXN(t.precio_adicional)}` : "Base"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {productoDetalle.ingredientes.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Ingredientes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {productoDetalle.ingredientes.map((ing) => (
                  <span key={ing} className="text-[10px] text-text-45 px-2 py-0.5 rounded-lg bg-surface-3">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {productoDetalle.etiquetas.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Etiquetas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {productoDetalle.etiquetas.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg",
                      tag === "popular" && "bg-status-ok-bg text-status-ok",
                      tag === "nuevo" && "bg-status-info-bg text-status-info",
                      tag === "especial" && "bg-accent-soft text-accent"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-1.5">
              Estado
            </span>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-lg",
                productoDetalle.disponible
                  ? "bg-status-ok-bg text-status-ok"
                  : "bg-status-err-bg text-status-err"
              )}
            >
              {productoDetalle.disponible ? "Disponible" : "No disponible"}
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setProductoEditando(productoDetalle);
                setModalAbierto(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-secondary text-[13px] min-h-[44px]"
            >
              <Pencil size={14} />
              Editar producto
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]">
              {productoDetalle.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
              {productoDetalle.disponible ? "Marcar no disponible" : "Marcar disponible"}
            </button>
          </div>
        </div>
      )}

      {/* Modal crear/editar producto */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={productoEditando ? "Editar producto" : "Nuevo producto"}
        size="lg"
      >
        <ProductoForm
          producto={productoEditando}
          onSave={(data) => {
            // TODO: Guardar en Supabase
            console.log("Guardar producto:", data);
            setModalAbierto(false);
          }}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>

      {/* R2: Confirmación de eliminar producto */}
      <ConfirmDialog
        open={confirmEliminar}
        onClose={() => { setConfirmEliminar(false); setProductoAEliminar(null); }}
        onConfirm={() => {
          // TODO: Eliminar en Supabase
          console.log("Eliminar producto:", productoAEliminar?.id);
          setProductoAEliminar(null);
        }}
        title="Eliminar producto"
        description={`¿Estás seguro de eliminar "${productoAEliminar?.nombre ?? ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
