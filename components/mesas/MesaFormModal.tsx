"use client";

import { useState, useEffect } from "react";
import { Circle, Square, RectangleHorizontal } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { useZonasStore } from "@/store/zonas.store";
import type { Mesa } from "@/lib/validators";

const FORMAS = [
  { id: "cuadrada" as const, label: "Cuadrada", Icon: Square },
  { id: "redonda" as const, label: "Redonda", Icon: Circle },
  { id: "rectangular" as const, label: "Rectangular", Icon: RectangleHorizontal },
];

interface MesaFormModalProps {
  open: boolean;
  onClose: () => void;
  mesa?: Mesa | null; // null = crear, Mesa = editar
  negocioId: string;
  onSave: (data: Partial<Mesa>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export default function MesaFormModal({
  open,
  onClose,
  mesa,
  negocioId,
  onSave,
  onDelete,
}: MesaFormModalProps) {
  const { zonas } = useZonasStore();
  const isEditing = !!mesa?.id;

  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("4");
  const [zonaId, setZonaId] = useState("");
  const [forma, setForma] = useState<"redonda" | "cuadrada" | "rectangular">("cuadrada");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Rellenar form cuando se edita
  useEffect(() => {
    if (mesa) {
      setNumero(String(mesa.numero));
      setCapacidad(String(mesa.capacidad));
      setZonaId(mesa.zona_id ?? "");
      setForma((mesa.forma as typeof forma) ?? "cuadrada");
    } else {
      setNumero("");
      setCapacidad("4");
      setZonaId(zonas[0]?.id ?? "");
      setForma("cuadrada");
    }
    setConfirmDelete(false);
  }, [mesa, open, zonas]);

  const handleSave = async () => {
    const num = parseInt(numero);
    const cap = parseInt(capacidad);

    if (!num || num < 1) {
      showToast("Número de mesa inválido", "error");
      return;
    }
    if (!cap || cap < 1) {
      showToast("Capacidad inválida", "error");
      return;
    }
    if (!zonaId) {
      showToast("Selecciona una zona", "error");
      return;
    }

    setSaving(true);
    const data: Partial<Mesa> = {
      ...(mesa?.id ? { id: mesa.id } : {}),
      negocio_id: negocioId,
      numero: num,
      capacidad: cap,
      zona_id: zonaId,
      forma,
      // Mantener posición si es edición
      pos_x: mesa?.pos_x ?? 80,
      pos_y: mesa?.pos_y ?? 80,
    };

    const ok = await onSave(data);
    setSaving(false);

    if (ok) {
      showToast(isEditing ? `Mesa ${num} actualizada` : `Mesa ${num} creada`, "success");
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!mesa?.id || !onDelete) return;
    setSaving(true);
    const ok = await onDelete(mesa.id);
    setSaving(false);
    if (ok) {
      showToast(`Mesa ${mesa.numero} eliminada`, "success");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Editar Mesa ${mesa?.numero}` : "Nueva Mesa"}
      size="sm"
    >
      <div className="space-y-5">
        {/* Número y Capacidad (inline) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-45 block mb-1.5">Número</label>
            <input
              type="number"
              min={1}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface-1 text-text-100 text-sm placeholder:text-text-25 outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-text-45 block mb-1.5">Capacidad</label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="4"
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface-1 text-text-100 text-sm placeholder:text-text-25 outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Zona */}
        <div>
          <label className="text-xs text-text-45 block mb-1.5">Zona</label>
          <select
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface-1 text-text-100 text-sm outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="">— Seleccionar —</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Forma */}
        <div>
          <label className="text-xs text-text-45 block mb-2">Forma</label>
          <div className="flex gap-2">
            {FORMAS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForma(id)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: forma === id ? "var(--accent)" : "var(--border)",
                  background: forma === id ? "var(--accent-soft)" : "var(--surface-1)",
                }}
              >
                <Icon
                  size={20}
                  style={{ color: forma === id ? "var(--accent)" : "var(--text-45)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: forma === id ? "var(--accent)" : "var(--text-45)" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Eliminar (solo en edición) */}
          <div>
            {isEditing && onDelete && (
              <>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-status-err">¿Seguro?</span>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="text-xs px-3 py-1.5 rounded-lg bg-status-err-bg text-status-err hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-surface-3 text-text-45 hover:opacity-80 transition-opacity"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs text-text-25 hover:text-status-err transition-colors"
                  >
                    Eliminar mesa
                  </button>
                )}
              </>
            )}
          </div>

          {/* Guardar/Cancelar */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-border text-text-45 hover:bg-surface-3 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs rounded-xl text-surface-0 disabled:opacity-50 transition-all"
              style={{ background: "var(--accent)" }}
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear Mesa"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
