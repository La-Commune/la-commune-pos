"use client";

import { create } from "zustand";
import type { Mesa } from "@/lib/validators";

interface MesasState {
  mesas: Mesa[];
  selectedMesa: Mesa | null;
  editMode: boolean;
  setMesas: (mesas: Mesa[]) => void;
  selectMesa: (mesa: Mesa | null) => void;
  updateMesa: (id: string, updates: Partial<Mesa>) => void;
  addMesa: (mesa: Mesa) => void;
  removeMesa: (id: string) => void;
  setEditMode: (mode: boolean) => void;
}

export const useMesasStore = create<MesasState>((set) => ({
  mesas: [],
  selectedMesa: null,
  editMode: false,
  setMesas: (mesas) => set({ mesas }),
  selectMesa: (mesa) => set({ selectedMesa: mesa }),
  updateMesa: (id, updates) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  addMesa: (mesa) => set((s) => ({ mesas: [...s.mesas, mesa] })),
  removeMesa: (id) =>
    set((s) => ({
      mesas: s.mesas.filter((m) => m.id !== id),
      selectedMesa: s.selectedMesa?.id === id ? null : s.selectedMesa,
    })),
  setEditMode: (mode) => set({ editMode: mode }),
}));
