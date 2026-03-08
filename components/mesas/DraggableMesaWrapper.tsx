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
}

export default function DraggableMesaWrapper({
  mesa,
  scale,
  isAdmin,
  onEdit,
  onClick,
  onContextMenu,
}: DraggableMesaWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: mesa.id ?? "", disabled: !isAdmin });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: (mesa.pos_x ?? 0) * scale,
        top: (mesa.pos_y ?? 0) * scale,
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px) scale(${scale})`
          : `scale(${scale})`,
        transformOrigin: "top left",
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
        dragListeners={isAdmin ? listeners : undefined}
        dragAttributes={isAdmin ? attributes : undefined}
      />
    </div>
  );
}
