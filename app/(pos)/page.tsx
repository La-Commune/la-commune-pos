"use client";

/* ============================================================
   Dashboard — PoC dirección V3 "Barra" (tablet-nativo + carácter)
   Misma lógica de datos que main; vestimenta V3:
   KPI hero en mono gigante, neutros cálidos, Verde Comuna.
   El shell (riel + dock) vive en ShellV3 via layout.
   ============================================================ */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ChefHat, Package, Check } from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { supabase, USE_MOCK } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useMesas, useOrdenes, useInventario, subscribeToTable } from "@/hooks/useSupabase";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { staggerContainer, fadeUp, timing, ease } from "@/lib/motion";
import type { Mesa, Orden } from "@/types/database";
import styles from "./dashboard-v3.module.css";

type ChipEstado = "nueva" | "prep" | "lista";

interface OrdenFila {
  folio: string;
  titulo: string;
  meta: string;
  monto: string;
  chip: ChipEstado;
}

const CHIP_LABEL: Record<ChipEstado, string> = {
  nueva: "Nueva",
  prep: "En cocina",
  lista: "Lista",
};

function minutosDesde(iso: string | null): string {
  if (!iso) return "";
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${String(min % 60).padStart(2, "0")}`;
}

function DashboardContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: mesas } = useMesas();
  const { data: ordenes, refetch: refetchOrdenes } = useOrdenes();
  const { data: inventario } = useInventario();
  const [ventasHoy, setVentasHoy] = useState(0);
  const [ordenesHoyCount, setOrdenesHoyCount] = useState(0);
  const [loading, setLoading] = useState(!USE_MOCK);

  const cargarVentas = async () => {
    if (USE_MOCK || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const { data: pagos } = await supabase
        .from("pagos")
        .select("monto")
        .eq("estado", "completado")
        .gte("creado_en", hoy.toISOString());

      const total = (pagos ?? []).reduce(
        (sum: number, p: { monto: number | null }) => sum + (p.monto || 0),
        0,
      );
      setVentasHoy(total);

      const { data: ordenesCompletadas } = await supabase
        .from("ordenes")
        .select("id")
        .eq("estado", "completada")
        .gte("creado_en", hoy.toISOString());

      setOrdenesHoyCount(ordenesCompletadas?.length ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = subscribeToTable("pagos", () => {
      cargarVentas();
      refetchOrdenes();
    });
    const subOrdenes = subscribeToTable("ordenes", () => {
      refetchOrdenes();
    });
    return () => {
      sub.unsubscribe();
      subOrdenes.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchOrdenes]);

  const [hora, setHora] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setHora(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const mesasList = (mesas as unknown as Mesa[]) ?? [];
  const ordenesList = (ordenes as unknown as Orden[]) ?? [];
  const inventarioList =
    (inventario as { stock_actual?: number; stock_minimo?: number; activo?: boolean }[]) ?? [];

  const mesasOcupadas = mesasList.filter((m) => m.estado === "ocupada").length;
  const ordenesPendientes = ordenesList.filter((o) => ["nueva", "confirmada"].includes(o.estado)).length;
  const ordenesEnKDS = ordenesList.filter((o) => ["preparando", "lista"].includes(o.estado)).length;
  const ordenesActivasCount = ordenesPendientes + ordenesEnKDS;
  const ticketPromedio = ordenesHoyCount > 0 ? ventasHoy / ordenesHoyCount : 0;
  const ingredientesBajos = inventarioList.filter(
    (i) => Number(i.stock_actual ?? 0) <= Number(i.stock_minimo ?? 0) && i.activo !== false,
  ).length;

  const saludo =
    hora.getHours() < 12 ? "Buenos días" : hora.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const nombreCorto = user?.nombre?.split(" ")[0] ?? "David";
  const fecha = hora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  const horaStr = hora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

  /* filas de órdenes activas — mock rico en modo dev, datos reales con Supabase */
  const filasOrdenes: OrdenFila[] = USE_MOCK
    ? [
        { folio: "#048", titulo: "2× Latte · Rol de canela", meta: "Mesa 3 · hace 4 min", monto: "$165.00", chip: "prep" },
        { folio: "#047", titulo: "Flat White · Cappuccino · 2× Croissant", meta: "Mesa 5 · hace 9 min", monto: "$248.00", chip: "lista" },
        { folio: "#046", titulo: "Americano 16oz", meta: "Para llevar · hace 2 min", monto: "$65.00", chip: "nueva" },
        { folio: "#045", titulo: "Moka · Latte 12oz · Brownie", meta: "Mesa 1 · hace 16 min", monto: "$197.00", chip: "lista" },
      ]
    : ordenesList
        .filter((o) => ["nueva", "confirmada", "preparando", "lista"].includes(o.estado))
        .slice(0, 6)
        .map((o) => ({
          folio: `#${String(o.folio ?? "—").padStart(3, "0")}`,
          titulo: o.notas || `Orden ${o.folio ?? "s/n"}`,
          meta: `${o.origen === "mesa" ? "En mesa" : "Para llevar"} · ${minutosDesde(o.creado_en)}`,
          monto: formatMXN(o.total ?? 0),
          chip: (["nueva", "confirmada"].includes(o.estado)
            ? "nueva"
            : o.estado === "preparando"
              ? "prep"
              : "lista") as ChipEstado,
        }));

  /* mini grid de mesas */
  const mesasGrid = USE_MOCK
    ? [
        { num: 1, ocupada: true, label: "48 min" },
        { num: 2, ocupada: false, label: "Libre" },
        { num: 3, ocupada: true, label: "12 min" },
        { num: 4, ocupada: true, label: "1h 02" },
        { num: 5, ocupada: true, label: "26 min" },
        { num: 6, ocupada: false, label: "Libre" },
        { num: 7, ocupada: true, label: "8 min" },
        { num: 8, ocupada: false, label: "Libre" },
      ]
    : mesasList.slice(0, 8).map((m) => ({
        num: m.numero,
        ocupada: m.estado === "ocupada",
        label: m.estado === "ocupada" ? minutosDesde(m.ocupada_desde) || "Ocupada" : "Libre",
      }));

  const mesasOcupadasGrid = USE_MOCK ? 5 : mesasOcupadas;
  const hayAvisos = ordenesPendientes > 0 || ordenesEnKDS > 0 || ingredientesBajos > 0;

  return (
    <div>
      {/* ── Header ── */}
      <motion.div
        className={styles.hdr}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.smooth, ease: ease.out }}
      >
        <h1 className={styles.hdrTitle}>
          {saludo}, {nombreCorto}
        </h1>
        <span className={styles.fecha}>{fechaCap}</span>
        <span className={styles.cajaChip}>
          <i className={styles.cajaDot} />
          EN VIVO · {horaStr}
        </span>
      </motion.div>

      {/* ── KPIs — el número es la interfaz ── */}
      {!loading && (
        <motion.div className={styles.kpis} variants={staggerContainer} initial="hidden" animate="show">
          <motion.button
            variants={fadeUp}
            className={cn(styles.kpi, styles.kpiHero, styles.kpiBtn)}
            onClick={() => router.push("/reportes")}
          >
            <div className={styles.kpiLbl}>Ventas de hoy</div>
            <AnimatedCounter value={ventasHoy} format={formatMXN} className={styles.kpiVal} delay={0.1} />
            <div className={styles.kpiSub}>
              <b>{ordenesHoyCount}</b> órdenes cobradas
            </div>
          </motion.button>
          <motion.button
            variants={fadeUp}
            className={cn(styles.kpi, styles.kpiBtn)}
            onClick={() => router.push("/ordenes")}
          >
            <div className={styles.kpiLbl}>Órdenes activas</div>
            <AnimatedCounter value={ordenesActivasCount} className={styles.kpiVal} delay={0.15} />
            <div className={styles.kpiSub}>{ordenesPendientes} por confirmar</div>
          </motion.button>
          <motion.button
            variants={fadeUp}
            className={cn(styles.kpi, styles.kpiBtn)}
            onClick={() => router.push("/reportes")}
          >
            <div className={styles.kpiLbl}>Ticket promedio</div>
            <AnimatedCounter value={ticketPromedio} format={formatMXN} className={styles.kpiVal} delay={0.2} />
            <div className={styles.kpiSub}>{ordenesHoyCount} cobradas</div>
          </motion.button>
          <motion.button
            variants={fadeUp}
            className={cn(styles.kpi, styles.kpiBtn)}
            onClick={() => router.push("/mesas")}
          >
            <div className={styles.kpiLbl}>Mesas</div>
            <span className={styles.kpiVal}>
              {mesasOcupadasGrid}/{mesasGrid.length || 8}
            </span>
            <div className={styles.kpiSub}>ocupadas ahora</div>
          </motion.button>
        </motion.div>
      )}

      {/* ── Grid principal ── */}
      <div className={styles.cols}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: timing.smooth, ease: ease.out, delay: 0.22 }}
        >
          <div className={styles.chead}>
            <span className={styles.cheadTitle}>Órdenes activas</span>
            <span className={styles.cheadN}>{filasOrdenes.length}</span>
            <button type="button" className={styles.cheadLink} onClick={() => router.push("/ordenes")}>
              Ver todas
            </button>
          </div>
          {filasOrdenes.length === 0 ? (
            <div className={styles.alerta} style={{ cursor: "default" }}>
              <span className={styles.alertaIcon} style={{ color: "var(--v3-ink-3)" }}>
                <Check size={18} strokeWidth={1.75} />
              </span>
              <span className={styles.alertaTxt}>Sin órdenes activas ahora</span>
            </div>
          ) : (
            filasOrdenes.map((o) => (
              <button type="button" key={o.folio} className={styles.orden} onClick={() => router.push("/ordenes")}>
                <span className={styles.folio}>{o.folio}</span>
                <span className={styles.que}>
                  <span className={styles.queTitulo}>{o.titulo}</span>
                  <span className={styles.queMeta}>{o.meta}</span>
                </span>
                <span
                  className={cn(
                    styles.chip,
                    o.chip === "prep" ? styles.chipPrep : o.chip === "lista" ? styles.chipLista : styles.chipNueva,
                  )}
                >
                  {CHIP_LABEL[o.chip]}
                </span>
                <span className={styles.monto}>{o.monto}</span>
              </button>
            ))
          )}
        </motion.div>

        <div className={styles.colsRight}>
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: timing.smooth, ease: ease.out, delay: 0.27 }}
          >
            <div className={styles.chead}>
              <span className={styles.cheadTitle}>Mesas</span>
              <span className={styles.cheadN}>
                {mesasOcupadasGrid}/{mesasGrid.length || 8}
              </span>
              <button type="button" className={styles.cheadLink} onClick={() => router.push("/mesas")}>
                Plano
              </button>
            </div>
            <div className={styles.mesas}>
              {mesasGrid.map((m) => (
                <button
                  type="button"
                  key={m.num}
                  className={cn(styles.mesa, m.ocupada ? styles.mesaOcupada : styles.mesaLibre)}
                  onClick={() => router.push("/mesas")}
                >
                  <span className={styles.mesaNum}>{m.num}</span>
                  <span className={styles.mesaSt}>{m.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: timing.smooth, ease: ease.out, delay: 0.32 }}
          >
            <div className={styles.chead}>
              <span className={styles.cheadTitle}>Avisos</span>
            </div>
            {ordenesPendientes > 0 && (
              <button type="button" className={styles.alerta} onClick={() => router.push("/ordenes")}>
                <span className={styles.alertaIcon}>
                  <AlertTriangle size={18} strokeWidth={1.75} />
                </span>
                <span className={styles.alertaTxt}>
                  <b>
                    {ordenesPendientes} {ordenesPendientes === 1 ? "orden pendiente" : "órdenes pendientes"}
                  </b>{" "}
                  de confirmar
                </span>
              </button>
            )}
            {ordenesEnKDS > 0 && (
              <button type="button" className={styles.alerta} onClick={() => router.push("/kds")}>
                <span className={styles.alertaIcon}>
                  <ChefHat size={18} strokeWidth={1.75} />
                </span>
                <span className={styles.alertaTxt}>
                  <b>
                    {ordenesEnKDS} {ordenesEnKDS === 1 ? "orden" : "órdenes"}
                  </b>{" "}
                  en cocina
                </span>
              </button>
            )}
            {ingredientesBajos > 0 && (
              <button type="button" className={styles.alerta} onClick={() => router.push("/inventario")}>
                <span className={styles.alertaIcon}>
                  <Package size={18} strokeWidth={1.75} />
                </span>
                <span className={styles.alertaTxt}>
                  <b>
                    {ingredientesBajos} {ingredientesBajos === 1 ? "ingrediente" : "ingredientes"}
                  </b>{" "}
                  con stock bajo
                </span>
              </button>
            )}
            {!hayAvisos && (
              <div className={cn(styles.alerta, styles.alertaOk)} style={{ cursor: "default" }}>
                <span className={styles.alertaIcon}>
                  <Check size={18} strokeWidth={1.75} />
                </span>
                <span className={styles.alertaTxt}>
                  Todo en orden — <b>sin avisos</b> por ahora
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary moduleName="Dashboard">
      <DashboardContent />
    </ErrorBoundary>
  );
}
