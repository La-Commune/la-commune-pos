"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  MapPin,
  Truck,
  ShoppingBag,
  Globe,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { useCategorias, useProductos, useOrdenes, useMesas } from "@/hooks/useSupabase";
import { calcularIVA } from "@/hooks/useIVA";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useUIStore } from "@/store/ui.store";
import { Star } from "lucide-react";

/* P11: Colores migrados al design system */
const estadoOrdenConfig = {
  nueva: { label: "Nueva", bg: "bg-status-info-bg", text: "text-status-info" },
  confirmada: { label: "Confirmada", bg: "bg-status-ok-bg", text: "text-status-ok" },
  preparando: { label: "Preparando", bg: "bg-status-warn-bg", text: "text-status-warn" },
  lista: { label: "Lista", bg: "bg-accent-soft", text: "text-accent" },
  completada: { label: "Completada", bg: "bg-surface-3", text: "text-text-45" },
  cancelada: { label: "Cancelada", bg: "bg-status-err-bg", text: "text-status-err" },
};

const origenLabel = {
  mesa: "Mesa",
  delivery: "Delivery",
  para_llevar: "Para llevar",
  online: "Online",
};

/* P6: Config del selector de origen */
const origenOptions = [
  { id: "mesa" as const, label: "Mesa", icon: MapPin, desc: "Servir en mesa" },
  { id: "para_llevar" as const, label: "Para llevar", icon: ShoppingBag, desc: "Empaque para llevar" },
  { id: "delivery" as const, label: "Delivery", icon: Truck, desc: "Envío a domicilio" },
  { id: "online" as const, label: "Online", icon: Globe, desc: "Pedido web/app" },
];

type OrigenOrden = "mesa" | "delivery" | "para_llevar" | "online";

export default function OrdenesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categorias } = useCategorias();
  const { data: productos } = useProductos();
  const { data: ordenes } = useOrdenes();
  const { data: mesas } = useMesas();
  const mesasDisponibles = (mesas as any[]).filter((m: any) => m.estado === "disponible");
  const { favoriteProductIds, toggleFavoriteProduct, lastActiveTabs, setLastActiveTab } = useUIStore();
  const [vista, setVista] = useState<"nueva" | "activas">((lastActiveTabs.ordenes as "nueva" | "activas") || "activas");
  const [categoriaActiva, setCategoriaActiva] = useState<string | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<any[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<any | null>(null);
  const [notasOrden, setNotasOrden] = useState("");

  /* P6: Estado del selector de origen */
  const [origenSeleccionado, setOrigenSeleccionado] = useState<OrigenOrden | null>(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null);
  const [pasoOrden, setPasoOrden] = useState<"origen" | "productos">("origen");

  /* P3: Estado del confirm dialog */
  const [confirmVaciar, setConfirmVaciar] = useState(false);
  const [confirmCancelar, setConfirmCancelar] = useState(false);

  /* P5: Loading states */
  const [enviandoOrden, setEnviandoOrden] = useState(false);
  const [confirmandoOrden, setConfirmandoOrden] = useState(false);

  /* P17: Ref para scroll de categorías */
  const categoriasRef = useRef<HTMLDivElement>(null);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  /* P7: Deep-linking — seleccionar mesa desde query param */
  useEffect(() => {
    const mesaParam = searchParams.get("mesa");
    if (mesaParam) {
      const mesaNum = parseInt(mesaParam);
      const mesaExiste = mesasDisponibles.some((m) => m.numero === mesaNum);
      if (mesaExiste) {
        setVista("nueva");
        setPasoOrden("productos");
        setOrigenSeleccionado("mesa");
        setMesaSeleccionada(mesaNum);
      } else {
        // Mesa no existe, ir a selección de origen
        setVista("nueva");
        setPasoOrden("origen");
      }
    }
  }, [searchParams]);

  /* P17: Detectar scroll overflow */
  useEffect(() => {
    const el = categoriasRef.current;
    if (!el) return;
    const checkScroll = () => {
      setShowScrollLeft(el.scrollLeft > 5);
      setShowScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [vista, pasoOrden]);

  const productosFiltrados = useMemo(() => {
    let lista = (productos as any[]).filter((p: any) => p.disponible);
    if (categoriaActiva !== "todas") {
      lista = lista.filter((p) => p.categoria_id === categoriaActiva);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return lista;
  }, [categoriaActiva, busqueda]);

  // Precios ya incluyen IVA — el total es la suma directa
  const totalCarrito = carrito.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
  // Desglose fiscal (hacia atrás): base gravable + IVA = total
  const { baseGravable, iva } = calcularIVA(totalCarrito);

  const agregarAlCarrito = (producto: any) => {
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

  /* P5: Simular envío de orden con loading */
  const handleEnviarOrden = async () => {
    setEnviandoOrden(true);
    // TODO: Enviar a Supabase
    await new Promise((r) => setTimeout(r, 1200));
    setEnviandoOrden(false);
    setCarrito([]);
    setNotasOrden("");
    setPasoOrden("origen");
    setOrigenSeleccionado(null);
    setMesaSeleccionada(null);
    setVista("activas");
  };

  const handleConfirmarOrden = async () => {
    setConfirmandoOrden(true);
    // TODO: Confirmar en Supabase
    await new Promise((r) => setTimeout(r, 800));
    setConfirmandoOrden(false);
  };

  /* P6: Handler para seleccionar origen y avanzar */
  const handleSeleccionarOrigen = (origen: OrigenOrden) => {
    setOrigenSeleccionado(origen);
    if (origen !== "mesa") {
      setMesaSeleccionada(null);
      setPasoOrden("productos");
    }
  };

  const handleSeleccionarMesa = (numero: number) => {
    setMesaSeleccionada(numero);
    setPasoOrden("productos");
  };

  /* P17: Scroll helpers */
  const scrollCategorias = (direction: "left" | "right") => {
    const el = categoriasRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -150 : 150, behavior: "smooth" });
  };

  return (
    <ErrorBoundary moduleName="Órdenes">
      <div className="flex h-[calc(100vh-3.5rem-4rem)]" style={{ gap: "var(--density-gap)" }}>
      {/* ── Panel izquierdo ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-0 mb-8 bg-surface-2 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setVista("activas"); setLastActiveTab("ordenes", "activas"); }}
            className={cn(
              "px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-200 min-h-[44px]",
              vista === "activas"
                ? "bg-surface-4 text-accent"
                : "text-text-45 hover:text-text-70"
            )}
          >
            Órdenes activas
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-md bg-accent-soft text-accent tabular-nums font-medium">
              {(ordenes as any[]).filter((o) => !["completada", "cancelada"].includes(o.estado)).length}
            </span>
          </button>
          <button
            onClick={() => {
              setVista("nueva");
              setLastActiveTab("ordenes", "nueva");
              if (!origenSeleccionado) setPasoOrden("origen");
            }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-200 min-h-[44px]",
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
            {(ordenes as any[]).filter((o) => !["completada", "cancelada"].includes(o.estado)).map(
              (orden) => {
                const config = estadoOrdenConfig[orden.estado as keyof typeof estadoOrdenConfig];
                return (
                  <button
                    key={orden.id}
                    onClick={() => setOrdenSeleccionada(orden)}
                    className={cn(
                      "w-full p-4 rounded-xl bg-surface-2 border text-left transition-all duration-300 hover:shadow-lg min-h-[44px]",
                      ordenSeleccionada?.id === orden.id
                        ? "border-accent shadow-lg shadow-accent/10"
                        : "border-border hover:border-border-hover"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-text-100">
                          {orden.mesa_numero ? `Mesa ${orden.mesa_numero}` : origenLabel[orden.origen as keyof typeof origenLabel]}
                        </span>
                        <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-lg", config?.bg, config?.text)}>
                          {config?.label}
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
                      {(orden.items ?? []).map((i: any) => `${i.cantidad}x ${i.nombre}`).join(" · ")}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-45">
                        {(orden.items ?? []).reduce((a: number, i: any) => a + i.cantidad, 0)} items
                      </span>
                      <span className="text-sm font-semibold text-accent tabular-nums">
                        {formatMXN(orden.total)}
                      </span>
                    </div>
                  </button>
                );
              }
            )}

            {/* P15: Empty state mejorado */}
            {(ordenes as any[]).filter((o) => !["completada", "cancelada"].includes(o.estado)).length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                  <ClipboardList size={28} className="text-text-25" />
                </div>
                <p className="text-sm text-text-45 mb-1">Sin órdenes activas</p>
                <p className="text-xs text-text-25">Crea una nueva orden para comenzar</p>
                <button
                  onClick={() => { setVista("nueva"); setPasoOrden("origen"); }}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
                >
                  <Plus size={16} />
                  Nueva orden
                </button>
              </div>
            )}
          </div>
        ) : pasoOrden === "origen" ? (
          /* ── P6: Paso 1 — Selector de origen ── */
          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-medium text-text-100 mb-1">Tipo de orden</h2>
            <p className="text-xs text-text-25 mb-6">Selecciona el origen de la orden</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {origenOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSeleccionarOrigen(opt.id)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 text-left min-h-[44px]",
                      origenSeleccionado === opt.id
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-surface-2 hover:border-border-hover hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      origenSeleccionado === opt.id ? "bg-accent/10" : "bg-surface-3"
                    )}>
                      <Icon size={22} className={origenSeleccionado === opt.id ? "text-accent" : "text-text-45"} />
                    </div>
                    <div>
                      <span className={cn(
                        "text-sm font-medium block",
                        origenSeleccionado === opt.id ? "text-accent" : "text-text-100"
                      )}>{opt.label}</span>
                      <span className="text-[11px] text-text-25">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selector de mesa si eligió "mesa" */}
            {origenSeleccionado === "mesa" && (
              <div>
                <h3 className="text-sm font-medium text-text-100 mb-1">Selecciona mesa</h3>
                <p className="text-xs text-text-25 mb-4">Mesas disponibles</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {mesasDisponibles.map((mesa) => (
                    <button
                      key={mesa.numero}
                      onClick={() => handleSeleccionarMesa(mesa.numero)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all duration-300 min-h-[44px]",
                        mesaSeleccionada === mesa.numero
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-surface-2 hover:border-border-hover"
                      )}
                    >
                      <div className={cn(
                        "text-2xl font-bold tabular-nums mb-1",
                        mesaSeleccionada === mesa.numero ? "text-accent" : "text-text-100"
                      )}>
                        {mesa.numero}
                      </div>
                      <div className="text-[10px] text-text-25">{mesa.ubicacion} · {mesa.capacidad}p</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Selector de productos para nueva orden ── */
          <>
            {/* P6: Badge del origen seleccionado */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setPasoOrden("origen")}
                className="flex items-center gap-1.5 text-xs text-text-45 hover:text-text-70 transition-colors min-h-[44px] px-2"
              >
                <ChevronLeft size={14} />
                Cambiar origen
              </button>
              <span className="text-xs font-medium text-accent bg-accent-soft px-3 py-1.5 rounded-lg">
                {origenSeleccionado === "mesa" && mesaSeleccionada
                  ? `Mesa ${mesaSeleccionada}`
                  : origenOptions.find((o) => o.id === origenSeleccionado)?.label}
              </span>
            </div>

            {/* P17: Categorías con indicadores de scroll */}
            <div className="relative mb-6">
              {showScrollLeft && (
                <button
                  onClick={() => scrollCategorias("left")}
                  className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-surface-0 to-transparent"
                >
                  <ChevronLeft size={16} className="text-text-45" />
                </button>
              )}
              <div
                ref={categoriasRef}
                className="flex items-center gap-0 bg-surface-2 p-1 rounded-xl w-full overflow-x-auto scrollbar-thin"
              >
                <button
                  onClick={() => setCategoriaActiva("todas")}
                  className={cn(
                    "px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-200 min-h-[44px]",
                    categoriaActiva === "todas"
                      ? "bg-surface-4 text-accent"
                      : "text-text-45 hover:text-text-70"
                  )}
                >
                  Todas
                </button>
                {(categorias as any[]).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-200 min-h-[44px]",
                      categoriaActiva === cat.id
                        ? "bg-surface-4 text-accent"
                        : "text-text-45 hover:text-text-70"
                    )}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
              {showScrollRight && (
                <button
                  onClick={() => scrollCategorias("right")}
                  className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-surface-0 to-transparent"
                >
                  <ChevronRight size={16} className="text-text-45" />
                </button>
              )}
            </div>

            {/* Favoritos */}
            {favoriteProductIds.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-text-25 uppercase tracking-widest mb-2">Favoritos</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {favoriteProductIds.map((fid) => {
                    const prod = (productos as any[]).find((p) => p.id === fid);
                    if (!prod) return null;
                    const enCarrito = carrito.find((i) => i.producto_id === prod.id);
                    return (
                      <button
                        key={fid}
                        onClick={() => agregarAlCarrito(prod)}
                        className={cn(
                          "flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-all duration-200 min-w-[100px]",
                          enCarrito ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:border-border-hover"
                        )}
                      >
                        <span className="text-[11px] font-medium text-text-100 block truncate">{prod.nombre}</span>
                        <span className="text-[10px] text-accent tabular-nums">{formatMXN(prod.precio_base)}</span>
                        {enCarrito && (
                          <span className="text-[10px] text-accent font-bold ml-1">x{enCarrito.cantidad}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Búsqueda */}
            <div className="relative mb-6">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-45" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-45 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 min-h-[44px]"
              />
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productosFiltrados.map((producto) => {
                  const enCarrito = carrito.find((i) => i.producto_id === producto.id);
                  return (
                    <button
                      key={producto.id}
                      onClick={() => agregarAlCarrito(producto)}
                      className={cn(
                        "relative p-4 rounded-xl bg-surface-2 border text-left transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 min-h-[44px] group",
                        enCarrito
                          ? "border-accent shadow-md shadow-accent/10"
                          : "border-border hover:border-border-hover"
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text-100 mb-1 line-clamp-2">
                        {producto.nombre}
                      </h3>
                      <p className="text-xs text-accent font-semibold tabular-nums">
                        {formatMXN(producto.precio_base)}
                      </p>
                      {enCarrito && (
                        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent text-surface-0 text-[11px] font-bold flex items-center justify-center shadow-lg">
                          {enCarrito.cantidad}
                        </span>
                      )}
                      {/* Favorite toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavoriteProduct(producto.id); }}
                        className={cn(
                          "absolute bottom-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                          favoriteProductIds.includes(producto.id) ? "text-accent opacity-100" : "text-text-25 hover:text-accent"
                        )}
                      >
                        <Star size={12} fill={favoriteProductIds.includes(producto.id) ? "currentColor" : "none"} />
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Panel derecho: Carrito / Detalle de orden ── */}
      <div className="flex-shrink-0 bg-surface-2 border-l border-border rounded-2xl mr-2 flex flex-col shadow-xl shadow-black/20" style={{ width: "var(--panel-lg)" }}>
        {vista === "nueva" ? (
          /* ── Carrito ── */
          <>
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={18} className="text-accent" />
                  <h2 className="text-sm font-semibold text-text-100">
                    {origenSeleccionado === "mesa" && mesaSeleccionada
                      ? `Mesa ${mesaSeleccionada}`
                      : origenSeleccionado
                        ? origenOptions.find((o) => o.id === origenSeleccionado)?.label ?? "Orden nueva"
                        : "Orden nueva"}
                  </h2>
                </div>
                <span className="text-[12px] text-text-45 tabular-nums font-medium">
                  {carrito.length} item{carrito.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {carrito.length === 0 ? (
              /* P15: Empty state mejorado */
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
                  <ShoppingCart size={24} className="text-text-25" />
                </div>
                <p className="text-sm text-text-45 mb-1">Carrito vacío</p>
                <p className="text-xs text-text-25 text-center">
                  Selecciona productos del menú<br />para agregarlos a la orden
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-surface-3/50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-text-100 truncate">
                          {item.nombre}
                        </h4>
                        <p className="text-xs text-text-45 tabular-nums">
                          {formatMXN(item.precio_unitario)}
                        </p>
                      </div>

                      {/* P1: Targets táctiles aumentados a 44px */}
                      <div className="flex items-center gap-1.5 bg-surface-2 rounded-xl p-1">
                        <button
                          onClick={() => cambiarCantidad(item.producto_id, -1)}
                          className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center text-text-45 hover:text-accent hover:bg-surface-4 transition-colors duration-200"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-semibold text-text-100 w-8 text-center tabular-nums">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.producto_id, 1)}
                          className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center text-text-45 hover:text-accent hover:bg-surface-4 transition-colors duration-200"
                        >
                          <Plus size={16} />
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
                      className="w-full px-4 py-3 rounded-xl bg-surface-3 border border-border text-text-70 text-xs placeholder:text-text-45 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Totales y enviar */}
                <div className="p-6 border-t border-border/50 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-text-100">
                    <span>Total</span>
                    <span className="tabular-nums text-accent">{formatMXN(totalCarrito)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-25">
                    <span>IVA incluido</span>
                    <span className="tabular-nums">{formatMXN(iva)}</span>
                  </div>

                  {/* P5: Botón con loading state */}
                  <button
                    onClick={handleEnviarOrden}
                    disabled={enviandoOrden}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl btn-primary text-[13px] font-semibold mt-2 min-h-[48px]",
                      enviandoOrden && "opacity-70 cursor-wait"
                    )}
                  >
                    {enviandoOrden ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar orden
                      </>
                    )}
                  </button>

                  {/* P3: Vaciar con confirmación */}
                  <button
                    onClick={() => setConfirmVaciar(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-ghost text-[13px] font-medium min-h-[44px]"
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
                    : origenLabel[ordenSeleccionada.origen as keyof typeof origenLabel]}
                </h2>
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="p-2.5 rounded-xl text-text-45 hover:text-text-100 hover:bg-surface-3 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const config = estadoOrdenConfig[ordenSeleccionada.estado as keyof typeof estadoOrdenConfig];
                  return (
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg", config?.bg, config?.text)}>
                      {config?.label}
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
              {(ordenSeleccionada.items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-surface-3/50 rounded-xl">
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
                  <div className="flex items-start gap-3 p-3 bg-accent-soft/30 rounded-xl border border-accent/10">
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
              <div className="flex justify-between text-sm font-bold text-text-100">
                <span>Total</span>
                <span className="tabular-nums text-accent">{formatMXN(ordenSeleccionada.total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-text-25">
                <span>IVA incluido</span>
                <span className="tabular-nums">{formatMXN(ordenSeleccionada.impuesto)}</span>
              </div>

              {/* Acciones con P5 loading y P7 deep-link */}
              <div className="space-y-3 pt-2">
                {ordenSeleccionada.estado === "nueva" && (
                  <button
                    onClick={handleConfirmarOrden}
                    disabled={confirmandoOrden}
                    className={cn(
                      "w-full py-3.5 rounded-xl btn-primary text-[13px] font-semibold flex items-center justify-center gap-2 min-h-[48px]",
                      confirmandoOrden && "opacity-70 cursor-wait"
                    )}
                  >
                    {confirmandoOrden ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      "Confirmar orden"
                    )}
                  </button>
                )}
                {ordenSeleccionada.estado === "confirmada" && (
                  <button className="w-full py-3.5 rounded-xl btn-primary text-[13px] font-semibold min-h-[48px]">
                    Enviar a cocina
                  </button>
                )}
                {/* P7: Deep-link a cobros */}
                {ordenSeleccionada.estado === "lista" && (
                  <button
                    onClick={() => router.push(`/cobros?orden=${ordenSeleccionada.id}`)}
                    className="w-full py-3.5 rounded-xl btn-primary text-[13px] font-semibold min-h-[48px]"
                  >
                    Cobrar
                  </button>
                )}
                {/* P3: Cancelar con confirmación */}
                <button
                  onClick={() => setConfirmCancelar(true)}
                  className="w-full py-3 rounded-xl btn-ghost text-[13px] font-medium min-h-[44px]"
                >
                  Cancelar orden
                </button>
              </div>
            </div>
          </>
        ) : (
          /* P15: Empty state mejorado */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mb-3">
              <ClipboardList size={24} className="text-text-25" />
            </div>
            <p className="text-sm text-text-45 mb-1">Sin orden seleccionada</p>
            <p className="text-xs text-text-25 text-center">
              Selecciona una orden de la lista<br />para ver su detalle
            </p>
          </div>
        )}
      </div>

      {/* P3: Confirm Dialogs */}
      <ConfirmDialog
        open={confirmVaciar}
        onClose={() => setConfirmVaciar(false)}
        onConfirm={() => {
          setCarrito([]);
          setNotasOrden("");
        }}
        title="Vaciar carrito"
        description="Se eliminarán todos los productos del carrito. Esta acción no se puede deshacer."
        confirmLabel="Vaciar"
        variant="danger"
      />
      <ConfirmDialog
        open={confirmCancelar}
        onClose={() => setConfirmCancelar(false)}
        onConfirm={() => {
          // TODO: Cancelar en Supabase
          setOrdenSeleccionada(null);
        }}
        title="Cancelar orden"
        description={`¿Estás seguro de cancelar la orden de ${ordenSeleccionada?.mesa_numero ? `Mesa ${ordenSeleccionada.mesa_numero}` : ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar orden"
        variant="danger"
      />
      </div>
    </ErrorBoundary>
  );
}
