"use client";

import { create } from "zustand";
import type { Orden, ItemOrden } from "@/lib/validators";

interface OrdenesState {
  ordenes: Orden[];
  currentOrder: Orden | null;
  cart: ItemOrden[];
  setOrdenes: (ordenes: Orden[]) => void;
  setCurrentOrder: (orden: Orden | null) => void;
  addToCart: (item: ItemOrden) => void;
  removeFromCart: (productoId: string, tamano?: string) => void;
  updateCartItem: (productoId: string, updates: Partial<ItemOrden>, tamano?: string) => void;
  clearCart: () => void;
}

function matchItem(item: ItemOrden, productoId: string, tamano?: string): boolean {
  return item.producto_id === productoId && (item.tamano ?? "") === (tamano ?? "");
}

export const useOrdenesStore = create<OrdenesState>((set) => ({
  ordenes: [],
  currentOrder: null,
  cart: [],
  setOrdenes: (ordenes) => set({ ordenes }),
  setCurrentOrder: (orden) => set({ currentOrder: orden }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (i) =>
          i.producto_id === item.producto_id &&
          (i.tamano ?? "") === (item.tamano ?? "") &&
          JSON.stringify(i.modificadores ?? []) === JSON.stringify(item.modificadores ?? [])
      );
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i === existing
              ? { ...i, cantidad: i.cantidad + item.cantidad }
              : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (productoId, tamano) =>
    set((state) => ({
      cart: state.cart.filter((i) => !matchItem(i, productoId, tamano)),
    })),
  updateCartItem: (productoId, updates, tamano) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        matchItem(i, productoId, tamano) ? { ...i, ...updates } : i
      ),
    })),
  clearCart: () => set({ cart: [] }),
}));
