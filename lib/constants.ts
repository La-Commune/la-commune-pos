// ── Status configs y constantes compartidas ──
// Extraídas de componentes duplicados en ordenes, mesas, kds, fidelidad

import { LayoutGrid, ShoppingBag, Truck } from "lucide-react";

// ── Estados de Orden ──
export const ESTADO_ORDEN_CONFIG = {
  nueva: { label: "Nueva", bg: "bg-status-info-bg", text: "text-status-info" },
  confirmada: { label: "Confirmada", bg: "bg-status-ok-bg", text: "text-status-ok" },
  preparando: { label: "Preparando", bg: "bg-status-warn-bg", text: "text-status-warn" },
  lista: { label: "Lista", bg: "bg-accent-soft", text: "text-accent" },
  completada: { label: "Completada", bg: "bg-surface-3", text: "text-text-45" },
  cancelada: { label: "Cancelada", bg: "bg-status-err-bg", text: "text-status-err" },
} as const;

// ── Estados de Mesa ──
export const ESTADO_MESA_CONFIG = {
  disponible: { label: "Disponible", cssVar: "--ok", tailwind: "text-status-ok", bg: "bg-status-ok-bg" },
  ocupada: { label: "Ocupada", cssVar: "--err", tailwind: "text-status-err", bg: "bg-status-err-bg" },
  reservada: { label: "Reservada", cssVar: "--warn", tailwind: "text-status-warn", bg: "bg-status-warn-bg" },
  preparando: { label: "Preparando", cssVar: "--info", tailwind: "text-status-info", bg: "bg-status-info-bg" },
} as const;

// ── Estados de KDS (Cocina) ──
export const ESTADO_KDS_CONFIG = {
  nueva: { label: "Nueva", bg: "bg-status-info-bg", text: "text-status-info" },
  preparando: { label: "Preparando", bg: "bg-status-warn-bg", text: "text-status-warn" },
  lista: { label: "Lista", bg: "bg-status-ok-bg", text: "text-status-ok" },
} as const;

// ── Origen de Orden (Mesa, Para llevar, Delivery, Online) ──
export const ORIGEN_OPTIONS = [
  { id: "mesa" as const, label: "Mesa", icon: LayoutGrid, desc: "Servir en mesa" },
  { id: "para_llevar" as const, label: "Para llevar", icon: ShoppingBag, desc: "Empaque para llevar" },
  { id: "delivery" as const, label: "Delivery", icon: Truck, desc: "Envío a domicilio" },
] as const;

// ── Etiquetas de Origen (para displays) ──
export const ORIGEN_LABEL = {
  mesa: "Mesa",
  delivery: "Delivery",
  para_llevar: "Para llevar",
  online: "Online",
} as const;

// ── Niveles de Fidelidad ──
export const NIVEL_CONFIG = {
  bronce: { label: "Bronce", color: "text-status-warn", bg: "bg-status-warn-bg", minPuntos: 0, maxPuntos: 499 },
  plata: { label: "Plata", color: "text-text-45", bg: "bg-surface-3", minPuntos: 500, maxPuntos: 999 },
  oro: { label: "Oro", color: "text-accent", bg: "bg-accent-soft", minPuntos: 1000, maxPuntos: Infinity },
} as const;

// ── Ubicaciones de Mesa (deprecated: usar tabla zonas) ──
export const UBICACIONES_MESA = ["Interior", "Terraza", "Barra"] as const;

// ── Formas de Mesa (para el floor plan) ──
export const FORMAS_MESA_CONFIG = {
  redonda: { label: "Redonda", icon: "circle" },
  cuadrada: { label: "Cuadrada", icon: "square" },
  rectangular: { label: "Rectangular", icon: "rectangle-horizontal" },
} as const;

// ── Columnas del Kanban KDS ──
export const COLUMNAS_KDS = ["nueva", "preparando", "lista"] as const;

// ── Estados de Período (Reportes) ──
export const PERIODOS = ["hoy", "semana", "mes"] as const;
