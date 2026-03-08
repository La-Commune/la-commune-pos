"use client";

import { create } from "zustand";
import type { Zona } from "@/lib/validators";

interface ZonasState {
  zonas: Zona[];
  selectedZonaId: string | null; // "todas" = null
  setZonas: (zonas: Zona[]) => void;
  selectZona: (id: string | null) => void;
  addZona: (zona: Zona) => void;
  updateZona: (id: string, updates: Partial<Zona>) => void;
  removeZona: (id: string) => void;
}

export const useZonasStore = create<ZonasState>((set) => ({
  zonas: [],
  selectedZonaId: null,
  setZonas: (zonas) => set({ zonas }),
  selectZona: (id) => set({ selectedZonaId: id }),
  addZona: (zona) => set((s) => ({ zonas: [...s.zonas, zona] })),
  updateZona: (id, updates) =>
    set((s) => ({
      zonas: s.zonas.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    })),
  removeZona: (id) =>
    set((s) => ({
      zonas: s.zonas.filter((z) => z.id !== id),
      selectedZonaId: s.selectedZonaId === id ? null : s.selectedZonaId,
    })),
}));
