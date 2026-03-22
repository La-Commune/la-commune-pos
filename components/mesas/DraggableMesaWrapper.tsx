"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ESTADO_MESA_CONFIG } from "@/lib/constants";
import DraggableMesa from "./DraggableMesa";
import type { Mesa } from "@/types/database";

const MOVE_STEP = 10;
const MOVE_STEP_FINE = 1;
const PERSIST_DELAY = 250;

interface DraggableMesaWrapperProps {
  mesa: Mesa;
  scale: number;
  isAdmin: boolean;
  onEdit: (mesa: Mesa) => void;
  onClick: (mesa: Mesa) => void;
  onContextMenu: (mesa: Mesa, x: number, y: number) => void;
  onResize: (mesaId: string, ancho: number, alto: number) => void;
  onRotate: (mesaId: string, rotacion: number) => void;
  onMove?: (mesaId: string, pos_x: number, pos_y: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export default function DraggableMesaWrapper({
  mesa,
  scale,
  isAdmin,
  onEdit,
  onClick,
  onContextMenu,
  onResize,
  onRotate,
  onMove,
  canvasWidth = 600,
  canvasHeight = 500,
}: DraggableMesaWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: mesa.id ?? "", disabled: !isAdmin });

  const rotacion = mesa.rotacion ?? 0;
  const ancho = mesa.ancho ?? 80;
  const alto = mesa.alto ?? 80;

  const rad = (rotacion * Math.PI) / 180;
  const cosR = Math.abs(Math.cos(rad));
  const sinR = Math.abs(Math.sin(rad));
  const bbW = ancho * cosR + alto * sinR;
  const bbH = ancho * sinR + alto * cosR;

  // ── Keyboard movement ──
  // Uses an ABSOLUTE local position (kbPos) instead of an offset.
  // While kbPos is set, visual ignores mesa.pos_x/pos_y entirely,
  // which prevents any blink from stale realtime/store data.
  // kbPos is only cleared once the store prop matches our target.
  const [kbPos, setKbPos] = useState<{ x: number; y: number } | null>(null);
  const kbPosRef = useRef<{ x: number; y: number } | null>(null);
  const kbTargetRef = useRef<{ x: number; y: number } | null>(null);
  const kbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only clear keyboard override when the store confirms our target position.
  // This prevents blinks from stale realtime data.
  useEffect(() => {
    const target = kbTargetRef.current;
    if (target && mesa.pos_x === target.x && mesa.pos_y === target.y) {
      kbTargetRef.current = null;
      kbPosRef.current = null;
      setKbPos(null);
    }
  }, [mesa.pos_x, mesa.pos_y]);

  useEffect(() => {
    return () => {
      if (kbTimerRef.current) clearTimeout(kbTimerRef.current);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isAdmin || !onMove || !mesa.id) return;

      const step = e.shiftKey ? MOVE_STEP_FINE : MOVE_STEP;

      // Start from current keyboard position, or from prop if first press
      const cur = kbPosRef.current ?? { x: mesa.pos_x ?? 0, y: mesa.pos_y ?? 0 };

      let newX = cur.x;
      let newY = cur.y;

      switch (e.key) {
        case "ArrowUp":    newY = Math.max(0, cur.y - step); break;
        case "ArrowDown":  newY = Math.min(canvasHeight - bbH, cur.y + step); break;
        case "ArrowLeft":  newX = Math.max(0, cur.x - step); break;
        case "ArrowRight": newX = Math.min(canvasWidth - bbW, cur.x + step); break;
        default: return;
      }

      e.preventDefault();

      const pos = { x: Math.round(newX), y: Math.round(newY) };
      kbPosRef.current = pos;
      setKbPos(pos);

      // Debounce persist — only fires once user stops pressing
      if (kbTimerRef.current) clearTimeout(kbTimerRef.current);
      kbTimerRef.current = setTimeout(() => {
        const final = kbPosRef.current;
        if (!final) return;
        // Set the target BEFORE calling onMove, so the useEffect
        // knows which position to wait for.
        kbTargetRef.current = final;
        onMove(mesa.id!, final.x, final.y);
      }, PERSIST_DELAY);
    },
    [isAdmin, onMove, mesa.id, mesa.pos_x, mesa.pos_y, bbW, bbH, canvasWidth, canvasHeight]
  );

  // ── Position: use keyboard pos if active, otherwise prop ──
  const effectiveX = kbPos?.x ?? (mesa.pos_x ?? 0);
  const effectiveY = kbPos?.y ?? (mesa.pos_y ?? 0);

  const centerX = effectiveX * scale + (bbW * scale) / 2;
  const centerY = effectiveY * scale + (bbH * scale) / 2;

  const estado = ESTADO_MESA_CONFIG[mesa.estado as keyof typeof ESTADO_MESA_CONFIG] ?? ESTADO_MESA_CONFIG.disponible;

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-label={`Mesa ${mesa.numero}, ${estado.label}, ${mesa.capacidad} personas${isAdmin ? ". Usa flechas para mover, Shift+flechas para ajuste fino" : ""}`}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        left: centerX,
        top: centerY,
        transform: [
          "translate(-50%, -50%)",
          transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
          rotacion ? `rotate(${rotacion}deg)` : "",
          `scale(${scale})`,
        ]
          .filter(Boolean)
          .join(" "),
        transformOrigin: "center center",
        zIndex: isDragging ? 50 : 1,
        outline: "none",
      }}
      className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
    >
      <DraggableMesa
        mesa={mesa}
        isDragging={isDragging}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onResize={onResize}
        onRotate={onRotate}
        scale={scale}
        dragListeners={isAdmin ? listeners : undefined}
        dragAttributes={isAdmin ? attributes : undefined}
      />
    </div>
  );
}
