"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { useZonasStore } from "@/store/zonas.store";
import type { Zona } from "@/lib/validators";

// ── Colores preset para zonas ──
const COLORES_ZONA = [
  "#8B7355", "#6B8E6B", "#7B8DAA", "#A0522D",
  "#708090", "#8FBC8F", "#CD853F", "#B0C4DE",
];

interface ZonaManagerProps {
  open: boolean;
  onClose: () => void;
  negocioId: string;
  onSave: (zona: Partial<Zona> & { nombre: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function ZonaManager({ open, onClose, negocioId, onSave, onDelete }: ZonaManagerProps) {
  const { zonas } = useZonasStore();
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(COLORES_ZONA[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setColor(COLORES_ZONA[0]);
    setEditingZona(null);
    setIsCreating(false);
  };

  const startEdit = (zona: Zona) => {
    setEditingZona(zona);
    setNombre(zona.nombre);
    setColor(zona.color ?? COLORES_ZONA[0]);
    setIsCreating(true);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      showToast("El nombre es requerido", "error");
      return;
    }

    setSaving(true);
    const data: Partial<Zona> & { nombre: string } = {
      ...(editingZona?.id ? { id: editingZona.id } : {}),
      negocio_id: negocioId,
      nombre: nombre.trim(),
      color,
      orden: editingZona?.orden ?? zonas.length,
    };

    const ok = await onSave(data);
    setSaving(false);

    if (ok) {
      showToast(
        editingZona ? `Zona "${nombre}" actualizada` : `Zona "${nombre}" creada`,
        "success"
      );
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await onDelete(id);
    if (ok) {
      showToast("Zona eliminada", "success");
      setConfirmDelete(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Gestionar Zonas" size="md">
      <div className="space-y-4">
        {/* Lista de zonas */}
        {zonas.length > 0 && !isCreating && (
          <div className="space-y-2">
            {zonas.map((zona) => (
              <div
                key={zona.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface-1 group"
              >
                <GripVertical size={14} className="text-text-25 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: zona.color }}
                />
                <span className="flex-1 text-sm text-text-100">{zona.nombre}</span>

                {confirmDelete === zona.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-status-err">¿Eliminar?</span>
                    <button
                      onClick={() => handleDelete(zona.id!)}
                      className="text-xs px-2 py-1 rounded-lg bg-status-err-bg text-status-err hover:opacity-80 transition-opacity"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs px-2 py-1 rounded-lg bg-surface-3 text-text-45 hover:opacity-80 transition-opacity"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(zona)}
                      className="p-1.5 rounded-lg text-text-25 hover:text-accent hover:bg-surface-3 transition-all"
                      aria-label={`Editar ${zona.nombre}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(zona.id!)}
                      className="p-1.5 rounded-lg text-text-25 hover:text-status-err hover:bg-status-err-bg transition-all"
                      aria-label={`Eliminar ${zona.nombre}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulario crear/editar */}
        {isCreating && (
          <div className="space-y-4 p-4 rounded-xl border border-accent/30 bg-accent-soft/20">
            <h3 className="text-xs font-medium text-text-45 uppercase tracking-wider">
              {editingZona ? "Editar zona" : "Nueva zona"}
            </h3>

            {/* Nombre */}
            <div>
              <label className="text-xs text-text-45 block mb-1.5">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Jardín, Piso 2..."
                maxLength={30}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface-1 text-text-100 text-sm placeholder:text-text-25 outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-xs text-text-45 block mb-1.5">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORES_ZONA.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "var(--accent)" : "transparent",
                      boxShadow: color === c ? "0 0 0 2px var(--accent-soft)" : "none",
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-xs rounded-xl border border-border text-text-45 hover:bg-surface-3 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nombre.trim()}
                className="px-4 py-2 text-xs rounded-xl text-surface-0 disabled:opacity-50 transition-all"
                style={{ background: "var(--accent)" }}
              >
                {saving ? "Guardando..." : editingZona ? "Actualizar" : "Crear Zona"}
              </button>
            </div>
          </div>
        )}

        {/* Botón agregar */}
        {!isCreating && (
          <button
            onClick={startCreate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-text-25 hover:text-accent hover:border-accent transition-all text-sm"
          >
            <Plus size={16} />
            Agregar Zona
          </button>
        )}
      </div>
    </Modal>
  );
}
