"use client";

import { useState, useEffect, useMemo } from "react";
import { Circle, Square, ArrowLeftRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { showToast } from "@/components/ui/Toast";
import { useZonasStore } from "@/store/zonas.store";
import type { Mesa } from "@/types/database";

const FORMAS = [
  { id: "cuadrada" as const, label: "Cuadrada", Icon: Square },
  { id: "redonda" as const, label: "Redonda", Icon: Circle },
];

interface MesaFormModalProps {
  open: boolean;
  onClose: () => void;
  mesa?: Mesa | null; // null = crear, Mesa = editar
  negocioId: string;
  mesas: Mesa[]; // todas las mesas para detectar duplicados
  onSave: (data: Partial<Mesa>) => Promise<boolean>;
  onSwap: (mesaAId: string, numA: number, mesaBId: string, numB: number) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export default function MesaFormModal({
  open,
  onClose,
  mesa,
  negocioId,
  mesas,
  onSave,
  onSwap,
  onDelete,
}: MesaFormModalProps) {
  const { zonas } = useZonasStore();
  const isEditing = !!mesa?.id;

  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("4");
  const [zonaId, setZonaId] = useState("");
  const [forma, setForma] = useState<"redonda" | "cuadrada">("cuadrada");
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
      // Para nueva mesa, sugerir el siguiente número disponible
      const maxNum = mesas.length > 0 ? Math.max(...mesas.map((m) => m.numero)) : 0;
      setNumero(String(maxNum + 1));
      setCapacidad("4");
      setZonaId(zonas[0]?.id ?? "");
      setForma("cuadrada");
    }
    setConfirmDelete(false);
  }, [mesa, open, zonas, mesas]);

  // Detectar conflicto de número
  const conflictMesa = useMemo(() => {
    const num = parseInt(numero);
    if (!num || !isEditing) return null;
    // Buscar otra mesa activa con ese número (excluyendo la que se edita)
    return mesas.find((m) => m.numero === num && m.id !== mesa?.id) ?? null;
  }, [numero, mesas, mesa?.id, isEditing]);

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

    // Si hay conflicto en edición, hacer swap
    if (conflictMesa && isEditing && mesa?.id) {
      setSaving(true);
      const ok = await onSwap(mesa.id, num, conflictMesa.id!, mesa.numero);
      setSaving(false);
      if (ok) {
        showToast(`Mesas ${num} y ${mesa.numero} intercambiadas`, "success");
        onClose();
      }
      return;
    }

    // Si hay conflicto en creación, bloquear
    if (!isEditing) {
      const exists = mesas.find((m) => m.numero === num);
      if (exists) {
        showToast(`Ya existe una mesa con el número ${num}`, "error");
        return;
      }
    }

    setSaving(true);
    const data: Partial<Mesa> = {
      ...(mesa?.id ? { id: mesa.id } : {}),
      negocio_id: negocioId,
      numero: num,
      capacidad: cap,
      zona_id: zonaId,
      forma,
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

        {/* Swap hint — aparece cuando hay conflicto */}
        {conflictMesa && isEditing && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <ArrowLeftRight size={14} className="text-accent shrink-0" />
            <p className="text-xs text-text-70">
              La mesa <strong>{conflictMesa.numero}</strong> ya existe.
              Al guardar se <strong>intercambiarán</strong> los números:
              Mesa {mesa?.numero} → {parseInt(numero)}, Mesa {conflictMesa.numero} → {mesa?.numero}
            </p>
          </div>
        )}

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
              className="px-5 py-2 text-xs rounded-xl text-surface-0 disabled:opacity-50 transition-all flex items-center gap-1.5"
              style={{ background: "var(--accent)" }}
            >
              {saving
                ? "Guardando..."
                : conflictMesa && isEditing
                  ? "Intercambiar"
                  : isEditing
                    ? "Actualizar"
                    : "Crear Mesa"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
