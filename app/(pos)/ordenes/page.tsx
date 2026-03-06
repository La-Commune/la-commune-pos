"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  X,
  ShoppingCart,
  Search,
  Clock,
  MessageSquare,
  Trash2,
  Send,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import {
  MOCK_CATEGORIAS,
  MOCK_PRODUCTOS,
  MOCK_ORDENES,
  type Producto,
  type ItemOrdenMock,
  type OrdenMock,
} from "@/lib/mock-data";

const estadoOrdenConfig = {
  nueva: { label: "Nueva", bg: "bg-blue-500/10", text: "text-blue-400" },
  confirmada: { label: "Confirmada", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  preparando: { label: "Preparando", bg: "bg-amber-500/10", text: "text-amber-400" },
  lista: { label: "Lista", bg: "bg-violet-500/10", text: "text-violet-400" },
  completada: { label: "Completada", bg: "bg-surface-3", text: "text-text-45" },
  cancelada: { label: "Cancelada", bg: "bg-red-500/10", text: "text-red-400" },
};

const origenLabel = {
  mesa: "Mesa",
  delivery: "Delivery",
  para_llevar: "Para llevar",
  online: "Online",
};

export default function OrdenesPage() {
  const [vista, setVista] = useState<"nueva" | "activas">("activas");
  const [categoriaActiva, setCategoriaActiva] = useState<string | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemOrdenMock[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenMock | null>(null);
  const [notasOrden, setNotasOrden] = useState("");

  // Productos filtrados para la vista "nueva orden"
  const productosFiltrados = useMemo(() => {
    let lista = MOCK_PRODUCTOS.filter((p) => p.disponible);
    if (categoriaActiva !== "todas") {
      lista = lista.filter((p) => p.categoria_id === categoriaActiva);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return lista;
  }, [categoriaActiva, busqueda]);

  // Totales del carrito
  const subtotal = carrito.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
  const impuesto = Math.round(subtotal * 0.16 * 100) / 100;
  const total = subtotal + impuesto;

  const agregarAlCarrito = (producto: Producto) => {
    const existente = carrito.find((i) => i.producto_id === producto.id);
    if (existente) {
      setCarrito(
        carrito.map((i) =>
          i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          id: `cart-${Date.now()}`,
          producto_id: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precio_unitario: producto.precio_base,
        },
      ]);
    }
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCarrito(
      carrito
        .map((i) =>
          i.producto_id === productoId ? { ...i, cantidad: i.cantidad + delta } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const tiempoTranscurrido = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-3.5rem-4rem)]">
      {/* ── Panel izquierdo: Órdenes activas o selector de productos ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs - Segmented Control Style */}
        <div className="flex items-center gap-0 mb-8 bg-surface-2 p-1 rounded-lg w-fit">
          <button
            onClick={() => setVista("activas")}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200",
              vista === "activas"
                ? "bg-surface-4 text-accent"
                : "text-text-45 hover:text-text-70"
            )}
          >
            Órdenes activas
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 tabular-nums font-medium">
              {MOCK_ORDENES.filter((o) => !["completada", "cancelada"].includes(o.estado)).length}
            </span>
          </button>
          <button
            onClick={() => setVista("nueva")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200",
              vista === "nueva"
                ? "bg-surface-4 text-accent"
                : "text-text-45 hover:text-text-70"
            )}
          >
            <Plus size={14} />
            Nueva orden
          </button>
        </div>

        {vista === "activas" ? (
          /* ── Lista de órdenes activas ── */
          <div className="flex-1 overflow-y-auto space-y-2">
            {MOCK_ORDENES.filter((o) => !["completada", "cancelada"].includes(o.estado)).map(
              (orden) => {
                const config = estadoOrdenConfig[orden.estado];
                return (
                  <button
                    key={orden.id}
                    onClick={() => setOrdenSeleccionada(orden)}
                    className={cn(
                      "w-full p-4 rounded-lg bg-surface-2 border text-left transition-all duration-300 hover:shadow-lg",
                      ordenSeleccionada?.id === orden.id
                        ? "border-accent shadow-lg shadow-violet-500/20"
                        : "border-border hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-text-100">
                          {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : origenLabel[orden.origen]}
                        </span>
                        <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md", config.bg, config.text)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-45">
                        <Clock size={13} />
                        <span className="text-[11px] tabular-nums">
                          {tiempoTranscurrido(orden.creado_en)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-text-45 mb-2">
                      {orden.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(" · ")}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-45">
                        {orden.items.reduce((a, i) => a + i.cantidad, 0)} items
                      </span>
                      <span className="text-sm font-semibold text-accent tabular-nums">
                        {formatMXN(orden.total)}
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        ) : (
          /* ── Selector de productos para nueva orden ── */
          <>
            {/* Categorías - Segmented Control Style */}
            <div className="flex items-center gap-0 mb-6 bg-surface-2 p-1 rounded-lg w-fit overflow-x-auto pb-1">
              <button
                onClick={() => setCategoriaActiva("todas")}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-200",
                  categoriaActiva === "todas"
                    ? "bg-surface-4 text-accent"
                    : "text-text-45 hover:text-text-70"
                )}
              >
                Todas
              </button>
              {MOCK_CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-200",
                    categoriaActiva === cat.id
                      ? "bg-surface-4 text-accent"
                      : "text-text-45 hover:text-text-70"
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative mb-6">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-45" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-45 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
              />
            </div>

            {/* Grid de productos moderno */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productosFiltrados.map((producto) => {
                  const enCarrito = carrito.find((i) => i.producto_id === producto.id);
                  return (
                    <button
                      key={producto.id}
                      onClick={() => agregarAlCarrito(producto)}
                      className={cn(
                        "relative p-4 rounded-lg bg-surface-2 border text-left transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10",
                        enCarrito
                          ? "border-accent shadow-md shadow-violet-500/20"
                          : "border-border hover:border-border"
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text-100 mb-1 line-clamp-2">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-accent font-semibold tabular-nums">
                        {formatMXN(producto.precio_base)}
                      </p>
                      {enCarrito && (
                        <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 text-surface-0 text-[11px] font-bold flex items-center justify-center shadow-lg">
                          {enCarrito.cantidad}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Panel derecho: Carrito / Detalle de orden ── */}
      <div className="w-96 flex-shrink-0 bg-surface-2 border-l border-border rounded-2xl mr-2 flex flex-col shadow-xl shadow-black/20">
        {vista === "nueva" ? (
          /* ── Carrito ── */
          <>
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={18} className="text-accent" />
                  <h2 className="text-sm font-semibold text-text-100">Orden nueva</h2>
                </div>
                <span className="text-[12px] text-text-45 tabular-nums font-medium">
                  {carrito.length} item{carrito.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {carrito.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-text-45 text-xs text-center uppercase tracking-widest font-medium">
                  Agrega productos<br />para iniciar
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-surface-3/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-text-100 truncate">
                          {item.nombre}
                        </h4>
                        <p className="text-xs text-text-45 tabular-nums">
                          {formatMXN(item.precio_unitario)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-surface-2 rounded-lg p-1">
                        <button
                          onClick={() => cambiarCantidad(item.producto_id, -1)}
                          className="w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center text-text-45 hover:text-accent transition-colors duration-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-semibold text-text-100 w-6 text-center tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.producto_id, 1)}
                          className="w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center text-text-45 hover:text-accent transition-colors duration-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-accent tabular-nums w-14 text-right">
                        {formatMXN(item.precio_unitario * item.cantidad)}
                      </span>
                    </div>
                  ))}

                  {/* Notas */}
                  <div className="pt-4 border-t border-border/50">
                    <textarea
                      placeholder="Notas de la orden..."
                      value={notasOrden}
                      onChange={(e) => setNotasOrden(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg bg-surface-3 border border-border text-text-70 text-xs placeholder:text-text-45 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Totales y enviar */}
                <div className="p-6 border-t border-border/50 space-y-3">
                  <div className="flex justify-between text-xs text-text-45">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium">{formatMXN(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-45">
                    <span>IVA (16%)</span>
                    <span className="tabular-nums font-medium">{formatMXN(impuesto)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-text-100 pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span className="tabular-nums text-accent">{formatMXN(total)}</span>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg btn-primary text-[13px] font-semibold mt-2">
                    <Send size={16} />
                    Enviar orden
                  </button>

                  <button
                    onClick={() => setCarrito([])}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg btn-ghost text-[13px] font-medium"
                  >
                    <Trash2 size={16} />
                    Vaciar
                  </button>
                </div>
              </>
            )}
          </>
        ) : ordenSeleccionada ? (
          /* ── Detalle de orden seleccionada ── */
          <>
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-100">
                  {ordenSeleccionada.mesa_numero
                    ? `Mesa ${ordenSeleccionada.mesa_numero}`
                    : origenLabel[ordenSeleccionada.origen]}
                </h2>
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="p-1.5 rounded-lg text-text-45 hover:text-text-100 hover:bg-surface-3 transition-colors duration-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const config = estadoOrdenConfig[ordenSeleccionada.estado];
                  return (
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md", config.bg, config.text)}>
                      {config.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-text-45 flex items-center gap-1.5 font-medium">
                  <Clock size={13} />
                  {tiempoTranscurrido(ordenSeleccionada.creado_en)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {ordenSeleccionada.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-surface-3/50 rounded-lg">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-sm font-bold text-accent tabular-nums w-5 text-center flex-shrink-0">
                      {item.cantidad}x
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-text-100 truncate">
                        {item.nombre}
                      </h4>
                      {item.tamano && (
                        <p className="text-xs text-text-45 font-medium">{item.tamano}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent tabular-nums flex-shrink-0">
                    {formatMXN(item.precio_unitario * item.cantidad)}
                  </span>
                </div>
              ))}

              {ordenSeleccionada.notas && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-start gap-3 p-3 bg-violet-500/5 rounded-lg border border-violet-500/20">
                    <MessageSquare size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-70 font-medium">
                      {ordenSeleccionada.notas}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="p-6 border-t border-border/50 space-y-3">
              <div className="flex justify-between text-xs text-text-45">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatMXN(ordenSeleccionada.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-45">
                <span>IVA</span>
                <span className="tabular-nums font-medium">{formatMXN(ordenSeleccionada.impuesto)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-100 pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="tabular-nums text-accent">{formatMXN(ordenSeleccionada.total)}</span>
              </div>

              {/* Acciones según estado */}
              <div className="space-y-3 pt-2">
                {ordenSeleccionada.estado === "nueva" && (
                  <button className="w-full py-3 rounded-lg btn-primary text-[13px] font-semibold">
                    Confirmar orden
                  </button>
                )}
                {ordenSeleccionada.estado === "confirmada" && (
                  <button className="w-full py-3 rounded-lg btn-primary text-[13px] font-semibold">
                    Enviar a cocina
                  </button>
                )}
                {ordenSeleccionada.estado === "lista" && (
                  <button className="w-full py-3 rounded-lg btn-primary text-[13px] font-semibold">
                    Cobrar
                  </button>
                )}
                <button className="w-full py-3 rounded-lg btn-ghost text-[13px] font-medium">
                  Cancelar orden
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Estado vacío ── */
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-text-45 text-xs text-center uppercase tracking-widest font-medium">
              Selecciona una orden<br />para ver el detalle
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
