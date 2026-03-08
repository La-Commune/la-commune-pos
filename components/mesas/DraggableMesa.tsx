"use client";

import { Circle, Square, RectangleHorizontal, Users, GripVertical } from "lucide-react";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import type { Mesa } from "@/lib/validators";

interface DraggableMesaProps {
  mesa: Mesa;
  isDragging?: boolean;
  editMode?: boolean;
  onEdit?: (mesa: Mesa) => void;
  onClick?: (mesa: Mesa) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any;
  style?: React.CSSProperties;
}

const FORMA_SIZES = {
  redonda: { w: 80, h: 80 },
  cuadrada: { w: 80, h: 80 },
  rectangular: { w: 120, h: 70 },
};

const FormaIcon = {
  redonda: Circle,
  cuadrada: Square,
  rectangular: RectangleHorizontal,
};

export default function DraggableMesa({
  mesa,
  isDragging = false,
  editMode = false,
  onEdit,
  onClick,
  dragListeners,
  dragAttributes,
  style,
}: DraggableMesaProps) {
  const estado = ESTADO_MESA_CONFIG[mesa.estado as keyof typeof ESTADO_MESA_CONFIG];
  const forma = (mesa.forma ?? "cuadrada") as keyof typeof FORMA_SIZES;
  const size = FORMA_SIZES[forma];

  const borderRadius =
    forma === "redonda" ? "50%" : forma === "rectangular" ? "var(--radius-lg)" : "var(--radius-lg)";

  return (
    <div
      style={{
        width: size.w,
        height: size.h,
        borderRadius,
        cursor: editMode ? "grab" : "pointer",
        opacity: isDragging ? 0.5 : 1,
        transition: isDragging ? "none" : "box-shadow 0.2s, transform 0.2s",
        transform: isDragging ? "scale(1.08)" : "scale(1)",
        ...style,
      }}
      className="relative flex flex-col items-center justify-center border-2 bg-surface-1 shadow-card select-none group"
      onClick={() => {
        if (editMode && onEdit) onEdit(mesa);
        else if (onClick) onClick(mesa);
      }}
      {...(editMode ? dragListeners : {})}
      {...(editMode ? dragAttributes : {})}
    >
      {/* Status indicator — top bar */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
        style={{
          width: "60%",
          backgroundColor: `var(${estado.cssVar})`,
        }}
      />

      {/* Grip (edit mode) */}
      {editMode && (
        <GripVertical
          size={12}
          className="absolute top-1 right-1 text-text-25 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}

      {/* Número */}
      <span className="text-base font-semibold text-text-100 leading-none">
        {mesa.numero}
      </span>

      {/* Capacidad */}
      <div className="flex items-center gap-0.5 mt-1">
        <Users size={10} className="text-text-25" />
        <span className="text-[10px] text-text-25">{mesa.capacidad}</span>
      </div>

      {/* Status label on hover */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          backgroundColor: `var(${estado.cssVar})`,
          color: "var(--surface-0)",
        }}
      >
        {estado.label}
      </div>

      {/* Border color by status */}
      <style jsx>{`
        div:first-child {
          border-color: color-mix(in srgb, var(${estado.cssVar}) 40%, var(--border));
        }
      `}</style>
    </div>
  );
}
