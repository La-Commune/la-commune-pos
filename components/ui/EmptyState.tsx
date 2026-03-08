"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Icono de Lucide para mostrar */
  icon: LucideIcon;
  /** Título del estado vacío */
  title: string;
  /** Descripción detallada */
  description: string;
  /** Botón o acción opcional a mostrar bajo la descripción */
  action?: ReactNode;
  /** Tamaño del icono (default: 24) */
  iconSize?: number;
}

/**
 * Componente reutilizable para estados vacíos
 * Usado en: ordenes, fidelidad, mesas, etc.
 *
 * Ejemplo:
 * ```tsx
 * <EmptyState
 *   icon={ClipboardList}
 *   title="Sin órdenes activas"
 *   description="Crea una nueva orden para comenzar"
 *   action={<button>Nueva orden</button>}
 * />
 * ```
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconSize = 24,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icono en caja redondeada */}
      <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
        <Icon size={iconSize} className="text-text-25" />
      </div>

      {/* Título */}
      <p className="text-sm font-medium text-text-45 mb-1">{title}</p>

      {/* Descripción */}
      <p className="text-xs text-text-25 text-center mb-4 max-w-xs">
        {description}
      </p>

      {/* Acción opcional */}
      {action && <div>{action}</div>}
    </div>
  );
}
