"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { useState } from "react";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import DraggableMesaWrapper from "./DraggableMesaWrapper";
import DraggableMesa from "./DraggableMesa";
import type { Mesa, Zona } from "@/lib/validators";

interface FloorPlanCanvasProps {
  mesas: Mesa[];
  zona: Zona | null;
  editMode: boolean;
  onMoveMesa: (mesaId: string, pos_x: number, pos_y: number) => void;
  onEditMesa: (mesa: Mesa) => void;
  onClickMesa: (mesa: Mesa) => void;
  onAddMesa: () => void;
}

const CANVAS_W = 800;
const CANVAS_H = 500;

export default function FloorPlanCanvas({
  mesas,
  zona,
  editMode,
  onMoveMesa,
  onEditMesa,
  onClickMesa,
  onAddMesa,
}: FloorPlanCanvasProps) {
  const [activeMesa, setActiveMesa] = useState<Mesa | null>(null);
  const [scale, setScale] = useState(1);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback(
    (event: { active: { id: string | number } }) => {
      const mesa = mesas.find((m) => m.id === String(event.active.id));
      if (mesa) setActiveMesa(mesa);
    },
    [mesas]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveMesa(null);
      const { active, delta } = event;
      const mesa = mesas.find((m) => m.id === String(active.id));
      if (!mesa) return;

      // Calcular nueva posición, clamped al canvas
      const newX = Math.max(0, Math.min(CANVAS_W - 80, (mesa.pos_x ?? 0) + delta.x / scale));
      const newY = Math.max(0, Math.min(CANVAS_H - 60, (mesa.pos_y ?? 0) + delta.y / scale));

      onMoveMesa(String(active.id), Math.round(newX), Math.round(newY));
    },
    [mesas, onMoveMesa, scale]
  );

  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 1.8));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));

  return (
    <div className="relative">
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

          {editMode && (
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

      {/* Canvas */}
      <div
        className="relative overflow-auto rounded-xl border border-border bg-surface-1"
        style={{ maxHeight: "60vh" }}
      >
        <DndContext
          sensors={editMode ? sensors : undefined}
          onDragStart={editMode ? handleDragStart : undefined}
          onDragEnd={editMode ? handleDragEnd : undefined}
        >
          <div
            className="relative"
            style={{
              width: CANVAS_W * scale,
              height: CANVAS_H * scale,
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              transition: "width 0.2s, height 0.2s",
            }}
          >
            {mesas.map((mesa) => (
              <DraggableMesaWrapper
                key={mesa.id}
                mesa={mesa}
                scale={scale}
                editMode={editMode}
                onEdit={onEditMesa}
                onClick={onClickMesa}
              />
            ))}
          </div>

          {/* Drag overlay — ghost element while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeMesa ? (
              <DraggableMesa
                mesa={activeMesa}
                isDragging
                editMode={editMode}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {mesas.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-25">
            <p className="text-sm">Sin mesas en esta zona</p>
            {editMode && (
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
      {editMode && mesas.length > 0 && (
        <p className="text-[10px] text-text-25 mt-2 text-center">
          Arrastra las mesas para reposicionarlas · Los cambios se guardan automáticamente
        </p>
      )}
    </div>
  );
}
