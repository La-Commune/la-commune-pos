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

  // Posición escalada del elemento en el canvas
  const posX = (mesa.pos_x ?? 0) * scale;
  const posY = (mesa.pos_y ?? 0) * scale;

  // Tamaño escalado
  const scaledW = ancho * scale;
  const scaledH = alto * scale;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        // Posicionar de modo que el centro de la mesa quede donde debe
        // left/top apuntan al centro, luego translate -50% para centrar
        left: posX + scaledW / 2,
        top: posY + scaledH / 2,
        transform: [
          // 1. Centrar el elemento sobre su posición
          "translate(-50%, -50%)",
          // 2. Drag offset
          transform ? `translate(${transform.x}px, ${transform.y}px)` : "",
          // 3. Rotación — ahora gira desde el centro porque transformOrigin es center
          rotacion ? `rotate(${rotacion}deg)` : "",
          // 4. Escala
          `scale(${scale})`,
        ]
          .filter(Boolean)
          .join(" "),
        // El origin es el centro del elemento
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
