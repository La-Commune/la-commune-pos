"use client";

import { useEffect, useRef, useCallback } from "react";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import type { Producto } from "@/types/database";

interface ProductoContextMenuProps {
  producto: Producto;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  onToggleDisponible: (producto: Producto) => void;
}

export default function ProductoContextMenu({
  producto,
  position,
  onClose,
  onEdit,
  onDelete,
  onToggleDisponible,
}: ProductoContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or ESC
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEsc);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Ajustar posición si se sale de pantalla
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) {
      ref.current.style.left = `${position.x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      ref.current.style.top = `${position.y - rect.height}px`;
    }
  }, [position]);

  const MenuItem = useCallback(
    ({
      icon: Icon,
      label,
      onClick,
      variant,
    }: {
      icon: typeof Pencil;
      label: string;
      onClick: () => void;
      variant?: "danger";
    }) => (
      <button
        onClick={() => {
          onClick();
          onClose();
        }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors rounded-lg ${
          variant === "danger"
            ? "text-status-err hover:bg-status-err-bg"
            : "text-text-70 hover:bg-surface-3"
        }`}
      >
        <Icon size={14} />
        {label}
      </button>
    ),
    [onClose]
  );

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[180px] p-1.5 rounded-xl border border-border bg-surface-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 mb-1 border-b border-border">
        <span className="text-xs font-semibold text-text-100 truncate block max-w-[200px]">
          {producto.nombre}
        </span>
        <span className="text-[10px] text-text-25">
          {formatMXN(producto.precio_base)}
        </span>
      </div>

      {/* Actions */}
      <MenuItem
        icon={Pencil}
        label="Editar producto"
        onClick={() => onEdit(producto)}
      />
      <MenuItem
        icon={producto.disponible ? EyeOff : Eye}
        label={producto.disponible ? "Marcar no disponible" : "Marcar disponible"}
        onClick={() => onToggleDisponible(producto)}
      />

      <div className="my-1 border-t border-border" />

      <MenuItem
        icon={Trash2}
        label="Eliminar producto"
        onClick={() => onDelete(producto)}
        variant="danger"
      />
    </div>
  );
}
