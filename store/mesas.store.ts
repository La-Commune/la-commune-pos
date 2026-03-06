"use client";

import { create } from "zustand";
import type { Mesa } from "@/lib/validators";

interface MesasState {
  mesas: Mesa[];
  selectedMesa: Mesa | null;
  setMesas: (mesas: Mesa[]) => void;
  selectMesa: (mesa: Mesa | null) => void;
  updateMesa: (id: string, updates: Partial<Mesa>) => void;
}

export const useMesasStore = create<MesasState>((set) => ({
  mesas: [],
  selectedMesa: null,
  setMesas: (mesas) => set({ mesas }),
  selectMesa: (mesa) => set({ selectedMesa: mesa }),
  updateMesa: (id, updates) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
}));
