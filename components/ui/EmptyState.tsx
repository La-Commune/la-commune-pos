"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { timing, ease } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════
 * EmptyState — Premium empty/error state for the POS
 *
 * Uses CSS custom properties from the design system so it
 * adapts to all 5 themes automatically. SVG illustrations
 * animate subtly. Backwards-compatible: still accepts LucideIcon.
 * ══════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  /** Lucide icon (backwards compatible) */
  icon?: LucideIcon;
  /** SVG illustration preset */
  illustration?: "coffee" | "orders" | "search" | "offline" | "error";
  /** Título */
  title: string;
  /** Descripción */
  description?: string;
  /** Botón o acción opcional (backwards compatible) */
  action?: ReactNode;
  /** Texto del botón de acción (nuevo API) */
  actionLabel?: string;
  /** Callback del botón (nuevo API) */
  onAction?: () => void;
  /** Tamaño del icono Lucide */
  iconSize?: number;
  /** Modo compacto */
  compact?: boolean;
}

/* ─── SVG Illustrations ─── */

function CoffeeIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
      <motion.path
        d="M30 28C30 28 32 22 30 16"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.3}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.path
        d="M40 26C40 26 42 18 40 12"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.4}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1.8, delay: 0.8, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.path
        d="M50 28C50 28 52 22 50 16"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.3}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{ duration: 1.6, delay: 1.1, repeat: Infinity, repeatType: "reverse" }}
      />
      <path d="M20 36H56L52 64C51.5 67 49 70 46 70H30C27 70 24.5 67 24 64L20 36Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.5} />
      <path d="M56 42C60 42 64 44 64 50C64 56 60 58 56 58" stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.3} />
      <ellipse cx="38" cy="72" rx="24" ry="3" stroke="currentColor" strokeWidth="1" opacity={0.2} />
    </svg>
  );
}

function OrdersIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
      <rect x="18" y="12" width="44" height="56" rx="4" stroke="currentColor" strokeWidth="1.5" opacity={0.3} />
      <line x1="28" y1="28" x2="52" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.25} />
      <line x1="28" y1="38" x2="48" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.2} />
      <line x1="28" y1="48" x2="44" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.15} />
      <motion.circle cx="24" cy="28" r="2" fill="currentColor" opacity={0.3}
        animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx="24" cy="38" r="2" fill="currentColor" opacity={0.2}
        animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
      />
      <motion.circle cx="24" cy="48" r="2" fill="currentColor" opacity={0.15}
        animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
      />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
      <circle cx="35" cy="35" r="16" stroke="currentColor" strokeWidth="1.5" opacity={0.4} />
      <line x1="47" y1="47" x2="62" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.3} />
      <motion.circle cx="55" cy="20" r="1.5" fill="currentColor" opacity={0.2}
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

function OfflineIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
      <path d="M24 50C18 50 14 46 14 40C14 34 18 30 24 30C24 24 28 18 36 18C44 18 48 24 48 28C54 28 60 32 60 38C60 44 56 50 48 50" stroke="currentColor" strokeWidth="1.5" opacity={0.3} fill="none" />
      <line x1="20" y1="60" x2="60" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
      <motion.circle cx="35" cy="60" r="1.5" fill="currentColor" opacity={0.2}
        animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.circle cx="45" cy="60" r="1.5" fill="currentColor" opacity={0.15}
        animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 1.5, delay: 0.4, repeat: Infinity }}
      />
    </svg>
  );
}

function ErrorIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
      <path d="M40 16L68 64H12L40 16Z" stroke="currentColor" strokeWidth="1.5" opacity={0.3} fill="none" />
      <line x1="40" y1="32" x2="40" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
      <motion.circle cx="40" cy="56" r="1.5" fill="currentColor" opacity={0.5}
        animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

const illustrationMap = {
  coffee: CoffeeIllustration,
  orders: OrdersIllustration,
  search: SearchIllustration,
  offline: OfflineIllustration,
  error: ErrorIllustration,
};

export default function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  actionLabel,
  onAction,
  iconSize = 24,
  compact = false,
}: EmptyStateProps) {
  const Illustration = illustration ? illustrationMap[illustration] : null;

  return (
    <div className={compact ? "flex flex-col items-center justify-center py-8 px-4" : "flex flex-col items-center justify-center py-14 px-4"}>
      {/* Ilustración SVG o Icono Lucide */}
      {(Illustration || Icon) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: timing.slow, ease: ease.out }}
          className="text-text-25 mb-4"
        >
          {Illustration ? (
            <Illustration />
          ) : Icon ? (
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
              <Icon size={iconSize} className="text-text-25" />
            </div>
          ) : null}
        </motion.div>
      )}

      {/* Separador decorativo */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: timing.smooth, delay: 0.1 }}
        aria-hidden="true"
        className="w-8 h-px bg-border mb-4"
      />

      {/* Título */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.smooth, delay: 0.15, ease: ease.out }}
        className="text-sm font-medium text-text-45 mb-1"
      >
        {title}
      </motion.p>

      {/* Descripción */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: timing.smooth, delay: 0.2, ease: ease.out }}
          className="text-xs text-text-25 text-center mb-4 max-w-xs"
        >
          {description}
        </motion.p>
      )}

      {/* Acción — soporta ambos APIs (action ReactNode o actionLabel+onAction) */}
      {(action || (actionLabel && onAction)) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: timing.smooth, delay: 0.28, ease: ease.out }}
        >
          {action ? (
            action
          ) : (
            <button
              onClick={onAction}
              className="text-xs font-medium text-accent hover:text-text-100 transition-colors duration-200 px-4 py-2 rounded-lg bg-accent-soft hover:bg-accent-mid"
            >
              {actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
