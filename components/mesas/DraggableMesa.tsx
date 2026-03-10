"use client";

import { useCallback, useRef, useState } from "react";
import { Users, GripVertical, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import type { Mesa } from "@/types/database";
import MesaTimer, { getMins, getLevel } from "./MesaTimer";

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

  // ¿Mesa estancada? (>60min ocupada)
  const isStale = mesa.ocupada_desde &&
    (mesa.estado === "ocupada" || mesa.estado === "reservada") &&
    getLevel(getMins(mesa.ocupada_desde)) === "err";

  // Counter-rotate para que el texto siempre sea horizontal
  const counterRotate = rotacion ? `rotate(${-rotacion}deg)` : undefined;

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

      // Pre-calcular rotación para transformar deltas de pantalla → espacio local
      const rad = -(rotacion * Math.PI) / 180; // negativo para invertir la rotación
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      const onMove = (ev: PointerEvent) => {
        const rawDx = (ev.clientX - startX) / scale;
        const rawDy = (ev.clientY - startY) / scale;

        // Rotar delta al espacio local de la mesa
        const dx = rawDx * cosR - rawDy * sinR;
        const dy = rawDx * sinR + rawDy * cosR;

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
    [ancho, alto, forma, rotacion, mesa.id, onResize, scale]
  );

  // ── Rotate via handle ──
  // Usamos el centro REAL del elemento (ancho/2, alto/2 en espacio local)
  // convertido a coordenadas de pantalla, en vez de getBoundingClientRect
  // que para rectángulos rotados da un bbox distorsionado.
  const handleRotateStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onRotate || !mesa.id || !containerRef.current) return;

      setIsRotating(true);

      // Obtener el centro real del elemento vía getClientRects o DOMRect
      // Para un elemento rotado, getBoundingClientRect da el AABB (axis-aligned bounding box).
      // Pero el centro del AABB sí coincide con el centro real del elemento rotado,
      // porque la rotación es alrededor del centro (transformOrigin: center).
      // Sin embargo, el padre (wrapper) aplica la rotación, no este div.
      // Así que el rect de ESTE containerRef ya está en espacio rotado del padre.
      // El centro del rect del padre es correcto.
      const el = containerRef.current;
      // Subir al wrapper que tiene el transform de rotación
      const wrapper = el.parentElement;
      if (!wrapper) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const centerX = wrapperRect.left + wrapperRect.width / 2;
      const centerY = wrapperRect.top + wrapperRect.height / 2;

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
      className={cn(
        "relative flex flex-col items-center justify-center border-2 bg-surface-1 shadow-card select-none group",
        isStale && "mesa-stale-pulse border-status-err"
      )}
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

      {/* ── Contenido con counter-rotate para que siempre sea legible ── */}
      <div
        className="flex flex-col items-center justify-center pointer-events-none"
        style={{
          transform: counterRotate,
          // Evitar que el texto counter-rotado se desborde visualmente
          // Tamaño fijo para que no afecte el layout del contenedor
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Número */}
        <span className="text-base font-semibold text-text-100 leading-none">
          {mesa.numero}
        </span>

        {/* Capacidad */}
        <div className="flex items-center gap-0.5 mt-1">
          <Users size={10} className="text-text-25" />
          <span className="text-[10px] text-text-25">{mesa.capacidad}</span>
        </div>

        {/* Timer inline — solo cuando ocupada/reservada */}
        {mesa.ocupada_desde &&
          (mesa.estado === "ocupada" || mesa.estado === "reservada") && (
            <div className="mt-0.5">
              <MesaTimer
                ocupadaDesde={mesa.ocupada_desde}
                variant="inline"
                showIcon={false}
              />
            </div>
          )}
      </div>

      {/* Status label on hover — también counter-rotado */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          backgroundColor: `var(${estado.cssVar})`,
          color: "var(--surface-0)",
          transform: counterRotate,
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
      {/* Distancia fija de 28px del borde para que se sienta consistente
          independientemente del aspect ratio del rectángulo */}
      {isAdmin && onRotate && forma === "cuadrada" && (
        <div
          onPointerDown={handleRotateStart}
          className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-accent hover:text-white hover:border-accent"
          style={{ top: -28 }}
          title="Arrastrar para rotar · Shift = snap 45°"
        >
          <RotateCw size={10} />
        </div>
      )}

      {/* Rotation indicator line (from center to rotation handle) */}
      {isAdmin && onRotate && forma === "cuadrada" && rotacion !== 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-px bg-accent/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ top: -18, height: 18 }}
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
