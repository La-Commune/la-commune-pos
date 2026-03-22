"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  ChefHat,
  History,
  TrendingDown,
  Filter,
  X,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useInventario, useMovimientosInventario, useRecetas, useProductos, insertRecord, updateRecord, deleteRecord, subscribeToTable } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store/auth.store";
import { showToast } from "@/components/ui/Toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import type { MockInventario, MockMovimientoInventario, MockReceta } from "@/lib/mock-data";

type TabType = "inventario" | "movimientos" | "recetas" | "mermas";

interface InventarioForm {
  nombre: string;
  descripcion: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string;
}

interface MovimientoForm {
  inventario_id: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  referencia: string;
  notas: string;
}

interface RecetaForm {
  producto_id: string;
  inventario_id: string;
  cantidad_necesaria: number;
}

export default function InventarioPage() {
  const user = useAuthStore((s) => s.user);
  const { data: inventario, loading: loadingInv, refetch: refetchInv } = useInventario();
  const { data: movimientos, loading: loadingMov, refetch: refetchMov } = useMovimientosInventario();
  const { data: recetas, loading: loadingRecetas, refetch: refetchRecetas } = useRecetas();
  const { data: productos } = useProductos();

  // ── TAB STATE ──
  const [tabActiva, setTabActiva] = useState<TabType>("inventario");

  // ── INVENTARIO TAB ──
  const [busqueda, setBusqueda] = useState("");
  const [filtroInventario, setFiltroInventario] = useState<"todos" | "stock_bajo" | "activo" | "inactivo">("todos");
  const [modalInventarioAbierto, setModalInventarioAbierto] = useState(false);
  const [inventarioEditando, setInventarioEditando] = useState<MockInventario | null>(null);
  const [formInv, setFormInv] = useState<InventarioForm>({
    nombre: "",
    descripcion: "",
    unidad_medida: "kg",
    stock_actual: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    proveedor: "",
  });
  const [guardandoInv, setGuardandoInv] = useState(false);
  const [confirmEliminarInv, setConfirmEliminarInv] = useState(false);
  const [invAEliminar, setInvAEliminar] = useState<MockInventario | null>(null);

  // ── AGREGAR/RETIRAR STOCK ──
  const [modalStockAbierto, setModalStockAbierto] = useState(false);
  const [tipoStock, setTipoStock] = useState<"entrada" | "salida">("entrada");
  const [invSeleccionado, setInvSeleccionado] = useState<MockInventario | null>(null);
  const [cantidadStock, setCantidadStock] = useState("");
  const [refStock, setRefStock] = useState("");
  const [notasStock, setNotasStock] = useState("");
  const [guardandoStock, setGuardandoStock] = useState(false);

  // ── MOVIMIENTOS TAB ──
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "salida" | "ajuste" | "devolucion">("todos");
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [formMov, setFormMov] = useState<MovimientoForm>({
    inventario_id: "",
    tipo: "entrada",
    cantidad: 0,
    referencia: "",
    notas: "",
  });
  const [guardandoMov, setGuardandoMov] = useState(false);

  // ── MERMAS TAB ──
  const [motivoMerma, setMotivoMerma] = useState<"caducidad" | "desperdicio" | "robo" | "otro">("caducidad");
  const [invSeleccionadoMerma, setInvSeleccionadoMerma] = useState<MockInventario | null>(null);
  const [cantidadMerma, setCantidadMerma] = useState("");
  const [notasMerma, setNotasMerma] = useState("");
  const [guardandoMerma, setGuardandoMerma] = useState(false);

  // ── RECETAS TAB ──
  const [modalRecetaAbierto, setModalRecetaAbierto] = useState(false);
  const [formReceta, setFormReceta] = useState<RecetaForm>({
    producto_id: "",
    inventario_id: "",
    cantidad_necesaria: 0,
  });
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [recetaAEliminar, setRecetaAEliminar] = useState<MockReceta | null>(null);
  const [confirmEliminarReceta, setConfirmEliminarReceta] = useState(false);

  // ── REALTIME ──
  useEffect(() => {
    const subInv = subscribeToTable("inventario", () => refetchInv());
    const subMov = subscribeToTable("movimientos_inventario", () => refetchMov());
    const subRecetas = subscribeToTable("recetas", () => refetchRecetas());
    return () => {
      subInv.unsubscribe();
      subMov.unsubscribe();
      subRecetas.unsubscribe();
    };
  }, [refetchInv, refetchMov, refetchRecetas]);

  // ── COMPUTED VALUES ──
  const invFiltrado = useMemo(() => {
    let lista = (inventario as MockInventario[]);

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter((i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.proveedor?.toLowerCase().includes(q)
      );
    }

    if (filtroInventario === "stock_bajo") {
      lista = lista.filter((i) => i.stock_actual < i.stock_minimo);
    } else if (filtroInventario === "activo") {
      lista = lista.filter((i) => i.activo);
    } else if (filtroInventario === "inactivo") {
      lista = lista.filter((i) => !i.activo);
    }

    return lista;
  }, [inventario, busqueda, filtroInventario]);

  const movimientosFiltrados = useMemo(() => {
    let lista = (movimientos as MockMovimientoInventario[]);

    if (filtroTipo !== "todos") {
      lista = lista.filter((m) => m.tipo === filtroTipo);
    }

    return lista;
  }, [movimientos, filtroTipo]);

  const mermasFiltradas = useMemo(() => {
    return (movimientos as MockMovimientoInventario[]).filter((m) => m.tipo === "ajuste");
  }, [movimientos]);

  const recetasFiltradas = useMemo(() => {
    return (recetas as MockReceta[]);
  }, [recetas]);

  // ── KPI CALCULATIONS ──
  const kpiInventario = useMemo(() => {
    const invList = inventario as MockInventario[];
    return {
      totalIngredientes: invList.length,
      bajoStock: invList.filter((i) => i.stock_actual < i.stock_minimo).length,
      valorTotal: invList.reduce((sum, i) => sum + (i.stock_actual * i.costo_unitario), 0),
    };
  }, [inventario]);

  const kpiMermas = useMemo(() => {
    const mermas = (movimientos as MockMovimientoInventario[]).filter((m) => m.tipo === "ajuste");
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const mermasEsteMes = mermas.filter((m) => new Date(m.creado_en) >= inicioMes);
    const invList = inventario as MockInventario[];

    const costoMermas = mermasEsteMes.reduce((sum, m) => {
      const inv = invList.find((i) => i.id === m.inventario_id);
      return sum + ((inv?.costo_unitario ?? 0) * m.cantidad);
    }, 0);

    return {
      totalMermas: mermasEsteMes.length,
      costoMermas,
    };
  }, [movimientos, inventario]);

  // ── HANDLERS: INVENTARIO ──
  const handleNuevoInventario = () => {
    setInventarioEditando(null);
    setFormInv({
      nombre: "",
      descripcion: "",
      unidad_medida: "kg",
      stock_actual: 0,
      stock_minimo: 0,
      costo_unitario: 0,
      proveedor: "",
    });
    setModalInventarioAbierto(true);
  };

  const handleEditarInventario = (inv: MockInventario) => {
    setInventarioEditando(inv);
    setFormInv({
      nombre: inv.nombre,
      descripcion: inv.descripcion ?? "",
      unidad_medida: inv.unidad,
      stock_actual: inv.stock_actual,
      stock_minimo: inv.stock_minimo,
      costo_unitario: inv.costo_unitario,
      proveedor: inv.proveedor ?? "",
    });
    setModalInventarioAbierto(true);
  };

  const handleGuardarInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoInv) return;
    if (!formInv.nombre.trim() || formInv.costo_unitario <= 0 || formInv.stock_minimo < 0) {
      showToast("Completa todos los campos correctamente", "error");
      return;
    }

    setGuardandoInv(true);
    try {
      const negocioId = user?.negocio_id;
      if (!negocioId) {
        showToast("Error: no se encontró el negocio", "error");
        return;
      }

      const data = {
        nombre: formInv.nombre.trim(),
        unidad: formInv.unidad_medida,
        stock_actual: formInv.stock_actual,
        stock_minimo: formInv.stock_minimo,
        costo_unitario: formInv.costo_unitario,
        proveedor: formInv.proveedor.trim() || null,
        descripcion: formInv.descripcion.trim() || null,
        negocio_id: negocioId,
        activo: true,
      };

      let result;
      if (inventarioEditando) {
        result = await updateRecord("inventario", inventarioEditando.id, data);
      } else {
        result = await insertRecord("inventario", data);
      }

      if (!result.success) {
        showToast(`Error: ${result.error}`, "error");
        return;
      }

      showToast(inventarioEditando ? "Ingrediente actualizado" : "Ingrediente creado");
      setModalInventarioAbierto(false);
      await refetchInv();
    } finally {
      setGuardandoInv(false);
    }
  };

  const handleEliminarInventario = async () => {
    if (!invAEliminar?.id) return;
    const { success, error } = await deleteRecord("inventario", invAEliminar.id);
    if (success) {
      showToast("Ingrediente eliminado");
      await refetchInv();
    } else {
      showToast(`Error: ${error}`, "error");
    }
    setConfirmEliminarInv(false);
    setInvAEliminar(null);
  };

  // ── HANDLERS: AGREGAR/RETIRAR STOCK ──
  const handleAbrirStockModal = (inv: MockInventario, tipo: "entrada" | "salida") => {
    setInvSeleccionado(inv);
    setTipoStock(tipo);
    setCantidadStock("");
    setRefStock("");
    setNotasStock("");
    setModalStockAbierto(true);
  };

  const handleGuardarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoStock || !invSeleccionado) return;
    if (!cantidadStock.trim() || isNaN(Number(cantidadStock)) || Number(cantidadStock) <= 0) {
      showToast("Cantidad debe ser un número positivo", "error");
      return;
    }

    setGuardandoStock(true);
    try {
      const cantidad = Number(cantidadStock);
      const nuevoStock = tipoStock === "entrada"
        ? invSeleccionado.stock_actual + cantidad
        : invSeleccionado.stock_actual - cantidad;

      if (nuevoStock < 0) {
        showToast("Stock insuficiente", "error");
        return;
      }

      // Crear movimiento
      const movData = {
        inventario_id: invSeleccionado.id,
        tipo: tipoStock,
        cantidad,
        stock_anterior: invSeleccionado.stock_actual,
        stock_nuevo: nuevoStock,
        referencia: refStock.trim() || null,
        motivo: null,
        notas: notasStock.trim() || null,
        usuario_id: user?.id,
        negocio_id: user?.negocio_id,
      };

      const movResult = await insertRecord("movimientos_inventario", movData);
      if (!movResult.success) {
        showToast(`Error: ${movResult.error}`, "error");
        return;
      }

      // Actualizar stock
      const invResult = await updateRecord("inventario", invSeleccionado.id, {
        stock_actual: nuevoStock,
      });

      if (!invResult.success) {
        showToast(`Error: ${invResult.error}`, "error");
        return;
      }

      showToast(`Stock ${tipoStock === "entrada" ? "agregado" : "retirado"}`);
      setModalStockAbierto(false);
      await refetchInv();
      await refetchMov();
    } finally {
      setGuardandoStock(false);
    }
  };

  // ── HANDLERS: MERMAS ──
  const handleGuardarMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoMerma || !invSeleccionadoMerma) return;
    if (!cantidadMerma.trim() || isNaN(Number(cantidadMerma)) || Number(cantidadMerma) <= 0) {
      showToast("Cantidad debe ser un número positivo", "error");
      return;
    }

    setGuardandoMerma(true);
    try {
      const cantidad = Number(cantidadMerma);
      const nuevoStock = invSeleccionadoMerma.stock_actual - cantidad;

      if (nuevoStock < 0) {
        showToast("Stock insuficiente", "error");
        return;
      }

      // Crear movimiento de ajuste (merma)
      const movData = {
        inventario_id: invSeleccionadoMerma.id,
        tipo: "ajuste",
        cantidad,
        stock_anterior: invSeleccionadoMerma.stock_actual,
        stock_nuevo: nuevoStock,
        referencia: null,
        motivo: motivoMerma,
        notas: notasMerma.trim() || null,
        usuario_id: user?.id,
        negocio_id: user?.negocio_id,
      };

      const movResult = await insertRecord("movimientos_inventario", movData);
      if (!movResult.success) {
        showToast(`Error: ${movResult.error}`, "error");
        return;
      }

      // Actualizar stock
      const invResult = await updateRecord("inventario", invSeleccionadoMerma.id, {
        stock_actual: nuevoStock,
      });

      if (!invResult.success) {
        showToast(`Error: ${invResult.error}`, "error");
        return;
      }

      showToast("Merma registrada");
      setInvSeleccionadoMerma(null);
      setCantidadMerma("");
      setNotasMerma("");
      setMotivoMerma("caducidad");
      await refetchInv();
      await refetchMov();
    } finally {
      setGuardandoMerma(false);
    }
  };

  // ── HANDLERS: RECETAS ──
  const handleNuevaReceta = () => {
    setFormReceta({
      producto_id: "",
      inventario_id: "",
      cantidad_necesaria: 0,
    });
    setModalRecetaAbierto(true);
  };

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoReceta || !formReceta.producto_id || !formReceta.inventario_id || formReceta.cantidad_necesaria <= 0) {
      showToast("Completa todos los campos", "error");
      return;
    }

    setGuardandoReceta(true);
    try {
      const inv = (inventario as MockInventario[]).find((i) => i.id === formReceta.inventario_id);
      if (!inv) {
        showToast("Ingrediente no encontrado", "error");
        return;
      }

      const data = {
        producto_id: formReceta.producto_id,
        inventario_id: formReceta.inventario_id,
        cantidad: formReceta.cantidad_necesaria,
      };

      const result = await insertRecord("recetas", data);
      if (!result.success) {
        showToast(`Error: ${result.error}`, "error");
        return;
      }

      showToast("Receta agregada");
      setModalRecetaAbierto(false);
      await refetchRecetas();
    } finally {
      setGuardandoReceta(false);
    }
  };

  const handleEliminarReceta = async () => {
    if (!recetaAEliminar?.id) return;
    const { success, error } = await deleteRecord("recetas", recetaAEliminar.id);
    if (success) {
      showToast("Receta eliminada");
      await refetchRecetas();
    } else {
      showToast(`Error: ${error}`, "error");
    }
    setConfirmEliminarReceta(false);
    setRecetaAEliminar(null);
  };

  // ── COLOR HELPERS ──
  const getStockColor = (actual: number, minimo: number) => {
    if (actual < minimo) return "text-status-err";
    if (actual <= minimo * 1.5) return "text-status-warn";
    return "text-status-ok";
  };

  const getStockBg = (actual: number, minimo: number) => {
    if (actual < minimo) return "bg-status-err-bg";
    if (actual <= minimo * 1.5) return "bg-status-warn-bg";
    return "bg-status-ok-bg";
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "entrada": return "bg-status-ok-bg text-status-ok";
      case "salida": return "bg-status-err-bg text-status-err";
      case "ajuste": return "bg-status-warn-bg text-status-warn";
      case "devolucion": return "bg-status-info-bg text-status-info";
      default: return "bg-surface-2 text-text-45";
    }
  };

  // ── RENDER ──
  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium text-text-100 tracking-tight">Inventario</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
            {(["inventario", "movimientos", "recetas", "mermas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTabActiva(tab)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-300 min-h-[44px]",
                  tabActiva === tab ? "bg-surface-4 text-text-100" : "text-text-25 hover:text-text-45"
                )}
              >
                {tab === "inventario" && "Inventario"}
                {tab === "movimientos" && "Movimientos"}
                {tab === "recetas" && "Recetas"}
                {tab === "mermas" && "Mermas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {tabActiva === "inventario" && (
        <>
          {/* KPI BAR */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-surface-2 border border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Total ingredientes</span>
              <span className="text-2xl font-bold text-text-100">{kpiInventario.totalIngredientes}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Bajo stock</span>
              <span className={cn("text-2xl font-bold", kpiInventario.bajoStock > 0 ? "text-status-err" : "text-status-ok")}>
                {kpiInventario.bajoStock}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Valor total</span>
              <span className="text-2xl font-bold text-text-100">{formatMXN(kpiInventario.valorTotal)}</span>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-25" />
              <input
                type="text"
                placeholder="Buscar ingrediente..."
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

            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
              {(["todos", "stock_bajo", "activo", "inactivo"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroInventario(f)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 min-h-[44px]",
                    filtroInventario === f
                      ? "bg-surface-4 text-text-100"
                      : "text-text-25 hover:text-text-45"
                  )}
                >
                  {f === "todos" && "Todos"}
                  {f === "stock_bajo" && "Bajo stock"}
                  {f === "activo" && "Activos"}
                  {f === "inactivo" && "Inactivos"}
                </button>
              ))}
            </div>

            <button
              onClick={handleNuevoInventario}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px] flex-shrink-0"
            >
              <Plus size={16} />
              Nuevo ingrediente
            </button>
          </div>

          {/* GRID */}
          {loadingInv ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : invFiltrado.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={Package} title="No hay ingredientes" description="Crea tu primer ingrediente para comenzar" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 pb-2">
                {invFiltrado.map((inv) => {
                  const invList = inventario as MockInventario[];
                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl bg-surface-2 border border-border hover:shadow-card transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-100 truncate">{inv.nombre}</h3>
                          <p className="text-xs text-text-25 truncate">{inv.unidad}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditarInventario(inv)}
                            className="p-2 rounded-lg text-text-25 hover:text-text-45 hover:bg-surface-3 transition-all duration-300 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => { setInvAEliminar(inv); setConfirmEliminarInv(true); }}
                            className="p-2 rounded-lg text-text-25 hover:text-status-err hover:bg-surface-3 transition-all duration-300 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Stock info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-25">Stock actual</span>
                          <span className={cn("text-sm font-bold", getStockColor(inv.stock_actual, inv.stock_minimo))}>
                            {inv.stock_actual}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-25">Stock mínimo</span>
                          <span className="text-sm font-medium text-text-45">{inv.stock_minimo}</span>
                        </div>

                        {/* Stock bar */}
                        <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all", getStockBg(inv.stock_actual, inv.stock_minimo))}
                            style={{ width: `${Math.min((inv.stock_actual / Math.max(inv.stock_minimo * 2, 1)) * 100, 100)}%` }}
                          />
                        </div>

                        {/* Alert if bajo stock */}
                        {inv.stock_actual < inv.stock_minimo && (
                          <div className="flex items-center gap-1.5 text-xs text-status-err">
                            <AlertTriangle size={12} />
                            Bajo stock
                          </div>
                        )}
                      </div>

                      {/* Cost info */}
                      <div className="space-y-1 mb-4 pb-4 border-b border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-25">Costo unitario</span>
                          <span className="text-sm font-medium text-text-100">{formatMXN(inv.costo_unitario)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-25">Valor total</span>
                          <span className="text-sm font-bold text-text-100">{formatMXN(inv.stock_actual * inv.costo_unitario)}</span>
                        </div>
                      </div>

                      {/* Provider */}
                      {inv.proveedor && (
                        <div className="mb-4 text-xs">
                          <span className="text-text-25">Proveedor: </span>
                          <span className="text-text-45 font-medium">{inv.proveedor}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAbrirStockModal(inv, "entrada")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-status-ok-bg text-status-ok hover:opacity-80 transition-all text-xs font-medium min-h-[36px]"
                        >
                          <ArrowUpCircle size={14} />
                          Entrada
                        </button>
                        <button
                          onClick={() => handleAbrirStockModal(inv, "salida")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-status-err-bg text-status-err hover:opacity-80 transition-all text-xs font-medium min-h-[36px]"
                        >
                          <ArrowDownCircle size={14} />
                          Salida
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tabActiva === "movimientos" && (
        <>
          {/* FILTER */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
              {(["todos", "entrada", "salida", "ajuste", "devolucion"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroTipo(f)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-300 min-h-[44px]",
                    filtroTipo === f
                      ? "bg-surface-4 text-text-100"
                      : "text-text-25 hover:text-text-45"
                  )}
                >
                  {f === "todos" && "Todos"}
                  {f !== "todos" && f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalMovimientoAbierto(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px] flex-shrink-0 ml-auto"
            >
              <Plus size={16} />
              Nuevo movimiento
            </button>
          </div>

          {/* TABLE */}
          {loadingMov ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={History} title="Sin movimientos" description="No hay movimientos registrados aún" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <div className="rounded-xl border border-border overflow-hidden min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-[120px_1fr_100px_120px_100px_1fr_100px] gap-3 px-5 py-3 bg-surface-2 border-b border-border">
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Fecha</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Ingrediente</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Tipo</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Cantidad</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Stock anterior</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Referencia</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Notas</span>
                </div>

                {/* Rows */}
                {movimientosFiltrados.map((mov) => {
                  const invList = inventario as MockInventario[];
                  const inv = invList.find((i) => i.id === mov.inventario_id);
                  return (
                    <div
                      key={mov.id}
                      className="grid grid-cols-[120px_1fr_100px_120px_100px_1fr_100px] gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                    >
                      <span className="text-xs text-text-45">
                        {new Date(mov.creado_en).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-xs font-medium text-text-100 truncate">{inv?.nombre ?? "—"}</span>
                      <span className={cn("text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg w-fit", getTipoColor(mov.tipo))}>
                        {mov.tipo}
                      </span>
                      <span className="text-xs text-text-45 font-mono">
                        {mov.tipo === "entrada" ? "+" : "-"}{mov.cantidad}
                      </span>
                      <span className="text-xs text-text-45 font-mono">{mov.stock_anterior}</span>
                      <span className="text-xs text-text-25 truncate">{mov.referencia || "—"}</span>
                      <span className="text-xs text-text-25 truncate">{mov.notas || "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tabActiva === "recetas" && (
        <>
          {/* BUTTON */}
          <div className="flex items-center justify-end mb-5">
            <button
              onClick={handleNuevaReceta}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
            >
              <Plus size={16} />
              Agregar receta
            </button>
          </div>

          {/* CONTENT */}
          {loadingRecetas ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : recetasFiltradas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={ChefHat} title="Sin recetas" description="Crea tu primera receta para vincular ingredientes con productos" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              <div className="space-y-4 pt-1 pb-2">
                {(productos as any[])?.map((prod) => {
                  const recetasDelProducto = recetasFiltradas.filter((r: any) => r.producto_id === prod.id);
                  if (recetasDelProducto.length === 0) return null;

                  const costoProducto = recetasDelProducto.reduce((sum: number, r: any) => {
                    const inv = (inventario as MockInventario[]).find((i) => i.id === r.inventario_id);
                    return sum + ((inv?.costo_unitario ?? 0) * (r.cantidad ?? r.cantidad_necesaria));
                  }, 0);

                  return (
                    <div key={prod.id} className="rounded-xl bg-surface-2 border border-border overflow-hidden">
                      {/* Product header */}
                      <div className="px-5 py-3 bg-surface-3 flex items-center justify-between border-b border-border">
                        <div>
                          <h3 className="text-sm font-semibold text-text-100">{prod.nombre}</h3>
                          <p className="text-xs text-text-25 mt-0.5">Costo estimado: <span className="font-medium">{formatMXN(costoProducto)}</span></p>
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div className="p-4 space-y-2">
                        {recetasDelProducto.map((rec: any) => {
                          const inv = (inventario as MockInventario[]).find((i) => i.id === rec.inventario_id);
                          return (
                            <div key={rec.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-3 border border-border">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-text-100">{inv?.nombre ?? "—"}</span>
                                <span className="text-[11px] text-text-25 ml-2">
                                  {rec.cantidad ?? rec.cantidad_necesaria} {inv?.unidad}
                                </span>
                              </div>
                              <button
                                onClick={() => { setRecetaAEliminar(rec); setConfirmEliminarReceta(true); }}
                                className="p-2 rounded-lg text-text-25 hover:text-status-err hover:bg-surface-2 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tabActiva === "mermas" && (
        <>
          {/* KPI BAR */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-surface-2 border border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Mermas este mes</span>
              <span className="text-2xl font-bold text-text-100">{kpiMermas.totalMermas}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-border">
              <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-2">Costo de mermas</span>
              <span className="text-2xl font-bold text-status-err">{formatMXN(kpiMermas.costoMermas)}</span>
            </div>
          </div>

          {/* BUTTON */}
          <div className="flex items-center justify-end mb-5">
            {!invSeleccionadoMerma ? (
              <button
                onClick={() => setInvSeleccionadoMerma(invFiltrado[0] ?? null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-[13px] min-h-[44px]"
              >
                <Plus size={16} />
                Registrar merma
              </button>
            ) : (
              <button
                onClick={() => setInvSeleccionadoMerma(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-ghost text-[13px] min-h-[44px]"
              >
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>

          {/* FORM O TABLE */}
          {loadingMov ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : invSeleccionadoMerma ? (
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
              <form onSubmit={handleGuardarMerma} className="w-full max-w-md bg-surface-2 border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-100 mb-5">Registrar merma: {invSeleccionadoMerma.nombre}</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
                      Cantidad (en {invSeleccionadoMerma.unidad})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cantidadMerma}
                      onChange={(e) => setCantidadMerma(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                      placeholder="Ej: 2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
                      Motivo
                    </label>
                    <select
                      value={motivoMerma}
                      onChange={(e) => setMotivoMerma(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    >
                      <option value="caducidad">Caducidad</option>
                      <option value="desperdicio">Desperdicio</option>
                      <option value="robo">Robo/Faltante</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notasMerma}
                      onChange={(e) => setNotasMerma(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                      rows={3}
                      placeholder="Descripción de lo ocurrido..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      type="submit"
                      disabled={guardandoMerma}
                      className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {guardandoMerma && <Loader2 size={14} className="animate-spin" />}
                      Registrar merma
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvSeleccionadoMerma(null)}
                      className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : mermasFiltradas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={TrendingDown} title="Sin mermas" description="No se han registrado mermas en este período" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <div className="rounded-xl border border-border overflow-hidden min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-[120px_1fr_100px_120px_100px_1fr] gap-3 px-5 py-3 bg-surface-2 border-b border-border">
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Fecha</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Ingrediente</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Motivo</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Cantidad</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Costo</span>
                  <span className="text-xs font-medium text-text-25 uppercase tracking-widest">Notas</span>
                </div>

                {/* Rows */}
                {mermasFiltradas.map((mov) => {
                  const invList = inventario as MockInventario[];
                  const inv = invList.find((i) => i.id === mov.inventario_id);
                  const costo = (inv?.costo_unitario ?? 0) * mov.cantidad;
                  return (
                    <div
                      key={mov.id}
                      className="grid grid-cols-[120px_1fr_100px_120px_100px_1fr] gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                    >
                      <span className="text-xs text-text-45">
                        {new Date(mov.creado_en).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-xs font-medium text-text-100 truncate">{inv?.nombre ?? "—"}</span>
                      <span className="text-xs text-text-45 capitalize">{mov.motivo || "—"}</span>
                      <span className="text-xs text-text-45 font-mono">-{mov.cantidad}</span>
                      <span className="text-xs font-medium text-status-err">{formatMXN(costo)}</span>
                      <span className="text-xs text-text-25 truncate">{mov.notas || "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}

      {/* Modal: Nuevo/Editar Inventario */}
      <Modal
        open={modalInventarioAbierto}
        onClose={() => setModalInventarioAbierto(false)}
        title={inventarioEditando ? "Editar ingrediente" : "Nuevo ingrediente"}
        size="md"
      >
        <form onSubmit={handleGuardarInventario} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              value={formInv.nombre}
              onChange={(e) => setFormInv({ ...formInv, nombre: e.target.value })}
              required
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="Ej: Café grano premium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Unidad de medida *
            </label>
            <select
              value={formInv.unidad_medida}
              onChange={(e) => setFormInv({ ...formInv, unidad_medida: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="kg">Kilogramo (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="pz">Pieza (pz)</option>
              <option value="gr">Gramo (gr)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="caja">Caja</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
                Stock actual *
              </label>
              <input
                type="number"
                step="0.01"
                value={formInv.stock_actual}
                onChange={(e) => setFormInv({ ...formInv, stock_actual: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
                Stock mínimo *
              </label>
              <input
                type="number"
                step="0.01"
                value={formInv.stock_minimo}
                onChange={(e) => setFormInv({ ...formInv, stock_minimo: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Costo unitario (MXN) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formInv.costo_unitario}
              onChange={(e) => setFormInv({ ...formInv, costo_unitario: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Proveedor
            </label>
            <input
              type="text"
              value={formInv.proveedor}
              onChange={(e) => setFormInv({ ...formInv, proveedor: e.target.value })}
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="Ej: Cafés de Altura"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Ubicación / Notas
            </label>
            <textarea
              value={formInv.descripcion}
              onChange={(e) => setFormInv({ ...formInv, descripcion: e.target.value })}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              rows={2}
              placeholder="Ej: Almacén A - Estante 1"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={guardandoInv}
              className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50"
            >
              {inventarioEditando ? "Guardar cambios" : "Crear ingrediente"}
            </button>
            <button
              type="button"
              onClick={() => setModalInventarioAbierto(false)}
              className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Agregar/Retirar Stock */}
      <Modal
        open={modalStockAbierto}
        onClose={() => setModalStockAbierto(false)}
        title={tipoStock === "entrada" ? "Agregar stock" : "Retirar stock"}
        size="sm"
      >
        <form onSubmit={handleGuardarStock} className="space-y-4">
          <div>
            <span className="text-xs font-medium text-text-25 uppercase tracking-widest block mb-1.5">
              Ingrediente: <span className="text-text-100 font-semibold">{invSeleccionado?.nombre}</span>
            </span>
            <span className="text-xs text-text-25">
              Stock actual: <span className="font-mono font-semibold text-text-45">{invSeleccionado?.stock_actual} {invSeleccionado?.unidad}</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Cantidad *
            </label>
            <input
              type="number"
              step="0.01"
              value={cantidadStock}
              onChange={(e) => setCantidadStock(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Referencia (Ej: Compra, Orden #)
            </label>
            <input
              type="text"
              value={refStock}
              onChange={(e) => setRefStock(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="Ej: Factura #12345"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Notas
            </label>
            <textarea
              value={notasStock}
              onChange={(e) => setNotasStock(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              rows={2}
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={guardandoStock}
              className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardandoStock && <Loader2 size={14} className="animate-spin" />}
              {tipoStock === "entrada" ? "Agregar" : "Retirar"}
            </button>
            <button
              type="button"
              onClick={() => setModalStockAbierto(false)}
              className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nuevo Movimiento */}
      <Modal
        open={modalMovimientoAbierto}
        onClose={() => setModalMovimientoAbierto(false)}
        title="Nuevo movimiento"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (guardandoMov || !formMov.inventario_id || formMov.cantidad <= 0) {
              showToast("Completa todos los campos", "error");
              return;
            }

            setGuardandoMov(true);
            try {
              const invList = inventario as MockInventario[];
              const inv = invList.find((i) => i.id === formMov.inventario_id);
              if (!inv) {
                showToast("Ingrediente no encontrado", "error");
                return;
              }

              let nuevoStock = inv.stock_actual;
              if (formMov.tipo === "entrada") {
                nuevoStock += formMov.cantidad;
              } else {
                nuevoStock -= formMov.cantidad;
                if (nuevoStock < 0) {
                  showToast("Stock insuficiente", "error");
                  return;
                }
              }

              const data = {
                inventario_id: formMov.inventario_id,
                tipo: formMov.tipo,
                cantidad: formMov.cantidad,
                stock_anterior: inv.stock_actual,
                stock_nuevo: nuevoStock,
                referencia: formMov.referencia.trim() || null,
                motivo: null,
                notas: formMov.notas.trim() || null,
                usuario_id: user?.id,
                negocio_id: user?.negocio_id,
              };

              const result = await insertRecord("movimientos_inventario", data);
              if (!result.success) {
                showToast(`Error: ${result.error}`, "error");
                return;
              }

              // Actualizar stock
              await updateRecord("inventario", formMov.inventario_id, { stock_actual: nuevoStock });

              showToast("Movimiento registrado");
              setModalMovimientoAbierto(false);
              await refetchMov();
              await refetchInv();
            } finally {
              setGuardandoMov(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Ingrediente *
            </label>
            <select
              value={formMov.inventario_id}
              onChange={(e) => setFormMov({ ...formMov, inventario_id: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">Seleccionar ingrediente...</option>
              {(inventario as MockInventario[]).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.nombre} ({inv.unidad})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Tipo *
            </label>
            <select
              value={formMov.tipo}
              onChange={(e) => setFormMov({ ...formMov, tipo: e.target.value as any })}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="entrada">Entrada (Compra)</option>
              <option value="salida">Salida (Uso)</option>
              <option value="ajuste">Ajuste (Inventario)</option>
              <option value="devolucion">Devolución</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Cantidad *
            </label>
            <input
              type="number"
              step="0.01"
              value={formMov.cantidad}
              onChange={(e) => setFormMov({ ...formMov, cantidad: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Referencia
            </label>
            <input
              type="text"
              value={formMov.referencia}
              onChange={(e) => setFormMov({ ...formMov, referencia: e.target.value })}
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="Ej: OC-001, Factura #12345"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Notas
            </label>
            <textarea
              value={formMov.notas}
              onChange={(e) => setFormMov({ ...formMov, notas: e.target.value })}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              rows={2}
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={guardandoMov}
              className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50"
            >
              Registrar movimiento
            </button>
            <button
              type="button"
              onClick={() => setModalMovimientoAbierto(false)}
              className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nueva Receta */}
      <Modal
        open={modalRecetaAbierto}
        onClose={() => setModalRecetaAbierto(false)}
        title="Agregar receta"
        size="md"
      >
        <form onSubmit={handleGuardarReceta} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Producto *
            </label>
            <select
              value={formReceta.producto_id}
              onChange={(e) => setFormReceta({ ...formReceta, producto_id: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">Seleccionar producto...</option>
              {(productos as any[])?.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Ingrediente *
            </label>
            <select
              value={formReceta.inventario_id}
              onChange={(e) => setFormReceta({ ...formReceta, inventario_id: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">Seleccionar ingrediente...</option>
              {(inventario as MockInventario[]).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.nombre} ({inv.unidad})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-25 uppercase tracking-widest mb-1.5">
              Cantidad necesaria *
            </label>
            <input
              type="number"
              step="0.01"
              value={formReceta.cantidad_necesaria}
              onChange={(e) => setFormReceta({ ...formReceta, cantidad_necesaria: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={guardandoReceta}
              className="flex-1 py-2.5 rounded-lg btn-primary text-[13px] disabled:opacity-50"
            >
              Agregar receta
            </button>
            <button
              type="button"
              onClick={() => setModalRecetaAbierto(false)}
              className="flex-1 py-2.5 rounded-lg btn-ghost text-[13px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm: Eliminar Inventario */}
      <ConfirmDialog
        open={confirmEliminarInv}
        onClose={() => { setConfirmEliminarInv(false); setInvAEliminar(null); }}
        onConfirm={handleEliminarInventario}
        title="Eliminar ingrediente"
        description={`¿Estás seguro de eliminar "${invAEliminar?.nombre ?? ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* Confirm: Eliminar Receta */}
      <ConfirmDialog
        open={confirmEliminarReceta}
        onClose={() => { setConfirmEliminarReceta(false); setRecetaAEliminar(null); }}
        onConfirm={handleEliminarReceta}
        title="Eliminar receta"
        description="¿Eliminar este ingrediente de la receta?"
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
