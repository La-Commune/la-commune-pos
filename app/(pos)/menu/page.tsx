"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
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
import ProductoContextMenu from "@/components/menu/ProductoContextMenu";
import { useCategorias, useProductos, insertRecord, updateRecord, deleteRecord } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { showToast } from "@/components/ui/Toast";
import { Grid3X3, List } from "lucide-react";

const tipoIcon = {
  drink: Coffee,
  food: UtensilsCrossed,
  other: Package,
};

export default function MenuPage() {
  const { data: categorias, loading: loadingCats, refetch: refetchCategorias } = useCategorias();
  const { data: productos, loading: loadingProds, refetch: refetchProductos } = useProductos();
  const user = useAuthStore((s) => s.user);
  const [categoriaActiva, setCategoriaActiva] = useState<string | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState<any | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any | null>(null);
  /* R2: Estado para confirmación de eliminar */
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  /* Context menu producto (right-click / long-press) */
  const [ctxMenu, setCtxMenu] = useState<{ producto: any; position: { x: number; y: number } } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Categoría CRUD */
  const [modalCategoria, setModalCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catTipo, setCatTipo] = useState<"drink" | "food" | "other">("drink");
  const { menuViewMode, setMenuViewMode, menuTileSize } = useUIStore();
  const loading = loadingCats || loadingProds;

  /* ── Handlers context menu producto ── */
  const handleProductoContextMenu = useCallback((e: React.MouseEvent, producto: any) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ producto, position: { x: e.clientX, y: e.clientY } });
  }, []);

  const handleProductoTouchStart = useCallback((e: React.TouchEvent, producto: any) => {
    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      setCtxMenu({ producto, position: pos });
    }, 500);
  }, []);

  const handleProductoTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCtxEdit = useCallback((producto: any) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  }, []);

  const handleCtxDelete = useCallback((producto: any) => {
    setProductoAEliminar(producto);
    setConfirmEliminar(true);
  }, []);

  const handleCtxToggle = useCallback(async (producto: any) => {
    const { success, error } = await updateRecord("productos", producto.id, {
      disponible: !producto.disponible,
    });
    if (success) {
      showToast(producto.disponible ? "Producto desactivado" : "Producto activado");
      // Si el panel detalle mostraba este producto, actualizarlo
      if (productoDetalle?.id === producto.id) {
        setProductoDetalle({ ...productoDetalle, disponible: !producto.disponible });
      }
      await refetchProductos();
    } else {
      showToast(`Error: ${error}`, "error");
    }
  }, [productoDetalle, refetchProductos]);

  const productosFiltrados = useMemo(() => {
    let lista = productos as any[];

    if (categoriaActiva !== "todas") {
      lista = lista.filter((p) => p.categoria_id === categoriaActiva);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p: any) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          (p.etiquetas ?? []).some((e: string) => e.toLowerCase().includes(q))
      );
    }

    if (soloDisponibles) {
      lista = lista.filter((p: any) => p.disponible);
    }

    return lista;
  }, [categoriaActiva, busqueda, soloDisponibles, productos]);

  const categoriaNombre = (id: string) =>
    (categorias as any[]).find((c) => c.id === id)?.nombre ?? "";

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)]" style={{ gap: "var(--density-gap)" }}>
      {/* ── Sidebar de Categorías ── */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: "var(--panel-sm)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium text-text-25 uppercase tracking-widest">
            Categorías
          </h2>
          {/* R1: Target táctil */}
          <button
            onClick={() => {
              setCategoriaEditando(null);
              setCatNombre("");
              setCatTipo("drink");
              setModalCategoria(true);
            }}
            className="p-2.5 rounded-xl text-text-25 hover:text-text-45 hover:bg-surface-2 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
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
              {productos.length}
            </span>
          </button>

          {(categorias as any[]).map((cat) => {
            const Icon = tipoIcon[cat.tipo as keyof typeof tipoIcon] ?? Package;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCategoriaEditando(cat);
                  setCatNombre(cat.nombre);
                  setCatTipo(cat.tipo ?? "drink");
                  setModalCategoria(true);
                }}
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
                  {productos.filter((p: any) => p.categoria_id === cat.id).length}
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
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-surface-2 rounded-lg p-0.5">
              <button
                onClick={() => setMenuViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  menuViewMode === "grid" ? "bg-surface-4 text-accent shadow-sm" : "text-text-45 hover:text-text-70"
                )}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setMenuViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  menuViewMode === "list" ? "bg-surface-4 text-accent shadow-sm" : "text-text-45 hover:text-text-70"
                )}
              >
                <List size={14} />
              </button>
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

        {/* Grid/List de productos */}
        <div className="flex-1 overflow-y-auto">
          {menuViewMode === "grid" ? (
            <div className={cn(
              "grid gap-2.5",
              menuTileSize === "sm" && "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
              menuTileSize === "md" && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
              menuTileSize === "lg" && "grid-cols-1 md:grid-cols-2"
            )}>
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => setProductoDetalle(producto)}
                  onContextMenu={(e) => handleProductoContextMenu(e, producto)}
                  onTouchStart={(e) => handleProductoTouchStart(e, producto)}
                  onTouchEnd={handleProductoTouchEnd}
                  onTouchMove={handleProductoTouchEnd}
                  className={cn(
                    "relative p-4 rounded-xl bg-surface-2 border border-border transition-all duration-[400ms] ease-smooth hover:-translate-y-0.5 hover:border-border-hover hover:shadow-lg hover:shadow-black/20 cursor-pointer select-none",
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
                    {(producto.tamanos ?? []).length > 0 && (
                      <span className="text-[10px] text-text-25 px-2 py-0.5 rounded-lg bg-surface-3">
                        {(producto.tamanos ?? []).length} tamaños
                      </span>
                    )}
                    {(producto.etiquetas ?? []).map((tag: string) => (
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
                </div>
              ))}
            </div>
          ) : (
            /* ── List view ── */
            <div className="space-y-1">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => setProductoDetalle(producto)}
                  onContextMenu={(e) => handleProductoContextMenu(e, producto)}
                  onTouchStart={(e) => handleProductoTouchStart(e, producto)}
                  onTouchEnd={handleProductoTouchEnd}
                  onTouchMove={handleProductoTouchEnd}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-2 border border-border transition-all duration-300 hover:border-border-hover hover:shadow-md cursor-pointer select-none",
                    !producto.disponible && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-100 truncate">{producto.nombre}</h3>
                    {producto.descripcion && (
                      <p className="text-[11px] text-text-25 truncate">{producto.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-text-25 px-2 py-0.5 rounded-lg bg-surface-3">
                      {categoriaNombre(producto.categoria_id)}
                    </span>
                    {(producto.etiquetas ?? []).map((tag: string) => (
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
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-lg bg-status-err-bg text-status-err">
                        N/D
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-text-100 tabular-nums w-20 text-right flex-shrink-0">
                    {formatMXN(producto.precio_base)}
                  </span>
                </div>
              ))}
            </div>
          )}

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

          {(productoDetalle.tamanos ?? []).length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Tamaños
              </span>
              <div className="space-y-1">
                {(productoDetalle.tamanos ?? []).map((t: any) => (
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

          {(productoDetalle.ingredientes ?? []).length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Ingredientes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(productoDetalle.ingredientes ?? []).map((ing: string) => (
                  <span key={ing} className="text-[10px] text-text-45 px-2 py-0.5 rounded-lg bg-surface-3">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(productoDetalle.etiquetas ?? []).length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-text-25 uppercase tracking-widest block mb-2">
                Etiquetas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(productoDetalle.etiquetas ?? []).map((tag: string) => (
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
              onClick={() => handleCtxEdit(productoDetalle)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-secondary text-[13px] min-h-[44px]"
            >
              <Pencil size={14} />
              Editar producto
            </button>
            <button
              onClick={() => handleCtxToggle(productoDetalle)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-ghost text-[13px] min-h-[44px]"
            >
              {productoDetalle.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
              {productoDetalle.disponible ? "Marcar no disponible" : "Marcar disponible"}
            </button>
          </div>
        </div>
      )}

      {/* Context menu producto (right-click / long-press) */}
      {ctxMenu && (
        <ProductoContextMenu
          producto={ctxMenu.producto}
          position={ctxMenu.position}
          onClose={() => setCtxMenu(null)}
          onEdit={handleCtxEdit}
          onDelete={handleCtxDelete}
          onToggleDisponible={handleCtxToggle}
        />
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
          onSave={async (data) => {
            if (saving) return;
            setSaving(true);
            try {
              const negocioId = user?.negocio_id;
              if (!negocioId) {
                showToast("Error: no se encontró el negocio", "error");
                return;
              }

              // Separar tamaños del payload principal
              const { tamanos, ...productoData } = data;

              if (productoEditando) {
                // ── Editar producto existente ──
                const { success, error } = await updateRecord("productos", productoEditando.id, productoData);
                if (!success) {
                  showToast(`Error al actualizar: ${error}`, "error");
                  return;
                }
                showToast("Producto actualizado");
              } else {
                // ── Crear producto nuevo ──
                const maxOrden = (productos as any[])
                  .filter((p: any) => p.categoria_id === data.categoria_id)
                  .reduce((max: number, p: any) => Math.max(max, p.orden ?? 0), 0);

                const { success, error } = await insertRecord("productos", {
                  ...productoData,
                  negocio_id: negocioId,
                  orden: maxOrden + 1,
                });
                if (!success) {
                  showToast(`Error al crear: ${error}`, "error");
                  return;
                }
                showToast("Producto creado");
              }

              setModalAbierto(false);
              setProductoEditando(null);
              await refetchProductos();
            } finally {
              setSaving(false);
            }
          }}
          onCancel={() => setModalAbierto(false)}
        />
      </Modal>

      {/* R2: Confirmación de eliminar producto */}
      <ConfirmDialog
        open={confirmEliminar}
        onClose={() => { setConfirmEliminar(false); setProductoAEliminar(null); }}
        onConfirm={async () => {
          if (!productoAEliminar?.id) return;
          const { success, error } = await deleteRecord("productos", productoAEliminar.id);
          if (success) {
            showToast("Producto eliminado");
            // Si el detalle mostraba este producto, cerrarlo
            if (productoDetalle?.id === productoAEliminar.id) {
              setProductoDetalle(null);
            }
            await refetchProductos();
          } else {
            showToast(`Error al eliminar: ${error}`, "error");
          }
          setProductoAEliminar(null);
        }}
        title="Eliminar producto"
        description={`¿Estás seguro de eliminar "${productoAEliminar?.nombre ?? ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* Modal crear/editar categoría */}
      <Modal
        open={modalCategoria}
        onClose={() => setModalCategoria(false)}
        title={categoriaEditando ? "Editar categoría" : "Nueva categoría"}
        size="sm"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving || !catNombre.trim()) return;
            setSaving(true);
            try {
              const negocioId = user?.negocio_id;
              if (!negocioId) {
                showToast("Error: no se encontró el negocio", "error");
                return;
              }

              if (categoriaEditando) {
                const { success, error } = await updateRecord("categorias_menu", categoriaEditando.id, {
                  nombre: catNombre.trim(),
                  tipo: catTipo,
                });
                if (!success) {
                  showToast(`Error: ${error}`, "error");
                  return;
                }
                showToast("Categoría actualizada");
              } else {
                const maxOrden = (categorias as any[]).reduce(
                  (max: number, c: any) => Math.max(max, c.orden ?? 0), 0
                );
                const { success, error } = await insertRecord("categorias_menu", {
                  nombre: catNombre.trim(),
                  tipo: catTipo,
                  negocio_id: negocioId,
                  orden: maxOrden + 1,
                });
                if (!success) {
                  showToast(`Error: ${error}`, "error");
                  return;
                }
                showToast("Categoría creada");
              }

              setModalCategoria(false);
              setCategoriaEditando(null);
              await refetchCategorias();
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              value={catNombre}
              onChange={(e) => setCatNombre(e.target.value)}
              placeholder="Ej: Postres"
              required
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Tipo
            </label>
            <div className="flex gap-2">
              {([
                { id: "drink" as const, label: "Bebida", Icon: Coffee },
                { id: "food" as const, label: "Comida", Icon: UtensilsCrossed },
                { id: "other" as const, label: "Otro", Icon: Package },
              ]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCatTipo(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-all",
                    catTipo === id
                      ? "border-accent text-accent bg-accent-soft"
                      : "border-border text-text-45 hover:border-border-hover"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={saving || !catNombre.trim()}
              className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50"
            >
              {categoriaEditando ? "Guardar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setModalCategoria(false)}
              className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
