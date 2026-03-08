"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface MesaTimerProps {
  /** ISO timestamp de cuando se ocupó la mesa */
  ocupadaDesde: string;
  /** Variante de display */
  variant?: "badge" | "inline" | "ring";
  /** Mostrar icono de reloj */
  showIcon?: boolean;
}

// ── Umbrales en minutos (configurables) ──
export const UMBRAL_OK = 30; // Verde: 0-30min (normal)
export const UMBRAL_WARN = 60; // Amarillo: 30-60min (atención)
// > 60min = Rojo (urgente)

/** Calcular minutos transcurridos */
export function getMins(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Formato de tiempo compacto */
export function formatTime(mins: number): string {
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h${remainMins}m` : `${hrs}h`;
}

/** Obtener nivel de urgencia */
export function getLevel(mins: number): "ok" | "warn" | "err" {
  if (mins <= UMBRAL_OK) return "ok";
  if (mins <= UMBRAL_WARN) return "warn";
  return "err";
}

/** CSS vars por nivel */
const LEVEL_STYLES = {
  ok: {
    color: "var(--ok)",
    bg: "var(--ok)",
  },
  warn: {
    color: "var(--warn)",
    bg: "var(--warn)",
  },
  err: {
    color: "var(--err)",
    bg: "var(--err)",
  },
} as const;

/**
 * MesaTimer — indicador visual de cuánto tiempo lleva una mesa ocupada.
 *
 * Variantes:
 * - `badge`: pill con texto y fondo semitransparente (para vista Grid)
 * - `inline`: solo texto con color (para dentro de tarjetas compactas)
 * - `ring`: anillo de progreso alrededor de la mesa (para vista Plano)
 */
export default function MesaTimer({
  ocupadaDesde,
  variant = "badge",
  showIcon = true,
}: MesaTimerProps) {
  const [mins, setMins] = useState(() => getMins(ocupadaDesde));

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    setMins(getMins(ocupadaDesde));
    const interval = setInterval(() => setMins(getMins(ocupadaDesde)), 30000);
    return () => clearInterval(interval);
  }, [ocupadaDesde]);

  const level = getLevel(mins);
  const styles = LEVEL_STYLES[level];
  const text = formatTime(mins);

  if (variant === "inline") {
    return (
      <span
        className="text-[10px] font-medium tabular-nums"
        style={{ color: styles.color }}
      >
        {showIcon && <Clock size={9} className="inline mr-0.5 -mt-px" />}
        {text}
      </span>
    );
  }

  if (variant === "ring") {
    // Anillo circular de progreso (0% a 100% en 60min)
    const progress = Math.min(1, mins / UMBRAL_WARN);
    const circumference = 2 * Math.PI * 16; // r=16
    const dashOffset = circumference * (1 - progress);

    return (
      <div className="absolute -top-1 -right-1 w-[18px] h-[18px] pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 36 36" className="block">
          {/* Track */}
          <circle
            cx="18" cy="18" r="16"
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx="18" cy="18" r="16"
            fill="none"
            stroke={styles.color}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        {/* Time text in center */}
        <span
          className="absolute inset-0 flex items-center justify-center text-[6px] font-bold tabular-nums"
          style={{ color: styles.color }}
        >
          {mins < 60 ? `${mins}` : `${Math.floor(mins / 60)}h`}
        </span>
      </div>
    );
  }

  // Default: badge
  return (
    <div
      className="inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
      style={{
        color: styles.color,
        backgroundColor: `color-mix(in srgb, ${styles.bg} 15%, transparent)`,
      }}
    >
      {showIcon && <Clock size={10} />}
      {text}
    </div>
  );
}
