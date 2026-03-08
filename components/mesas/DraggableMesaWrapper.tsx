"use client";

import { useDraggable } from "@dnd-kit/core";
import DraggableMesa from "./DraggableMesa";
import type { Mesa } from "@/lib/validators";

interface DraggableMesaWrapperProps {
  mesa: Mesa;
  scale: number;
  isAdmin: boolean;
  onEdit: (mesa: Mesa) => void;
  onClick: (mesa: Mesa) => void;
  onContextMenu: (mesa: Mesa, x: number, y: number) => void;
  onResize: (mesaId: string, ancho: number, alto: number) => void;
  onRotate: (mesaId: string, rotacion: number) => void;
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
}: DraggableMesaWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: mesa.id ?? "", disabled: !isAdmin });

  const rotacion = mesa.rotacion ?? 0;
  const ancho = mesa.ancho ?? 80;
  const alto = mesa.alto ?? 80;

  // Calcular bounding box rotado para posicionar correctamente
  const rad = (rotacion * Math.PI) / 180;
  const cosR = Math.abs(Math.cos(rad));
  const sinR = Math.abs(Math.sin(rad));
  const bbW = ancho * cosR + alto * sinR;
  const bbH = ancho * sinR + alto * cosR;

  // pos_x/pos_y = esquina top-left del bounding box rotado
  const posX = (mesa.pos_x ?? 0) * scale;
  const posY = (mesa.pos_y ?? 0) * scale;

  // Centro del bounding box = centro visual de la mesa rotada
  const centerX = posX + (bbW * scale) / 2;
  const centerY = posY + (bbH * scale) / 2;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        // left/top apuntan al centro del bounding box,
        // translate(-50%,-50%) centra el elemento sobre ese punto
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
      }}
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
