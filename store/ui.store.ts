"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarPosition = "left" | "left-mini" | "top" | "hidden";
export type Density = "spacious" | "comfortable" | "compact";
export type PanelWidth = "narrow" | "default" | "wide";
export type ViewMode = "grid" | "list";
export type TileSize = "sm" | "md" | "lg";
export type KDSDisplayMode = "classic" | "tiled" | "split";
export type FontScale = 90 | 100 | 110 | 120;

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

  /* View mode (grid/list) per module */
  menuViewMode: ViewMode;
  ordenesViewMode: ViewMode;
  menuTileSize: TileSize;
  setMenuViewMode: (v: ViewMode) => void;
  setOrdenesViewMode: (v: ViewMode) => void;
  setMenuTileSize: (s: TileSize) => void;

  /* Font scale */
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;

  /* Accessibility */
  reducedMotion: boolean;
  highContrast: boolean;
  largeTouchTargets: boolean;
  setReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setLargeTouchTargets: (v: boolean) => void;

  /* Auto dark mode */
  autoDarkMode: boolean;
  autoDarkStart: number; // hour 0-23
  autoDarkEnd: number;
  autoDarkLightTheme: string;
  autoDarkDarkTheme: string;
  setAutoDarkMode: (v: boolean) => void;
  setAutoDarkStart: (h: number) => void;
  setAutoDarkEnd: (h: number) => void;
  setAutoDarkLightTheme: (t: string) => void;
  setAutoDarkDarkTheme: (t: string) => void;

  /* KDS preferences */
  kdsDisplayMode: KDSDisplayMode;
  kdsSoundEnabled: boolean;
  kdsSoundVolume: number; // 0-100
  kdsUrgentSound: boolean;
  setKDSDisplayMode: (m: KDSDisplayMode) => void;
  setKDSSoundEnabled: (v: boolean) => void;
  setKDSSoundVolume: (v: number) => void;
  setKDSUrgentSound: (v: boolean) => void;

  /* Favorites (product IDs for quick access in ordenes) */
  favoriteProductIds: string[];
  toggleFavoriteProduct: (id: string) => void;
  setFavoriteProducts: (ids: string[]) => void;

  /* Persistent tab state per page */
  lastActiveTabs: Record<string, string>;
  setLastActiveTab: (page: string, tab: string) => void;

  /* Keyboard shortcuts enabled */
  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (v: boolean) => void;

  /* Column visibility per table */
  columnVisibility: Record<string, string[]>;
  setColumnVisibility: (table: string, columns: string[]) => void;

  /* Persistent filters per page */
  persistentFilters: Record<string, Record<string, any>>;
  setPersistentFilter: (page: string, filters: Record<string, any>) => void;
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

      /* View mode */
      menuViewMode: "grid",
      ordenesViewMode: "grid",
      menuTileSize: "md",
      setMenuViewMode: (v) => set({ menuViewMode: v }),
      setOrdenesViewMode: (v) => set({ ordenesViewMode: v }),
      setMenuTileSize: (s) => set({ menuTileSize: s }),

      /* Font scale */
      fontScale: 100,
      setFontScale: (s) => set({ fontScale: s }),

      /* Accessibility */
      reducedMotion: false,
      highContrast: false,
      largeTouchTargets: false,
      setReducedMotion: (v) => set({ reducedMotion: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setLargeTouchTargets: (v) => set({ largeTouchTargets: v }),

      /* Auto dark mode */
      autoDarkMode: false,
      autoDarkStart: 20,
      autoDarkEnd: 7,
      autoDarkLightTheme: "mono-editorial",
      autoDarkDarkTheme: "neo-minimal-warm",
      setAutoDarkMode: (v) => set({ autoDarkMode: v }),
      setAutoDarkStart: (h) => set({ autoDarkStart: h }),
      setAutoDarkEnd: (h) => set({ autoDarkEnd: h }),
      setAutoDarkLightTheme: (t) => set({ autoDarkLightTheme: t }),
      setAutoDarkDarkTheme: (t) => set({ autoDarkDarkTheme: t }),

      /* KDS preferences */
      kdsDisplayMode: "classic",
      kdsSoundEnabled: true,
      kdsSoundVolume: 70,
      kdsUrgentSound: true,
      setKDSDisplayMode: (m) => set({ kdsDisplayMode: m }),
      setKDSSoundEnabled: (v) => set({ kdsSoundEnabled: v }),
      setKDSSoundVolume: (v) => set({ kdsSoundVolume: v }),
      setKDSUrgentSound: (v) => set({ kdsUrgentSound: v }),

      /* Favorites */
      favoriteProductIds: [],
      toggleFavoriteProduct: (id) =>
        set((state) => ({
          favoriteProductIds: state.favoriteProductIds.includes(id)
            ? state.favoriteProductIds.filter((fid) => fid !== id)
            : [...state.favoriteProductIds, id].slice(0, 8),
        })),
      setFavoriteProducts: (ids) => set({ favoriteProductIds: ids.slice(0, 8) }),

      /* Persistent tab state */
      lastActiveTabs: {},
      setLastActiveTab: (page, tab) =>
        set((state) => ({
          lastActiveTabs: { ...state.lastActiveTabs, [page]: tab },
        })),

      /* Keyboard shortcuts */
      keyboardShortcutsEnabled: true,
      setKeyboardShortcutsEnabled: (v) => set({ keyboardShortcutsEnabled: v }),

      /* Column visibility */
      columnVisibility: {},
      setColumnVisibility: (table, columns) =>
        set((state) => ({
          columnVisibility: { ...state.columnVisibility, [table]: columns },
        })),

      /* Persistent filters */
      persistentFilters: {},
      setPersistentFilter: (page, filters) =>
        set((state) => ({
          persistentFilters: { ...state.persistentFilters, [page]: filters },
        })),
    }),
    {
      name: "la-commune-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarPosition: state.sidebarPosition,
        density: state.density,
        panelWidth: state.panelWidth,
        menuViewMode: state.menuViewMode,
        ordenesViewMode: state.ordenesViewMode,
        menuTileSize: state.menuTileSize,
        fontScale: state.fontScale,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
        largeTouchTargets: state.largeTouchTargets,
        autoDarkMode: state.autoDarkMode,
        autoDarkStart: state.autoDarkStart,
        autoDarkEnd: state.autoDarkEnd,
        autoDarkLightTheme: state.autoDarkLightTheme,
        autoDarkDarkTheme: state.autoDarkDarkTheme,
        kdsDisplayMode: state.kdsDisplayMode,
        kdsSoundEnabled: state.kdsSoundEnabled,
        kdsSoundVolume: state.kdsSoundVolume,
        kdsUrgentSound: state.kdsUrgentSound,
        favoriteProductIds: state.favoriteProductIds,
        lastActiveTabs: state.lastActiveTabs,
        keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
        columnVisibility: state.columnVisibility,
        persistentFilters: state.persistentFilters,
      }),
    }
  )
);
