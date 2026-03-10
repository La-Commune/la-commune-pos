"use client";

import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategorias } from "@/hooks/useSupabase";
import type { CategoriaMenu } from "@/types/database";

interface ProductoFormProps {
  producto?: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function ProductoForm({ producto, onSave, onCancel }: ProductoFormProps) {
  const { data: categorias } = useCategorias();
  const isEditing = !!producto;

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precioBase, setPrecioBase] = useState(producto?.precio_base?.toString() ?? "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? (categorias as CategoriaMenu[])[0]?.id ?? "");
  const [disponible, setDisponible] = useState(producto?.disponible ?? true);
  const [ingredientes, setIngredientes] = useState(producto?.ingredientes?.join(", ") ?? "");
  const [etiquetas, setEtiquetas] = useState(producto?.etiquetas?.join(", ") ?? "");
  const [tamanos, setTamanos] = useState<any[]>(
    producto?.tamanos ?? []
  );

  const agregarTamano = () => {
    setTamanos([...tamanos, { id: `t-new-${Date.now()}`, nombre: "", precio_adicional: 0, orden: tamanos.length }]);
  };

  const actualizarTamano = (idx: number, field: string, value: string | number) => {
    setTamanos(tamanos.map((t: any, i: number) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const eliminarTamano = (idx: number) => {
    setTamanos(tamanos.filter((_: any, i: number) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseFloat(precioBase);
    if (isNaN(precio) || precio < 0) {
      return; // HTML5 validation will handle the message
    }
    onSave({
      nombre,
      descripcion: descripcion || null,
      precio_base: parseFloat(precioBase) || 0,
      categoria_id: categoriaId,
      disponible,
      ingredientes: ingredientes
        .split(",")
        .map((i: string) => i.trim())
        .filter(Boolean),
      etiquetas: etiquetas
        .split(",")
        .map((e: string) => e.trim())
        .filter(Boolean),
      tamanos: tamanos.filter((t: any) => t.nombre.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label htmlFor="prod-nombre" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Nombre del producto *
        </label>
        <input
          id="prod-nombre"
          type="text"
          value={nombre}
          maxLength={100}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Latte"
          required
          className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
        />
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="prod-descripcion" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Descripción
        </label>
        <input
          id="prod-descripcion"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Espresso con leche vaporizada"
          className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
        />
      </div>

      {/* Precio y Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="prod-precio" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
            Precio base (MXN) *
          </label>
          <input
            id="prod-precio"
            type="number"
            value={precioBase}
            onChange={(e) => setPrecioBase(e.target.value)}
            placeholder="0.00"
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300 tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="prod-categoria" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
            Categoría *
          </label>
          <select
            id="prod-categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm focus:outline-none focus:border-border-hover transition-all duration-300"
          >
            {(categorias as CategoriaMenu[]).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <label htmlFor="prod-ingredientes" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Ingredientes (separados por coma)
        </label>
        <input
          id="prod-ingredientes"
          type="text"
          value={ingredientes}
          onChange={(e) => setIngredientes(e.target.value)}
          placeholder="Ej: espresso, leche, azúcar"
          className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
        />
      </div>

      {/* Etiquetas */}
      <div>
        <label htmlFor="prod-etiquetas" className="block text-[10px] font-medium text-text-25 uppercase tracking-widest mb-1.5">
          Etiquetas (separadas por coma)
        </label>
        <input
          id="prod-etiquetas"
          type="text"
          value={etiquetas}
          onChange={(e) => setEtiquetas(e.target.value)}
          placeholder="Ej: popular, nuevo, especial"
          className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
        />
      </div>

      {/* Tamaños */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-medium text-text-25 uppercase tracking-widest">
            Tamaños
          </label>
          <button
            type="button"
            onClick={agregarTamano}
            className="flex items-center gap-1 text-[11px] text-accent hover:opacity-80 transition-opacity"
          >
            <Plus size={12} />
            Agregar
          </button>
        </div>
        {tamanos.length === 0 ? (
          <p className="text-[11px] text-text-25 italic">Sin tamaños (precio único)</p>
        ) : (
          <div className="space-y-2">
            {tamanos.map((t, idx) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={t.nombre}
                  onChange={(e) => actualizarTamano(idx, "nombre", e.target.value)}
                  placeholder="Ej: 12 oz"
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-3 border border-border text-text-100 text-xs placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300"
                />
                <input
                  type="number"
                  value={t.precio_adicional}
                  onChange={(e) =>
                    actualizarTamano(idx, "precio_adicional", parseFloat(e.target.value) || 0)
                  }
                  placeholder="+$0"
                  className="w-24 px-3 py-2 rounded-lg bg-surface-3 border border-border text-text-100 text-xs placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300 tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => eliminarTamano(idx)}
                  className="p-1.5 rounded-lg text-text-25 hover:text-status-err hover:bg-status-err-bg transition-all duration-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disponible */}
      <div className="flex items-center gap-3">
        <input
          id="prod-disponible"
          type="checkbox"
          checked={disponible}
          onChange={(e) => setDisponible(e.target.checked)}
          className="sr-only peer"
        />
        <label
          htmlFor="prod-disponible"
          className={cn(
            "w-10 h-6 rounded-full transition-all duration-300 relative cursor-pointer",
            disponible ? "bg-status-ok" : "bg-surface-3"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300",
              disponible ? "left-5" : "left-1"
            )}
          />
        </label>
        <label htmlFor="prod-disponible" className="text-xs text-text-70 cursor-pointer">
          {disponible ? "Disponible" : "No disponible"}
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg btn-primary text-[13px]"
        >
          <Save size={14} />
          {isEditing ? "Guardar cambios" : "Crear producto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg btn-ghost text-[13px]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
