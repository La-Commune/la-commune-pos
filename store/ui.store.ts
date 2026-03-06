"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModule: string;
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  setActiveModule: (module: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModule: "mesas",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  collapseSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveModule: (module) => set({ activeModule: module }),
}));
