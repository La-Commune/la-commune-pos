"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import DraggableMesaWrapper from "./DraggableMesaWrapper";
import type { Mesa, Zona } from "@/lib/validators";

interface FloorPlanCanvasProps {
  mesas: Mesa[];
  zona: Zona | null;
  isAdmin: boolean;
  onMoveMesa: (mesaId: string, pos_x: number, pos_y: number) => void;
  onEditMesa: (mesa: Mesa) => void;
  onClickMesa: (mesa: Mesa) => void;
  onContextMenu: (mesa: Mesa, x: number, y: number) => void;
  onResizeMesa: (mesaId: string, ancho: number, alto: number) => void;
  onRotateMesa: (mesaId: string, rotacion: number) => void;
  onAddMesa: () => void;
}

const CANVAS_MIN_W = 600;
const CANVAS_H = 500;

export default function FloorPlanCanvas({
  mesas,
  zona,
  isAdmin,
  onMoveMesa,
  onEditMesa,
  onClickMesa,
  onContextMenu,
  onResizeMesa,
  onRotateMesa,
  onAddMesa,
}: FloorPlanCanvasProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(CANVAS_MIN_W);

  // ── Responsive: medir el contenedor ──
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setCanvasW(Math.max(CANVAS_MIN_W, w));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Drag & drop siempre activo para admin
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const mesa = mesas.find((m) => m.id === String(active.id));
      if (!mesa) return;

      const w = mesa.ancho ?? 80;
      const h = mesa.alto ?? 80;
      const rot = mesa.rotacion ?? 0;

      // Calcular bounding box considerando rotación
      // Cuando un rectángulo rota, su bounding box axis-aligned cambia
      const rad = (rot * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const bbW = w * cos + h * sin;
      const bbH = w * sin + h * cos;

      // pos_x/pos_y representan la esquina top-left del bounding box rotado
      // Clampear para que el bounding box rotado quede dentro del canvas
      const newX = Math.max(0, Math.min(canvasW - bbW, (mesa.pos_x ?? 0) + delta.x / scale));
      const newY = Math.max(0, Math.min(CANVAS_H - bbH, (mesa.pos_y ?? 0) + delta.y / scale));

      onMoveMesa(String(active.id), Math.round(newX), Math.round(newY));
    },
    [mesas, onMoveMesa, scale, canvasW]
  );

  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 1.8));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));
  const zoomFit = () => setScale(1);

  return (
    <div className="relative" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {zona && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: zona.color ?? "#94a3b8" }}
              />
              <span className="text-sm font-medium text-text-100">{zona.nombre}</span>
              <span className="text-xs text-text-25">
                · {mesas.length} {mesas.length === 1 ? "mesa" : "mesas"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-45 transition-colors"
            title="Alejar"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[10px] text-text-25 w-10 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-45 transition-colors"
            title="Acercar"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={zoomFit}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-45 transition-colors"
            title="Ajustar"
          >
            <Maximize2 size={16} />
          </button>

          {isAdmin && (
            <button
              onClick={onAddMesa}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-[11px]"
            >
              <Plus size={14} />
              Mesa
            </button>
          )}
        </div>
      </div>

      {/* Canvas — full width */}
      <div
        className="relative overflow-auto rounded-xl border border-border bg-surface-1"
        style={{ maxHeight: "65vh" }}
      >
        <DndContext
          sensors={isAdmin ? sensors : undefined}
          onDragEnd={isAdmin ? handleDragEnd : undefined}
        >
          <div
            className="relative"
            style={{
              width: canvasW * scale,
              height: CANVAS_H * scale,
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              transition: "height 0.2s",
            }}
          >
            {mesas.map((mesa) => (
              <DraggableMesaWrapper
                key={mesa.id}
                mesa={mesa}
                scale={scale}
                isAdmin={isAdmin}
                onEdit={onEditMesa}
                onClick={onClickMesa}
                onContextMenu={onContextMenu}
                onResize={onResizeMesa}
                onRotate={onRotateMesa}
              />
            ))}
          </div>

          {/* Sin DragOverlay — el elemento original ya se mueve con el transform de dnd-kit */}
        </DndContext>

        {/* Empty state */}
        {mesas.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-25">
            <p className="text-sm">Sin mesas en esta zona</p>
            {isAdmin && (
              <button
                onClick={onAddMesa}
                className="mt-2 text-xs text-accent hover:underline"
              >
                + Agregar primera mesa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {isAdmin && mesas.length > 0 && (
        <p className="text-[10px] text-text-25 mt-2 text-center">
          Arrastra para mover · Handles para redimensionar · Icono superior para rotar (Shift = snap 45°) · Click derecho para más opciones
        </p>
      )}
    </div>
  );
}
