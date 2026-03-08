"use client";

import { useCallback, useRef, useState } from "react";
import { Users, GripVertical, RotateCw } from "lucide-react";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import type { Mesa } from "@/lib/validators";

interface DraggableMesaProps {
  mesa: Mesa;
  isDragging?: boolean;
  isAdmin?: boolean;
  onEdit?: (mesa: Mesa) => void;
  onClick?: (mesa: Mesa) => void;
  onContextMenu?: (mesa: Mesa, x: number, y: number) => void;
  onResize?: (mesaId: string, ancho: number, alto: number) => void;
  onRotate?: (mesaId: string, rotacion: number) => void;
  scale?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: any;
  style?: React.CSSProperties;
}

const MIN_SIZE = 50;
const MAX_SIZE = 300;
const SNAP_ANGLE = 45;

export default function DraggableMesa({
  mesa,
  isDragging = false,
  isAdmin = false,
  onEdit,
  onClick,
  onContextMenu,
  onResize,
  onRotate,
  scale = 1,
  dragListeners,
  dragAttributes,
  style,
}: DraggableMesaProps) {
  const estado = ESTADO_MESA_CONFIG[mesa.estado as keyof typeof ESTADO_MESA_CONFIG];
  const forma = mesa.forma ?? "cuadrada";
  const ancho = mesa.ancho ?? 80;
  const alto = mesa.alto ?? 80;
  const rotacion = mesa.rotacion ?? 0;

  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Flag para bloquear el click que se dispara justo después de soltar resize/rotate
  const justFinishedInteractionRef = useRef(false);

  const borderRadius =
    forma === "redonda" ? "50%" : "var(--radius-lg)";

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin || !onContextMenu) return;
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(mesa, e.clientX, e.clientY);
  };

  // ── Resize via corner handle ──
  const handleResizeStart = useCallback(
    (corner: "se" | "e" | "s", e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onResize || !mesa.id) return;

      setIsResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = ancho;
      const startH = alto;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;

        let newW = startW;
        let newH = startH;

        if (corner === "se" || corner === "e") {
          newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(startW + dx)));
        }
        if (corner === "se" || corner === "s") {
          newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(startH + dy)));
        }

        // Para redondas, mantener proporción 1:1
        if (forma === "redonda") {
          const maxDim = Math.max(newW, newH);
          newW = maxDim;
          newH = maxDim;
        }

        onResize(mesa.id!, newW, newH);
      };

      const onUp = () => {
        setIsResizing(false);
        justFinishedInteractionRef.current = true;
        setTimeout(() => { justFinishedInteractionRef.current = false; }, 50);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [ancho, alto, forma, mesa.id, onResize, scale]
  );

  // ── Rotate via top handle ──
  const handleRotateStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onRotate || !mesa.id || !containerRef.current) return;

      setIsRotating(true);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const onMove = (ev: PointerEvent) => {
        const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
        let degrees = Math.round((angle * 180) / Math.PI + 90);
        if (degrees < 0) degrees += 360;

        // Snap a 45° si se mantiene Shift
        if (ev.shiftKey) {
          degrees = Math.round(degrees / SNAP_ANGLE) * SNAP_ANGLE;
        }

        degrees = degrees % 360;
        onRotate(mesa.id!, degrees);
      };

      const onUp = () => {
        setIsRotating(false);
        justFinishedInteractionRef.current = true;
        setTimeout(() => { justFinishedInteractionRef.current = false; }, 50);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [mesa.id, onRotate]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: ancho,
        height: alto,
        borderRadius,
        cursor: isResizing || isRotating ? "default" : isAdmin ? "grab" : "pointer",
        opacity: isDragging ? 0.5 : 1,
        transition: isDragging || isResizing || isRotating ? "none" : "box-shadow 0.2s",
        transform: isDragging ? "scale(1.05)" : "scale(1)",
        ...style,
      }}
      className="relative flex flex-col items-center justify-center border-2 bg-surface-1 shadow-card select-none group"
      onClick={(e) => {
        if (isResizing || isRotating || justFinishedInteractionRef.current) return;
        if (onClick) onClick(mesa);
      }}
      onContextMenu={handleContextMenu}
      {...(!isResizing && !isRotating && dragListeners ? dragListeners : {})}
      {...(!isResizing && !isRotating && dragAttributes ? dragAttributes : {})}
    >
      {/* Status indicator — top bar */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
        style={{
          width: "60%",
          backgroundColor: `var(${estado.cssVar})`,
        }}
      />

      {/* Grip icon (admin, when not showing handles) */}
      {isAdmin && !isResizing && !isRotating && (
        <GripVertical
          size={12}
          className="absolute top-1 right-1 text-text-25 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        />
      )}

      {/* Número */}
      <span className="text-base font-semibold text-text-100 leading-none pointer-events-none">
        {mesa.numero}
      </span>

      {/* Capacidad */}
      <div className="flex items-center gap-0.5 mt-1 pointer-events-none">
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

      {/* ── Admin: Resize handles ── */}
      {isAdmin && onResize && (
        <>
          {/* Right edge */}
          <div
            onPointerDown={(e) => handleResizeStart("e", e)}
            className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-[10px] h-6 rounded-sm bg-accent/80 cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accent"
            title="Arrastrar para cambiar ancho"
          />

          {/* Bottom edge */}
          <div
            onPointerDown={(e) => handleResizeStart("s", e)}
            className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 h-[10px] w-6 rounded-sm bg-accent/80 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accent"
            title="Arrastrar para cambiar alto"
          />

          {/* SE corner */}
          <div
            onPointerDown={(e) => handleResizeStart("se", e)}
            className="absolute -bottom-[6px] -right-[6px] w-3 h-3 rounded-full bg-accent border-2 border-surface-1 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-125"
            title="Arrastrar para redimensionar"
          />
        </>
      )}

      {/* ── Admin: Rotation handle ── */}
      {isAdmin && onRotate && forma === "cuadrada" && (
        <div
          onPointerDown={handleRotateStart}
          className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-accent hover:text-white hover:border-accent"
          title="Arrastrar para rotar · Shift = snap 45°"
        >
          <RotateCw size={10} />
        </div>
      )}

      {/* Rotation indicator line (from center to rotation handle) */}
      {isAdmin && onRotate && forma === "cuadrada" && rotacion !== 0 && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-accent/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ top: -12 }}
        />
      )}

      {/* Border color by status */}
      <style jsx>{`
        div:first-child {
          border-color: color-mix(in srgb, var(${estado.cssVar}) 40%, var(--border));
        }
      `}</style>
    </div>
  );
}
