"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarPosition = "left" | "left-mini" | "top" | "hidden";
export type Density = "spacious" | "comfortable" | "compact";
export type PanelWidth = "narrow" | "default" | "wide";

interface UIState {
  /* Existing */
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModule: string;
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  setActiveModule: (module: string) => void;

  /* Layout preferences */
  sidebarPosition: SidebarPosition;
  density: Density;
  panelWidth: PanelWidth;
  setSidebarPosition: (pos: SidebarPosition) => void;
  setDensity: (d: Density) => void;
  setPanelWidth: (w: PanelWidth) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      /* Existing */
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModule: "mesas",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      collapseSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveModule: (module) => set({ activeModule: module }),

      /* Layout preferences */
      sidebarPosition: "left",
      density: "comfortable",
      panelWidth: "default",
      setSidebarPosition: (pos) => set({ sidebarPosition: pos }),
      setDensity: (d) => set({ density: d }),
      setPanelWidth: (w) => set({ panelWidth: w }),
    }),
    {
      name: "la-commune-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarPosition: state.sidebarPosition,
        density: state.density,
        panelWidth: state.panelWidth,
      }),
    }
  )
);
