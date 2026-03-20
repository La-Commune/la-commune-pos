"use client";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────
   Badge unificado — POS La Commune
   Reemplaza status pills inconsistentes
   en mesas, órdenes, KDS, cobros, etc.
   ────────────────────────────────────── */

const variants = {
  // ── Estado de orden ──
  nueva:       { bg: "bg-status-info-bg", text: "text-status-info",  label: "Nueva" },
  confirmada:  { bg: "bg-status-ok-bg",   text: "text-status-ok",    label: "Confirmada" },
  preparando:  { bg: "bg-status-warn-bg",  text: "text-status-warn",  label: "Preparando" },
  lista:       { bg: "bg-accent-soft",     text: "text-accent",       label: "Lista" },
  completada:  { bg: "bg-surface-3",       text: "text-text-45",      label: "Completada" },
  cancelada:   { bg: "bg-status-err-bg",   text: "text-status-err",   label: "Cancelada" },

  // ── Estado de mesa ──
  disponible:  { bg: "bg-status-ok-bg",    text: "text-status-ok",    label: "Disponible" },
  ocupada:     { bg: "bg-status-warn-bg",  text: "text-status-warn",  label: "Ocupada" },
  reservada:   { bg: "bg-status-info-bg",  text: "text-status-info",  label: "Reservada" },

  // ── Estado activo/inactivo ──
  activo:      { bg: "bg-status-ok-bg",    text: "text-status-ok",    label: "Activo" },
  inactivo:    { bg: "bg-status-err-bg",   text: "text-status-err",   label: "Inactivo" },

  // ── Etiquetas de producto ──
  popular:     { bg: "bg-status-ok-bg",    text: "text-status-ok",    label: "Popular" },
  nuevo:       { bg: "bg-status-info-bg",  text: "text-status-info",  label: "Nuevo" },
  especial:    { bg: "bg-accent-soft",     text: "text-accent",       label: "Especial" },
  agotado:     { bg: "bg-status-err-bg",   text: "text-status-err",   label: "Agotado" },

  // ── Roles ──
  admin:       { bg: "bg-accent-soft",     text: "text-accent",       label: "Admin" },
  barista:     { bg: "bg-status-info-bg",  text: "text-status-info",  label: "Barista" },
  camarero:    { bg: "bg-status-ok-bg",    text: "text-status-ok",    label: "Camarero" },
  cocina:      { bg: "bg-status-warn-bg",  text: "text-status-warn",  label: "Cocina" },
} as const;

export type BadgeVariant = keyof typeof variants;

interface BadgeProps {
  /** Variante semántica — define colores y label por defecto */
  status: BadgeVariant;
  /** Texto personalizado (si no se pasa, usa el label de la variante) */
  children?: React.ReactNode;
  /** Muestra dot indicator a la izquierda */
  dot?: boolean;
  /** Tamaño */
  size?: "sm" | "default";
  /** Clases adicionales */
  className?: string;
}

export function Badge({
  status,
  children,
  dot = false,
  size = "default",
  className,
}: BadgeProps) {
  const config = variants[status];

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 rounded-lg",
    default: "text-xs px-3 py-1 rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider",
        sizes[size],
        config.bg,
        config.text,
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.text.replace("text-", "bg-"))} />
      )}
      {children ?? config.label}
    </span>
  );
}

/** Helper: devuelve la config de color para uso en componentes que necesitan más control */
export function getBadgeConfig(status: BadgeVariant) {
  return variants[status];
}
